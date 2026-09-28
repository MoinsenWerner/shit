export const QUIET_ZONE = 4;

export function getGeometry(moduleCount, moduleSize, height = 0.1) {
  const safeModuleCount = Math.max(1, Number(moduleCount) || 1);
  const safeModuleSize = Math.max(0.1, Number(moduleSize) || 0.8);
  const totalModules = safeModuleCount + QUIET_ZONE * 2;
  const round = (value) => Math.round(value * 10000) / 10000;
  return {
    moduleCount: safeModuleCount,
    moduleSize: safeModuleSize,
    totalModules,
    codeSize: round(safeModuleCount * safeModuleSize),
    totalSize: round(totalModules * safeModuleSize),
    quietZone: round(QUIET_ZONE * safeModuleSize),
    height: Number(height),
  };
}

export function formatMm(value) {
  return `${Number(value).toFixed(1).replace('.', ',')} mm`;
}

export function createDrawingSvg(matrix, moduleSize, height = 0.1) {
  const geometry = getGeometry(matrix.length, moduleSize, height);
  const padding = Math.max(12, geometry.totalSize * 0.16);
  const top = padding + 8;
  const left = padding + 10;
  const width = geometry.totalSize + padding * 2 + 12;
  const drawingHeight = geometry.totalSize + padding * 2 + 27;
  const paths = [];

  matrix.forEach((row, y) => row.forEach((dark, x) => {
    if (dark) paths.push(`M${left + geometry.quietZone + x * moduleSize} ${top + geometry.quietZone + y * moduleSize}h${moduleSize}v${moduleSize}h-${moduleSize}z`);
  }));

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}mm" height="${drawingHeight}mm" viewBox="0 0 ${width} ${drawingHeight}">
  <rect width="100%" height="100%" fill="#f5f3ea"/>
  <rect x="${left}" y="${top}" width="${geometry.totalSize}" height="${geometry.totalSize}" fill="#fff" stroke="#151a18" stroke-width="0.25"/>
  <path d="${paths.join('')}" fill="#0a0e0c"/>
  <g fill="none" stroke="#d15f36" stroke-width="0.22"><path d="M${left} ${top - 3}v-4m${geometry.totalSize} 4v-4M${left} ${top - 5}h${geometry.totalSize}"/><path d="M${left - 3} ${top}h-4m4 ${geometry.totalSize}h-4M${left - 5} ${top}v${geometry.totalSize}"/></g>
  <g fill="#d15f36" font-family="monospace" font-size="2.8" text-anchor="middle"><text x="${left + geometry.totalSize / 2}" y="${top - 6}">${formatMm(geometry.totalSize)}</text><text transform="translate(${left - 6},${top + geometry.totalSize / 2}) rotate(-90)" y="-0.5">${formatMm(geometry.totalSize)}</text></g>
  <g fill="#151a18" font-family="monospace" font-size="2.8"><text x="${left}" y="${top + geometry.totalSize + 8}">MODUL ${formatMm(moduleSize)}  ·  RUHEZONE ${formatMm(geometry.quietZone)}  ·  HÖHE ${formatMm(height)}</text><text x="${left}" y="${top + geometry.totalSize + 13}" fill="#68706c">QR · Fehlerkorrektur H · Maßstab 1:1</text></g>
  </svg>`;
}

export const STEP_SIZE = 15;
export const STEP_DEPTH = 1;

export function createStep(matrix) {
  const entities = [];
  const add = (value) => {
    entities.push(value);
    return `#${entities.length}`;
  };
  const point = (x, y, z) => add(`CARTESIAN_POINT('',(${x.toFixed(6)},${y.toFixed(6)},${z.toFixed(6)}))`);
  const cuboid = (x1, y1, x2, y2, index) => {
    const coordinates = [
      [x1, y1, 0], [x2, y1, 0], [x2, y2, 0], [x1, y2, 0],
      [x1, y1, STEP_DEPTH], [x2, y1, STEP_DEPTH],
      [x2, y2, STEP_DEPTH], [x1, y2, STEP_DEPTH],
    ];
    const points = coordinates.map(([x, y, z]) => point(x, y, z));
    const vertices = points.map((item) => add(`VERTEX_POINT('',${item})`));
    const edgePairs = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]];
    const edges = edgePairs.map(([start, end]) => {
      const delta = coordinates[end].map((value, axis) => value - coordinates[start][axis]);
      const length = Math.hypot(...delta);
      const direction = add(`DIRECTION('',(${delta.map((value) => (value / length).toFixed(6)).join(',')}))`);
      const vector = add(`VECTOR('',${direction},${length.toFixed(6)})`);
      const line = add(`LINE('',${points[start]},${vector})`);
      return add(`EDGE_CURVE('',${vertices[start]},${vertices[end]},${line},.T.)`);
    });
    const faceDefinitions = [
      { edgeUses: [[3, false], [2, false], [1, false], [0, false]], origin: 0, normal: [0, 0, -1], ref: [1, 0, 0] },
      { edgeUses: [[4, true], [5, true], [6, true], [7, true]], origin: 4, normal: [0, 0, 1], ref: [1, 0, 0] },
      { edgeUses: [[0, true], [9, true], [4, false], [8, false]], origin: 0, normal: [0, -1, 0], ref: [1, 0, 0] },
      { edgeUses: [[1, true], [10, true], [5, false], [9, false]], origin: 1, normal: [1, 0, 0], ref: [0, 1, 0] },
      { edgeUses: [[2, true], [11, true], [6, false], [10, false]], origin: 2, normal: [0, 1, 0], ref: [-1, 0, 0] },
      { edgeUses: [[3, true], [8, true], [7, false], [11, false]], origin: 3, normal: [-1, 0, 0], ref: [0, -1, 0] },
    ];
    const faces = faceDefinitions.map(({ edgeUses, origin, normal, ref }) => {
      const orientedEdges = edgeUses.map(([edgeIndex, forward]) =>
        add(`ORIENTED_EDGE('',*,*,${edges[edgeIndex]},.${forward ? 'T' : 'F'}.)`)
      );
      const loop = add(`EDGE_LOOP('',(${orientedEdges.join(',')}))`);
      const bound = add(`FACE_OUTER_BOUND('',${loop},.T.)`);
      const normalDirection = add(`DIRECTION('',(${normal.map((value) => value.toFixed(1)).join(',')}))`);
      const refDirection = add(`DIRECTION('',(${ref.map((value) => value.toFixed(1)).join(',')}))`);
      const placement = add(`AXIS2_PLACEMENT_3D('',${points[origin]},${normalDirection},${refDirection})`);
      const plane = add(`PLANE('',${placement})`);
      return add(`FACE_SURFACE('',(${bound}),${plane},.T.)`);
    });
    const shell = add(`CLOSED_SHELL('',(${faces.join(',')}))`);
    return add(`FACETED_BREP('QR_RUN_${index}',${shell})`);
  };

  const appContext = add("APPLICATION_CONTEXT('configuration controlled 3d designs of mechanical parts and assemblies')");
  add(`APPLICATION_PROTOCOL_DEFINITION('international standard','config_control_design',1994,${appContext})`);
  const designContext = add(`DESIGN_CONTEXT('',${appContext},'design')`);
  const mechanicalContext = add(`MECHANICAL_CONTEXT('',${appContext},'mechanical')`);
  const product = add(`PRODUCT('SUBMARK_QR','SUBMARK_QR','QR code solids',(${mechanicalContext}))`);
  const formation = add(`PRODUCT_DEFINITION_FORMATION_WITH_SPECIFIED_SOURCE('1','',${product},.NOT_KNOWN.)`);
  const definition = add(`PRODUCT_DEFINITION('design','',${formation},${designContext})`);
  const definitionShape = add(`PRODUCT_DEFINITION_SHAPE('','',${definition})`);
  const lengthUnit = add('(LENGTH_UNIT()NAMED_UNIT(*)SI_UNIT(.MILLI.,.METRE.))');
  const angleUnit = add('(NAMED_UNIT(*)PLANE_ANGLE_UNIT()SI_UNIT($,.RADIAN.))');
  const solidAngleUnit = add('(NAMED_UNIT(*)SI_UNIT($,.STERADIAN.)SOLID_ANGLE_UNIT())');
  const uncertainty = add(`UNCERTAINTY_MEASURE_WITH_UNIT(LENGTH_MEASURE(0.001),${lengthUnit},'distance_accuracy_value','')`);
  const geometryContext = add(`(GEOMETRIC_REPRESENTATION_CONTEXT(3)GLOBAL_UNCERTAINTY_ASSIGNED_CONTEXT((${uncertainty}))GLOBAL_UNIT_ASSIGNED_CONTEXT((${lengthUnit},${angleUnit},${solidAngleUnit}))REPRESENTATION_CONTEXT('',''))`);

  const moduleSize = STEP_SIZE / matrix.length;
  const solids = [];
  matrix.forEach((row, y) => {
    let start = -1;
    for (let x = 0; x <= row.length; x += 1) {
      if (row[x] && start < 0) start = x;
      if ((!row[x] || x === row.length) && start >= 0) {
        solids.push(cuboid(
          start * moduleSize,
          STEP_SIZE - (y + 1) * moduleSize,
          x * moduleSize,
          STEP_SIZE - y * moduleSize,
          solids.length + 1
        ));
        start = -1;
      }
    }
  });
  const representation = add(`SHAPE_REPRESENTATION('',(${solids.join(',')}),${geometryContext})`);
  add(`SHAPE_DEFINITION_REPRESENTATION(${definitionShape},${representation})`);

  const body = entities.map((entity, index) => `#${index + 1}=${entity};`).join('\r\n');
  return `ISO-10303-21;\r\nHEADER;\r\nFILE_DESCRIPTION(('SUBMARK QR CODE 15 X 15 X 1 MM'),'2;1');\r\nFILE_NAME('submark-qr.step','',('SUBMARK'),('SUBMARK'),'SUBMARK','SUBMARK','');\r\nFILE_SCHEMA(('CONFIG_CONTROL_DESIGN'));\r\nENDSEC;\r\nDATA;\r\n${body}\r\nENDSEC;\r\nEND-ISO-10303-21;\r\n`;
}

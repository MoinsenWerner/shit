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

function traceModuleContours(matrix) {
  const edges = [];
  const isDark = (x, y) => Boolean(matrix[y]?.[x]);
  const addEdge = (x1, y1, x2, y2) => edges.push({ start: [x1, y1], end: [x2, y2] });

  matrix.forEach((row, y) => row.forEach((dark, x) => {
    if (!dark) return;
    if (!isDark(x, y - 1)) addEdge(x, y, x + 1, y);
    if (!isDark(x + 1, y)) addEdge(x + 1, y, x + 1, y + 1);
    if (!isDark(x, y + 1)) addEdge(x + 1, y + 1, x, y + 1);
    if (!isDark(x - 1, y)) addEdge(x, y + 1, x, y);
  }));

  const remaining = new Set(edges.map((_, index) => index));
  const contours = [];
  const direction = ([x1, y1], [x2, y2]) => [x2 - x1, y2 - y1];
  const turnRank = (incoming, outgoing) => {
    const cross = incoming[0] * outgoing[1] - incoming[1] * outgoing[0];
    const dot = incoming[0] * outgoing[0] + incoming[1] * outgoing[1];
    if (cross > 0) return 0;
    if (dot > 0) return 1;
    if (cross < 0) return 2;
    return 3;
  };

  while (remaining.size) {
    let edgeIndex = remaining.values().next().value;
    const first = edges[edgeIndex];
    const contour = [first.start];
    let current = first;
    remaining.delete(edgeIndex);

    while (current.end[0] !== contour[0][0] || current.end[1] !== contour[0][1]) {
      contour.push(current.end);
      const incoming = direction(current.start, current.end);
      const candidates = [...remaining].filter((index) => {
        const start = edges[index].start;
        return start[0] === current.end[0] && start[1] === current.end[1];
      });
      edgeIndex = candidates.sort((a, b) =>
        turnRank(incoming, direction(edges[a].start, edges[a].end)) -
        turnRank(incoming, direction(edges[b].start, edges[b].end))
      )[0];
      if (edgeIndex === undefined) throw new Error('QR-Kontur konnte nicht geschlossen werden.');
      current = edges[edgeIndex];
      remaining.delete(edgeIndex);
    }
    const simplified = contour.filter((point, index) => {
      const previous = contour[(index - 1 + contour.length) % contour.length];
      const next = contour[(index + 1) % contour.length];
      return (point[0] - previous[0]) * (next[1] - point[1]) !==
        (point[1] - previous[1]) * (next[0] - point[0]);
    });
    contours.push(simplified);
  }
  return contours;
}

export function createDxf(matrix, moduleSize) {
  const size = Number(moduleSize);
  const codeHeight = matrix.length * size;
  const contours = traceModuleContours(matrix);
  const entities = contours.map((contour) => {
    const vertices = contour.map(([x, y]) =>
      `10\n${(x * size).toFixed(4)}\n20\n${(codeHeight - y * size).toFixed(4)}`
    ).join('\n');
    return `0\nLWPOLYLINE\n8\nQR_MODULES\n90\n${contour.length}\n70\n1\n${vertices}`;
  }).join('\n');

  return `0\nSECTION\n2\nHEADER\n9\n$ACADVER\n1\nAC1015\n9\n$INSUNITS\n70\n4\n0\nENDSEC\n0\nSECTION\n2\nTABLES\n0\nTABLE\n2\nLAYER\n70\n1\n0\nLAYER\n2\nQR_MODULES\n70\n0\n62\n7\n6\nCONTINUOUS\n0\nENDTAB\n0\nENDSEC\n0\nSECTION\n2\nENTITIES\n${entities}\n0\nENDSEC\n0\nEOF\n`;
}

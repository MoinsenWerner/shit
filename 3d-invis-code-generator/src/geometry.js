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

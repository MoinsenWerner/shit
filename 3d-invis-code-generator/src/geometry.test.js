import { describe, expect, it } from 'vitest';
import { createDrawingSvg, createDxf, formatMm, getGeometry } from './geometry.js';

describe('geometry', () => {
  it('adds a four-module quiet zone on every side', () => {
    expect(getGeometry(21, 0.8)).toMatchObject({ totalModules: 29, totalSize: 23.2, quietZone: 3.2, height: 0.1 });
  });
  it('formats German millimetre values', () => expect(formatMm(23.2)).toBe('23,2 mm'));
  it('builds a dimensioned SVG from a matrix', () => {
    const svg = createDrawingSvg([[true, false], [false, true]], 1);
    expect(svg).toContain('<svg');
    expect(svg).toContain('MODUL 1,0 mm');
    expect(svg).toContain('<path d="M');
  });
  it('exports merged, closed DXF contours in millimetres', () => {
    const dxf = createDxf([[true, true], [false, true]], 0.8);
    expect(dxf).toContain('$INSUNITS\n70\n4');
    expect(dxf).toContain('LWPOLYLINE\n8\nQR_MODULES\n90\n6\n70\n1');
    expect(dxf).toContain('10\n1.6000\n20\n0.0000');
    expect(dxf).toMatch(/0\nEOF\n$/);
  });
  it('keeps diagonally touching modules as separate contours', () => {
    const dxf = createDxf([[true, false], [false, true]], 1);
    expect(dxf.match(/0\nLWPOLYLINE/g)).toHaveLength(2);
  });
});

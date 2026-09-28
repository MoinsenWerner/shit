import { describe, expect, it } from 'vitest';
import { createDrawingSvg, formatMm, getGeometry } from './geometry.js';

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
});

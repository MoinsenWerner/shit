import { describe, expect, it } from 'vitest';
import { createDrawingSvg, createStep, formatMm, getGeometry, STEP_DEPTH, STEP_SIZE } from './geometry.js';

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
  it('exports a valid STEP envelope with millimetre units', () => {
    const step = createStep([[true, true], [false, true]]);
    expect(STEP_SIZE).toBe(15);
    expect(STEP_DEPTH).toBe(1);
    expect(step).toContain("SI_UNIT(.MILLI.,.METRE.)");
    expect(step).toContain("CARTESIAN_POINT('',(15.000000,15.000000,1.000000))");
    expect(step).toMatch(/END-ISO-10303-21;\r\n$/);
  });
  it('contains solids only for black horizontal runs', () => {
    const step = createStep([[true, true], [false, true]]);
    expect(step.match(/FACETED_BREP/g)).toHaveLength(2);
    expect(step).not.toContain('QR_RUN_3');
  });
});

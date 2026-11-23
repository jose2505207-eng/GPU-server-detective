import { describe, expect, it } from 'vitest';
import { CASES } from './cases/index.js';
import { DIAGNOSES, canCloseTicket, checkMeasure, countSentences, runTest, steadyRates } from './game.js';

const SERIES = ['throughput', 'gpuTempC', 'smClockMHz', 'powerW', 'powerLimitW', 'clockEventReason', 'inputQueue'];

describe.each(CASES)('$id', (c) => {
  it('has one reading per minute mark for every series', () => {
    for (const set of [c.readings, c.afterRepair]) {
      const n = set.minutes.length;
      for (const gpu of ['gpu0', 'gpu1']) for (const k of SERIES) expect(set[gpu][k]).toHaveLength(n);
      for (const fan of Object.values(set.fans)) expect(fan).toHaveLength(n);
    }
  });

  it('matches its own measure answers', () => {
    const r = steadyRates(c);
    expect(r.slowBefore).toBeGreaterThanOrEqual(c.throughputTarget);
    expect(Math.round(((r.slowBefore - r.slowAfter) / r.slowBefore) * 10) * 10).toBe(c.measure.lossPercent);
    const ok = checkMeasure(c.measure, c);
    expect(Object.values(ok).every(Boolean)).toBe(true);
  });

  it('has a root cause and feedback for every wrong diagnosis', () => {
    const ids = DIAGNOSES.map((d) => d.id);
    expect(ids).toContain(c.expected.rootCause);
    for (const id of ids.filter((d) => d !== c.expected.rootCause)) expect(c.expected.wrongFeedback[id]).toBeTruthy();
  });

  it('passes a 1-minute test both before and after the repair', () => {
    expect(runTest(c, 1, false).passed).toBe(true);
    expect(runTest(c, 1, true).passed).toBe(true);
  });

  it('fails a 10-minute test before the repair and passes it after', () => {
    expect(runTest(c, 10, false).passed).toBe(false);
    expect(runTest(c, 10, true).passed).toBe(true);
  });

  it('only lets the ticket close after a passing run past the failure window', () => {
    expect(canCloseTicket([runTest(c, 1, true), runTest(c, 3, true)])).toBe(false);
    expect(canCloseTicket([runTest(c, 10, false)])).toBe(false);
    expect(canCloseTicket([runTest(c, 10, true)])).toBe(true);
  });

  it('has a two-sentence model update', () => {
    expect(countSentences(c.expected.modelUpdate)).toBe(2);
  });
});

it('both cases open with the same complaint and the same throughput', () => {
  const [a, b] = CASES;
  expect(a.ticket).toEqual(b.ticket);
  expect(a.readings.gpu1.throughput.at(-1)).toBeCloseTo(b.readings.gpu1.throughput.at(-1), 0);
});

it('counts sentences', () => {
  expect(countSentences('')).toBe(0);
  expect(countSentences('One. Two!')).toBe(2);
  expect(countSentences('About 119 images/s. Fixed.')).toBe(2);
});

// Pure game logic, kept separate from the UI so it can be tested.

export const LOSS_CHOICES = [10, 25, 40, 60];
export const ONSET_CHOICES = [
  { value: 0, label: 'Right from the start' },
  { value: 2, label: 'After about 2 minutes' },
  { value: 5, label: 'After about 5 minutes' },
  { value: 10, label: 'After about 10 minutes' },
];

export const DIAGNOSES = [
  { id: 'replace-gpu', label: 'The GPU is faulty and should be replaced' },
  { id: 'cooling', label: 'A cooling problem is making the GPU slow itself down' },
  { id: 'power-limit', label: 'A power limit is holding the GPU back' },
  { id: 'input-pipeline', label: 'The input pipeline is not feeding the GPU fast enough' },
  { id: 'driver', label: 'A driver or software bug' },
];

// Each kind of evidence answers a different question.
export const EVIDENCE = [
  { id: 'temps', label: 'GPU temperatures', source: 'nvidia-smi', question: 'Is either GPU running hot?' },
  { id: 'clocks', label: 'Clock speeds and slowdown reasons', source: 'nvidia-smi -q -d PERFORMANCE', question: 'Is the GPU lowering its own clock, and why?' },
  { id: 'power', label: 'Power draw and power limit', source: 'nvidia-smi -q -d POWER', question: 'Is the GPU getting the power it is allowed?' },
  { id: 'queue', label: 'Application input queue', source: 'inference server metrics', question: 'Is the GPU waiting on input, or is input waiting on the GPU?' },
  { id: 'fans', label: 'Chassis fan RPM', source: 'Supermicro BMC sensors', question: 'Is the chassis moving enough air?' },
];

export const TEST_DURATIONS = [1, 3, 10];

export function checkMeasure(answers, theCase) {
  const m = theCase.measure;
  return {
    slowWorker: answers.slowWorker === m.slowWorker,
    lossPercent: answers.lossPercent === m.lossPercent,
    onsetMinute: answers.onsetMinute === m.onsetMinute,
  };
}

const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;

// Steady throughput before the slowdown and after it settles, rounded to whole images per second.
export function steadyRates(theCase) {
  const { minutes, gpu0, gpu1 } = theCase.readings;
  const onset = theCase.measure.onsetMinute;
  const pick = (vals, keep) => vals.filter((_, i) => keep(minutes[i]));
  return {
    healthy: Math.round(mean(gpu0.throughput)),
    slowBefore: Math.round(mean(pick(gpu1.throughput, (t) => t < onset))),
    slowAfter: Math.round(mean(pick(gpu1.throughput, (t) => t >= onset + 2))),
  };
}

// Readings from the start of a run up to and including `minutes`.
export function sliceRun(series, minutes) {
  const end = series.minutes.findIndex((t) => t > minutes);
  const n = end === -1 ? series.minutes.length : end;
  return {
    minutes: series.minutes.slice(0, n),
    gpu0: series.gpu0.throughput.slice(0, n),
    gpu1: series.gpu1.throughput.slice(0, n),
  };
}

// Run the same workload for `minutes`, before or after the repair.
export function runTest(theCase, minutes, afterRepair) {
  const run = sliceRun(afterRepair ? theCase.afterRepair : theCase.readings, minutes);
  const lowest = Math.min(...run.gpu0, ...run.gpu1);
  return {
    minutes,
    afterRepair,
    run,
    lowest,
    passed: lowest >= theCase.throughputTarget,
    // A test that ends before the failure window cannot tell a fixed server from a broken one.
    coversFailureWindow: minutes > theCase.failureWindowMinutes,
  };
}

// The ticket can be closed only after a passing post-repair run that lasts past the failure window.
export function canCloseTicket(tests) {
  return tests.some((t) => t.afterRepair && t.passed && t.coversFailureWindow);
}

export function countSentences(text) {
  const parts = text
    .trim()
    .split(/(?<=[.!?])\s+/)
    .filter((s) => /[A-Za-z0-9]/.test(s));
  return parts.length;
}

export function pickRandomCase(cases, rand = Math.random) {
  return cases[Math.floor(rand() * cases.length)];
}

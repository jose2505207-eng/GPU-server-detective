import { useEffect, useState } from 'react';
import LineChart from './LineChart.jsx';
import { GPU0, GPU1 } from './colors.js';
import { LOSS_CHOICES, ONSET_CHOICES, checkMeasure, steadyRates } from '../game.js';

// Step 1: find out what "slow" means.
export default function StepMeasure({ theCase, onDone }) {
  const { readings, workers } = theCase;
  const total = readings.minutes.length;
  const [shown, setShown] = useState(0);
  const [answers, setAnswers] = useState({ slowWorker: null, lossPercent: null, onsetMinute: null });
  const [result, setResult] = useState(null);
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    if (shown === 0 || shown >= total) return;
    const id = setTimeout(() => setShown((n) => n + 1), 90);
    return () => clearTimeout(id);
  }, [shown, total]);

  const done = shown >= total;
  const allRight = result && Object.values(result).every(Boolean);
  const set = (k, v) => {
    setAnswers((a) => ({ ...a, [k]: v }));
    setResult(null);
  };
  const complete = Object.values(answers).every((v) => v !== null);

  const check = () => {
    setAttempts((n) => n + 1);
    setResult(checkMeasure(answers, theCase));
  };

  const rates = steadyRates(theCase);
  const mark = (k) => (result ? (result[k] ? ' ✓' : ' ✗') : '');

  return (
    <section className="step">
      <h2>Step 1. Find out what “slow” means</h2>
      <p>
        Before you guess at a cause, reproduce the problem. Run the customer’s workload on both workers for 12
        minutes. {theCase.workload}
      </p>
      {shown === 0 ? (
        <button className="primary" onClick={() => setShown(1)}>
          Run the workload for 12 minutes
        </button>
      ) : (
        <LineChart
          x={readings.minutes}
          series={[
            { label: `${workers[0].name} (${workers[0].gpu})`, values: readings.gpu0.throughput, color: GPU0 },
            { label: `${workers[1].name} (${workers[1].gpu})`, values: readings.gpu1.throughput, color: GPU1 },
          ]}
          yLabel="images / s"
          yMin={0}
          yMax={140}
          visibleCount={shown}
        />
      )}

      {done && (
        <div className="questions">
          <fieldset>
            <legend>Which worker slowed down?{mark('slowWorker')}</legend>
            {workers.map((w) => (
              <label key={w.id}>
                <input
                  type="radio"
                  name="slowWorker"
                  checked={answers.slowWorker === w.id}
                  onChange={() => set('slowWorker', w.id)}
                />
                {w.name} ({w.gpu})
              </label>
            ))}
          </fieldset>
          <fieldset>
            <legend>About how much throughput did it lose?{mark('lossPercent')}</legend>
            {LOSS_CHOICES.map((p) => (
              <label key={p}>
                <input
                  type="radio"
                  name="loss"
                  checked={answers.lossPercent === p}
                  onChange={() => set('lossPercent', p)}
                />
                About {p}%
              </label>
            ))}
          </fieldset>
          <fieldset>
            <legend>When did it start?{mark('onsetMinute')}</legend>
            {ONSET_CHOICES.map((o) => (
              <label key={o.value}>
                <input
                  type="radio"
                  name="onset"
                  checked={answers.onsetMinute === o.value}
                  onChange={() => set('onsetMinute', o.value)}
                />
                {o.label}
              </label>
            ))}
          </fieldset>
          {!allRight && (
            <button className="primary" disabled={!complete} onClick={check}>
              Check my reading
            </button>
          )}
          {result && !allRight && (
            <p className="feedback bad">
              Not quite. Look at the chart again: compare where each line levels off, and when the lines split.
            </p>
          )}
          {allRight && (
            <div className="feedback good">
              <p>
                <strong>You can now tell the customer exactly what you reproduced.</strong> {workers[1].name} dropped
                from about {rates.slowBefore} to about {rates.slowAfter} images per second (about a{' '}
                {theCase.measure.lossPercent}% loss), starting around minute{' '}
                {theCase.measure.onsetMinute}. {workers[0].name} held about {rates.healthy} the whole time, so the workload itself is not the problem.
              </p>
              <button className="primary" onClick={() => onDone({ attempts })}>
                Next: inspect the evidence
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

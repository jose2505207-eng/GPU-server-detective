import { useState } from 'react';
import LineChart from './LineChart.jsx';
import { GPU0, GPU1 } from './colors.js';
import { TEST_DURATIONS, canCloseTicket, runTest } from '../game.js';

function TestChart({ test, theCase }) {
  const [w0, w1] = theCase.workers;
  return (
    <LineChart
      x={test.run.minutes}
      xMax={test.minutes}
      series={[
        { label: `${w0.name}`, values: test.run.gpu0, color: GPU0 },
        { label: `${w1.name}`, values: test.run.gpu1, color: GPU1 },
      ]}
      refLines={[{ y: theCase.throughputTarget, label: `target ${theCase.throughputTarget}` }]}
      yLabel="images / s"
      yMin={0}
      yMax={140}
      height={180}
    />
  );
}

// Step 3: decide when the ticket can be closed.
export default function StepVerify({ theCase, onDone }) {
  const [tests, setTests] = useState([]);
  const [reopened, setReopened] = useState(0);
  const [showReopen, setShowReopen] = useState(false);
  const last = tests[tests.length - 1];
  const before = runTest(theCase, 1, false);

  const run = (minutes) => {
    setShowReopen(false);
    setTests((t) => [...t, runTest(theCase, minutes, true)]);
  };

  const close = () => {
    if (canCloseTicket(tests)) onDone({ tests, reopened });
    else {
      setReopened((n) => n + 1);
      setShowReopen(true);
    }
  };

  return (
    <section className="step">
      <h2>Step 3. Decide when you can close the ticket</h2>
      <p>
        The repair is done. Run the same workload on the repaired server and compare it against the customer’s
        target of <strong>{theCase.throughputTarget} images per second</strong> on each worker. Close the ticket when
        you could defend the result to the customer.
      </p>
      <div className="row">
        {TEST_DURATIONS.map((m) => (
          <button key={m} onClick={() => run(m)}>
            Run {m}-minute test
          </button>
        ))}
        <button className="primary" disabled={!tests.some((t) => t.passed)} onClick={close}>
          Close the ticket
        </button>
      </div>

      {last && (
        <div className="test-result">
          <p>
            <strong>
              {last.minutes}-minute test after the repair: {last.passed ? 'passed' : 'failed'}.
            </strong>{' '}
            Lowest rate on either worker was {last.lowest.toFixed(1)} images per second.
          </p>
          <TestChart test={last} theCase={theCase} />
        </div>
      )}

      {showReopen && (
        <div className="feedback bad">
          <p>
            <strong>Two days later the customer reopens the ticket.</strong> Your test ended before minute{' '}
            {theCase.failureWindowMinutes}, and the problem only shows up after that. Here is the same 1-minute test
            run <em>before</em> the repair. It passed too, so it proves nothing about the fix:
          </p>
          <TestChart test={before} theCase={theCase} />
        </div>
      )}
    </section>
  );
}

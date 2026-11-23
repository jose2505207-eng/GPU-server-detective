import { DIAGNOSES, EVIDENCE } from '../game.js';

const label = (list, id) => list.find((x) => x.id === id)?.label ?? id;

export default function Debrief({ theCase, log, onRestart }) {
  const { measure, evidence, verify, update } = log;
  const longest = Math.max(...verify.tests.map((t) => t.minutes));
  return (
    <section className="step">
      <h2>Debrief: {theCase.ticketNumber}</h2>
      <p>
        <strong>Cause:</strong> {theCase.expected.summary}. {theCase.expected.explanation}
      </p>
      <table className="debrief">
        <tbody>
          <tr>
            <th>Measured the slowdown</th>
            <td>{measure.attempts === 1 ? 'Right on the first try' : `${measure.attempts} tries`}</td>
          </tr>
          <tr>
            <th>Evidence inspected</th>
            <td>
              {evidence.opened.length} of {EVIDENCE.length}, in this order:{' '}
              {evidence.opened.map((id) => label(EVIDENCE, id)).join(' → ')}
            </td>
          </tr>
          <tr>
            <th>Diagnosis</th>
            <td>
              {evidence.wrong.length === 0
                ? 'Right on the first try'
                : `Ruled out first: ${evidence.wrong.map((id) => label(DIAGNOSES, id)).join('; ')}`}
            </td>
          </tr>
          <tr>
            <th>Verification</th>
            <td>
              {verify.tests.length} {verify.tests.length === 1 ? 'test' : 'tests'}, longest {longest} minutes.{' '}
              {verify.reopened === 0
                ? 'Closed the ticket without a reopen.'
                : `The ticket was reopened ${verify.reopened} ${verify.reopened === 1 ? 'time' : 'times'} after closing on a short test.`}
            </td>
          </tr>
          <tr>
            <th>Customer update</th>
            <td>
              <q>{update.update}</q>
              <br />
              Self-check: {update.checklist} of {update.of} points covered.
            </td>
          </tr>
        </tbody>
      </table>
      <p className="small">
        The other ticket opens with the same complaint and the same throughput chart. Only the evidence tells them
        apart, so memorizing “slow GPU means bad fan” does not work.
      </p>
      <button className="primary" onClick={onRestart}>
        Back to the ticket queue
      </button>
    </section>
  );
}

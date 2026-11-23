import { useState } from 'react';
import { countSentences } from '../game.js';

const CHECKLIST = [
  'Answers the customer’s question: does the GPU need replacing?',
  'Names the cause in plain words',
  'Says what was repaired',
  'Says how the fix was verified, with a duration and a number',
];

// Step 4: write the customer a two-sentence update.
export default function StepUpdate({ theCase, onDone }) {
  const [text, setText] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [checked, setChecked] = useState([]);
  const n = countSentences(text);
  const ok = n >= 1 && n <= 2;

  const toggle = (i) => setChecked((c) => (c.includes(i) ? c.filter((x) => x !== i) : [...c, i]));

  return (
    <section className="step">
      <h2>Step 4. Write the customer a two-sentence update</h2>
      <blockquote>“{theCase.ticket.message}”</blockquote>
      <textarea
        rows={5}
        value={text}
        disabled={submitted}
        placeholder="Two sentences: what you found, what you did, and how you know it is fixed."
        onChange={(e) => setText(e.target.value)}
      />
      <p className={`small ${n > 2 ? 'warn' : ''}`}>
        {n} {n === 1 ? 'sentence' : 'sentences'}
        {n > 2 ? '. Cut it down to two.' : ''}
      </p>
      {!submitted && (
        <button className="primary" disabled={!ok} onClick={() => setSubmitted(true)}>
          Send the update
        </button>
      )}
      {submitted && (
        <div className="feedback">
          <p>Check your update against this list, then compare it with a model answer.</p>
          {CHECKLIST.map((item, i) => (
            <label key={item} className="check">
              <input type="checkbox" checked={checked.includes(i)} onChange={() => toggle(i)} />
              {item}
            </label>
          ))}
          <p className="model">
            <strong>Model answer:</strong> {theCase.expected.modelUpdate}
          </p>
          <button className="primary" onClick={() => onDone({ update: text, checklist: checked.length, of: CHECKLIST.length })}>
            See the debrief
          </button>
        </div>
      )}
    </section>
  );
}

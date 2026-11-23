import { useState } from 'react';
import Evidence from './Evidence.jsx';
import { DIAGNOSES, EVIDENCE } from '../game.js';

// Step 2: choose which evidence to inspect, then name the cause.
export default function StepEvidence({ theCase, onDone }) {
  const [opened, setOpened] = useState([]);
  const [minute, setMinute] = useState(8);
  const [choice, setChoice] = useState(null);
  const [wrong, setWrong] = useState([]);
  const [solved, setSolved] = useState(false);
  const { expected } = theCase;
  const maxMinute = theCase.readings.minutes[theCase.readings.minutes.length - 1];

  const open = (id) => setOpened((o) => (o.includes(id) ? o : [...o, id]));
  const submit = () => {
    if (choice === expected.rootCause) setSolved(true);
    else setWrong((w) => (w.includes(choice) ? w : [...w, choice]));
  };
  const lastWrong = wrong.length && choice === wrong[wrong.length - 1] ? choice : null;

  return (
    <section className="step">
      <h2>Step 2. Choose which evidence to inspect</h2>
      <p>
        Each reading answers a different question. Open only what you need, and be ready to say why you opened it.
        The readouts below the charts show the moment you pick here.
      </p>
      <label className="slider">
        Readout at minute <strong>{minute}</strong>
        <input
          type="range"
          min={0}
          max={maxMinute}
          step={0.5}
          value={minute}
          onChange={(e) => setMinute(Number(e.target.value))}
        />
      </label>

      <div className="evidence-list">
        {EVIDENCE.map((ev) => {
          const isOpen = opened.includes(ev.id);
          return (
            <article key={ev.id} className={`evidence ${isOpen ? 'open' : ''}`}>
              <header>
                <div>
                  <h3>{ev.label}</h3>
                  <p className="small">
                    {ev.question} <span className="source">Source: {ev.source}</span>
                  </p>
                </div>
                {!isOpen && <button onClick={() => open(ev.id)}>Inspect</button>}
              </header>
              {isOpen && <Evidence kind={ev.id} theCase={theCase} minute={minute} />}
            </article>
          );
        })}
      </div>

      <fieldset className="diagnosis">
        <legend>What is slowing {theCase.workers[1].name} down?</legend>
        {DIAGNOSES.map((d) => (
          <label key={d.id} className={wrong.includes(d.id) ? 'ruled-out' : ''}>
            <input
              type="radio"
              name="diagnosis"
              disabled={solved}
              checked={choice === d.id}
              onChange={() => setChoice(d.id)}
            />
            {d.label}
          </label>
        ))}
        {!solved && (
          <button className="primary" disabled={!choice || opened.length === 0} onClick={submit}>
            {opened.length === 0 ? 'Inspect at least one reading first' : 'Commit to this diagnosis'}
          </button>
        )}
      </fieldset>

      {lastWrong && !solved && <p className="feedback bad">{expected.wrongFeedback[lastWrong]}</p>}

      {solved && (
        <div className="feedback good">
          <p>
            <strong>{expected.summary}.</strong> {expected.explanation}
          </p>
          <p>
            <strong>Repair:</strong> {expected.repair}
          </p>
          <button className="primary" onClick={() => onDone({ opened, wrong })}>
            Next: decide when to close the ticket
          </button>
        </div>
      )}
    </section>
  );
}

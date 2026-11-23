import { useState } from 'react';
import { CASES } from './cases/index.js';
import { pickRandomCase } from './game.js';
import StepMeasure from './components/StepMeasure.jsx';
import StepEvidence from './components/StepEvidence.jsx';
import StepVerify from './components/StepVerify.jsx';
import StepUpdate from './components/StepUpdate.jsx';
import Debrief from './components/Debrief.jsx';

const STEPS = ['Measure', 'Evidence', 'Close the ticket', 'Customer update'];

export default function App() {
  const [theCase, setCase] = useState(null);
  const [step, setStep] = useState(0);
  const [log, setLog] = useState({});

  const start = (c) => {
    setCase(c);
    setStep(0);
    setLog({});
  };
  const advance = (key) => (data) => {
    setLog((l) => ({ ...l, [key]: data }));
    setStep((s) => s + 1);
    window.scrollTo({ top: 0 });
  };

  if (!theCase) {
    return (
      <main>
        <h1>GPU Server Detective</h1>
        <p className="lead">
          You are the field applications engineer. A customer’s GPU server slows down after a few minutes, and they want
          to know if they need to replace the GPU before they spend money or take the server offline. Reproduce the
          problem, pick the evidence that explains it, prove the fix, and tell the customer.
        </p>
        <p className="small">
          All readings are simulated. Both tickets open with the same complaint; the evidence is what differs.
        </p>
        <div className="queue">
          {CASES.map((c) => (
            <button key={c.id} onClick={() => start(c)}>
              <strong>{c.ticketNumber}</strong>
              <span>{c.ticket.subject}</span>
            </button>
          ))}
          <button className="primary" onClick={() => start(pickRandomCase(CASES))}>
            <strong>Random ticket</strong>
            <span>Good for interviews: you won’t know which case it is</span>
          </button>
        </div>
      </main>
    );
  }

  return (
    <main>
      <header className="ticket">
        <div className="ticket-head">
          <span className="ticket-id">{theCase.ticketNumber}</span>
          <span>{theCase.ticket.customer}</span>
          <button className="link" onClick={() => setCase(null)}>
            Leave ticket
          </button>
        </div>
        <p>“{theCase.ticket.message}”</p>
        {step < STEPS.length && (
          <ol className="steps">
            {STEPS.map((s, i) => (
              <li key={s} className={i === step ? 'current' : i < step ? 'done' : ''}>
                {s}
              </li>
            ))}
          </ol>
        )}
      </header>
      {step === 0 && <StepMeasure theCase={theCase} onDone={advance('measure')} />}
      {step === 1 && <StepEvidence theCase={theCase} onDone={advance('evidence')} />}
      {step === 2 && <StepVerify theCase={theCase} onDone={advance('verify')} />}
      {step === 3 && <StepUpdate theCase={theCase} onDone={advance('update')} />}
      {step === 4 && <Debrief theCase={theCase} log={log} onRestart={() => setCase(null)} />}
    </main>
  );
}

import LineChart from './LineChart.jsx';
import { GPU0, GPU1, FAN_COLORS } from './colors.js';

const REASONS = [
  ['Idle', 0],
  ['Applications Clocks Setting', 0],
  ['SW Power Cap', 0],
  ['HW Slowdown', 0],
  ['HW Thermal Slowdown', 1],
  ['HW Power Brake Slowdown', 1],
  ['Sync Boost', 0],
  ['SW Thermal Slowdown', 0],
  ['Display Clock Setting', 0],
];

// Both GPUs in both cases ship with a 350 W default limit.
const DEFAULT_POWER_LIMIT_W = 350;

const pad = (s, n) => s + ' '.repeat(Math.max(1, n - s.length));

function clocksText(w, g, i) {
  const active = g.clockEventReason[i];
  const lines = [`GPU ${w.busId}`, '    Clocks', pad('        SM', 38) + `: ${g.smClockMHz[i]} MHz`, '    Clocks Event Reasons'];
  for (const [name, depth] of REASONS) {
    const indent = '        ' + '    '.repeat(depth);
    lines.push(pad(indent + name, 38) + ': ' + (active === name ? 'Active' : 'Not Active'));
  }
  return lines.join('\n');
}

function powerText(w, g, i) {
  return [
    `GPU ${w.busId}`,
    '    GPU Power Readings',
    pad('        Power Draw', 38) + `: ${g.powerW[i].toFixed(2)} W`,
    pad('        Current Power Limit', 38) + `: ${g.powerLimitW[i].toFixed(2)} W`,
    pad('        Default Power Limit', 38) + `: ${DEFAULT_POWER_LIMIT_W.toFixed(2)} W`,
  ].join('\n');
}

function fanRows(fans, i) {
  return Object.entries(fans).map(([name, vals]) => {
    const rpm = vals[i];
    return { name, rpm, status: rpm < 1000 ? 'Lower Critical' : 'OK' };
  });
}

export function snapshotIndex(minutes, minute) {
  const i = minutes.findIndex((t) => t >= minute);
  return i === -1 ? minutes.length - 1 : i;
}

// Renders one kind of evidence for both GPUs, as a chart plus a raw readout at the chosen minute.
export default function Evidence({ kind, theCase, minute }) {
  const { readings: r, workers } = theCase;
  const [w0, w1] = workers;
  const i = snapshotIndex(r.minutes, minute);
  const both = (key) => [
    { label: `${w0.gpu} (${w0.name})`, values: r.gpu0[key], color: GPU0 },
    { label: `${w1.gpu} (${w1.name})`, values: r.gpu1[key], color: GPU1 },
  ];

  if (kind === 'temps') {
    return (
      <>
        <LineChart x={r.minutes} series={both('gpuTempC')} yLabel="°C" yMin={30} yMax={100} />
        <pre>{`GPU temperature at minute ${r.minutes[i]}\n  ${w0.gpu}: ${r.gpu0.gpuTempC[i]} C\n  ${w1.gpu}: ${r.gpu1.gpuTempC[i]} C`}</pre>
      </>
    );
  }
  if (kind === 'clocks') {
    return (
      <>
        <LineChart x={r.minutes} series={both('smClockMHz')} yLabel="SM clock, MHz" yMin={0} yMax={2200} />
        <p className="small">Readout at minute {r.minutes[i]}, modeled on nvidia-smi -q -d PERFORMANCE:</p>
        <div className="pre-pair">
          <pre>{clocksText(w0, r.gpu0, i)}</pre>
          <pre>{clocksText(w1, r.gpu1, i)}</pre>
        </div>
      </>
    );
  }
  if (kind === 'power') {
    return (
      <>
        <LineChart
          x={r.minutes}
          series={[
            ...both('powerW'),
            { label: `${w0.gpu} power limit`, values: r.gpu0.powerLimitW, color: GPU0, dashed: true },
            { label: `${w1.gpu} power limit`, values: r.gpu1.powerLimitW, color: GPU1, dashed: true },
          ]}
          yLabel="watts"
          yMin={0}
          yMax={400}
        />
        <p className="small">Readout at minute {r.minutes[i]}, modeled on nvidia-smi -q -d POWER:</p>
        <div className="pre-pair">
          <pre>{powerText(w0, r.gpu0, i)}</pre>
          <pre>{powerText(w1, r.gpu1, i)}</pre>
        </div>
      </>
    );
  }
  if (kind === 'queue') {
    return (
      <>
        <LineChart x={r.minutes} series={both('inputQueue')} yLabel="images waiting" yMin={0} yMax={2200} />
        <p className="small">
          Images waiting in each worker’s input queue. The queue holds at most 2048 images; when it is full, the
          dispatcher has to wait.
        </p>
      </>
    );
  }
  if (kind === 'fans') {
    return (
      <>
        <LineChart
          x={r.minutes}
          series={Object.entries(r.fans).map(([name, values]) => ({ label: name, values, color: FAN_COLORS[name] }))}
          yLabel="RPM"
          yMin={0}
          yMax={16000}
        />
        <p className="small">
          {w0.fanZone.join(' and ')} blow across {w0.gpu}. {w1.fanZone.join(' and ')} blow across {w1.gpu}. Sensor
          readings at minute {r.minutes[i]}:
        </p>
        <table className="sensors">
          <thead>
            <tr>
              <th>Sensor</th>
              <th>Reading</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {fanRows(r.fans, i).map((f) => (
              <tr key={f.name} className={f.status === 'OK' ? '' : 'alarm'}>
                <td>{f.name}</td>
                <td>{f.rpm.toLocaleString('en-US')} RPM</td>
                <td>{f.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </>
    );
  }
  return null;
}

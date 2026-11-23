// Small dependency-free SVG line chart.
// series: [{ label, values, color, dashed }]; x: minutes for each value.
export default function LineChart({
  x,
  series,
  yLabel,
  yMin,
  yMax,
  xMax,
  refLines = [],
  visibleCount,
  height = 220,
}) {
  const width = 640;
  const pad = { top: 16, right: 16, bottom: 36, left: 56 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;

  const all = series.flatMap((s) => s.values).concat(refLines.map((r) => r.y));
  const lo = yMin ?? Math.min(...all);
  const hi = yMax ?? Math.max(...all);
  const span = hi - lo || 1;
  const x1 = xMax ?? x[x.length - 1];
  const sx = (t) => pad.left + (t / x1) * innerW;
  const sy = (v) => pad.top + innerH - ((v - lo) / span) * innerH;
  const n = visibleCount ?? x.length;

  const yTicks = 4;
  const ticks = Array.from({ length: yTicks + 1 }, (_, i) => lo + (span * i) / yTicks);
  const xStep = x1 > 6 ? 2 : x1 > 2 ? 1 : 0.5;
  const xTicks = [];
  for (let t = 0; t <= x1 + 1e-9; t += xStep) xTicks.push(t);

  return (
    <figure className="chart">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={yLabel}>
        {ticks.map((v) => (
          <g key={v}>
            <line className="grid" x1={pad.left} x2={width - pad.right} y1={sy(v)} y2={sy(v)} />
            <text className="tick" x={pad.left - 8} y={sy(v) + 4} textAnchor="end">
              {Math.round(v)}
            </text>
          </g>
        ))}
        {xTicks.map((t) => (
          <text key={t} className="tick" x={sx(t)} y={height - pad.bottom + 18} textAnchor="middle">
            {t}
          </text>
        ))}
        <text className="axis" x={pad.left + innerW / 2} y={height - 4} textAnchor="middle">
          minutes
        </text>
        <text className="axis" transform={`translate(14 ${pad.top + innerH / 2}) rotate(-90)`} textAnchor="middle">
          {yLabel}
        </text>
        {refLines.map((r) => (
          <g key={r.label}>
            <line className="ref" x1={pad.left} x2={width - pad.right} y1={sy(r.y)} y2={sy(r.y)} />
            <text className="ref-label" x={width - pad.right - 4} y={sy(r.y) + 16} textAnchor="end">
              {r.label}
            </text>
          </g>
        ))}
        {series.map((s) => {
          const pts = s.values
            .slice(0, n)
            .map((v, i) => `${sx(x[i]).toFixed(1)},${sy(v).toFixed(1)}`)
            .join(' ');
          return (
            <polyline
              key={s.label}
              points={pts}
              fill="none"
              style={{ stroke: s.color }}
              strokeWidth={s.dashed ? 1.5 : 2.5}
              strokeDasharray={s.dashed ? '6 5' : undefined}
              strokeLinejoin="round"
            />
          );
        })}
      </svg>
      <figcaption className="legend">
        {series.map((s) => (
          <span key={s.label}>
            <i style={{ background: s.color }} className={s.dashed ? 'dashed' : ''} />
            {s.label}
          </span>
        ))}
      </figcaption>
    </figure>
  );
}

# GPU Server Detective

A simulated customer says, “Our server runs fine for five minutes, then slows down. Do we need to replace the GPU?” You play the field applications engineer (FAE). You reproduce the problem, choose which temperatures, clocks, power readings, queue metrics and fan readings to inspect, diagnose the fault, prove the fix, and explain it to the customer.

It is a portfolio piece you can play through in an FAE interview. One way to use it: hand the interviewer the controls and say, “You’re the customer. Pick a reading, and I’ll tell you what it would change about my recommendation.”

All readings are simulated. Nothing here talks to real hardware.

## Run it

Requires Node.js 20 or newer.

```bash
npm install
npm run dev      # opens on http://localhost:5173
npm test         # checks the case data and game rules
npm run build    # static build in dist/
```

## How a round plays

Two GPU workers process identical images. Both start near 120 images per second. A few minutes in, one drops to about 72 while the other stays at about 120.

1. **Measure.** Run the workload and read the chart: which worker slowed, by how much, and when.
2. **Evidence.** Open only the readings you need. Each answers a different question:
   - GPU temperatures: is either GPU running hot?
   - Clock speeds and slowdown reasons (modeled on `nvidia-smi -q -d PERFORMANCE`): is the GPU lowering its own clock, and why?
   - Power draw and power limit (modeled on `nvidia-smi -q -d POWER`): is the GPU getting the power it is allowed?
   - Application input queue: is the GPU waiting on input, or is input waiting on the GPU?
   - Chassis fan RPM (modeled on Supermicro BMC sensor readings): is the chassis moving enough air?

   Then commit to a diagnosis. A wrong pick gets case-specific feedback.
3. **Close the ticket.** After the repair, a 1-minute test passes. It also passed before the repair. Close the ticket on a short test and the customer reopens it. You need a run past the five-minute failure window that stays above the 114 images/s target.
4. **Customer update.** Write two sentences, check them against a list, and compare with a model answer.

A debrief at the end shows how many tries each step took and which evidence you opened, in order.

## The two cases

Both tickets open with the same complaint and the same throughput chart, so “slow GPU means bad fan” does not work as a memorized answer.

| Ticket | Cause | What gives it away |
| --- | --- | --- |
| TCK-4471 (`src/cases/case-a.json`) | Failed chassis fan in front of GPU 1 | FAN4 reads 0 RPM, GPU 1 climbs to 89 °C, `SW Thermal Slowdown` is active |
| TCK-4502 (`src/cases/case-b.json`) | GPU 1’s power limit lowered from 350 W to 200 W at minute 5 | Power limit drops, `SW Power Cap` is active, temperatures fall and fans are normal |

The start screen has a **Random ticket** button so the player does not know which case they got.

## Project layout

```
src/
  cases/case-a.json, case-b.json   timeline, readings and expected outcome for each case
  game.js                          game rules (answer checks, test runs, when the ticket can close)
  game.test.js                     checks both cases against the rules
  components/                      one component per step, plus an SVG line chart
```

Each case file holds the ticket, the readings before the repair (`readings`), the readings after it (`afterRepair`), and the expected outcome (`expected`: root cause, explanation, repair, feedback for each wrong diagnosis, model customer update). Readings are sampled every 30 seconds for 12 minutes.

To add a case, copy a case file, change the readings and `expected`, and add it to `src/cases/index.js`. `npm test` checks that the series lengths match, that a 1-minute test passes before the repair, and that a 10-minute test fails before the repair and passes after it.

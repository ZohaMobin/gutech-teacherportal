import React from 'react';

const round = (n) => Math.round(n * 100) / 100;

// Shown while adding or editing an assessment: what the other assessments already use, what this one adds, and where the
// section's regular weightage will stand after saving. A bonus is on top of the 100 and does not move it.
const WeightMeter = ({ others, current, isBonus, problem }) => {
  const used = round(Number(others) || 0);
  const mine = isBonus ? 0 : round(Number(current) || 0);
  const total = round(used + mine);
  const over = total > 100;
  const tone = isBonus ? 'bonus' : over ? 'over' : total === 100 ? 'ok' : 'todo';
  const pct = (n) => `${Math.max(0, Math.min(100, n))}%`;
  const message = problem
    || (isBonus ? `A bonus is on top of the 100% and does not change the section total, which stays at ${used}%.`
      : total === 100 ? 'The section will add up to exactly 100%.'
        : over ? `After saving, the section adds up to ${total}%, which is ${round(total - 100)}% over. It must be exactly 100% before results can be submitted.`
          : `After saving, the section adds up to ${total}%. ${round(100 - total)}% is still to be added before results can be submitted.`);
  return (
    <div className={`weight-meter weight-meter-${tone}`} role="status">
      <div className="weight-meter-bar" aria-hidden="true">
        <span className="wm-others" style={{ width: pct(used) }} />
        <span className="wm-mine" style={{ width: pct(Math.min(mine, Math.max(0, 100 - used))) }} />
      </div>
      <div className="weight-meter-rows">
        <span>Other assessments <b>{used}%</b></span>
        {!isBonus && <span>This one <b>{mine}%</b></span>}
        {!isBonus && <span className="weight-meter-total">Section total <b>{total} / 100</b></span>}
      </div>
      <p className={`weight-meter-message ${problem || over ? 'bad' : ''}`} role={problem ? 'alert' : undefined}>{message}</p>
    </div>
  );
};

export default WeightMeter;

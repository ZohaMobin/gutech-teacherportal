import React from 'react';

// Where a section's weightage stands, at a glance. Regular assessments make up the course's 100%. A bonus is extra
// credit ON TOP of that 100%: it never uses any of the 100, and it is there to help students who are not passing, or
// to let them score better. A student's total is still shown as at most 100%.
const round = (n) => Math.round(n * 100) / 100;

export const summarizeWeights = (assessments = []) => {
  let regular = 0;
  let bonus = 0;
  for (const a of assessments) {
    const weight = Number(a.weightage) || 0;
    if (a.isBonus) bonus += weight; else regular += weight;
  }
  return { regular: round(regular), bonus: round(bonus), count: assessments.length };
};

const WeightSummary = ({ assessments }) => {
  const { regular, bonus, count } = summarizeWeights(assessments);
  if (!count) return null;

  const gap = round(100 - regular);
  const tone = gap === 0 ? 'ok' : gap > 0 ? 'todo' : 'over';
  const message = gap === 0
    ? 'The regular assessments add up to exactly 100%.'
    : gap > 0
      ? `${gap}% is still to be added to reach 100%.`
      : `${-gap}% over 100%. Lower a weightage, or if one of these is extra credit, tick Bonus on it (bonus is on top of the 100%).`;

  return (
    <div className={`weight-summary weight-summary-${tone}`} role="status">
      <div className="weight-summary-row">
        <span>Regular weightage</span>
        <strong>{regular} / 100</strong>
        <span className="weight-summary-bar" aria-hidden="true"><i style={{ width: `${Math.max(0, Math.min(100, regular))}%` }} /></span>
      </div>
      {bonus > 0 && (
        <div className="weight-summary-row weight-summary-bonus">
          <span>Bonus (on top of 100%)</span>
          <strong>+{bonus}%</strong>
        </div>
      )}
      <p className="weight-summary-message">{message}</p>
    </div>
  );
};

export default WeightSummary;

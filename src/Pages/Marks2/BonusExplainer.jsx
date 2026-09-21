import React from 'react';

// The one place that explains how a bonus works, so the Add and Edit dialogs always say the same thing:
// bonus marks sit ON TOP of the course's 100%.
export const BONUS_LABEL = 'Bonus (on top of 100%)';
export const BONUS_WEIGHT_LABEL = 'Bonus weightage (%, on top of the 100)';

const BonusExplainer = ({ checked, onChange, id = 'bonus-checkbox' }) => (
  <div className="form-group bonus-checkbox-group">
    <label className="bonus-checkbox-label" htmlFor={id}>
      <input id={id} type="checkbox" checked={Boolean(checked)} onChange={(e) => onChange(e.target.checked)} />
      <span>{BONUS_LABEL}</span>
    </label>
    <div className="bonus-help-text">
      <p>
        Bonus marks are <strong>extra</strong>. They are added <strong>on top of</strong> the course's 100% and never use up any of the 100.
      </p>
      <p>Leave it unticked if this is a normal part of the course grade.</p>
    </div>
  </div>
);

export default BonusExplainer;

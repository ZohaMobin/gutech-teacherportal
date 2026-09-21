import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import WeightMeter from './WeightMeter';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let container; let root;
beforeEach(() => { container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container); });
afterEach(() => { act(() => root.unmount()); container.remove(); });
const show = async (props) => { await act(async () => { root.render(<WeightMeter {...props} />); }); return container.textContent; };

test('it shows what the others use, what this one adds, and the section total after saving', async () => {
  const text = await show({ others: 60, current: 30 });
  expect(text).toContain('Other assessments 60%');
  expect(text).toContain('This one 30%');
  expect(text).toContain('Section total 90 / 100');
  expect(text).toContain('After saving, the section adds up to 90%. 10% is still to be added before results can be submitted.');
});

test('exactly 100 is confirmed', async () => {
  const text = await show({ others: 60, current: 40 });
  expect(text).toContain('The section will add up to exactly 100%.');
  expect(container.querySelector('.weight-meter-ok')).not.toBeNull();
});

test('over 100 with a blocking problem shows that problem, in red, and no duplicate sentence', async () => {
  const text = await show({ others: 80, current: 40, problem: 'Only 20% is left in this section. Lower this to 20% or less.' });
  expect(text).toContain('Only 20% is left in this section.');
  expect(text).not.toContain('After saving');
  expect(container.querySelector('[role=alert]')).not.toBeNull();
  expect(container.querySelector('.weight-meter-over')).not.toBeNull();
});

test('a section already over 100 that is being lowered is told how far over it still is', async () => {
  const text = await show({ others: 100, current: 5 });
  expect(text).toContain('adds up to 105%, which is 5% over. It must be exactly 100%');
});

test('a bonus is on top of the 100 and leaves the total alone', async () => {
  const text = await show({ others: 95, current: 8, isBonus: true });
  expect(text).toContain('does not change the section total, which stays at 95%');
  expect(text).not.toContain('This one');
  expect(text).not.toContain('Section total');
});

test('the bar never runs past the end, however large the numbers', async () => {
  await show({ others: 90, current: 50 });
  const widths = [...container.querySelectorAll('.weight-meter-bar span')].map((s) => s.style.width);
  expect(widths).toEqual(['90%', '10%']);
});

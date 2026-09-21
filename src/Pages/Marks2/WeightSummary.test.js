import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import WeightSummary, { summarizeWeights } from './WeightSummary';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const a = (weightage, isBonus = false) => ({ weightage, isBonus });

test('regular weight and bonus are added up separately, and bonus never counts toward the 100', () => {
  expect(summarizeWeights([a(50), a(40), a(10), a(2, true)])).toEqual({ regular: 100, bonus: 2, count: 4 });
  expect(summarizeWeights([a(33.33), a(33.33), a(33.34)]).regular).toBe(100);           // decimals do not drift
  expect(summarizeWeights([])).toEqual({ regular: 0, bonus: 0, count: 0 });
});

let container; let root;
const show = async (assessments) => { await act(async () => { root.render(<WeightSummary assessments={assessments} />); }); return container.textContent; };
beforeEach(() => { container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container); });
afterEach(() => { act(() => root.unmount()); container.remove(); });

test('exactly 100 is confirmed, with the bonus shown as extra on top', async () => {
  const text = await show([a(50), a(40), a(10), a(2, true)]);
  expect(text).toContain('100 / 100');
  expect(text).toContain('add up to exactly 100%');
  expect(text).toContain('+2%');
  expect(text).toContain('never uses up any of the 100');
  expect(text).not.toContain('capped');
  expect(text).toContain('Bonus (on top of 100%)');
});

test('under 100 says how much is still to add', async () => {
  const text = await show([a(95), a(5, true)]);                 // the CL-202 situation
  expect(text).toContain('95 / 100');
  expect(text).toContain('5% is still to be added to reach 100%');
  expect(text).toContain('+5%');
});

test('over 100 says by how much, and points to the Bonus tick for extra credit', async () => {
  const text = await show([a(60), a(45)]);
  expect(text).toContain('5% over 100%');
  expect(text).toContain('tick Bonus');
});

test('with no bonus the extra-credit line is not shown, and with no assessments nothing is shown', async () => {
  expect(await show([a(100)])).not.toContain('Bonus (on top of 100%)');
  expect(await show([])).toBe('');
});

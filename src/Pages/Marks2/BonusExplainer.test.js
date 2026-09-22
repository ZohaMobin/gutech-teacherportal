import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import BonusExplainer, { BONUS_LABEL, BONUS_WEIGHT_LABEL } from './BonusExplainer';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container; let root;
beforeEach(() => { container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container); });
afterEach(() => { act(() => root.unmount()); container.remove(); });
const show = async (props) => { await act(async () => { root.render(<BonusExplainer id="b" onChange={() => {}} {...props} />); }); return container.textContent; };

test('it says a bonus is extra, on top of the 100%, and nothing more', async () => {
  const text = await show({ checked: false });
  expect(text).toContain('Bonus (on top of 100%)');
  expect(text).toContain("added on top of the course's 100%");
  expect(text).toContain('never use up any of the 100');
  expect(text).toContain('Leave it unticked if this is a normal part of the course grade.');
  expect(text).not.toMatch(/example|not passing|score better|103|65%|capped/i);
});

test('the tick box reflects its state and reports a change', async () => {
  const seen = [];
  await show({ checked: true, onChange: (v) => seen.push(v) });
  const box = container.querySelector('input[type="checkbox"]');
  expect(box.checked).toBe(true);
  expect(container.querySelector('label').getAttribute('for')).toBe('b');
  await act(async () => { box.click(); });
  expect(seen).toEqual([false]);
});

test('the labels are the ones used in the dialogs', () => {
  expect(BONUS_LABEL).toBe('Bonus (on top of 100%)');
  expect(BONUS_WEIGHT_LABEL).toBe('Bonus weightage (%, on top of the 100)');
});

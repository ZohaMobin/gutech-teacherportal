import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import LockedNotice, { lockText } from './LockedNotice';

jest.mock('lucide-react', () => new Proxy({ __esModule: true }, { get: (target, name) => (name in target ? target[name] : () => null) }));
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container; let root;
beforeEach(() => { container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container); });
afterEach(() => { act(() => root.unmount()); container.remove(); });
const show = async (status) => { await act(async () => { root.render(<LockedNotice status={status} />); }); return container.textContent; };

test('nothing is shown while the marks can still be edited, or before the status is known', async () => {
  expect(await show({ workflowEnabled: true, state: 'OPEN', marksFrozen: false })).toBe('');
  expect(await show(null)).toBe('');
});

test('a submitted section says it is read-only and how to get a change made', async () => {
  const text = await show({ workflowEnabled: true, state: 'SUBMITTED', marksFrozen: true });
  expect(text).toContain('Submitted for approval. This section is read-only.');
  expect(text).toContain('ask the administrator to return them to you');
});

test('an approved and a published section each say what has happened, and published points to amendments', async () => {
  expect(await show({ state: 'APPROVED', marksFrozen: true })).toContain('approved and on record');
  expect(await show({ state: 'PUBLISHED', marksFrozen: true })).toContain('made by an administrator as an amendment');
});

test('a section locked the older way still says so, without naming a state', async () => {
  const text = await show({ state: 'OPEN', marksFrozen: true });
  expect(text).toContain('Marks are locked. This section is read-only.');
  expect(text).not.toMatch(/OPEN|SUBMITTED/);
  expect(lockText({ state: 'OPEN', marksFrozen: false })).toBeNull();
});

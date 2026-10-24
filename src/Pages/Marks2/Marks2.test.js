import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import axios from 'axios';
import Marks2 from './Marks2';

jest.mock('axios');
jest.mock('xlsx', () => ({}));
jest.mock('lucide-react', () => new Proxy({ __esModule: true }, { get: (target, name) => (name in target ? target[name] : () => null) }));
jest.mock('react-hot-toast', () => ({ toast: Object.assign(jest.fn(), { success: jest.fn(), error: jest.fn() }) }));
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const { toast } = require('react-hot-toast');
const assessment = (id, title, weightage, over = {}) => ({ _id: id, title, type: 'quiz', maxMarks: 10, weightage, isBonus: false, description: '', status: 'published', ...over });
const assessments = [assessment('a1', 'Quiz 1', 40), assessment('a2', 'Final', 60, { type: 'final', maxMarks: 100 })];
const LOCK_MESSAGE = "This section's marks are locked, so assessments can no longer be changed. If a change is needed, ask the administrator to return the results to you.";

let container; let root;
const wait = (ms = 0) => act(async () => { await new Promise((r) => setTimeout(r, ms)); });
const click = async (el) => { await act(async () => { el.dispatchEvent(new MouseEvent('click', { bubbles: true })); }); await wait(); };
const type = async (el, value) => act(async () => {
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, value);
  el.dispatchEvent(new Event('input', { bubbles: true }));
});

const mount = async ({ status = { workflowEnabled: true, state: 'OPEN', marksFrozen: false }, putError = null, students = [{ id: 'r1', rollNumber: 'R-1', name: 'Ayesha' }], gradesPut = null, marks = null } = {}) => {
  axios.isAxiosError = (e) => Boolean(e && (e.response || e.request));
  axios.get.mockImplementation((url) => {
    if (url.includes('/getSections/')) return Promise.resolve({ data: [{ _id: 's1', section: 'A', courseId: { name: 'Linear Algebra' } }] });
    if (url.includes('/academic-years/current')) return Promise.resolve({ data: { _id: 't1' } });
    if (url.includes('/grading-scale')) return Promise.resolve({ data: { bands: [] } });
    if (url.includes('/status')) return Promise.resolve({ data: status });
    if (url.includes('/students')) return Promise.resolve({ data: students });
    if (url.includes('/assessments/section/')) return Promise.resolve({ data: { assessments } });
    if (marks && url.includes('/marks')) return Promise.resolve({ data: { marks } });
    return Promise.resolve({ data: [] });
  });
  axios.put.mockImplementation((url) => (url.includes('/grades') && gradesPut ? gradesPut() : putError ? Promise.reject(putError) : Promise.resolve({ data: { ...assessments[0], weightage: 30 } })));
  await act(async () => { root.render(<Marks2 />); });
  await wait(20);
  await click(container.querySelector('.section-item'));
  await wait(20);
};
const openEdit = async () => { await click(container.querySelector('.assessment-actions .btn-icon')); await wait(); };
const update = async () => { await click([...container.querySelectorAll('button')].find((b) => b.textContent.includes('Update Assessment'))); await wait(); };

beforeEach(() => {
  container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container);
  sessionStorage.setItem('token', 't'); sessionStorage.setItem('user', JSON.stringify({ teacherId: 'tch1' }));
  jest.clearAllMocks(); jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => { act(() => root.unmount()); container.remove(); console.error.mockRestore?.(); });

test('editing a locked assessment shows the server\'s reason inside the dialog, never "Network error"', async () => {
  await mount({ putError: { response: { status: 409, data: { message: LOCK_MESSAGE } } } });
  await openEdit();
  await update();
  const shown = container.querySelector('.dialog-error');
  expect(shown.textContent).toBe(LOCK_MESSAGE);
  expect(container.textContent).not.toMatch(/network error/i);
  expect(container.querySelector('.error-message')).toBeNull();            // not a banner hidden behind the dialog
  expect(container.querySelector('.modal-content, .modal')).not.toBeNull();  // and the dialog stays open
});

test('a real connection problem says so, and only then', async () => {
  await mount({ putError: { request: {} } });
  await openEdit();
  await update();
  expect(container.querySelector('.dialog-error').textContent).toBe("Couldn't reach the server. Check your internet connection and try again.");
});

test('the dialog error goes away when the dialog is reopened', async () => {
  await mount({ putError: { response: { status: 409, data: { message: LOCK_MESSAGE } } } });
  await openEdit();
  await update();
  await click([...container.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Cancel'));
  await openEdit();
  expect(container.querySelector('.dialog-error')).toBeNull();
});

test('the edit dialog shows a live weightage meter for the whole section', async () => {
  await mount();
  await openEdit();
  const meter = container.querySelector('.weight-meter');
  expect(meter.textContent).toContain('Other assessments 60%');
  expect(meter.textContent).toContain('Section total 100 / 100');
  expect(meter.textContent).toContain('exactly 100%');
  const weight = container.querySelectorAll('.form-group input[type="number"]');
  await type(weight[weight.length - 1], '30');
  expect(container.querySelector('.weight-meter').textContent).toContain('Section total 90 / 100');
});

test('a locked section says so up front, and the controls that would fail are disabled', async () => {
  await mount({ status: { workflowEnabled: true, state: 'SUBMITTED', marksFrozen: true } });
  expect(container.querySelector('.marks-locked-notice').textContent).toContain('Submitted for approval. This section is read-only.');
  const add = [...container.querySelectorAll('button')].find((b) => b.textContent.includes('Add Assessment'));
  expect(add.disabled).toBe(true);
  expect([...container.querySelectorAll('.assessment-actions .btn-icon')].every((b) => b.disabled)).toBe(true);
});

test('an open section shows no lock notice and its controls work', async () => {
  await mount();
  expect(container.querySelector('.marks-locked-notice')).toBeNull();
  const add = [...container.querySelectorAll('button')].find((b) => b.textContent.includes('Add Assessment'));
  expect(add.disabled).toBe(false);
  expect(toast.error).not.toHaveBeenCalled();
});

test('saving sends only the marks that changed, and does not reload them afterwards', async () => {
  await mount();
  axios.get.mockImplementation((url) => {
    if (url.includes('/getSections/')) return Promise.resolve({ data: [{ _id: 's1', section: 'A', courseId: { name: 'Linear Algebra' } }] });
    if (url.includes('/academic-years/current')) return Promise.resolve({ data: { _id: 't1' } });
    if (url.includes('/status')) return Promise.resolve({ data: { workflowEnabled: true, state: 'OPEN', marksFrozen: false } });
    if (url.includes('/students')) return Promise.resolve({ data: [{ id: 'r1', registrationId: 'g1', rollNumber: 'R-1', name: 'Ayesha' }, { id: 'r2', registrationId: 'g2', rollNumber: 'R-2', name: 'Bilal' }] });
    if (url.includes('/assessments/section/')) return Promise.resolve({ data: { assessments } });
    if (url.includes('/marks')) return Promise.resolve({ data: { marks: { r1: 7 } } });
    return Promise.resolve({ data: [] });
  });
  axios.put.mockResolvedValue({ data: { grades: [] } });
  await click(container.querySelectorAll('.section-item')[0]);            // reload the section with the new students
  await wait(20);
  await click(container.querySelector('.assessment-item'));
  await wait(30);
  const inputs = [...container.querySelectorAll('.marks-table input[type="number"], .students-table input[type="number"], input.mark-input')];
  expect(inputs.length).toBeGreaterThanOrEqual(2);
  expect(inputs[0].readOnly).toBe(true);                                     // Ayesha's 7 is saved, so the list opens locked
  await click(container.querySelector('.mk-edit'));
  await type(inputs[1], '9');
  const save = () => click(container.querySelector('button.save-btn'));
  const marksGets = () => axios.get.mock.calls.filter(([u]) => /assessment\/a1\/marks/.test(u)).length;
  const before = marksGets();
  await save(); await wait(20);
  expect(axios.put).toHaveBeenCalledTimes(1);
  expect(axios.put.mock.calls[0][1].grades).toEqual([{ registrationId: 'g2', obtainedMarks: 9, feedback: '' }]);   // Ayesha's 7 is already saved
  expect(marksGets()).toBe(before);                                          // no reload after saving
  expect(container.querySelector('button.save-btn')).toBeNull();             // saved marks lock again: nothing more to send until Edit marks
  expect(axios.put).toHaveBeenCalledTimes(1);
});

test('opening the gradebook loads every mark with ONE request, however many assessments there are', async () => {
  await mount();
  axios.get.mockImplementation((url) => {
    if (url.includes('/students')) return Promise.resolve({ data: [{ id: 'r1', registrationId: 'g1', rollNumber: 'R-1', name: 'Ayesha' }] });
    if (url.includes('/section/s1/marks')) return Promise.resolve({ data: { marks: { a1: { r1: 7 }, a2: { r1: 55 } } } });
    if (url.includes('/status')) return Promise.resolve({ data: { workflowEnabled: true, state: 'OPEN', marksFrozen: false } });
    if (url.includes('/assessments/section/')) return Promise.resolve({ data: { assessments } });
    return Promise.resolve({ data: [] });
  });
  axios.get.mockClear();
  await click([...container.querySelectorAll('.marks-view-tab')].find((b) => b.textContent.includes('Gradebook')));
  await wait(50);
  const marksCalls = axios.get.mock.calls.map(([u]) => u).filter((u) => /\/marks$/.test(u));
  expect(marksCalls).toHaveLength(1);
  expect(marksCalls[0]).toContain('/section/s1/marks');
});

// Saving marks writes, it does not read: the panel must stay on screen, with only the button and the table saying so.
test('saving marks keeps the table on screen and shows the button working, then confirms', async () => {
  let finish;
  await mount({ students: [{ id: 'r1', registrationId: 'reg1', rollNumber: 'R-1', name: 'Ayesha' }], gradesPut: () => new Promise((resolve) => { finish = () => resolve({ data: { ok: true } }); }) });
  await click(container.querySelector('.assessment-item'));
  await wait(20);
  await type(container.querySelector('.marks-table input'), '7');
  const saveButton = () => [...container.querySelectorAll('button.save-btn')][0];
  await click(saveButton());

  expect(container.querySelector('.ld-table')).toBeNull();                          // no skeleton in place of the table
  expect(container.querySelectorAll('.marks-table tbody input').length).toBe(1);    // the entered marks are still there
  expect(container.querySelector('.marks-table input').readOnly).toBe(true);        // ...but cannot be edited mid-save
  expect(saveButton().textContent).toContain('Saving');
  expect(saveButton().disabled).toBe(true);

  await act(async () => { finish(); });
  await wait();
  expect(saveButton()).toBeUndefined();                                             // saved: the marks lock again...
  expect(container.querySelector('.mk-edit').textContent).toContain('Edit marks');  // ...until the teacher chooses to edit
  expect(container.querySelector('.marks-table input').readOnly).toBe(true);
  expect(toast.success).toHaveBeenCalledWith('Marks saved successfully');
});

test('the first load shows placeholders in the lists, not an empty "Select a section" prompt, and ends when the sections arrive', async () => {
  let release;
  axios.get.mockImplementation((url) => {
    if (url.includes('/academic-years/current')) return new Promise((resolve) => { release = () => resolve({ data: { _id: 't1' } }); });
    return Promise.resolve({ data: [] });
  });
  await act(async () => { root.render(<Marks2 />); });
  await wait(20);
  expect(container.querySelectorAll('.sk-list').length).toBe(2);              // sections and assessments
  expect(container.querySelector('.sk-roster')).not.toBeNull();               // and the panel
  expect(container.textContent).not.toContain('Select a section to view and manage marks');
  axios.get.mockImplementation((url) => {
    if (url.includes('/getSections/')) return Promise.resolve({ data: [{ _id: 's1', section: 'A', courseId: { name: 'Linear Algebra' } }] });
    if (url.includes('/students')) return Promise.resolve({ data: [{ id: 'r1', rollNumber: 'R-1', name: 'Ayesha' }] });
    if (url.includes('/assessments/section/')) return Promise.resolve({ data: { assessments } });
    if (url.includes('/status')) return Promise.resolve({ data: { workflowEnabled: true, state: 'OPEN', marksFrozen: false } });
    return Promise.resolve({ data: [] });
  });
  await act(async () => { release(); });
  await wait(60);
  expect(container.querySelector('.sk-list')).toBeNull();
  expect(container.querySelector('.section-item')).not.toBeNull();
});

// Saved marks open read-only so a stray keystroke cannot change them; empty ones open ready for entry.
describe('editing safeguards', () => {
  const students = [{ id: 'r1', registrationId: 'g1', rollNumber: 'R-1', name: 'Ayesha' }, { id: 'r2', registrationId: 'g2', rollNumber: 'R-2', name: 'Bilal' }];
  const inputs = () => [...container.querySelectorAll('.marks-table tbody input')];
  const openQuiz = async (opts) => { await mount({ students, ...opts }); await click(container.querySelector('.assessment-item')); await wait(20); };
  const button = (text) => [...document.querySelectorAll('.confirm-dialog button')].find((b) => b.textContent.trim() === text);

  test('an assessment with no marks opens ready to type in, with no Edit button', async () => {
    await openQuiz();
    expect(inputs()[0].readOnly).toBe(false);
    expect(container.querySelector('.mk-edit')).toBeNull();
    expect(container.querySelector('.mk-dirty')).toBeNull();
  });

  test('saved marks open locked; Edit marks unlocks, and a changed mark shows what it was', async () => {
    await openQuiz({ marks: { r1: 7 } });
    expect(inputs().every((i) => i.readOnly)).toBe(true);
    expect(container.querySelector('button.save-btn')).toBeNull();
    await click(container.querySelector('.mk-edit'));
    expect(inputs().every((i) => !i.readOnly)).toBe(true);
    expect(container.querySelector('.mk-dirty')).toBeNull();                       // nothing changed yet: no nagging
    await type(inputs()[0], '9');
    expect(inputs()[0].classList.contains('mk-changed')).toBe(true);
    expect(container.querySelector('.mk-was').textContent).toBe('was 7');
    expect(container.querySelector('.mk-dirty').textContent).toMatch(/1\s*unsaved change/);
    expect(container.querySelector('button.save-btn').textContent).toContain('Save 1 change');
  });

  test('Discard puts the saved marks back', async () => {
    await openQuiz({ marks: { r1: 7 } });
    await click(container.querySelector('.mk-edit'));
    await type(inputs()[0], '9');
    await type(inputs()[1], '5');                                                  // a brand-new mark counts as a change too
    expect(container.querySelector('.mk-dirty').textContent).toMatch(/2\s*unsaved changes/);
    await click(container.querySelector('.mk-link'));
    expect(inputs().map((i) => i.value)).toEqual(['7', '']);
    expect(container.querySelector('.mk-dirty')).toBeNull();
  });

  test('typing the same value that is saved is not a change', async () => {
    await openQuiz({ marks: { r1: 7 } });
    await click(container.querySelector('.mk-edit'));
    await type(inputs()[0], '7');
    expect(container.querySelector('.mk-dirty')).toBeNull();
  });

  test('switching assessment with unsaved changes asks first; cancelling keeps them', async () => {
    await openQuiz({ marks: { r1: 7 } });
    await click(container.querySelector('.mk-edit'));
    await type(inputs()[0], '9');
    await click(container.querySelectorAll('.assessment-item')[1]);
    expect(document.querySelector('.confirm-dialog')).not.toBeNull();
    await click(button('Cancel'));
    expect(container.querySelector('.assessment-header h2').textContent).toBe('Quiz 1');
    expect(inputs()[0].value).toBe('9');
    await click(container.querySelectorAll('.assessment-item')[1]);
    await click(button('Discard'));
    await wait(20);
    expect(container.querySelector('.assessment-header h2').textContent).toBe('Final');
  });

  test('switching with nothing changed does not ask', async () => {
    await openQuiz({ marks: { r1: 7 } });
    await click(container.querySelectorAll('.assessment-item')[1]);
    expect(document.querySelector('.confirm-dialog')).toBeNull();
    expect(container.querySelector('.assessment-header h2').textContent).toBe('Final');
  });

  test('closing the tab with unsaved changes is questioned by the browser, and not otherwise', async () => {
    await openQuiz({ marks: { r1: 7 } });
    const fire = () => { const e = new Event('beforeunload', { cancelable: true }); window.dispatchEvent(e); return e.defaultPrevented; };
    expect(fire()).toBe(false);
    await click(container.querySelector('.mk-edit'));
    await type(inputs()[0], '9');
    expect(fire()).toBe(true);
  });
});

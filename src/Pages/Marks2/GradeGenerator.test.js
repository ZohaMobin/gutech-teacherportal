import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import axios from 'axios';
import GradeGenerator, { buildScheme } from './GradeGenerator';

jest.mock('axios');
jest.mock('lucide-react', () => new Proxy({ __esModule: true }, { get: (target, name) => (name in target ? target[name] : () => null) }));
jest.mock('react-hot-toast', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const section = { _id: 's1', section: 'A', courseId: { name: 'Linear Algebra' } };
const readiness = { weights: { ready: true, regularWeight: 100 }, missing: [], hasAssessments: true, hasStudents: true, readyToSubmit: true };
const batch = (over = {}) => ({ sectionId: 's1', state: 'OPEN', returnedReason: null, generation: null, ledger: null, stale: false, readiness, policy: { maxUpgradeMarks: 10 }, history: [], ...over });
const summary = { studentCount: 2, gradedCount: 2, classAverageBefore: 60, classAverageAfter: 62, passingBefore: 1, passingAfter: 2, studentsUpgraded: 2, studentsMovedUp: 1, studentsAtCeiling: 0, studentsLimited: 0, mostAdded: 2, distribution: { grades: ['A', 'F'], before: { A: 1, F: 1 }, after: { A: 1, F: 0 } } };
const preview = { description: 'Add 2 marks to every student', summary, rows: [
  { registrationId: 'r1', name: 'Ayesha Khan', rollNumber: 'R-1', raw: 48, upgrade: 2, final: 50, rawGrade: { grade: 'F' }, finalGrade: { grade: 'D' }, limitedBy: null },
  { registrationId: 'r2', name: 'Bilal Ahmed', rollNumber: 'R-2', raw: 99, upgrade: 1, final: 100, rawGrade: { grade: 'A' }, finalGrade: { grade: 'A' }, limitedBy: 'CEILING' },
] };

let container; let root;
const mount = async (data) => {
  axios.get.mockResolvedValue({ data });
  axios.post.mockResolvedValue({ data: preview });
  axios.put.mockResolvedValue({ data: {} });
  await act(async () => { root.render(<GradeGenerator section={section} apiUrl="http://api" headers={() => ({})} />); });
  await act(async () => { await new Promise((r) => setTimeout(r, 380)); });
};
const type = async (el, value) => {
  const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  await act(async () => { Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, value); el.dispatchEvent(new Event('input', { bubbles: true })); });
};
const choose = async (index) => { await act(async () => { container.querySelectorAll('.gg-option input')[index].click(); }); await act(async () => { await new Promise((r) => setTimeout(r, 380)); }); };
const button = (label) => [...container.querySelectorAll('button')].find((b) => b.textContent.includes(label));

beforeEach(() => { jest.clearAllMocks(); container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container); });
afterEach(() => { act(() => root.unmount()); container.remove(); });

test('buildScheme accepts good input and says what is wrong with bad input', () => {
  expect(buildScheme('NONE', '', '', 10)).toEqual({ scheme: { type: 'NONE' }, problem: null });
  expect(buildScheme('ADD_MARKS', '2', '', 10).scheme).toEqual({ type: 'ADD_MARKS', marks: 2 });
  expect(buildScheme('ADD_MARKS', '11', '', 10).problem).toBe('The most that can be added is 10 marks.');
  expect(buildScheme('ADD_MARKS', '', '', 10).problem).toBe('Enter how many marks to add.');
  expect(buildScheme('ADD_MARKS', '-1', '', 10).scheme).toBeNull();
  expect(buildScheme('TARGET_AVERAGE', '', '72', 10).scheme).toEqual({ type: 'TARGET_AVERAGE', target: 72 });
  expect(buildScheme('TARGET_AVERAGE', '', '150', 10).scheme).toBeNull();
});

test('a draft shows readiness, the class effect, and every student before and after', async () => {
  await mount(batch());
  const text = container.textContent;
  expect(text).toContain('Draft');
  expect(text).toContain('Weightage 100 / 100');
  expect(text).toContain('Ayesha Khan');
  expect(text).toContain('Held at 100');
  expect(container.querySelectorAll('.gg-step.done').length).toBe(1);
});

test('an upgrade needs a reason and a valid amount before it can be submitted, and says why', async () => {
  await mount(batch());
  await choose(1);
  expect(container.querySelector('.gg-blocker').textContent).toContain('reason for the upgrade');
  expect(button('Submit to admin').disabled).toBe(true);
  await type(container.querySelector('#gg-marks'), '11');
  expect(container.querySelector('.gg-problem').textContent).toContain('most that can be added is 10');
  await type(container.querySelector('#gg-marks'), '2');
  await type(container.querySelector('#gg-reason'), 'The final exam was harder than planned');
  expect(button('Submit to admin').disabled).toBe(false);
});

test('submitting saves the choice first, asks for confirmation, and only then submits', async () => {
  await mount(batch({ readiness: { ...readiness, missing: [{ registrationId: 'r9', name: 'Zed', rollNumber: 'R-9', missingCount: 1 }] } }));
  await choose(1);
  await type(container.querySelector('#gg-reason'), 'The final exam was harder than planned');
  await act(async () => { button('Submit to admin').click(); });
  expect(axios.post).not.toHaveBeenCalledWith(expect.stringContaining('/submit'), expect.anything(), expect.anything());
  const submit = button('Submit');
  const confirm = [...container.querySelectorAll('.gg-modal button')].find((b) => b.textContent === 'Submit');
  expect(confirm.disabled).toBe(true);                       // missing marks must be acknowledged
  await act(async () => { container.querySelector('.gg-check input').click(); });
  await act(async () => { confirm.click(); });
  expect(axios.put).toHaveBeenCalledWith('http://api/api/result-batches/section/s1/generation', expect.objectContaining({ scheme: { type: 'ADD_MARKS', marks: 2 } }), expect.anything());
  expect(axios.post).toHaveBeenCalledWith('http://api/api/result-batches/section/s1/submit', { acknowledgeMissing: true }, expect.anything());
  expect(submit).toBeTruthy();
});

test('when the weightage is not 100 the teacher is told and cannot submit', async () => {
  await mount(batch({ readiness: { ...readiness, weights: { ready: false, regularWeight: 95 }, readyToSubmit: false } }));
  expect(container.querySelector('.gg-blocker').textContent).toContain('95%');
  expect(button('Submit to admin').disabled).toBe(true);
});

test('a submitted section is read-only: no choices, no submit, and a clear notice', async () => {
  await mount(batch({ state: 'SUBMITTED', generation: { scheme: { type: 'ADD_MARKS', marks: 2 }, description: 'Add 2 marks to every student', reason: 'x', summary, rows: preview.rows.map(({ rawGrade, finalGrade, ...r }) => r) } }));
  expect(container.textContent).toContain('Submitted');
  expect(container.textContent).toContain('read-only');
  expect(container.querySelector('.gg-choose')).toBeNull();
  expect(container.querySelector('.gg-actions')).toBeNull();
  expect(container.querySelector('.gg-table.no-grade')).not.toBeNull();     // no letters exist yet
});

test('a section returned by the administrator shows their reason and is editable again', async () => {
  await mount(batch({ returnedReason: 'Please re-check the Midterm marks' }));
  expect(container.textContent).toContain('Returned by the administrator');
  expect(container.textContent).toContain('Please re-check the Midterm marks');
  expect(container.querySelector('.gg-choose')).not.toBeNull();
});

test('once approved, the record letters are shown beside the marks', async () => {
  await mount(batch({ state: 'APPROVED', generation: { scheme: { type: 'NONE' }, description: 'As entered (no upgrade)', summary, rows: preview.rows.map(({ rawGrade, finalGrade, ...r }) => r) }, ledger: [{ registrationId: 'r1', letterGrade: 'D' }, { registrationId: 'r2', letterGrade: 'A' }] }));
  const cells = [...container.querySelectorAll('.gg-letter')].map((e) => e.textContent);
  expect(cells).toEqual(['D', 'A']);
  expect(container.textContent).toContain('Approved and recorded');
});

test('a load failure is shown with a way to try again', async () => {
  axios.get.mockRejectedValue({ response: { data: { message: 'You do not teach this section' } } });
  await act(async () => { root.render(<GradeGenerator section={section} apiUrl="http://api" headers={() => ({})} />); });
  expect(container.textContent).toContain('You do not teach this section');
  expect(button('Try again')).toBeTruthy();
});

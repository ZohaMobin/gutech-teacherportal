import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import Marks2 from './Marks2';

// The real spreadsheet library is used here (unlike Marks2.test.js): the point is the whole path from a chosen file to the table.
jest.mock('axios');
jest.mock('lucide-react', () => new Proxy({ __esModule: true }, { get: (target, name) => (name in target ? target[name] : () => null) }));
jest.mock('react-hot-toast', () => ({ toast: Object.assign(jest.fn(), { success: jest.fn(), error: jest.fn() }) }));
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const { toast } = require('react-hot-toast');
const assessments = [{ _id: 'a1', title: 'Quiz 1', type: 'quiz', maxMarks: 10, weightage: 40, isBonus: false, description: '', status: 'published' }];
const students = [
  { id: 'r1', registrationId: 'g1', rollNumber: 'R-1', name: 'Ayesha' },
  { id: 'r2', registrationId: 'g2', rollNumber: 'R-2', name: 'Bilal' },
  { id: 'r3', registrationId: 'g3', rollNumber: 'R-3', name: 'Chand' },
];

let container; let root;
const wait = (ms = 0) => act(async () => { await new Promise((r) => setTimeout(r, ms)); });
const click = async (el) => { await act(async () => { el.dispatchEvent(new MouseEvent('click', { bubbles: true })); }); await wait(); };
const button = (text) => [...container.querySelectorAll('button')].find((b) => b.textContent.trim().includes(text));
const sheetFile = (rows, name = 'marks.xlsx') => {
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), 'Marks');
  const bytes = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
  return new File([bytes], name, { type: 'application/octet-stream' });
};
const chooseFile = async (file) => {
  const input = document.querySelector('input[type="file"]');
  Object.defineProperty(input, 'files', { value: [file], configurable: true });
  await act(async () => { input.dispatchEvent(new Event('change', { bubbles: true })); });
  await wait(60);                                   // the file is read asynchronously
};
const markInputs = () => [...container.querySelectorAll('input.mark-input, .marks-table input[type="number"], .students-table input[type="number"]')];

beforeEach(async () => {
  container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container);
  sessionStorage.setItem('token', 't'); sessionStorage.setItem('user', JSON.stringify({ teacherId: 'tch1' }));
  jest.clearAllMocks(); jest.spyOn(console, 'error').mockImplementation(() => {});
  axios.isAxiosError = (e) => Boolean(e && (e.response || e.request));
  axios.get.mockImplementation((url) => {
    if (url.includes('/getSections/')) return Promise.resolve({ data: [{ _id: 's1', section: 'A', courseId: { name: 'Linear Algebra' } }] });
    if (url.includes('/academic-years/current')) return Promise.resolve({ data: { _id: 't1' } });
    if (url.includes('/grading-scale')) return Promise.resolve({ data: { bands: [] } });
    if (url.includes('/status')) return Promise.resolve({ data: { workflowEnabled: true, state: 'OPEN', marksFrozen: false } });
    if (url.includes('/students')) return Promise.resolve({ data: students });
    if (url.includes('/assessments/section/')) return Promise.resolve({ data: { assessments } });
    if (url.includes('/marks')) return Promise.resolve({ data: { marks: { r3: 4 } } });
    return Promise.resolve({ data: [] });
  });
  await act(async () => { root.render(<Marks2 />); });
  await wait(20);
  await click(container.querySelector('.section-item'));
  await wait(20);
  await click(container.querySelector('.assessment-item'));
  await wait(30);
});
afterEach(() => { act(() => root.unmount()); container.remove(); console.error.mockRestore?.(); });

test('choosing a file after clicking "Import marks" reaches the page, because the file input is not inside the closing menu', async () => {
  await click(button('Import / Export'));
  expect(container.querySelector('.marks2-menu-list')).not.toBeNull();
  const input = document.querySelector('input[type="file"]');
  await click(button('Import marks'));                                    // the menu closes on this click, as it always did
  expect(container.querySelector('.marks2-menu-list')).toBeNull();
  expect(document.body.contains(input)).toBe(true);                        // ...and the file input is still there to receive the file
  await chooseFile(sheetFile([{ 'Roll Number': 'R-1', 'Obtained Marks': 8 }, { 'Roll Number': 'R-2', 'Obtained Marks': 6 }]));
  expect(container.textContent).toMatch(/2 marks will be added to Quiz 1 \(out of 10\)/);
});

test('importing puts the marks in the table without saving, and says to press Save', async () => {
  await chooseFile(sheetFile([{ 'Roll Number': 'R-1', 'Obtained Marks': 8 }, { 'Roll Number': 'R-2', 'Obtained Marks': 6 }]));
  await click(button('Add 2 marks'));
  expect(container.textContent).not.toMatch(/Import marks\s*Preview/);
  expect(toast.success).toHaveBeenCalledWith(expect.stringMatching(/2 marks added to Quiz 1\. Press Save to keep them\./));
  expect(axios.put).not.toHaveBeenCalled();
  expect(markInputs().map((i) => i.value)).toEqual(['8', '6', '4']);       // Chand's saved 4 is untouched
  await click(button('Save Marks'));
  await wait(20);
  expect(axios.put.mock.calls[0][1].grades).toEqual([
    { registrationId: 'g1', obtainedMarks: 8, feedback: '' },
    { registrationId: 'g2', obtainedMarks: 6, feedback: '' },
  ]);
});

test('blank cells leave existing marks alone, and problems are listed instead of one error per row', async () => {
  await chooseFile(sheetFile([{ 'Roll Number': 'R-3', 'Obtained Marks': '' }, { 'Roll Number': 'R-1', 'Obtained Marks': 11 }, { 'Roll Number': 'X-9', 'Obtained Marks': 5 }, { 'Roll Number': 'R-2', 'Obtained Marks': 7 }]));
  expect(container.textContent).toMatch(/1 row has no mark and will be left as they are/);
  expect(container.textContent).toMatch(/1 roll number was not found in this section: X-9/);
  expect(container.textContent).toMatch(/1 mark is not a number from 0 to 10: Ayesha \(11\)/);
  await click(button('Add 1 mark'));
  expect(markInputs().map((i) => i.value)).toEqual(['', '7', '4']);        // Ayesha's invalid 11 was not entered, Chand's 4 kept
  expect(toast.error).not.toHaveBeenCalled();
});

test('a file without the right columns is refused with a clear reason and nothing to add', async () => {
  await chooseFile(sheetFile([{ Name: 'Ayesha', Score: 5 }]));
  expect(container.querySelector('.dialog-error').textContent).toMatch(/no "Roll Number" or "Obtained Marks" column/);
  expect(button('Nothing to add').disabled).toBe(true);
});

test('a file made for another assessment is flagged before anything is added', async () => {
  await chooseFile(sheetFile([{ 'Roll Number': 'R-1', Assessment: 'Final', 'Obtained Marks': 5 }]));
  expect(container.querySelector('.dialog-error').textContent).toMatch(/made for “Final”, not Quiz 1/);
});

test('the same file can be chosen again after fixing it', async () => {
  const input = document.querySelector('input[type="file"]');
  await chooseFile(sheetFile([{ 'Roll Number': 'R-1', 'Obtained Marks': 8 }]));
  expect(input.value).toBe('');                                            // reset, so the browser reports a second choice of the same file
});

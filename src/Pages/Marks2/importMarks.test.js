import { planImport } from './importMarks';

const students = [
  { id: 's1', rollNumber: '2622-4CS-001', name: 'Ali' },
  { id: 's2', rollNumber: '2622-4CS-002', name: 'Sara' },
  { id: 's3', rollNumber: '2622-4CS-003', name: 'Omar' },
];
const quiz = { title: 'Quiz 1', maxMarks: 10 };
const row = (roll, mark, extra = {}) => ({ 'Roll Number': roll, 'Student Name': 'x', 'Obtained Marks': mark, ...extra });

test('marks are matched to students by roll number, ignoring case and stray spaces', () => {
  const plan = planImport([row(' 2622-4cs-001 ', 8), row('2622-4CS-002', '7.5')], students, quiz);
  expect(plan.matches).toEqual([
    { studentId: 's1', rollNumber: '2622-4CS-001', name: 'Ali', mark: 8 },
    { studentId: 's2', rollNumber: '2622-4CS-002', name: 'Sara', mark: 7.5 },
  ]);
});

test('a blank mark changes nothing: a half-filled template cannot wipe marks', () => {
  const plan = planImport([row('2622-4CS-001', ''), row('2622-4CS-002', 6), row('2622-4CS-003', undefined)], students, quiz);
  expect(plan.matches.map((m) => m.studentId)).toEqual(['s2']);
  expect(plan.blank).toBe(2);
});

test('unknown roll numbers and impossible marks are listed, not imported', () => {
  const plan = planImport([row('9999', 5), row('2622-4CS-001', 11), row('2622-4CS-002', -1), row('2622-4CS-003', 'abc'), row('2622-4CS-002', 9)], students, quiz);
  expect(plan.notFound).toEqual(['9999']);
  expect(plan.invalid.map((i) => i.mark)).toEqual(['11', '-1', 'abc']);
  expect(plan.matches).toEqual([{ studentId: 's2', rollNumber: '2622-4CS-002', name: 'Sara', mark: 9 }]);
});

test('a zero is a real mark, and the maximum is allowed', () => {
  const plan = planImport([row('2622-4CS-001', 0), row('2622-4CS-002', 10)], students, quiz);
  expect(plan.matches.map((m) => m.mark)).toEqual([0, 10]);
});

test('a sheet without the needed columns is refused with their names', () => {
  expect(planImport([{ Name: 'Ali', Score: 5 }], students, quiz).missingColumns).toEqual(['Roll Number', 'Obtained Marks']);
  expect(planImport([{ 'Roll Number': '2622-4CS-001' }], students, quiz).missingColumns).toEqual(['Obtained Marks']);
  expect(planImport([], students, quiz).missingColumns).toEqual(['Roll Number', 'Obtained Marks']);
});

test('headers are matched without regard to case or spacing', () => {
  const plan = planImport([{ ' roll number ': '2622-4CS-001', 'OBTAINED  MARKS': 4 }], students, quiz);
  expect(plan.matches).toHaveLength(1);
});

test('a sheet exported for another assessment is flagged, so marks do not land in the wrong one', () => {
  const plan = planImport([row('2622-4CS-001', 5, { Assessment: 'Midterm' })], students, quiz);
  expect(plan.mismatch).toBe('Midterm');
  expect(planImport([row('2622-4CS-001', 5, { Assessment: ' quiz 1 ' })], students, quiz).mismatch).toBeNull();
});

test('a roll number listed twice keeps the later mark', () => {
  const plan = planImport([row('2622-4CS-001', 3), row('2622-4CS-001', 9)], students, quiz);
  expect(plan.matches).toEqual([{ studentId: 's1', rollNumber: '2622-4CS-001', name: 'Ali', mark: 9 }]);
});

// Works out what an uploaded marks sheet would do, before anything is changed, so the teacher can review it first.
// The sheet is the one the portal exports and the template it offers: a "Roll Number" column and an "Obtained Marks" column.

const norm = (value) => String(value ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
const ROLL_HEADERS = ['roll number', 'roll no', 'roll no.', 'rollnumber', 'roll #', 'roll'];
const MARK_HEADERS = ['obtained marks', 'obtained', 'marks'];
const ASSESSMENT_HEADERS = ['assessment'];

const pick = (row, headers) => {
  for (const key of Object.keys(row)) if (headers.includes(norm(key))) return row[key];
  return undefined;
};
const blank = (value) => value === undefined || value === null || String(value).trim() === '';

// rows: the sheet as objects (XLSX.utils.sheet_to_json). students: the section's students. assessment: the one the marks go into.
export const planImport = (rows, students, assessment) => {
  const plan = { matches: [], blank: 0, notFound: [], invalid: [], missingColumns: [], mismatch: null };
  const list = Array.isArray(rows) ? rows : [];
  if (!list.some((row) => pick(row, ROLL_HEADERS) !== undefined)) plan.missingColumns.push('Roll Number');
  if (!list.some((row) => pick(row, MARK_HEADERS) !== undefined)) plan.missingColumns.push('Obtained Marks');
  if (plan.missingColumns.length) return plan;

  const byRoll = new Map(students.map((student) => [norm(student.rollNumber), student]));
  const found = new Map();                 // a roll number listed twice: the later row wins
  for (const row of list) {
    const roll = pick(row, ROLL_HEADERS);
    const mark = pick(row, MARK_HEADERS);
    const named = pick(row, ASSESSMENT_HEADERS);
    if (!plan.mismatch && !blank(named) && norm(named) !== norm(assessment?.title)) plan.mismatch = String(named).trim();
    if (blank(roll)) continue;                                            // an empty row
    if (blank(mark)) { plan.blank += 1; continue; }                       // nothing to import: the mark stays as it is
    const student = byRoll.get(norm(roll));
    if (!student) { plan.notFound.push(String(roll).trim()); continue; }
    const value = Number(mark);
    if (Number.isNaN(value) || value < 0 || value > Number(assessment?.maxMarks)) { plan.invalid.push({ roll: String(roll).trim(), name: student.name, mark: String(mark).trim() }); continue; }
    found.set(student.id, { studentId: student.id, rollNumber: student.rollNumber, name: student.name, mark: value });
  }
  plan.matches = [...found.values()];
  return plan;
};

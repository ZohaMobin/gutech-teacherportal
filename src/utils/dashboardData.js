// What the teacher dashboard shows, worked out from data the portal already loads: the timetable, each section's attendance
// and each section's assessments and marks. Pure functions, so every rule can be tested without a screen.
import { summarizeWeights } from "../Pages/Marks2/WeightSummary";

export const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const TITLES = new Set(["dr", "mr", "ms", "mrs", "prof", "professor", "molana", "engr", "hafiz"]);
const OVERDUE_DAYS = 7;

const pad = (n) => String(n).padStart(2, "0");
export const dateKey = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
export const minutesOf = (time) => { const [h, m] = String(time || "").split(":").map(Number); return h * 60 + (m || 0); };
export const nowMinutes = (now) => now.getHours() * 60 + now.getMinutes();
const idOf = (value) => String(value?._id ?? value ?? "");
const round = (n) => Math.round(n);

export const greetingFor = (now) => (now.getHours() < 12 ? "Good morning" : now.getHours() < 17 ? "Good afternoon" : "Good evening");

export const firstNameOf = (name = "") => {
  const words = String(name).trim().split(/\s+/).filter(Boolean);
  return words.find((word) => !TITLES.has(word.toLowerCase().replace(/\./g, ""))) || words[0] || "";
};

// The server's schedule is { Monday: [{ timeSlot: { startTime, endTime, room }, courseId, sectionId }] }.
export const classesOn = (schedule, date) => {
  const list = [...(schedule?.[DAY_NAMES[date.getDay()]] || [])]
    .filter((item) => item?.timeSlot?.startTime && item?.timeSlot?.endTime)
    .sort((a, b) => minutesOf(a.timeSlot.startTime) - minutesOf(b.timeSlot.startTime));
  const seen = {};
  // `ordinal` is which class of that section this is on the day (0 = first), to match against the slots saved that day.
  return list.map((item) => { const key = idOf(item.sectionId); const ordinal = seen[key] || 0; seen[key] = ordinal + 1; return { item, sectionId: key, ordinal }; });
};

export const hasAnyClass = (schedule) => Object.values(schedule || {}).some((list) => Array.isArray(list) && list.length > 0);

// The first class after `now`, on a later day when today is finished: { item, daysAhead } or null.
export const nextClassAfter = (schedule, now) => {
  for (let ahead = 0; ahead <= 7; ahead += 1) {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + ahead);
    const found = classesOn(schedule, day).find(({ item }) => ahead > 0 || minutesOf(item.timeSlot.startTime) > nowMinutes(now));
    if (found) return { ...found, daysAhead: ahead, date: day };
  }
  return null;
};

// slotCounts: { sectionId: { "YYYY-MM-DD": number of slots saved } }, built from the attendance responses.
export const slotCountsFrom = (attendanceResponse) => {
  const counts = {};
  for (const section of attendanceResponse?.attendance || []) {
    const key = idOf(section.sectionId);
    counts[key] = counts[key] || {};
    for (const [rawDate, entry] of Object.entries(section.dates || {})) {
      const date = rawDate.split("T")[0];
      const slots = Array.isArray(entry?.slots) && entry.slots.length ? entry.slots.filter((slot) => (slot.students || []).length > 0).length : (entry?.students || []).length ? 1 : 0;
      counts[key][date] = (counts[key][date] || 0) + slots;
    }
  }
  return counts;
};

// Every class today with where it stands: done, live or later. `marked` is whether attendance is saved for it.
export const todaysClasses = (schedule, slotCounts, now) => {
  const today = dateKey(now);
  const minutes = nowMinutes(now);
  const classes = classesOn(schedule, now).map(({ item, sectionId, ordinal }) => {
    const start = minutesOf(item.timeSlot.startTime);
    const end = minutesOf(item.timeSlot.endTime);
    const state = minutes >= end ? "done" : minutes >= start ? "live" : "later";
    return { item, sectionId, state, marked: (slotCounts[sectionId]?.[today] || 0) > ordinal, minutesUntil: start - minutes };
  });
  const firstLater = classes.findIndex((entry) => entry.state === "later");
  return classes.map((entry, index) => ({ ...entry, next: index === firstLater }));
};

// Classes in the last week that have finished and have no saved attendance. Today counts only once the class has ended.
export const overdueAttendance = (schedule, slotCounts, now, { termStart = null, studentCounts = {} } = {}) => {
  const overdue = [];
  for (let back = 0; back < OVERDUE_DAYS; back += 1) {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() - back);
    const key = dateKey(day);
    if (termStart && key < termStart) continue;
    for (const { item, sectionId, ordinal } of classesOn(schedule, day)) {
      if (back === 0 && nowMinutes(now) < minutesOf(item.timeSlot.endTime)) continue;
      if (studentCounts[sectionId] === 0) continue;
      if ((slotCounts[sectionId]?.[key] || 0) <= ordinal) overdue.push({ date: key, day, item, sectionId });
    }
  }
  return overdue;   // most recent first
};

// Present or late counts as attended. null when nothing has been marked yet, so the screen shows a dash, not 0%.
export const attendanceStats = (attendanceResponse) => {
  let attended = 0; let total = 0; let slots = 0;
  for (const section of attendanceResponse?.attendance || []) {
    for (const entry of Object.values(section.dates || {})) {
      const lists = Array.isArray(entry?.slots) && entry.slots.length ? entry.slots.map((slot) => slot.students || []) : [entry?.students || []];
      for (const students of lists) {
        if (!students.length) continue;
        slots += 1;
        for (const record of students) { total += 1; if (record.status === "present" || record.status === "late") attended += 1; }
      }
    }
  }
  return { attended, total, slots, rate: total ? attended / total : null };
};

// marks: { assessmentId: { studentId: mark } } for a section with `students` students.
export const marksProgress = (assessments = [], marks = {}, students = 0) => {
  const items = assessments.map((assessment) => {
    const entered = Object.keys(marks[assessment._id] || {}).length;
    return { assessment, entered, complete: students > 0 && entered >= students, partial: entered > 0 && entered < students };
  });
  const expected = items.length * students;
  const entered = items.reduce((sum, item) => sum + Math.min(item.entered, students), 0);
  return { students, items, count: items.length, done: items.filter((item) => item.complete).length, entered, expected, rate: expected ? entered / expected : null, weights: summarizeWeights(assessments) };
};

// The few things that need the teacher, most pressing first. Each has a stable `key`, a `kind` for its icon and a `to` route.
export const attentionItems = ({ overdue, sections }) => {
  const items = [];
  for (const entry of overdue) items.push({ key: `att-${entry.sectionId}-${entry.date}-${entry.item._id}`, kind: "attendance", title: "Attendance not marked", detail: `${entry.item.courseId?.name || "Class"} · ${entry.day.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}, ${entry.item.timeSlot.startTime}`, to: "/attendance", sectionId: entry.sectionId });
  for (const { section, marks } of sections) {
    if (!marks) continue;
    for (const item of marks.items.filter((i) => i.partial)) items.push({ key: `marks-${item.assessment._id}`, kind: "marks", title: `${item.assessment.title} is missing marks`, detail: `${section.courseId?.name || "Course"} · ${item.entered} of ${marks.students ?? "?"} entered`, to: "/marks", sectionId: idOf(section) });
    const { regular, count } = marks.weights;
    if (count && regular !== 100) items.push({ key: `weights-${idOf(section)}`, kind: "weights", tone: regular > 100 ? "danger" : "warning", title: `Weights total ${regular}%`, detail: `${section.courseId?.name || "Course"} · ${regular > 100 ? `${regular - 100}% over` : `add ${100 - regular}% to finish`}`, to: "/marks", sectionId: idOf(section) });
  }
  return items;
};

export const percent = (rate) => (rate === null || rate === undefined ? null : round(rate * 100));

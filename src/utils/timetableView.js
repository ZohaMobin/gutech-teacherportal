// What the teacher timetable page shows, worked out from the timetable the server sends: { Monday: [{ timeSlot, courseId, sectionId }] }.
// Pure functions, so the rules can be tested without a screen.
import { DAY_NAMES, minutesOf } from "./dashboardData";

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const idOf = (value) => String(value?._id ?? value ?? "");

// Monday to Friday always; a weekend day only if there is a class on it.
export const visibleDays = (schedule) => [...WEEKDAYS, ...["Saturday", "Sunday"].filter((day) => (schedule?.[day] || []).length > 0)];

// The days with their dates, for the week being shown. On a weekend the next week is shown, because that is the one that is coming.
export const weekDates = (now, days) => {
  const dow = now.getDay();
  const toMonday = dow === 0 ? 1 : dow === 6 ? 2 : 1 - dow;
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + toMonday);
  return days.map((name) => {
    const index = (DAY_NAMES.indexOf(name) + 6) % 7;      // Monday = 0 ... Sunday = 6
    return { name, short: name.slice(0, 3), date: new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + index) };
  });
};

export const isSameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

// The day to open on: today if today is a shown day, otherwise the first day that has classes (on a weekend: Monday's week).
export const defaultDay = (days, schedule, now) => {
  const today = DAY_NAMES[now.getDay()];
  if (days.includes(today)) return today;
  return days.find((day) => (schedule?.[day] || []).length > 0) || days[0];
};

export const classesOfDay = (schedule, day) => [...(schedule?.[day] || [])]
  .filter((item) => item?.timeSlot?.startTime && item?.timeSlot?.endTime)
  .sort((a, b) => minutesOf(a.timeSlot.startTime) - minutesOf(b.timeSlot.startTime));

// For a day that is today: where each class stands now. Anything else has no state.
export const dayAgenda = (schedule, day, now, isToday) => {
  const minutes = now.getHours() * 60 + now.getMinutes();
  const list = classesOfDay(schedule, day).map((item) => {
    const start = minutesOf(item.timeSlot.startTime); const end = minutesOf(item.timeSlot.endTime);
    const state = !isToday ? "later" : minutes >= end ? "done" : minutes >= start ? "live" : "later";
    return { item, state, minutesUntil: start - minutes, next: false };
  });
  if (isToday) { const first = list.findIndex((entry) => entry.state === "later"); if (first >= 0) list[first].next = true; }
  return list;
};

// The week on a real time axis. The axis starts at the earliest class of the week and ends at the latest, each rounded to the half hour,
// so nothing is wasted above the first class. Every class sits at its own start and end, so a 9:30-11:30 class, a class that starts at
// 12:00 inside a 11:45 period, or one that spans two periods all land where they really are. Classes that overlap share the width.
const HALF_HOUR = 30;
export const weekAxis = (schedule, days) => {
  const all = days.flatMap((day) => classesOfDay(schedule, day));
  if (!all.length) return null;
  const start = Math.floor(Math.min(...all.map((item) => minutesOf(item.timeSlot.startTime))) / HALF_HOUR) * HALF_HOUR;
  const end = Math.ceil(Math.max(...all.map((item) => minutesOf(item.timeSlot.endTime))) / HALF_HOUR) * HALF_HOUR;
  // A line at the start, then one at each full hour inside the range.
  const ticks = [start];
  for (let t = Math.ceil(start / 60) * 60; t <= end; t += 60) if (t > start + 10) ticks.push(t);
  return { start, end, ticks, columns: days.map((day) => ({ day, blocks: layoutDay(classesOfDay(schedule, day), start) })) };
};

// Each class with its place in the day's column: how far from the top (minutes), how long, and which of `cols` side-by-side lanes it takes.
export const layoutDay = (items, axisStart = 0) => {
  const blocks = items.map((item) => ({ item, from: minutesOf(item.timeSlot.startTime), to: minutesOf(item.timeSlot.endTime), lane: 0, cols: 1 }));
  let group = []; let groupEnd = -1;
  const settle = () => { const cols = Math.max(1, ...group.map((block) => block.lane + 1)); group.forEach((block) => { block.cols = cols; }); group = []; };
  for (const block of blocks) {
    if (group.length && block.from >= groupEnd) { settle(); groupEnd = -1; }
    const taken = new Set(group.filter((other) => other.to > block.from).map((other) => other.lane));
    while (taken.has(block.lane)) block.lane += 1;
    group.push(block); groupEnd = Math.max(groupEnd, block.to);
  }
  settle();
  return blocks.map((block) => ({ item: block.item, top: block.from - axisStart, length: block.to - block.from, lane: block.lane, cols: block.cols }));
};

// The breaks between a day's classes worth showing (15 minutes or more): [{ after: itemId, minutes }]
export const breaksOf = (items) => items.slice(1).map((item, index) => ({ before: item._id, minutes: minutesOf(item.timeSlot.startTime) - minutesOf(items[index].timeSlot.endTime) })).filter((gap) => gap.minutes >= 15);

// Course colours: a short palette of muted, harmonious tones chosen to sit with the portal's maroon. Gold is left out on purpose, it means
// "now". Each course gets the next tone in order of course code, so the result does not depend on the order the rows arrived in; a lab
// (CS-301L) shares its theory course's tone, a little deeper. [accent edge, ink for text]
const TONES = [
  ["#991d20", "#991d20"],   // maroon
  ["#0f766e", "#0b4f4a"],   // teal
  ["#4f5bb5", "#2f3880"],   // indigo
  ["#5f8f3e", "#37591f"],   // sage
  ["#86447f", "#59295a"],   // plum
  ["#c2562f", "#80351a"],   // terracotta
  ["#2f6fa3", "#1d4a73"],   // steel blue
  ["#be3a64", "#7d2144"],   // rose
  ["#64748b", "#334155"],   // slate
];
const labOf = (code) => { const match = /^(.*\d)L$/i.exec(String(code || "").trim()); return match ? match[1] : null; };
const rgba = (hex, alpha) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`; };

export const courseKey = (item) => item?.courseId?.code || idOf(item?.courseId);

// key -> { "--card-accent", "--card-bg", "--card-ink" }
export const courseColors = (schedule) => {
  const found = new Map();
  Object.values(schedule || {}).flat().forEach((item) => { const key = courseKey(item); if (key) found.set(key, { code: String(item?.courseId?.code || key), name: String(item?.courseId?.name || "") }); });
  // A lab shares its course's tone, a little deeper: found by its code (CS-301L) or by its name ("Database Systems Lab").
  const isLab = ({ code, name }) => Boolean(labOf(code)) || /\bLabs?$/i.test(name.trim());
  const groupOf = (entry) => (entry.name ? entry.name.trim().replace(/\s+(I\s+)?Labs?$/i, "").toLowerCase() : labOf(entry.code) || entry.code);
  const groups = [...new Set([...found.values()].map(groupOf))].sort();
  const result = {};
  found.forEach((entry, key) => {
    const [accent, ink] = TONES[groups.indexOf(groupOf(entry)) % TONES.length];
    result[key] = { "--card-accent": accent, "--card-ink": ink, "--card-bg": rgba(accent, isLab(entry) ? 0.2 : 0.12) };
  });
  return result;
};

// The section letter of a class ("A26-F"), which is how a teacher tells their sections of one course apart.
export const sectionOf = (item) => item?.sectionId?.section || item?.sectionId?.name || "";

export const hasAnyClass = (schedule) => Object.values(schedule || {}).some((list) => Array.isArray(list) && list.length > 0);

// The three numbers above the timetable: the next class (or the one running now), today, and the week.
// "Today" is the real today, so on a weekend it is empty and the next class is the first one of the coming week.
export const summaryOf = (schedule, now) => {
  const todayName = DAY_NAMES[now.getDay()];
  const today = dayAgenda(schedule, todayName, now, true);
  const live = today.find((entry) => entry.state === "live");
  let next = live ? { item: live.item, day: todayName, live: true, minutesUntil: 0 } : null;
  if (!next) {
    const upcoming = today.find((entry) => entry.state === "later");
    if (upcoming) next = { item: upcoming.item, day: todayName, live: false, minutesUntil: upcoming.minutesUntil };
  }
  if (!next) {
    for (let step = 1; step <= 7 && !next; step += 1) {
      const name = DAY_NAMES[(now.getDay() + step) % 7];
      const first = classesOfDay(schedule, name)[0];
      if (first) next = { item: first, day: name, live: false, minutesUntil: null, daysAhead: step };
    }
  }
  const all = Object.values(schedule || {}).flat().filter((item) => item?.timeSlot?.startTime && item?.timeSlot?.endTime);
  return {
    next,
    today: { total: today.length, done: today.filter((e) => e.state === "done").length, live: today.filter((e) => e.state === "live").length, later: today.filter((e) => e.state === "later").length },
    week: { classes: all.length, courses: new Set(all.map(courseKey)).size },
  };
};

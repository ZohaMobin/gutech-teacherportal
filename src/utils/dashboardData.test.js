import { sessionsOn, attendanceStats, attentionItems, classesOn, dateKey, firstNameOf, greetingFor, marksProgress, nextClassAfter, overdueAttendance, percent, slotCountsFrom, todaysClasses } from "./dashboardData";

const cls = (id, section, start, end, name = "Web Tech") => ({ _id: id, sectionId: { _id: section }, courseId: { name, code: "CS" }, timeSlot: { startTime: start, endTime: end, room: "SL" } });
// Thursday 15 October 2026, 11:20
const now = new Date(2026, 9, 15, 11, 20);
const schedule = {
  Thursday: [cls("c3", "db", "14:00", "15:25", "DB Lab"), cls("c1", "wt", "08:30", "09:55"), cls("c2", "wt", "10:10", "11:35"), cls("c4", "db", "11:45", "13:10", "DB Lab")],
  Monday: [cls("m1", "wt", "09:30", "11:30")],
};
const attendance = (dates) => ({ attendance: [{ sectionId: "wt", dates }] });

test("names and greetings", () => {
  expect(firstNameOf("Dr. Rauf Malick")).toBe("Rauf");
  expect(firstNameOf("Zoha Mobin")).toBe("Zoha");
  expect(firstNameOf("")).toBe("");
  expect(greetingFor(new Date(2026, 0, 1, 9))).toBe("Good morning");
  expect(greetingFor(new Date(2026, 0, 1, 15))).toBe("Good afternoon");
  expect(greetingFor(new Date(2026, 0, 1, 20))).toBe("Good evening");
});

test("a day's classes are in time order", () => {
  const list = classesOn(schedule, now);
  expect(list.map((c) => c.item._id)).toEqual(["c1", "c2", "c4", "c3"]);
  expect(list.map((c) => c.sectionId)).toEqual(["wt", "wt", "db", "db"]);
});

test("today's classes are done, live or later, with the next one marked", () => {
  const counts = { wt: { "2026-10-15": 1 } };
  const list = todaysClasses(schedule, counts, now);
  expect(list.map((c) => c.state)).toEqual(["done", "live", "later", "later"]);
  expect(list.map((c) => c.next)).toEqual([false, false, true, false]);
  expect(list.map((c) => c.marked)).toEqual([true, true, false, false]);   // one saved attendance covers the section's whole day
  expect(list[2].minutesUntil).toBe(25);
});

test("overdue attendance: finished days with nothing saved, never today's unfinished classes", () => {
  const counts = { wt: { "2026-10-15": 1, "2026-10-12": 1 }, db: {} };
  // Today: the wt section is saved, and the db classes (11:45, 14:00) have not finished. Monday 12 Oct: m1 is saved.
  expect(overdueAttendance(schedule, counts, now)).toEqual([]);
  const later = new Date(2026, 9, 15, 16, 0);
  // db has a late-morning class and an afternoon class (a real gap between them): two sessions, so two attendances are expected
  expect(overdueAttendance(schedule, counts, later).map((o) => o.item._id)).toEqual(["c4", "c3"]);
  expect(overdueAttendance(schedule, { ...counts, db: { "2026-10-15": 1 } }, later).map((o) => o.item._id)).toEqual(["c3"]);   // the morning one is done
  expect(overdueAttendance(schedule, { ...counts, db: { "2026-10-15": 2 } }, later)).toEqual([]);
});

test("one attendance taken for a section that has two timetable rows that day is not reported as missing for the second row", () => {
  // The case that was wrong: a lab printed as two periods, attendance taken once.
  const twoRows = { Thursday: [cls("p1", "lab", "08:30", "09:55", "Web Tech Lab"), cls("p2", "lab", "10:10", "11:35", "Web Tech Lab")] };
  const afterBoth = new Date(2026, 9, 15, 12, 0);
  expect(overdueAttendance(twoRows, { lab: { "2026-10-15": 1 } }, afterBoth)).toEqual([]);
  expect(todaysClasses(twoRows, { lab: { "2026-10-15": 1 } }, afterBoth).map((c) => c.marked)).toEqual([true, true]);
  // and when nothing was taken it is one alert, not two
  expect(overdueAttendance(twoRows, {}, afterBoth).map((o) => o.item._id)).toEqual(["p1"]);
});

test("overdue ignores dates before the term and sections with no students", () => {
  const later = new Date(2026, 9, 15, 16, 0);
  expect(overdueAttendance(schedule, {}, later, { termStart: "2026-10-15" }).map((o) => o.item._id)).toEqual(["c1", "c4", "c3"]);
  expect(overdueAttendance(schedule, {}, later, { studentCounts: { wt: 0 } }).map((o) => o.sectionId)).not.toContain("wt");
});

test("saved slots are counted per date, in both payload shapes", () => {
  const counts = slotCountsFrom(attendance({ "2026-10-15T00:00:00.000Z": { slots: [{ slotNumber: 1, students: [{ status: "present" }] }, { slotNumber: 2, students: [] }] }, "2026-10-14": { students: [{ status: "absent" }] } }));
  expect(counts.wt).toEqual({ "2026-10-15": 1, "2026-10-14": 1 });
});

test("attendance rate counts present and late, and is null before anything is marked", () => {
  expect(attendanceStats({ attendance: [] }).rate).toBeNull();
  const stats = attendanceStats(attendance({ "2026-10-15": { slots: [{ students: [{ status: "present" }, { status: "late" }, { status: "absent" }, { status: "present" }] }] } }));
  expect(stats).toMatchObject({ attended: 3, total: 4, slots: 1 });
  expect(percent(stats.rate)).toBe(75);
  expect(percent(null)).toBeNull();
});

test("marks progress: complete, partial and missing assessments", () => {
  const assessments = [{ _id: "a", title: "Quiz 1", weightage: 40 }, { _id: "b", title: "Quiz 2", weightage: 40 }, { _id: "c", title: "Final", weightage: 20 }];
  const progress = marksProgress(assessments, { a: { s1: 5, s2: 4 }, b: { s1: 3 }, c: {} }, 2);
  expect(progress).toMatchObject({ count: 3, done: 1, entered: 3, expected: 6 });
  expect(percent(progress.rate)).toBe(50);
  expect(progress.items.map((i) => i.partial)).toEqual([false, true, false]);
  expect(marksProgress([], {}, 5).rate).toBeNull();
  expect(marksProgress(assessments, {}, 0).rate).toBeNull();
});

test("attention: unmarked classes first, then partial marks, then weight problems", () => {
  const later = new Date(2026, 9, 15, 16, 0);
  const overdue = overdueAttendance(schedule, { wt: { "2026-10-15": 2 }, db: { "2026-10-15": 2 } }, later, { termStart: "2026-10-15" });
  expect(overdue).toEqual([]);
  const marks = marksProgress([{ _id: "a", title: "Quiz 1", weightage: 40 }, { _id: "b", title: "Quiz 2", weightage: 50 }], { a: { s1: 1 }, b: { s1: 1, s2: 1 } }, 2);
  const items = attentionItems({ overdue: overdueAttendance(schedule, {}, later, { termStart: "2026-10-15" }).slice(0, 1), sections: [{ section: { _id: "wt", courseId: { name: "Web Tech" } }, marks }] });
  expect(items.map((i) => i.kind)).toEqual(["attendance", "marks", "weights"]);
  expect(items[1].detail).toMatch(/1 of 2 entered/);
  expect(items[2]).toMatchObject({ tone: "warning", title: "Weights total 90%" });
});

test("the next class is found today, or on a later day", () => {
  expect(nextClassAfter(schedule, now)).toMatchObject({ daysAhead: 0 });
  expect(nextClassAfter(schedule, now).item._id).toBe("c4");
  const evening = new Date(2026, 9, 15, 18, 0);
  const next = nextClassAfter(schedule, evening);
  expect(next.item._id).toBe("m1");
  expect(next.daysAhead).toBe(4);
  expect(dateKey(next.date)).toBe("2026-10-19");
  expect(nextClassAfter({}, now)).toBeNull();
});

test("back-to-back periods of one section are one session; a real gap makes a new one", () => {
  const sessions = sessionsOn(schedule, now);
  expect(sessions.map((s) => [s.sectionId, s.index, s.rowIds])).toEqual([["wt", 0, ["c1", "c2"]], ["db", 0, ["c4"]], ["db", 1, ["c3"]]]);
  expect(sessions[0]).toMatchObject({ start: 8 * 60 + 30, end: 11 * 60 + 35 });
});

test("a teacher who takes a separate attendance for each period of a session is also fine", () => {
  const twoRows = { Thursday: [cls("p1", "lab", "08:30", "09:55", "Lab"), cls("p2", "lab", "10:10", "11:35", "Lab")] };
  const afterBoth = new Date(2026, 9, 15, 12, 0);
  expect(overdueAttendance(twoRows, { lab: { "2026-10-15": 2 } }, afterBoth)).toEqual([]);
  expect(overdueAttendance(twoRows, { lab: { "2026-10-15": 1 } }, afterBoth)).toEqual([]);
});

test("a session is not reported while its second period is still running", () => {
  const twoRows = { Thursday: [cls("p1", "lab", "08:30", "09:55", "Lab"), cls("p2", "lab", "10:10", "11:35", "Lab")] };
  expect(overdueAttendance(twoRows, {}, new Date(2026, 9, 15, 10, 30)).map((o) => o.item._id)).toEqual([]);
  expect(overdueAttendance(twoRows, {}, new Date(2026, 9, 15, 11, 40)).map((o) => o.item._id)).toEqual(["p1"]);
});

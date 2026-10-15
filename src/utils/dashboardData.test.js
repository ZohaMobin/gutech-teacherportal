import { attendanceStats, attentionItems, classesOn, dateKey, firstNameOf, greetingFor, marksProgress, nextClassAfter, overdueAttendance, percent, slotCountsFrom, todaysClasses } from "./dashboardData";

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

test("a day's classes are in time order and numbered per section", () => {
  const list = classesOn(schedule, now);
  expect(list.map((c) => c.item._id)).toEqual(["c1", "c2", "c4", "c3"]);
  expect(list.map((c) => [c.sectionId, c.ordinal])).toEqual([["wt", 0], ["wt", 1], ["db", 0], ["db", 1]]);
});

test("today's classes are done, live or later, with the next one marked", () => {
  const counts = { wt: { "2026-10-15": 1 } };
  const list = todaysClasses(schedule, counts, now);
  expect(list.map((c) => c.state)).toEqual(["done", "live", "later", "later"]);
  expect(list.map((c) => c.next)).toEqual([false, false, true, false]);
  expect(list.map((c) => c.marked)).toEqual([true, false, false, false]);
  expect(list[2].minutesUntil).toBe(25);
});

test("overdue attendance: finished classes with nothing saved, never today's unfinished ones", () => {
  const counts = { wt: { "2026-10-15": 1, "2026-10-12": 1 }, db: {} };
  const overdue = overdueAttendance(schedule, counts, now);
  // Today: c1 is saved, c2 is still running, DB classes (11:45, 14:00) have not finished. Monday 12 Oct: m1 is saved.
  expect(overdue).toEqual([]);
  const later = new Date(2026, 9, 15, 16, 0);
  expect(overdueAttendance(schedule, counts, later).map((o) => o.item._id)).toEqual(["c2", "c4", "c3"]);
});

test("overdue ignores dates before the term and sections with no students", () => {
  const later = new Date(2026, 9, 15, 16, 0);
  expect(overdueAttendance(schedule, {}, later, { termStart: "2026-10-15" }).map((o) => o.item._id)).toEqual(["c1", "c2", "c4", "c3"]);
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

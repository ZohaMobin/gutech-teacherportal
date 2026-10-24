import { summaryOf, courseColors, weekAxis, visibleDays, sectionOf } from "./timetableView";

const cls = (id, code, name, start, end, section = "A26-F") => ({ _id: id, courseId: { _id: code, code, name }, sectionId: { section }, timeSlot: { startTime: start, endTime: end, room: "SF1" } });
const at = (h, m = 0) => new Date(2026, 9, 21, h, m);                      // Wednesday 21 October 2026
const schedule = {
  Monday: [cls("m", "CS-202", "Database Systems", "08:30", "09:55")],
  Wednesday: [cls("a", "CS-202", "Database Systems", "08:30", "09:55"), cls("b", "CS-305", "Operating Systems", "12:00", "13:10"), cls("c", "CL-202", "Database Systems Lab", "14:00", "15:25")],
  Friday: [cls("f", "CS-203", "Software Engineering", "10:10", "11:35")],
};

test("during a class it is live; between classes the next one is named with minutes to go", () => {
  expect(summaryOf(schedule, at(12, 30)).next).toMatchObject({ live: true, item: { _id: "b" } });
  expect(summaryOf(schedule, at(11, 0)).next).toMatchObject({ live: false, minutesUntil: 60, item: { _id: "b" } });
  expect(summaryOf(schedule, at(11, 0)).today).toEqual({ total: 3, done: 1, live: 0, later: 2 });
});

test("after the last class today the next class is the first one on the next day that has any", () => {
  expect(summaryOf(schedule, at(16, 0)).next).toMatchObject({ day: "Friday", item: { _id: "f" } });
});

test("on a weekend nothing is today, and the next class is Monday's first", () => {
  const saturday = new Date(2026, 9, 24, 10, 0);
  const summary = summaryOf(schedule, saturday);
  expect(summary.today.total).toBe(0);
  expect(summary.next).toMatchObject({ day: "Monday", item: { _id: "m" } });
  expect(summary.week).toEqual({ classes: 5, courses: 4 });
});

test("a lab shares its course's tone, deeper, whatever its code is", () => {
  const colors = courseColors(schedule);
  expect(colors["CL-202"]["--card-accent"]).toBe(colors["CS-202"]["--card-accent"]);
  expect(colors["CL-202"]["--card-bg"]).not.toBe(colors["CS-202"]["--card-bg"]);
  expect(colors["CS-305"]["--card-accent"]).not.toBe(colors["CS-202"]["--card-accent"]);
});

test("the board stretches to the evening, and a weekend column exists only with weekend classes", () => {
  const withEvening = { ...schedule, Saturday: [cls("s", "ML-501", "Machine Learning", "18:00", "21:00")] };
  expect(visibleDays(schedule)).toEqual(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]);
  expect(visibleDays(withEvening)).toContain("Saturday");
  expect(weekAxis(withEvening, visibleDays(withEvening)).end).toBe(21 * 60);
  expect(sectionOf(schedule.Monday[0])).toBe("A26-F");
});

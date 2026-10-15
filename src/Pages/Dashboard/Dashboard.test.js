import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";
import axios from "axios";
import Dashboard from "./Dashboard";
import { DAY_NAMES } from "../../utils/dashboardData";

jest.mock("axios");
jest.mock("lucide-react", () => new Proxy({}, { get: () => () => null }));
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({ useNavigate: () => mockNavigate }), { virtual: true });

const section = { _id: "wt", section: "B26-F", courseId: { _id: "c1", code: "CS-102", name: "Web Technologies" }, programs: [{ _id: "p", code: "BSCS", name: "BSCS" }] };
const lab = { _id: "db", section: "A26-F", courseId: { _id: "c2", code: "CL-202", name: "Database Systems Lab" }, programs: [] };
const todayName = DAY_NAMES[new Date().getDay()];
const klass = (id, sec, name, start, end) => ({ _id: id, sectionId: { _id: sec, section: sec === "wt" ? "B26-F" : "A26-F" }, courseId: { name, code: "X" }, timeSlot: { startTime: start, endTime: end, room: "SL" } });

let container; let root;
const wait = (ms = 0) => act(async () => { await new Promise((r) => setTimeout(r, ms)); });
const click = (el) => act(async () => { el.dispatchEvent(new MouseEvent("click", { bubbles: true })); });
const text = () => container.textContent;

const mount = async ({ sections = [section, lab], schedule = {}, attendance = { attendance: [] }, assessments = [], marks = {}, students = 2, fail = null } = {}) => {
  sessionStorage.setItem("token", "t");
  sessionStorage.setItem("user", JSON.stringify({ teacherId: "teacher1", name: "Dr. Zoha Mobin" }));
  axios.get.mockImplementation(async (url) => {
    if (fail && url.includes(fail)) throw Object.assign(new Error("boom"), { response: { data: { message: "Server is down" } } });
    if (url.includes("/academic-years/current")) return { data: { _id: "t1", semesterType: "Fall", year: 2026, startDate: "2026-08-01" } };
    if (url.includes("/getSections/")) return { data: sections };
    if (url.includes("/section-schedules/teacher/")) return { data: schedule };
    if (url.includes("/students")) return { data: Array.from({ length: students }, (_, i) => ({ id: `s${i}` })) };
    if (url.includes("/api/teachers/attendance")) return { data: attendance };
    if (url.includes("/api/assessments/section/")) return { data: { assessments } };
    if (url.includes("/marks")) return { data: { marks } };
    return { data: [] };
  });
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => { root.render(<Dashboard />); });
  await wait(30);
};
afterEach(() => { act(() => root.unmount()); container.remove(); sessionStorage.clear(); jest.clearAllMocks(); });

test("a brand-new term: dashes instead of fake zeros, a setup checklist, and nothing overdue", async () => {
  await mount({ schedule: { [todayName]: [klass("c1", "wt", "Web Technologies", "23:00", "23:30")] }, assessments: [] });
  expect(text()).toMatch(/, Zoha/);                      // the title is skipped: "Dr." is not a first name
  expect(text()).toMatch(/Average attendance—/);        // no attendance yet: a dash, not 0%
  expect(text()).toMatch(/Marks entered—/);
  expect(text()).toMatch(/Nothing overdue/);
  expect(text()).toMatch(/Get your term set up/);
  expect(text()).toMatch(/Add assessments to Web Technologies/);
  expect(text()).toMatch(/You're all caught up/);
  expect(text()).toMatch(/No classes yet/);
  expect(text()).toMatch(/No assessments/);
});

test("with attendance and marks it shows real figures and what needs attention", async () => {
  const day = new Date(); day.setDate(day.getDate() - 1);
  const yesterday = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
  const schedule = { [DAY_NAMES[day.getDay()]]: [klass("c1", "wt", "Web Technologies", "08:30", "09:55")] };
  await mount({
    schedule,
    attendance: { attendance: [{ sectionId: "wt", dates: { "2026-09-01": { slots: [{ students: [{ status: "present" }, { status: "absent" }, { status: "present" }, { status: "late" }] }] } } }] },
    assessments: [{ _id: "a", title: "Quiz 1", weightage: 40 }, { _id: "b", title: "Quiz 2", weightage: 50 }],
    marks: { a: { s0: 5, s1: 4 }, b: { s0: 3 } },
  });
  expect(text()).toMatch(/Average attendance75%Based on 2 classes so far/);   // two classes (one per section) are too few to call it a trend
  expect(text()).toMatch(/Attendance not marked/);
  expect(text()).toMatch(new RegExp("Web Technologies · "));
  expect(text()).toMatch(/Quiz 2 is missing marks/);
  expect(text()).toMatch(/Weights total 90%/);
  expect(text()).toMatch(/Marks entered75%6 of 8 marks entered/);
  expect(text()).toMatch(/75% · 1 class(?!s)/);
  expect(yesterday).toBeTruthy();
});

test("a row opens the page on that section", async () => {
  await mount({ assessments: [{ _id: "a", title: "Quiz 1", weightage: 100 }], marks: { a: { s0: 1, s1: 1 } } });
  const metric = [...container.querySelectorAll(".dash-metric")].find((b) => b.textContent.includes("100%"));
  await click(metric);
  expect(mockNavigate).toHaveBeenCalledWith("/marks");
  expect(sessionStorage.getItem("dashboard:section")).toBe("wt");
});

test("no sections: a calm message, not a grid of dashes", async () => {
  await mount({ sections: [] });
  expect(text()).toMatch(/No sections assigned yet/);
  expect(container.querySelector(".dash-stats")).toBeNull();
});

test("a failed load shows a retry, and retrying loads again", async () => {
  await mount({ fail: "/getSections/" });
  expect(container.querySelector('[role="alert"]').textContent).toMatch(/Server is down/);
  axios.get.mockClear();
  await click(container.querySelector(".es-btn"));
  await wait(10);
  expect(axios.get).toHaveBeenCalled();
});

test("one failing section request does not break the page", async () => {
  await mount({ fail: "/api/assessments/section/", assessments: [] });
  expect(text()).toMatch(/My sections/);
  expect(text()).toMatch(/Unavailable/);
});

test("a teacher with no timetable is told so and pointed to it", async () => {
  await mount({ schedule: {} });
  expect(text()).toMatch(/No timetable for this term yet/);
  await click([...container.querySelectorAll(".dash-link")].find((b) => b.textContent.includes("Open timetable")));
  expect(mockNavigate).toHaveBeenCalledWith("/timetable");
  expect(text()).toMatch(/Ask the administrator/);   // an unfinished "Timetable published" step has no action for the teacher
});

test("refresh fetches again without going back to the skeleton", async () => {
  await mount({});
  axios.get.mockClear();
  await click([...container.querySelectorAll(".dash-foot .dash-link")][0]);
  expect(container.querySelector('[aria-busy="true"]')).toBeNull();
  await wait(30);
  expect(axios.get).toHaveBeenCalled();
  expect(text()).toMatch(/Updated \d\d:\d\d/);
});

test("the timetable is shown as the Timetable page shows it, even a class from another term's section, without attendance nagging", async () => {
  await mount({ schedule: { [todayName]: [klass("x", "old-section", "Problem Solving Lab", "00:01", "00:02")] } });
  expect(text()).toMatch(/Problem Solving Lab/);
  expect(text()).not.toMatch(/No timetable for this term yet/);
  expect(text()).not.toMatch(/Not marked/);
  expect(text()).toMatch(/Attendance to mark0Nothing overdue/);
  expect(container.querySelector(".dash-timeline .dash-link")).toBeNull();     // no "Take attendance" for a section this page can't judge
});

test("with no internet the dashboard says so in plain words, not 'Network Error'", async () => {
  await mount({});
  axios.get.mockImplementation(async () => { throw Object.assign(new Error("Network Error"), { request: {}, code: "ERR_NETWORK" }); });
  await click([...container.querySelectorAll(".dash-foot .dash-link")][0]);
  await wait(30);
  act(() => root.unmount());
  root = createRoot(container);
  await act(async () => { root.render(<Dashboard />); });
  await wait(30);
  expect(container.querySelector('[role="alert"]').textContent).toMatch(/Couldn't reach the server\. Check your internet connection and try again\./);
  expect(text()).not.toMatch(/Network Error/);
});

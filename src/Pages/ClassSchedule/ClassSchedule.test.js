import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";
import axios from "axios";
import ClassSchedule from "./ClassSchedule";
import { DAY_NAMES } from "../../utils/dashboardData";

jest.mock("axios");
jest.mock("lucide-react", () => new Proxy({}, { get: () => () => null }));
global.IS_REACT_ACT_ENVIRONMENT = true;

const cls = (id, code, name, start, end, room = "SL", section = "A26-F") => ({
  _id: id, courseId: { _id: code, code, name }, sectionId: { _id: "s" + section, section }, timeSlot: { startTime: start, endTime: end, room },
});
const week = {
  Monday: [cls("1", "CS-202", "Database Systems", "08:30", "09:55", "SF1"), cls("2", "CS-305", "Operating Systems", "12:00", "13:10", "ONLINE")],
  Tuesday: [], Wednesday: [cls("3", "CL-202", "Database Systems Lab", "14:00", "15:25", "SL", "B26-F")], Thursday: [], Friday: [],
};

let container; let root;
const wait = (ms = 0) => act(async () => { await new Promise((r) => setTimeout(r, ms)); });
const click = async (el) => { await act(async () => { el.dispatchEvent(new MouseEvent("click", { bubbles: true })); }); await wait(); };
const text = () => container.textContent;
const button = (label) => [...container.querySelectorAll("button")].find((b) => b.textContent.trim() === label);

const mount = async ({ schedule = week, fail = false, narrow = false, term = { semesterType: "Fall", year: 2026 } } = {}) => {
  window.matchMedia = jest.fn().mockImplementation(() => ({ matches: narrow, addEventListener: jest.fn(), removeEventListener: jest.fn() }));
  sessionStorage.setItem("token", "t"); sessionStorage.setItem("user", JSON.stringify({ teacherId: "t1" }));
  axios.get.mockImplementation(async (url) => {
    if (url.includes("/academic-years/current")) return { data: term };
    if (fail) throw Object.assign(new Error("Network Error"), { request: {}, code: "ERR_NETWORK" });
    return { data: schedule };
  });
  container = document.createElement("div"); document.body.appendChild(container); root = createRoot(container);
  // eslint-disable-next-line testing-library/no-unnecessary-act
  await act(async () => { root.render(<ClassSchedule />); });
  await wait(fail ? 1500 : 40);                                // a failed load is tried once more, quietly, after a second
};
afterEach(() => { act(() => root.unmount()); container.remove(); sessionStorage.clear(); jest.clearAllMocks(); });

test("it opens on the week, in the page's usual frame, with the term beside the title", async () => {
  await mount();
  expect(container.querySelector(".tt h1").textContent).toBe("Timetable");
  expect(container.querySelector(".tt-term").textContent).toBe("Fall 2026");
  expect(container.querySelector(".tt-week")).not.toBeNull();
  expect(button("Week").getAttribute("aria-pressed")).toBe("true");
  expect(axios.get).toHaveBeenCalledWith(expect.stringContaining("/api/section-schedules/teacher/t1"), expect.anything());
});

test("each class sits at its own time, names its section, and an online class says so", async () => {
  await mount();
  expect(container.querySelector(".tt-hours span").textContent).toBe("8:30a");
  const names = [...container.querySelectorAll(".tt-blk b")].map((b) => b.textContent);
  expect(names).toEqual(["Database Systems", "Operating Systems", "Database Systems Lab"]);
  expect(text()).toContain("Section A26-F");
  expect(text()).toContain("Section B26-F");
  expect(text()).toContain("12:00–1:10 PM · Online");
});

test("a lab keeps its course's colour, a little deeper", async () => {
  await mount();
  const blocks = [...container.querySelectorAll(".tt-blk")];
  const [db, , lab] = blocks;
  expect(lab.style.getPropertyValue("--card-accent")).toBe(db.style.getPropertyValue("--card-accent"));
  expect(lab.style.getPropertyValue("--card-bg")).not.toBe(db.style.getPropertyValue("--card-bg"));
});

test("three numbers sit above the board: the next class, today and the week", async () => {
  await mount();
  const labels = [...container.querySelectorAll(".tt-stat small")].map((s) => s.textContent);
  expect(labels[0]).toMatch(/Live now|Next class/);
  expect(labels.slice(1)).toEqual(["Today", "This week"]);
  expect(container.querySelectorAll(".tt-stat")[2].textContent).toContain("3 classes");
  expect(container.querySelectorAll(".tt-stat")[2].textContent).toContain("3 courses");
});

test("the Day view has a tab per day, and a day without classes says so", async () => {
  await mount();
  await click(button("Day"));
  expect(container.querySelector(".tt-agenda")).not.toBeNull();
  const todayName = DAY_NAMES[new Date().getDay()];
  const tabs = [...container.querySelectorAll('.tt-days [role="tab"]')];
  const empty = tabs.find((t) => t.querySelector("small").textContent === "Tue");
  await click(empty);
  expect(text()).toContain("No classes on Tuesday");
  expect(todayName).toBeTruthy();
});

test("evening and weekend classes get their own column and stretch the board", async () => {
  const schedule = { ...week, Saturday: [cls("9", "ML-501", "Machine Learning", "18:00", "21:00", "SF2", "A26-S")] };
  await mount({ schedule });
  const heads = [...container.querySelectorAll(".tt-wkhead > div")].slice(1).map((d) => d.textContent.slice(0, 3));
  expect(heads).toEqual(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]);
  const hours = [...container.querySelectorAll(".tt-hours span")].map((s) => s.textContent);
  expect(hours[hours.length - 1]).toBe("9p");
});

test("a phone gets the day view", async () => {
  await mount({ narrow: true });
  expect(container.querySelector(".tt-agenda, .tt-empty-day")).not.toBeNull();
  expect(container.querySelector(".tt-week")).toBeNull();
});

test("no classes yet says so kindly", async () => {
  await mount({ schedule: { Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [] } });
  expect(text()).toContain("isn't published yet");
});

test("with no internet it says so plainly and offers to try again", async () => {
  await mount({ fail: true });
  expect(text()).toContain("Couldn't reach the server");
  expect(button("Try again")).toBeTruthy();
});

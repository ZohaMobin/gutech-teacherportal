import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import Attendance from "./Attendance";

jest.mock("axios");
jest.mock("react-hot-toast", () => ({ __esModule: true, default: { success: jest.fn(), error: jest.fn() } }));
jest.mock("react-datepicker", () => () => null);
jest.mock("lucide-react", () => ({ Download: () => null }));
jest.mock("react-datepicker/dist/react-datepicker.css", () => ({}), { virtual: true });
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const today = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; })();
const section = { _id: "sec1", section: "A26-F", courseId: { _id: "c1", code: "ML-501", name: "Machine Learning" } };
const students = [{ id: "st1", rollNumber: "2622-6DSAI-016", name: "Syed Taloot Munim" }, { id: "st2", rollNumber: "2622-6DSAI-017", name: "Muhammad Umar Hanfi" }];

let container; let root;
const wait = (ms = 0) => act(async () => { await new Promise((r) => setTimeout(r, ms)); });
const click = (el) => act(async () => { el.dispatchEvent(new MouseEvent("click", { bubbles: true })); });
const mount = async ({ savedToday }) => {
  sessionStorage.setItem("token", "t");
  sessionStorage.setItem("user", JSON.stringify({ teacherId: "teacher1", name: "Dr. M. Shahzad" }));
  const attendance = savedToday
    ? { attendance: [{ sectionId: "sec1", dates: { [today]: { slots: [{ slotNumber: 1, durationMinutes: 75, students: students.map((s) => ({ studentId: s.id, status: "absent" })) }] } } }] }
    : { attendance: [] };
  axios.get.mockImplementation(async (url) => {
    if (url.includes("/api/sections/getSections/")) return { data: [section] };
    if (url.includes("/api/academic-years/current")) return { data: { _id: "t1", status: "active", semesterType: "Fall", year: 2026 } };
    if (url.includes("/students")) return { data: students };
    if (url.includes("/api/teachers/attendance")) return { data: attendance };
    return { data: [] };
  });
  axios.delete.mockResolvedValue({ data: { message: "deleted" } });
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => { root.render(<Attendance />); });
  await wait(50);
};
const clearAll = () => container.querySelector(".btn-quick.clear");
const save = () => container.querySelector(".save-btn");
afterEach(() => { act(() => root.unmount()); container.remove(); sessionStorage.clear(); jest.clearAllMocks(); jest.restoreAllMocks(); });

test("attendance saved on the wrong day: Clear all, then Save, removes it after a confirm", async () => {
  await mount({ savedToday: true });
  await click(clearAll());
  await click(save());
  await wait(20);
  expect(document.querySelector(".confirm-dialog").textContent).toMatch(/You've cleared everyone. Remove the saved attendance for Slot 1/);
  await click(document.querySelector(".confirm-dialog .btn-danger"));
  await wait(20);
  expect(axios.delete).toHaveBeenCalledWith(expect.stringContaining("/api/teachers/attendance"), expect.objectContaining({ params: { sectionId: "sec1", courseId: "c1", date: today, slotNumber: 1 } }));
  expect(toast.success).toHaveBeenCalledWith(expect.stringMatching(/removed/));
  expect(toast.error).not.toHaveBeenCalled();
});

test("cancelling the confirm keeps the saved attendance", async () => {
  await mount({ savedToday: true });
  await click(clearAll());
  await click(save());
  await wait(20);
  await click(document.querySelector(".confirm-dialog .btn-secondary"));
  await wait(20);
  expect(document.querySelector(".confirm-dialog")).toBeNull();
  expect(axios.delete).not.toHaveBeenCalled();
});

test("nothing saved and nobody marked: Save explains there's nothing to save", async () => {
  await mount({ savedToday: false });
  await click(save());
  await wait(20);
  expect(toast.error).toHaveBeenCalledWith(expect.stringMatching(/nothing to save/));
  expect(document.querySelector(".confirm-dialog")).toBeNull();
  expect(axios.delete).not.toHaveBeenCalled();
  expect(axios.post).not.toHaveBeenCalled();
});

import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";
import axios from "axios";
import Settings from "./Settings";

jest.mock("axios");
jest.mock("lucide-react", () => new Proxy({ __esModule: true }, { get: (target, name) => (name in target ? target[name] : () => null) }));
global.IS_REACT_ACT_ENVIRONMENT = true;

let container; let root;
const wait = (ms = 0) => act(async () => { await new Promise((r) => setTimeout(r, ms)); });
const type = (name, value) => act(async () => {
  const input = container.querySelector(`input[name="${name}"]`);
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
});
const submit = () => act(async () => { container.querySelector("form").dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })); });

beforeEach(async () => {
  sessionStorage.setItem("user", JSON.stringify({ name: "Dr. M. Shahzad", email: "ms@agu.edu.pk" }));
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  // eslint-disable-next-line testing-library/no-unnecessary-act, testing-library/no-render-in-setup
  await act(async () => { root.render(<Settings />); });
});
afterEach(() => { act(() => root.unmount()); container.remove(); sessionStorage.clear(); jest.clearAllMocks(); });

test("it uses the same page frame as the other tabs: a heading with a subtitle, then cards", () => {
  expect(container.querySelector(".st-header h1").textContent).toBe("Settings");
  expect(container.querySelector(".st-account").textContent).toContain("Dr. M. Shahzad");
  expect(container.querySelector(".st-account").textContent).toContain("ms@agu.edu.pk");
  expect(container.querySelector(".st-password h2").textContent).toBe("Change password");
});

test("it says what is wrong before asking the server", async () => {
  await submit();
  expect(container.textContent).toContain("Fill in all three password fields.");
  await type("currentPassword", "oldpass1"); await type("newPassword", "abc"); await type("confirmPassword", "abc");
  await submit();
  expect(container.textContent).toContain("at least 6 characters");
  await type("newPassword", "newpass1"); await type("confirmPassword", "different1");
  await submit();
  expect(container.textContent).toContain("do not match");
  expect(axios.post).not.toHaveBeenCalled();
});

test("a valid change is sent, and the form clears with a confirmation", async () => {
  axios.post.mockResolvedValue({ data: {} });
  await type("currentPassword", "oldpass1"); await type("newPassword", "newpass1"); await type("confirmPassword", "newpass1");
  await submit();
  await wait(10);
  expect(axios.post).toHaveBeenCalledWith(expect.stringContaining("/api/auth/change-password"), { currentPassword: "oldpass1", newPassword: "newpass1" });
  expect(container.querySelector(".st-success").textContent).toBe("Password changed successfully.");
  expect(container.querySelector('input[name="newPassword"]').value).toBe("");
});

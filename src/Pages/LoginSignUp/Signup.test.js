import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";
import axios from "axios";
import Signup from "./Signup";

jest.mock("lucide-react", () => new Proxy({}, { get: () => () => null }));
jest.mock("axios");
jest.mock("react-router-dom", () => ({ Link: ({ children }) => <a href="/">{children}</a>, useNavigate: () => jest.fn() }), { virtual: true });
jest.mock("../../Components/AuthContext", () => ({ useAuth: () => ({ login: jest.fn() }) }));
jest.mock("react-hot-toast", () => ({ __esModule: true, default: { success: jest.fn(), error: jest.fn() } }));
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container; let root;
const type = async (el, value) => act(async () => {
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(el, value);
  el.dispatchEvent(new Event("input", { bubbles: true }));
});
const signIn = async (failure) => {
  axios.post.mockRejectedValue(failure);
  await type(container.querySelector('input[name="identifier"]'), "someone@example.com");
  await type(container.querySelector('input[placeholder="Password"][name="password"]:not([value])') || [...container.querySelectorAll('input[name="password"]')].pop(), "a-password-1");
  const form = container.querySelector('input[name="identifier"]').closest("form");
  await act(async () => { form.requestSubmit(); });
  await act(async () => { await new Promise((r) => setTimeout(r, 0)); });
};
beforeEach(async () => {
  axios.get.mockResolvedValue({ data: [] });
  container = document.createElement("div"); document.body.appendChild(container); root = createRoot(container);
  jest.spyOn(console, "error").mockImplementation(() => {});
  await act(async () => { root.render(<Signup />); });
  await act(async () => { await new Promise((r) => setTimeout(r, 0)); });
});
afterEach(() => { act(() => root.unmount()); container.remove(); jest.restoreAllMocks(); });

test("with no internet, sign in says so instead of blaming the password", async () => {
  await signIn({ request: {}, message: "Network Error", code: "ERR_NETWORK" });
  expect(container.textContent).toContain("Couldn't reach the server. Check your internet connection and try again.");
  expect(container.textContent).not.toMatch(/check your credentials/);
});

test("a wrong password still says so, using the server's words", async () => {
  await signIn({ response: { status: 401, data: { message: "Invalid credentials" } } });
  expect(container.textContent).toContain("Invalid credentials");
});

test("a rejection with no reason falls back to the credentials message", async () => {
  await signIn({ response: { status: 401, data: {} } });
  expect(container.textContent).toContain("Login failed. Please check your credentials.");
});

test("if the departments cannot be loaded, the register form says so instead of 'No departments available'", async () => {
  axios.get.mockRejectedValue({ request: {}, message: "Network Error" });
  act(() => root.unmount());
  root = createRoot(container);
  await act(async () => { root.render(<Signup />); });
  await act(async () => { await new Promise((r) => setTimeout(r, 0)); });
  const options = [...container.querySelectorAll('select[name="department"] option')].map((o) => o.textContent);
  expect(options.join(" | ")).toMatch(/Couldn't load departments/);
  expect(options.join(" | ")).not.toMatch(/No departments available/);
});

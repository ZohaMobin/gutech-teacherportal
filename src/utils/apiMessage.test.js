import { NETWORK_MESSAGE, formMessageOf, isNetworkError, messageOf } from "./apiMessage";

const noAnswer = { request: {}, message: "Network Error", code: "ERR_NETWORK" };
const answered = (status, data) => ({ response: { status, data } });

test("no answer from the server is a connection problem, however axios words it", () => {
  expect(isNetworkError(noAnswer)).toBe(true);
  expect(isNetworkError({ message: "Network Error" })).toBe(true);
  expect(isNetworkError({ code: "ECONNABORTED" })).toBe(true);
  expect(isNetworkError(answered(500, {}))).toBe(false);
  expect(isNetworkError(new Error("boom"))).toBe(false);
  expect(isNetworkError(null)).toBe(false);
});

test("one plain sentence for a lost connection, and the server's own reason always wins", () => {
  expect(messageOf(noAnswer, "Failed to fetch schedule")).toBe("Couldn't reach the server. Check your internet connection and try again.");
  expect(messageOf(answered(409, { message: "Section is locked" }))).toBe("Section is locked");
  expect(messageOf(new Error("odd"), "Failed to fetch schedule")).toBe("Failed to fetch schedule");
});

test("forms: a lost connection is never described as a wrong password, and a wrong password never as an ended session", () => {
  expect(formMessageOf(noAnswer, "Login failed. Please check your credentials.")).toBe(NETWORK_MESSAGE);
  expect(formMessageOf(answered(401, {}), "Login failed. Please check your credentials.")).toBe("Login failed. Please check your credentials.");
  expect(formMessageOf(answered(401, { message: "Invalid email or password" }), "x")).toBe("Invalid email or password");
});

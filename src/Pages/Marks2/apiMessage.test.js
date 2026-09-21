import { messageOf } from './apiMessage';

test("the server's own message is shown as it is, whatever the status: a refusal is not a network problem", () => {
  const locked = { response: { status: 409, data: { message: "This section's marks are locked, so assessments can no longer be changed. If a change is needed, ask the administrator to return the results to you." } } };
  expect(messageOf(locked)).toBe("This section's marks are locked, so assessments can no longer be changed. If a change is needed, ask the administrator to return the results to you.");
  expect(messageOf({ response: { status: 400, data: { message: 'Mark must be between 0 and 10' } } })).toBe('Mark must be between 0 and 10');
  expect(messageOf(locked)).not.toMatch(/network/i);
});

test('"could not reach the server" is only for a request that got no response at all', () => {
  expect(messageOf({ request: {} })).toBe("Couldn't reach the server. Check your internet connection and try again.");
  expect(messageOf({ response: { status: 409, data: {} }, request: {} })).not.toMatch(/reach the server/);
});

test('without a server message, each kind of failure gets a plain sentence', () => {
  expect(messageOf({ response: { status: 401, data: {} } })).toBe('Your session has ended. Please sign in again.');
  expect(messageOf({ response: { status: 403, data: {} } })).toBe("You don't have permission to do this.");
  expect(messageOf({ response: { status: 500, data: {} } })).toBe('Something went wrong on our side. Please try again in a moment.');
  expect(messageOf({ response: { status: 404, data: {} } }, { notFound: 'Section not found. Please refresh the page.' })).toBe('Section not found. Please refresh the page.');
  expect(messageOf({})).toBe('Something went wrong. Please try again.');
});

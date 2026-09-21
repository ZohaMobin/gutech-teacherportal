// What to tell a person when a request fails: the server's own plain-language message when it sent one (that is the reason
// they need), otherwise a clear sentence about what happened and what to do. "Network error" is for a real connection
// problem only, never for a refusal from the server.
export const messageOf = (error, { notFound } = {}) => {
  const message = error?.response?.data?.message;
  if (message) return message;
  const status = error?.response?.status;
  if (status === 404 && notFound) return notFound;
  if (status === 401) return 'Your session has ended. Please sign in again.';
  if (status === 403) return "You don't have permission to do this.";
  if (status >= 500) return 'Something went wrong on our side. Please try again in a moment.';
  if (error?.request && !error?.response) return "Couldn't reach the server. Check your internet connection and try again.";
  return 'Something went wrong. Please try again.';
};

import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";
import { AuthProvider } from "../../Components/AuthContext";
import PrivateRoute from "../../Components/PrivateRoute";
import Topbar from "./topbar";

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
  Navigate: ({ to }) => <p>Redirected to {to}</p>,
  Outlet: () => <p>Signed-in page</p>,
}), { virtual: true });
global.IS_REACT_ACT_ENVIRONMENT = true;

test("logging out ends the session and the signed-in page goes away at once, so it cannot show an error for a session that no longer exists", async () => {
  sessionStorage.setItem("token", "t");
  sessionStorage.setItem("user", JSON.stringify({ name: "Sara", teacherId: "t1" }));
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  // eslint-disable-next-line testing-library/no-unnecessary-act
  await act(async () => { root.render(<AuthProvider><Topbar toggleSidebar={() => {}} isSidebarOpen={false} /><PrivateRoute /></AuthProvider>); });
  expect(container.textContent).toContain("Signed-in page");
  await act(async () => { container.querySelector(".user-avatar").click(); });
  await act(async () => { [...container.querySelectorAll(".logout")].find((b) => b.textContent.trim() === "Logout").click(); });
  expect(container.textContent).not.toContain("Signed-in page");
  expect(container.textContent).toContain("Redirected to /");
  expect(sessionStorage.getItem("token")).toBeNull();
  expect(sessionStorage.getItem("user")).toBeNull();
  expect(mockNavigate).toHaveBeenCalledWith("/", { replace: true });
  act(() => root.unmount());
  container.remove();
});

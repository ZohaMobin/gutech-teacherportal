import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";
import SectionLabel, { ProgramTags } from "./SectionLabel";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let container; let root;
beforeEach(() => { container = document.createElement("div"); document.body.appendChild(container); root = createRoot(container); });
afterEach(() => { act(() => root.unmount()); container.remove(); });
const render = (node) => act(async () => { root.render(node); });

const section = (programs) => ({ _id: "s1", section: "B26-F", courseId: { name: "Web Technologies", code: "CS-102" }, programs });
const program = (code, name = `${code} program`) => ({ _id: code, code, name });

test("shows the course, its program tag, then the section and course code", async () => {
  await render(<SectionLabel section={section([program("BSCS", "BS Computer Science")])} />);
  expect(container.querySelector(".sl-name").textContent).toBe("Web Technologies");
  expect([...container.querySelectorAll(".sl-program")].map((t) => t.textContent)).toEqual(["BSCS"]);
  expect(container.querySelector(".sl-program").getAttribute("title")).toBe("BS Computer Science");
  expect(container.querySelector(".sl-section").textContent).toBe("Section B26-F · CS-102");
});

test("more than two programs collapse into +N, whose tooltip names the rest", async () => {
  await render(<SectionLabel section={section([program("BSCS"), program("BSSE"), program("BBA", "Bachelors in Business Administration")])} />);
  expect([...container.querySelectorAll(".sl-program")].map((t) => t.textContent)).toEqual(["BSCS", "BSSE", "+1"]);
  expect(container.querySelector(".sl-more").getAttribute("title")).toBe("Bachelors in Business Administration");
});

test("a section with no registered students just shows no program tag", async () => {
  await render(<SectionLabel section={section([])} />);
  expect(container.querySelector(".sl-program")).toBeNull();
  expect(container.querySelector(".sl-section").textContent).toContain("Section B26-F");
  await render(<SectionLabel section={{ section: "A", courseId: { name: "X" } }} />);   // an older response without the field
  expect(container.querySelector(".sl-program")).toBeNull();
});

test("ProgramTags alone can show up to a chosen number", async () => {
  await render(<ProgramTags section={section([program("A"), program("B"), program("C")])} max={3} />);
  expect([...container.querySelectorAll(".sl-program")].map((t) => t.textContent)).toEqual(["A", "B", "C"]);
});

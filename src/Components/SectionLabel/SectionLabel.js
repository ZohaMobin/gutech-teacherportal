import React from "react";
import "./SectionLabel.css";

// How a section is named wherever a teacher picks one: the course, then the program(s) its students are in (as small tags, so
// the same course taught to two programs is told apart at a glance), then the section name and course code.
// `programs` comes from the server with each section; it is empty until students are registered.
export const ProgramTags = ({ section, max = 2 }) => {
  const programs = Array.isArray(section?.programs) ? section.programs : [];
  if (programs.length === 0) return null;
  const shown = programs.slice(0, max);
  const hidden = programs.slice(max);
  return (
    <>
      {shown.map((program) => <span className="sl-program" key={program._id || program.code} title={program.name}>{program.code}</span>)}
      {hidden.length > 0 && <span className="sl-program sl-more" title={hidden.map((program) => program.name || program.code).join(", ")}>+{hidden.length}</span>}
    </>
  );
};

const SectionLabel = ({ section, showCode = true }) => (
  <>
    <span className="section-name sl-name">{section?.courseId?.name || "Unknown Course"}</span>
    <span className="section-code sl-meta">
      <ProgramTags section={section} />
      <span className="sl-section">Section {section?.section}{showCode && section?.courseId?.code ? ` · ${section.courseId.code}` : ""}</span>
    </span>
  </>
);

export default SectionLabel;

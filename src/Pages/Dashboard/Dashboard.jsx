import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { CalendarClock, CalendarDays, CheckCircle2, ChevronRight, ClipboardCheck, ClipboardList, PencilLine, RefreshCw, Scale, UserCheck } from "lucide-react";
import SectionLabel from "../../Components/SectionLabel/SectionLabel";
import { to12Hour } from "../../utils/timetablePeriods";
import {
  DAY_NAMES, attendanceStats, attentionItems, dateKey, firstNameOf, greetingFor, hasAnyClass, marksProgress, nextClassAfter,
  overdueAttendance, percent, slotCountsFrom, todaysClasses,
} from "../../utils/dashboardData";
import "./Dashboard.css";
import { messageOf } from "../../utils/apiMessage";
import ErrorState from "../../Components/ErrorState/ErrorState";

const apiUrl = process.env.REACT_APP_BACKEND_URL;
const SECTION_HINT = "dashboard:section";   // the section to open first on Attendance or Marks, read once
const ATTENTION_SHOWN = 5;
const MIN_CLASSES_FOR_RATE = 3;   // one marked class says little about attendance, so the figure stays muted until there are a few

const idOf = (value) => String(value?._id ?? value ?? "");
const plural = (n, word) => `${n} ${n === 1 ? word : word.endsWith("s") ? `${word}es` : `${word}s`}`;
const ICONS = { attendance: ClipboardList, marks: PencilLine, weights: Scale };

// Everything the page needs, loaded once and in parallel. The sections and the timetable are required; the rest of a
// section's figures (students, attendance, marks) degrade to "no data" if one request fails.
const useDashboard = () => {
  const [state, setState] = useState({ status: "loading" });
  // `soft` keeps what is on screen while the figures are fetched again, instead of going back to the skeleton.
  const load = useCallback(async ({ soft = false } = {}) => {
    if (soft) setState((current) => ({ ...current, refreshing: true })); else setState({ status: "loading" });
    try {
      const user = JSON.parse(sessionStorage.getItem("user") || "null");
      const headers = { Authorization: `Bearer ${sessionStorage.getItem("token")}` };
      if (!user?.teacherId) throw new Error("Please sign in again.");
      const term = await axios.get(`${apiUrl}/api/academic-years/current`, { headers }).then((r) => r.data).catch(() => null);
      const params = term?._id ? { academicYearId: term._id } : {};
      const [sectionsResponse, scheduleResponse] = await Promise.all([
        axios.get(`${apiUrl}/api/sections/getSections/${user.teacherId}`, { params, headers }),
        axios.get(`${apiUrl}/api/section-schedules/teacher/${user.teacherId}`, { headers }),
      ]);
      const sections = Array.isArray(sectionsResponse.data) ? sectionsResponse.data : [];
      const mine = new Set(sections.map(idOf));
      const schedule = scheduleResponse.data || {};   // as the Timetable page shows it, so the two always agree

      const details = await Promise.all(sections.map(async (section) => {
        const id = idOf(section);
        const [students, attendance, assessments, marks] = await Promise.allSettled([
          axios.get(`${apiUrl}/api/teacher-marks/section/${id}/students`, { params, headers }),
          axios.get(`${apiUrl}/api/teachers/attendance`, { params: { sectionId: id, ...params }, headers }),
          axios.get(`${apiUrl}/api/assessments/section/${id}`, { headers }),
          axios.get(`${apiUrl}/api/teacher-marks/section/${id}/marks`, { headers }),
        ]);
        const value = (result) => (result.status === "fulfilled" ? result.value.data : null);
        return { section, students: Array.isArray(value(students)) ? value(students).length : null, attendance: value(attendance), assessments: value(assessments)?.assessments ?? null, marks: value(marks)?.marks ?? null };
      }));
      setState({ status: "ready", user, term, sections, schedule, mine, details, updatedAt: new Date() });
    } catch (error) {
      const message = messageOf(error, "The dashboard could not be loaded.");
      setState((current) => (soft && current.status === "ready" ? { ...current, refreshing: false, refreshFailed: true } : { status: "error", message }));
    }
  }, []);
  useEffect(() => { load(); }, [load]);
  return [state, load];
};

const useClock = () => {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const timer = setInterval(() => setNow(new Date()), 60000); return () => clearInterval(timer); }, []);
  return now;
};

const Skeleton = () => (
  <div className="dash" aria-busy="true">
    <span className="ld-sr" role="status">Loading your dashboard…</span>
    <div className="ld-bar" style={{ height: 30, width: "40%", marginBottom: 18 }} />
    <div className="ld-bar" style={{ height: 92, marginBottom: 20 }} />
    <div className="dash-grid"><div className="ld-bar" style={{ height: 300 }} /><div className="ld-bar" style={{ height: 300 }} /></div>
  </div>
);

const Bar = ({ value, label }) => (
  <div className="dash-bar" role="img" aria-label={label}><i style={{ width: `${value ?? 0}%` }} /></div>
);

const go = (navigate, to, sectionId) => {
  try { if (sectionId) sessionStorage.setItem(SECTION_HINT, sectionId); } catch { /* the page still opens, on its first section */ }
  navigate(to);
};

const Dashboard = () => {
  const navigate = useNavigate();
  const now = useClock();
  const [state, reload] = useDashboard();

  const view = useMemo(() => {
    if (state.status !== "ready") return null;
    const { sections, schedule, mine, details, term } = state;
    // Attendance can only be judged for sections whose attendance was loaded (this term's), so those are the only ones counted as overdue.
    const known = Object.fromEntries(Object.entries(schedule).map(([day, list]) => [day, (list || []).filter((item) => mine.has(idOf(item.sectionId)))]));
    const slotCounts = {};
    const studentCounts = {};
    for (const detail of details) {
      Object.assign(slotCounts, slotCountsFrom(detail.attendance));
      if (detail.students !== null) studentCounts[idOf(detail.section)] = detail.students;
    }
    const termStart = term?.startDate ? dateKey(new Date(term.startDate)) : null;
    const today = todaysClasses(schedule, slotCounts, now);
    const overdue = overdueAttendance(known, slotCounts, now, { termStart, studentCounts });
    const rows = details.map((detail) => ({
      section: detail.section,
      attendance: attendanceStats(detail.attendance),
      marks: detail.assessments && detail.marks ? marksProgress(detail.assessments, detail.marks, detail.students || 0) : null,
      assessments: detail.assessments,
    }));
    const totals = rows.reduce((sum, row) => ({ attended: sum.attended + row.attendance.attended, total: sum.total + row.attendance.total, slots: sum.slots + row.attendance.slots }), { attended: 0, total: 0, slots: 0 });
    const markTotals = rows.reduce((sum, row) => (row.marks ? { entered: sum.entered + row.marks.entered, expected: sum.expected + row.marks.expected, done: sum.done + row.marks.done, count: sum.count + row.marks.count } : sum), { entered: 0, expected: 0, done: 0, count: 0 });
    return {
      today, overdue, rows, slotCounts, mine,
      attention: attentionItems({ overdue, sections: rows.map((row) => ({ section: row.section, marks: row.marks })) }),
      attendanceRate: totals.total ? totals.attended / totals.total : null,
      attendanceClasses: totals.slots,
      marksRate: markTotals.expected ? markTotals.entered / markTotals.expected : null,
      markTotals,
      next: today.length === 0 || today.every((c) => c.state === "done") ? nextClassAfter(schedule, now) : null,
      hasTimetable: hasAnyClass(schedule),
      allHaveAssessments: sections.length > 0 && rows.every((row) => (row.assessments || []).length > 0),
      noAssessmentsFor: rows.find((row) => row.assessments && row.assessments.length === 0)?.section,
    };
  }, [state, now]);

  if (state.status === "loading") return <Skeleton />;
  if (state.status === "error") {
    return (
      <div className="dash">
        <ErrorState message={state.message} onRetry={() => reload()} />
      </div>
    );
  }

  const { user, term, sections } = state;
  const termLabel = term?.semesterType && term?.year ? `${term.semesterType} ${term.year}` : "";
  const dateLabel = now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
  const header = (
    <header className="dash-header">
      <div className="dash-title">
        <h1>Dashboard</h1>
        <p className="dash-sub">
          <span className="dash-greet">{greetingFor(now)}{firstNameOf(user?.name) ? `, ${firstNameOf(user.name)}` : ""}</span>
          <span className="dash-date">{dateLabel}</span>
          {termLabel && <span className="dash-term">{termLabel}</span>}
        </p>
      </div>
    </header>
  );

  if (sections.length === 0) {
    return (
      <div className="dash">
        {header}
        <div className="dash-card dash-empty">
          <h3>No sections assigned yet</h3>
          <p>Your sections will appear here once the administrator assigns them to you for {termLabel || "this term"}.</p>
        </div>
      </div>
    );
  }

  const { mine, today, overdue, rows, attention, attendanceRate, attendanceClasses, marksRate, markTotals, next, hasTimetable, allHaveAssessments, noAssessmentsFor } = view;
  const live = today.filter((c) => c.state === "live").length;
  const done = today.filter((c) => c.state === "done").length;
  const later = today.length - live - done;
  const setup = [
    { done: sections.length > 0, label: "Sections assigned" },
    { done: hasTimetable, label: "Timetable published" },
    { done: allHaveAssessments, label: noAssessmentsFor ? `Add assessments to ${noAssessmentsFor.courseId?.name || "your course"}` : "Assessments added", to: "/marks", sectionId: noAssessmentsFor ? idOf(noAssessmentsFor) : null },
  ];
  const setupDone = setup.filter((step) => step.done).length;
  const shown = attention.slice(0, ATTENTION_SHOWN);

  const thin = attendanceClasses < MIN_CLASSES_FOR_RATE;
  const stats = [
    { label: "Classes today", icon: CalendarClock, value: today.length, muted: today.length === 0, note: today.length === 0 ? "A free day" : [done && `${done} done`, live && `${live} live`, later && `${later} to come`].filter(Boolean).join(" · ") },
    { label: "Attendance to mark", icon: ClipboardCheck, value: overdue.length, muted: overdue.length === 0, tone: overdue.length ? "warn" : "", note: overdue.length ? "Classes this past week" : "Nothing overdue" },
    { label: "Average attendance", icon: UserCheck, value: percent(attendanceRate) === null ? "—" : `${percent(attendanceRate)}%`, muted: attendanceRate === null || thin, note: attendanceRate === null ? "Starts after your first class" : thin ? `Based on ${plural(attendanceClasses, "class")} so far` : `Across ${plural(sections.length, "section")}` },
    { label: "Marks entered", icon: PencilLine, value: percent(marksRate) === null ? "—" : `${percent(marksRate)}%`, muted: marksRate === null, note: markTotals.count === 0 ? "No assessments yet" : `${markTotals.entered} of ${markTotals.expected} marks entered` },
  ];
  const updated = state.updatedAt ? state.updatedAt.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "";

  return (
    <div className="dash">
      {header}

      <section className="dash-card dash-stats" aria-label="Summary">
        {stats.map((stat) => (
          <div className="dash-stat" key={stat.label}>
            <span className={`dash-stat-icon ${stat.tone ? `is-${stat.tone}` : ""}`} aria-hidden="true"><stat.icon size={17} /></span>
            <div className="dash-stat-body">
              <span className="dash-label">{stat.label}</span>
              <strong className={`${stat.tone ? `is-${stat.tone}` : ""} ${stat.muted ? "is-muted" : ""}`}>{stat.value}</strong>
              <span className="dash-note">{stat.note}</span>
            </div>
          </div>
        ))}
      </section>

      {setupDone < setup.length && (
        <section className="dash-card dash-setup" aria-labelledby="dash-setup">
          <div className="dash-setup-title"><h2 id="dash-setup">Get your term set up</h2><span className="dash-note">{setupDone} of {setup.length} done</span></div>
          <ul className="dash-steps">
            {setup.map((step) => (
              <li key={step.label} className={step.done ? "is-done" : ""}>
                <span className="dash-step-mark" aria-hidden="true">{step.done ? <CheckCircle2 size={17} /> : <i />}</span>
                <span>{step.label}</span>
                {!step.done && step.to && <button type="button" className="dash-link" onClick={() => go(navigate, step.to, step.sectionId)}>Open Marks<ChevronRight size={14} aria-hidden="true" /></button>}
                {!step.done && !step.to && <span className="dash-note">Ask the administrator</span>}
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="dash-grid">
        <section className="dash-card" aria-labelledby="dash-today">
          <div className="dash-card-head"><h2 id="dash-today">Today's classes</h2>{today.length > 0 && <span className="dash-note">{dateLabel}</span>}</div>
          {today.length === 0 ? (
            <div className="dash-quiet is-big">
              <CalendarDays size={22} aria-hidden="true" />
              {!hasTimetable ? (
                <><p>No timetable for this term yet.</p><button type="button" className="dash-link" onClick={() => navigate("/timetable")}>Open timetable<ChevronRight size={14} aria-hidden="true" /></button></>
              ) : next ? (
                <><p>No classes today.</p><span className="dash-note">Next: {DAY_NAMES[next.date.getDay()]} at {to12Hour(next.item.timeSlot.startTime)} · {next.item.courseId?.name}</span></>
              ) : <p>No classes today.</p>}
            </div>
          ) : (
            <ol className="dash-timeline">
              {today.map(({ item, sectionId, state: status, marked: savedToday, next: isNext, minutesUntil }) => {
                const tracked = mine.has(sectionId);
                const marked = tracked && savedToday;
                return (
                <li key={item._id} className={`dash-class is-${status}`}>
                  <div className="dash-class-top">
                    <strong>{item.courseId?.name}</strong>
                    {status === "live" && <span className="dash-pill is-live">Live now</span>}
                    {status === "done" && tracked && <span className={`dash-pill ${marked ? "is-ok" : "is-warn"}`}>{marked ? "Marked" : "Not marked"}</span>}
                    {status === "later" && <span className="dash-pill">{isNext ? (minutesUntil < 60 ? `In ${minutesUntil} min` : "Next") : "Later"}</span>}
                  </div>
                  <span className="dash-note">{to12Hour(item.timeSlot.startTime)} – {to12Hour(item.timeSlot.endTime)} · {item.timeSlot.room} · Section {item.sectionId?.section}</span>
                  {tracked && (status === "live" || (status === "done" && !marked)) && (
                    <button type="button" className="dash-link" onClick={() => go(navigate, "/attendance", sectionId)}>{marked ? "Review attendance" : "Take attendance"}<ChevronRight size={14} aria-hidden="true" /></button>
                  )}
                </li>
                );
              })}
            </ol>
          )}
        </section>

        <div className="dash-stack">
          <section className="dash-card" aria-labelledby="dash-attention">
            <div className="dash-card-head"><h2 id="dash-attention">Needs your attention</h2>{attention.length > 0 && <span className="dash-pill is-warn">{attention.length}</span>}</div>
            {attention.length === 0 ? (
              <div className="dash-quiet is-ok"><CheckCircle2 size={18} aria-hidden="true" /><p>You're all caught up.</p></div>
            ) : (
              <ul className="dash-attention">
                {shown.map((entry) => {
                  const Icon = ICONS[entry.kind];
                  return (
                    <li key={entry.key}>
                      <button type="button" className={`is-${entry.tone || (entry.kind === "marks" ? "brand" : "warn")}`} onClick={() => go(navigate, entry.to, entry.sectionId)}>
                        <span className={`dash-ic is-${entry.tone || (entry.kind === "marks" ? "brand" : "warn")}`}><Icon size={15} aria-hidden="true" /></span>
                        <span className="dash-attention-text"><strong>{entry.title}</strong><span className="dash-note">{entry.detail}</span></span>
                        <ChevronRight size={15} aria-hidden="true" className="dash-chev" />
                      </button>
                    </li>
                  );
                })}
                {attention.length > shown.length && <li className="dash-more">+{attention.length - shown.length} more</li>}
              </ul>
            )}
          </section>
        </div>
      </div>

      <section className="dash-card dash-sections" aria-labelledby="dash-sections">
        <div className="dash-card-head"><h2 id="dash-sections">My sections</h2>{termLabel && <span className="dash-note">{termLabel}</span>}</div>
        <div className="dash-row dash-row-head" aria-hidden="true"><span>Course</span><span>Attendance</span><span>Marks entered</span></div>
        {rows.map(({ section, attendance, marks, assessments }) => {
          const attendancePercent = percent(attendance.rate);
          const marksPercent = marks ? percent(marks.rate) : null;
          return (
            <div className="dash-row" key={idOf(section)}>
              <div className="dash-course"><SectionLabel section={section} /></div>
              <button type="button" className="dash-metric" onClick={() => go(navigate, "/attendance", idOf(section))}>
                <span className="dash-metric-text">{attendancePercent === null ? "No classes yet" : `${attendancePercent}% · ${plural(attendance.slots, "class")}`}</span>
                <Bar value={attendancePercent} label={attendancePercent === null ? "No attendance yet" : `${attendancePercent}% attendance`} />
              </button>
              <button type="button" className="dash-metric" onClick={() => go(navigate, "/marks", idOf(section))}>
                <span className="dash-metric-text">{!assessments ? "Unavailable" : marks && marks.count === 0 ? "No assessments" : marksPercent === null ? "No students yet" : `${marksPercent}% · ${marks.done} of ${plural(marks.count, "item")}`}</span>
                <Bar value={marksPercent} label={marksPercent === null ? "No marks yet" : `${marksPercent}% of marks entered`} />
              </button>
            </div>
          );
        })}
      </section>

      <div className="dash-foot">
        <span>{state.refreshFailed ? "Couldn't refresh just now" : `Updated ${updated}`}</span>
        <button type="button" className="dash-link" onClick={() => reload({ soft: true })} disabled={state.refreshing}>
          <RefreshCw size={13} className={state.refreshing ? "is-spinning" : ""} aria-hidden="true" />{state.refreshing ? "Refreshing…" : "Refresh"}
        </button>
      </div>
    </div>
  );
};

export default Dashboard;

import React from "react";

// Placeholders shaped like the screens they stand in for, so the page does not jump when the real content arrives.
// Each is one "first load" picture; they use the same shimmer bars as <Loading>.
const Bar = ({ className = "", style }) => <span className={`ld-bar ${className}`} style={style} aria-hidden="true" />;

// The Timetable: the title row, the three summary cards and a week board with a few blocks in each day.
export const TimetableSkeleton = () => (
  <div className="tt" role="status" aria-busy="true" aria-live="polite">
    <span className="ld-sr">Loading your timetable…</span>
    <header className="tt-header">
      <div className="tt-title"><h1>Timetable</h1><p className="tt-sub"><span>Your weekly classes</span></p></div>
      <Bar className="sk-seg" />
    </header>
    <div className="tt-summary" aria-hidden="true">
      {[0, 1, 2].map((i) => <div key={i} className="tt-stat sk-stat"><Bar style={{ width: "40%", height: 10 }} /><Bar style={{ width: "70%", height: 16 }} /><Bar style={{ width: "55%", height: 10 }} /></div>)}
    </div>
    <section className="tt-card sk-week" aria-hidden="true">
      <div className="sk-days">{["Mon", "Tue", "Wed", "Thu", "Fri"].map((d) => <span key={d}><Bar style={{ width: "55%", height: 12 }} /></span>)}</div>
      <div className="sk-board">
        {[[0, 2, 4], [1, 3], [0, 3], [2, 4], [1]].map((blocks, column) => (
          <div key={column} className="sk-col">
            {blocks.map((slot, i) => <Bar key={i} className="sk-block" style={{ top: `${slot * 19 + 2}%`, height: i % 2 ? "15%" : "17%" }} />)}
          </div>
        ))}
      </div>
    </section>
  </div>
);

// The attendance roster panel: the date and slot row, the search / counts / save row, then students with their three buttons.
export const RosterSkeleton = ({ rows = 9, bare = false }) => (
  <div className="sk-roster" role="status" aria-busy="true" aria-live="polite">
    <span className="ld-sr">Loading attendance…</span>
    {!bare && (
      <>
        <div className="sk-row sk-controls" aria-hidden="true">
          <Bar style={{ width: "9rem", height: 34 }} /><Bar style={{ width: "6rem", height: 34 }} /><span className="sk-grow" /><Bar style={{ width: "2.2rem", height: 28 }} /><Bar style={{ width: "2.2rem", height: 28 }} /><Bar style={{ width: "2.2rem", height: 28 }} />
        </div>
        <div className="sk-row sk-toolbar" aria-hidden="true">
          <Bar style={{ flex: "1 1 10rem", height: 36 }} /><Bar style={{ width: "4.5rem", height: 28, borderRadius: 999 }} /><Bar style={{ width: "4.5rem", height: 28, borderRadius: 999 }} /><Bar style={{ width: "4.5rem", height: 28, borderRadius: 999 }} /><Bar style={{ width: "6.5rem", height: 36 }} />
        </div>
      </>
    )}
    <div className="sk-table" aria-hidden="true">
      <div className="sk-trow sk-thead"><Bar style={{ width: "5rem", height: 10 }} /><Bar style={{ width: "4rem", height: 10 }} /><Bar style={{ width: "5rem", height: 10 }} /></div>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="sk-trow">
          <Bar style={{ width: "7.5rem", height: 12 }} />
          <Bar style={{ width: `${46 + ((i * 17) % 38)}%`, maxWidth: "16rem", height: 12 }} />
          <span className="sk-btns"><Bar style={{ width: "4.6rem", height: 28 }} /><Bar style={{ width: "4.6rem", height: 28 }} /><Bar style={{ width: "3.6rem", height: 28 }} /></span>
        </div>
      ))}
    </div>
  </div>
);

// The Marks side lists: sections, then assessments.
export const SidebarListSkeleton = ({ rows = 3, label = "Loading" }) => (
  <div className="sk-list" role="status" aria-busy="true" aria-live="polite">
    <span className="ld-sr">{label}…</span>
    {Array.from({ length: rows }, (_, i) => <Bar key={i} className="sk-item" style={{ width: `${88 - (i % 3) * 9}%` }} />)}
  </div>
);

// The Marks main panel: what is being edited, a search row and the students with their mark boxes.
export const MarksSkeleton = ({ rows = 9 }) => (
  <div className="sk-roster" role="status" aria-busy="true" aria-live="polite">
    <span className="ld-sr">Loading marks…</span>
    <div className="sk-row sk-controls" aria-hidden="true">
      <span className="sk-stack"><Bar style={{ width: "13rem", height: 16 }} /><Bar style={{ width: "8rem", height: 10 }} /></span>
      <span className="sk-grow" /><Bar style={{ width: "6rem", height: 32 }} /><Bar style={{ width: "7rem", height: 32 }} />
    </div>
    <div className="sk-row sk-toolbar" aria-hidden="true">
      <Bar style={{ flex: "1 1 10rem", height: 36 }} /><Bar style={{ width: "5rem", height: 36 }} /><Bar style={{ width: "5rem", height: 36 }} />
    </div>
    <div className="sk-table" aria-hidden="true">
      <div className="sk-trow sk-marks sk-thead"><Bar style={{ width: "5rem", height: 10 }} /><Bar style={{ width: "4rem", height: 10 }} /><Bar style={{ width: "4rem", height: 10 }} /><Bar style={{ width: "3.5rem", height: 10 }} /></div>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="sk-trow sk-marks">
          <Bar style={{ width: "7.5rem", height: 12 }} />
          <Bar style={{ width: `${46 + ((i * 17) % 38)}%`, maxWidth: "15rem", height: 12 }} />
          <Bar style={{ width: "4.5rem", height: 30 }} />
          <Bar style={{ width: "3rem", height: 12 }} />
        </div>
      ))}
    </div>
  </div>
);

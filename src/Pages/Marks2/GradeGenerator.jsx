import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import {
  AlertTriangle, ArrowUp, Check, CheckCircle2, Clock, Info, Lock, Send, Save, SlidersHorizontal, TrendingUp, Users, X,
} from 'lucide-react';
import './GradeGenerator.css';

// The Grade Generator: the step between "marks entered" and "results approved". The teacher chooses how the class is
// graded (as entered, or an upgrade), sees the effect on every student before anything is saved, and submits the section
// to an administrator. Upgrades are for staff only: students never see them.

const STEPS = ['Marks entered', 'Grades chosen', 'Admin review', 'Approved', 'Published'];
const STEP_OF_STATE = { OPEN: 1, SUBMITTED: 2, UNDER_REVIEW: 2, APPROVED: 3, PUBLISHED: 4, AMENDED: 4 };

const STATE_INFO = {
  OPEN: { label: 'Draft', tone: 'draft' },
  SUBMITTED: { label: 'Submitted', tone: 'wait' },
  UNDER_REVIEW: { label: 'Under review', tone: 'wait' },
  APPROVED: { label: 'Approved', tone: 'ok' },
  PUBLISHED: { label: 'Published', tone: 'ok' },
  AMENDED: { label: 'Amended', tone: 'ok' },
};

const LEDE = {
  OPEN: 'Choose how this class is graded, check the effect on every student, then send it to the administrator.',
  SUBMITTED: 'These results are with the administrator. Marks and grading cannot be changed unless they are returned to you.',
  UNDER_REVIEW: 'These results are with the administrator. Marks and grading cannot be changed unless they are returned to you.',
  APPROVED: 'These results are approved and on record. Marks and grading are now final for this section.',
  PUBLISHED: 'These results are published. Marks and grading are final for this section.',
  AMENDED: 'These results are published. Marks and grading are final for this section.',
};

const fmt = (n) => (n === null || n === undefined ? '–' : Number(n).toFixed(2).replace(/\.?0+$/, ''));
const sign = (n) => (n > 0 ? `+${fmt(n)}` : '–');
const gradeText = (g) => (g && (g.grade || g)) || '–';
// What to tell a person when a request fails: the server's own plain-language message when it sent one, otherwise a
// clear sentence about what happened and what to do.
const messageOf = (error) => {
  const message = error?.response?.data?.message;
  if (message) return message;
  const status = error?.response?.status;
  if (status === 401) return 'Your session has ended. Please sign in again.';
  if (status === 403) return "You don't have permission to do this.";
  if (status >= 500) return 'Something went wrong on our side. Please try again in a moment.';
  if (error?.request && !error?.response) return "Couldn't reach the server. Check your internet connection and try again.";
  return 'Something went wrong. Please try again.';
};

// What the current choice means, as a scheme the server understands (or a reason it is not ready).
export const buildScheme = (choice, marks, target, maxUpgradeMarks) => {
  if (choice === 'NONE') return { scheme: { type: 'NONE' }, problem: null };
  if (choice === 'ADD_MARKS') {
    const value = Number(marks);
    if (marks === '' || !Number.isFinite(value) || value <= 0) return { scheme: null, problem: 'Enter how many marks to add.' };
    if (maxUpgradeMarks && value > maxUpgradeMarks) return { scheme: null, problem: `The most that can be added is ${maxUpgradeMarks} marks.` };
    return { scheme: { type: 'ADD_MARKS', marks: value }, problem: null };
  }
  const value = Number(target);
  if (target === '' || !Number.isFinite(value) || value <= 0 || value > 100) return { scheme: null, problem: 'Enter a target average between 1 and 100.' };
  return { scheme: { type: 'TARGET_AVERAGE', target: value }, problem: null };
};

const Stepper = ({ state }) => {
  const at = STEP_OF_STATE[state] ?? 1;
  return (
    <>
    <p className="gg-step-now">Step {Math.min(at + 1, STEPS.length)} of {STEPS.length}: <strong>{STEPS[Math.min(at, STEPS.length - 1)]}</strong></p>
    <ol className="gg-steps" aria-label="Progress of these results">
      {STEPS.map((label, i) => (
        <li key={label} className={`gg-step ${i < at ? 'done' : ''} ${i === at ? 'current' : ''}`} aria-current={i === at ? 'step' : undefined}>
          <span className="gg-step-dot">{i < at ? <Check size={12} strokeWidth={3} /> : i + 1}</span>
          <span className="gg-step-label">{label}</span>
        </li>
      ))}
    </ol>
    </>
  );
};

const Tile = ({ label, before, after, hint, tone }) => (
  <div className={`gg-tile ${tone || ''}`}>
    <span className="gg-tile-label">{label}</span>
    <span className="gg-tile-value"><strong>{after}</strong></span>
    {before !== undefined && before !== after && <span className="gg-tile-hint was">was {before}</span>}
    {hint && <span className="gg-tile-hint">{hint}</span>}
  </div>
);

const Distribution = ({ distribution }) => {
  if (!distribution) return null;
  const { grades, before, after } = distribution;
  const peak = Math.max(1, ...grades.map((g) => Math.max(before[g] || 0, after[g] || 0)));
  return (
    <div className="gg-dist" role="group" aria-label="Number of students at each grade, before and after">
      <div className="gg-dist-legend"><span><i className="gg-key before" />As entered</span><span><i className="gg-key after" />After grading</span></div>
      {grades.map((g) => (
        <div className="gg-dist-row" key={g}>
          <span className="gg-dist-grade">{g}</span>
          <div className="gg-dist-bars">
            <div className="gg-bar before" style={{ width: `${((before[g] || 0) / peak) * 100}%` }} />
            <div className="gg-bar after" style={{ width: `${((after[g] || 0) / peak) * 100}%` }} />
          </div>
          <span className="gg-dist-count">{before[g] || 0}<em aria-hidden="true">→</em>{after[g] || 0}</span>
        </div>
      ))}
    </div>
  );
};

const limitNote = (row) => (row.limitedBy === 'CEILING' ? 'Held at 100' : row.limitedBy === 'MAXIMUM' ? 'At the maximum' : null);

const StudentRows = ({ rows, ledger }) => {
  const letters = useMemo(() => new Map((ledger || []).map((l) => [String(l.registrationId), l.letterGrade])), [ledger]);
  if (!rows.length) return <p className="gg-empty">This section has no students yet.</p>;
  // Letters exist for a preview and, once approved, in the record. A submitted draft has none, so the column is left out.
  const showGrade = Boolean(ledger) || rows.some((r) => r.finalGrade);
  return (
    <div className={`gg-table ${showGrade ? '' : 'no-grade'}`} role="table" aria-label="Every student's marks before and after grading">
      <div className="gg-row gg-head" role="row">
        <span role="columnheader">Student</span>
        <span role="columnheader" className="num">Entered</span>
        <span role="columnheader" className="num">Added</span>
        <span role="columnheader" className="num">Final</span>
        {showGrade && <span role="columnheader" className="grade">Grade</span>}
      </div>
      {rows.map((r) => {
        const note = limitNote(r);
        const noMarks = r.raw === null;
        const moved = r.rawGrade && r.finalGrade && r.rawGrade.grade !== r.finalGrade.grade;
        const letter = letters.get(String(r.registrationId));
        return (
          <div className={`gg-row ${r.upgrade > 0 ? 'changed' : ''}`} role="row" key={r.registrationId}>
            <span role="cell" className="gg-student"><strong>{r.name || 'Student'}</strong><small>{r.rollNumber}</small></span>
            <span role="cell" className="num" data-label="Entered">{noMarks ? <em className="gg-muted">No marks</em> : fmt(r.raw)}</span>
            <span role="cell" className="num" data-label="Added">
              {r.upgrade > 0 ? <span className="gg-added">{sign(r.upgrade)}</span> : <span className="gg-muted">–</span>}
              {note && <small className="gg-limit">{note}</small>}
            </span>
            <span role="cell" className="num" data-label="Final"><strong>{fmt(r.final)}</strong></span>
            {showGrade && (
              <span role="cell" className="grade" data-label="Grade">
                {letter ? <span className="gg-letter">{letter}</span>
                  : noMarks ? <span className="gg-muted">–</span>
                    : moved ? <span className="gg-move"><span className="gg-from">{gradeText(r.rawGrade)}</span><ArrowUp size={12} aria-label="up to" /><span className="gg-letter up">{gradeText(r.finalGrade)}</span></span>
                      : <span className="gg-letter">{gradeText(r.finalGrade)}</span>}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};

// Shown instead of the generator until the regular weightage totals exactly 100%: there is nothing to grade fairly before then.
const NotReady = ({ section, weights, hasAssessments, onOpenEntry }) => {
  const regular = Number(weights?.regularWeight) || 0;
  const none = !hasAssessments || regular === 0;
  const invalid = weights?.status === 'invalid';
  const over = regular > 100;
  const width = Math.max(0, Math.min(100, regular));
  return (
    <section className="gg" aria-label="Grade generator">
      <div className="gg-panel gg-gate" role="status">
        <span className="gg-gate-icon" aria-hidden="true"><SlidersHorizontal size={22} /></span>
        <p className="gg-eyebrow">Grade generator</p>
        <h2>{none ? 'Add your assessments first' : "The grade generator isn't ready yet"}</h2>
        <p className="gg-gate-course">{section.courseId?.name || 'Selected course'} · Section {section.section || section.name || '–'}</p>
        <p className="gg-gate-text">
          {invalid
            ? 'Some assessments have a missing or invalid weightage or maximum marks. Fix them on the Assessment Entry tab.'
            : none
              ? 'No assessments have been added to this section yet. Add your quizzes, assignments, midterm and final on the Assessment Entry tab. Their weightage needs to add up to exactly 100%.'
              : `Grades can be generated once the regular assessments add up to exactly 100%. They add up to ${fmt(regular)}% right now, ${over ? `so ${fmt(regular - 100)}% needs to come off.` : `so ${fmt(100 - regular)}% is still to be added.`}`}
        </p>
        {!none && !invalid && (
          <div className="gg-gate-meter" aria-label={`Regular weightage: ${fmt(regular)} out of 100`}>
            <div className="gg-gate-track"><i className={over ? 'over' : ''} style={{ width: `${width}%` }} /></div>
            <span>{fmt(regular)} / 100</span>
          </div>
        )}
        <p className="gg-gate-note">Bonus assessments are extra, on top of the 100%, and are not counted here.</p>
        {onOpenEntry && <button type="button" className="btn btn-primary" onClick={onOpenEntry}>Go to Assessment Entry</button>}
      </div>
    </section>
  );
};

const GradeGenerator = ({ section, apiUrl, headers, onOpenEntry }) => {
  const sectionId = section?._id;
  const [batch, setBatch] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [choice, setChoice] = useState('NONE');
  const [marks, setMarks] = useState('2');
  const [target, setTarget] = useState('70');
  const [reason, setReason] = useState('');
  const [preview, setPreview] = useState(null);
  const [previewing, setPreviewing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [acknowledge, setAcknowledge] = useState(false);
  const [showMissing, setShowMissing] = useState(false);
  const previewToken = useRef(0);

  const base = `${apiUrl}/api/result-batches/section/${sectionId}`;
  // The parent hands over a fresh function every render; keep the latest in a ref so effects do not loop.
  const headersRef = useRef(headers);
  headersRef.current = headers;
  const config = useCallback(() => ({ headers: headersRef.current() }), []);

  const load = useCallback(async () => {
    if (!sectionId) return null;
    try {
      setLoadError(null);
      const { data } = await axios.get(base, config());
      setBatch(data);
      return data;
    } catch (error) {
      setLoadError(messageOf(error));
      return null;
    }
  }, [base, config, sectionId]);

  // A different section starts from a clean slate, then takes whatever the teacher had already saved.
  useEffect(() => {
    setBatch(null); setPreview(null); setChoice('NONE'); setReason(''); setConfirming(false); setAcknowledge(false);
    load().then((data) => {
      const saved = data?.generation?.scheme;
      if (!saved) return;
      setChoice(saved.type);
      if (saved.type === 'ADD_MARKS') setMarks(String(saved.marks));
      if (saved.type === 'TARGET_AVERAGE') setTarget(String(saved.target));
      setReason(data.generation.reason || '');
    });
  }, [load]);

  const editable = batch?.state === 'OPEN';
  const weightsOk = batch?.readiness?.weights?.ready === true;
  const maxUpgradeMarks = batch?.policy?.maxUpgradeMarks;
  const { scheme, problem } = useMemo(() => buildScheme(choice, marks, target, maxUpgradeMarks), [choice, marks, target, maxUpgradeMarks]);

  // The live preview: what the class would look like. Nothing is saved by looking.
  useEffect(() => {
    if (!editable || !weightsOk || !scheme) { setPreview(null); return undefined; }
    const token = ++previewToken.current;
    setPreviewing(true);
    const timer = setTimeout(async () => {
      try {
        const { data } = await axios.post(`${base}/preview`, { scheme }, config());
        if (token === previewToken.current) setPreview(data);
      } catch (error) {
        if (token === previewToken.current) { setPreview(null); toast.error(messageOf(error)); }
      } finally {
        if (token === previewToken.current) setPreviewing(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [base, config, editable, weightsOk, scheme]);

  const needsReason = choice !== 'NONE';
  const reasonOk = !needsReason || reason.trim().length >= 5;
  const readiness = batch?.readiness;
  const weightsReady = readiness?.weights?.ready;
  const missing = readiness?.missing || [];
  const view = editable ? preview : (batch?.generation && { rows: batch.generation.rows, summary: batch.generation.summary, description: batch.generation.description });
  const summary = view?.summary;

  const workflowOn = batch?.workflowEnabled !== false;
  const blocker = !editable ? null
    : !workflowOn ? "Results processing isn't switched on yet, so you can't save or submit. Please ask a system administrator to turn it on."
    : !readiness?.hasStudents ? 'This section has no students.'
      : !readiness?.hasAssessments ? 'Add assessments and enter marks first.'
        : !weightsReady ? `The regular weightage is ${fmt(readiness.weights.regularWeight)}%. It must total exactly 100% before results can be submitted.`
          : problem || (!reasonOk ? 'Give a short reason for the upgrade (at least 5 characters).' : null);

  const save = async () => {
    await axios.put(`${base}/generation`, { scheme, reason: needsReason ? reason.trim() : undefined }, config());
  };

  const saveDraft = async () => {
    setBusy(true);
    try { await save(); await load(); toast.success('Draft saved'); } catch (error) { toast.error(messageOf(error)); } finally { setBusy(false); }
  };

  const submit = async () => {
    setBusy(true);
    try {
      await save();
      await axios.post(`${base}/submit`, { acknowledgeMissing: acknowledge }, config());
      setConfirming(false);
      await load();
      toast.success('Submitted to the administrator');
    } catch (error) {
      toast.error(messageOf(error));
    } finally { setBusy(false); }
  };

  if (loadError) return <div className="gg-panel gg-error" role="alert"><AlertTriangle size={18} /><span>{loadError}</span><button type="button" className="btn btn-secondary" onClick={load}>Try again</button></div>;
  if (!batch) return <div className="gg-panel gg-loading" aria-busy="true"><div className="gg-skel wide" /><div className="gg-skel" /><div className="gg-skel" /></div>;

  if (editable && !weightsOk) return <NotReady section={section} weights={batch.readiness?.weights} hasAssessments={batch.readiness?.hasAssessments} onOpenEntry={onOpenEntry} />;

  const info = STATE_INFO[batch.state] || STATE_INFO.OPEN;
  const banner = {
    SUBMITTED: { icon: <Clock size={16} />, text: 'Submitted. The administrator will review these results. Marks and assessments are read-only until they are returned or approved.' },
    UNDER_REVIEW: { icon: <Clock size={16} />, text: 'The administrator is reviewing these results. Marks and assessments are read-only.' },
    APPROVED: { icon: <Lock size={16} />, text: 'Approved and recorded. The administrator will publish these results to students.' },
    PUBLISHED: { icon: <CheckCircle2 size={16} />, text: 'Published. Students can now see their grades on their transcript.' },
    AMENDED: { icon: <CheckCircle2 size={16} />, text: 'Published, with an amendment on record.' },
  }[batch.state];

  return (
    <section className="gg" aria-label="Grade generator">
      <header className="gg-head-bar">
        <div>
          <p className="gg-eyebrow">Grade generator</p>
          <h2>{section.courseId?.name || 'Selected course'} <span>Section {section.section || section.name || '–'}</span></h2>
          <p className="gg-lede">{LEDE[batch.state] || LEDE.OPEN}</p>
        </div>
        <span className={`gg-state ${info.tone}`}>{info.label}</span>
      </header>

      <Stepper state={batch.state} />

      {!workflowOn && editable && (
        <div className="gg-banner info" role="status"><Info size={16} /><p><strong>Results processing isn't switched on yet.</strong> You can try out a grading choice and see its effect on every student, but saving and submitting will work once a system administrator turns it on.</p></div>
      )}
      {batch.returnedReason && editable && (
        <div className="gg-banner warn" role="status"><AlertTriangle size={16} /><div><strong>Returned by the administrator</strong><p>{batch.returnedReason}</p></div></div>
      )}
      {banner && <div className={`gg-banner ${batch.state === 'PUBLISHED' || batch.state === 'AMENDED' ? 'ok' : 'info'}`} role="status">{banner.icon}<p>{banner.text}</p></div>}
      {editable && batch.stale && batch.generation && (
        <div className="gg-banner warn" role="status"><AlertTriangle size={16} /><p>Marks have changed since you last saved this grading. Check the preview below and save it again.</p></div>
      )}

      {editable && (
        <div className="gg-panel gg-ready">
          <div className="gg-ready-item">
            <span className={`gg-ready-icon ${weightsReady ? 'ok' : 'bad'}`}>{weightsReady ? <Check size={14} strokeWidth={3} /> : <X size={14} strokeWidth={3} />}</span>
            <div>
              <strong>Weightage {fmt(readiness.weights.regularWeight)} / 100</strong>
              <small>{weightsReady ? 'The regular assessments add up to 100%.' : 'Fix the weightage on the Assessment Entry tab.'}</small>
            </div>
          </div>
          <div className="gg-ready-item">
            <span className={`gg-ready-icon ${missing.length ? 'warn' : 'ok'}`}>{missing.length ? <AlertTriangle size={13} /> : <Check size={14} strokeWidth={3} />}</span>
            <div>
              <strong>{missing.length ? `${missing.length} student${missing.length === 1 ? ' has' : 's have'} marks missing` : 'All marks entered'}</strong>
              <small>
                {missing.length ? <>Missing marks count as zero. <button type="button" className="gg-link" onClick={() => setShowMissing((v) => !v)}>{showMissing ? 'Hide who' : 'See who'}</button></> : 'Every student has a mark for every assessment.'}
              </small>
            </div>
          </div>
          {showMissing && missing.length > 0 && (
            <ul className="gg-missing">{missing.map((m) => <li key={m.registrationId}><strong>{m.name}</strong> <small>{m.rollNumber}</small><span>{m.missingCount} missing</span></li>)}</ul>
          )}
        </div>
      )}

      <div className="gg-grid">
        {editable && (
          <div className="gg-panel gg-choose">
            <h3><SlidersHorizontal size={16} /> How should this class be graded?</h3>
            <div className="gg-options" role="radiogroup" aria-label="Grading choice">
              <label className={`gg-option ${choice === 'NONE' ? 'on' : ''}`}>
                <input type="radio" name="gg-choice" checked={choice === 'NONE'} onChange={() => setChoice('NONE')} />
                <span className="gg-radio" aria-hidden="true" />
                <span><strong>As entered</strong><small>Grades come straight from the marks. No upgrade.</small></span>
              </label>
              <label className={`gg-option ${choice === 'ADD_MARKS' ? 'on' : ''}`}>
                <input type="radio" name="gg-choice" checked={choice === 'ADD_MARKS'} onChange={() => setChoice('ADD_MARKS')} />
                <span className="gg-radio" aria-hidden="true" />
                <span><strong>Add marks to everyone</strong><small>The same number of marks is added to every student’s total. No one goes above 100.</small></span>
              </label>
              {choice === 'ADD_MARKS' && (
                <div className="gg-inline">
                  <label htmlFor="gg-marks">Marks to add</label>
                  <div className="gg-number">
                    <button type="button" aria-label="One less" onClick={() => setMarks(String(Math.max(0, (Number(marks) || 0) - 0.5)))}>−</button>
                    <input id="gg-marks" type="number" inputMode="decimal" min="0" max={maxUpgradeMarks} step="0.5" value={marks} onChange={(e) => setMarks(e.target.value)} aria-invalid={Boolean(problem)} />
                    <button type="button" aria-label="One more" onClick={() => setMarks(String(Math.min(maxUpgradeMarks || 100, (Number(marks) || 0) + 0.5)))}>+</button>
                  </div>
                  {maxUpgradeMarks ? <small>Up to {maxUpgradeMarks} marks</small> : null}
                </div>
              )}
              <label className={`gg-option ${choice === 'TARGET_AVERAGE' ? 'on' : ''}`}>
                <input type="radio" name="gg-choice" checked={choice === 'TARGET_AVERAGE'} onChange={() => setChoice('TARGET_AVERAGE')} />
                <span className="gg-radio" aria-hidden="true" />
                <span><strong>Raise the class average</strong><small>Adds the smallest number of marks (within the limit) that brings the class average up to a target.</small></span>
              </label>
              {choice === 'TARGET_AVERAGE' && (
                <div className="gg-inline">
                  <label htmlFor="gg-target">Target average (%)</label>
                  <div className="gg-number">
                    <input id="gg-target" type="number" inputMode="decimal" min="1" max="100" step="1" value={target} onChange={(e) => setTarget(e.target.value)} aria-invalid={Boolean(problem)} />
                  </div>
                </div>
              )}
            </div>
            {choice !== 'NONE' && problem && <p className="gg-problem" role="alert"><Info size={14} />{problem}</p>}
            {needsReason && (
              <div className="gg-reason">
                <label htmlFor="gg-reason">Why is this needed? <small>Kept on record for the administrator</small></label>
                <textarea id="gg-reason" rows={2} maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="For example: the final exam was harder than planned and the class average was low." />
              </div>
            )}
            <p className="gg-privacy"><Lock size={13} /> Upgrades are seen by staff only. Students see their marks as entered and, once published, their transcript.</p>
          </div>
        )}

        <div className={`gg-panel gg-effect ${previewing ? 'busy' : ''}`}>
          <h3><TrendingUp size={16} /> {editable ? 'Effect on the class' : 'How this class was graded'}</h3>
          {view?.description && <p className="gg-desc">{view.description}</p>}
          {summary ? (
            <>
              <div className="gg-tiles">
                <Tile label="Class average" before={fmt(summary.classAverageBefore)} after={fmt(summary.classAverageAfter)} />
                <Tile label="Passing" before={summary.passingBefore} after={summary.passingAfter} hint={`of ${summary.gradedCount} with marks`} />
                <Tile label="Moved up a grade" after={summary.studentsMovedUp} hint={`${summary.studentsUpgraded} received marks`} />
                <Tile label="Held at 100" after={summary.studentsAtCeiling} hint={summary.studentsLimited ? `${summary.studentsLimited} limited` : 'nobody above 100'} />
              </div>
              <Distribution distribution={summary.distribution} />
            </>
          ) : (
            <p className="gg-empty">{editable ? (scheme ? 'Working out the effect…' : 'Complete the choice on the left to see the effect on the class.') : 'No summary was saved.'}</p>
          )}
        </div>
      </div>

      <div className="gg-panel gg-students">
        <h3><Users size={16} /> Students{view?.rows ? <span className="gg-count">{view.rows.length}</span> : null}</h3>
        {view?.rows ? <StudentRows rows={view.rows} ledger={batch.ledger} /> : <p className="gg-empty">{editable ? 'The list appears once the grading choice is complete.' : 'Nothing to show.'}</p>}
      </div>

      {editable && (
        <div className="gg-actions">
          <p className={`gg-blocker ${blocker ? 'on' : ''}`} role="status">{blocker ? <><Info size={14} />{blocker}</> : 'Ready to submit. You can still save a draft and come back.'}</p>
          <div className="gg-buttons">
            <button type="button" className="btn btn-secondary" onClick={saveDraft} disabled={busy || !workflowOn || Boolean(problem) || !reasonOk}><Save size={16} /> Save draft</button>
            <button type="button" className="btn btn-primary" onClick={() => { setAcknowledge(false); setConfirming(true); }} disabled={busy || Boolean(blocker)}><Send size={16} /> Submit to admin</button>
          </div>
        </div>
      )}

      {confirming && (
        <div className="gg-modal-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget && !busy) setConfirming(false); }}>
          <div className="gg-modal" role="dialog" aria-modal="true" aria-labelledby="gg-confirm-title">
            <h3 id="gg-confirm-title">Submit these results?</h3>
            <p className="gg-modal-lede">{preview?.description || 'As entered (no upgrade)'}</p>
            {summary && <ul className="gg-modal-list">
              <li>Class average <strong>{fmt(summary.classAverageBefore)}{summary.classAverageBefore !== summary.classAverageAfter ? ` → ${fmt(summary.classAverageAfter)}` : ''}</strong></li>
              <li>Passing <strong>{summary.passingBefore !== summary.passingAfter ? `${summary.passingBefore} → ${summary.passingAfter}` : summary.passingAfter} of {summary.gradedCount}</strong></li>
              <li>Moved up a grade <strong>{summary.studentsMovedUp}</strong></li>
            </ul>}
            <p className="gg-modal-note"><Lock size={14} /> Once submitted, marks and assessments for this section cannot be changed unless the administrator returns it to you.</p>
            {missing.length > 0 && (
              <label className="gg-check">
                <input type="checkbox" checked={acknowledge} onChange={(e) => setAcknowledge(e.target.checked)} />
                <span>{missing.length} student{missing.length === 1 ? ' has' : 's have'} marks missing. I understand they count as zero.</span>
              </label>
            )}
            <div className="gg-modal-buttons">
              <button type="button" className="btn btn-secondary" onClick={() => setConfirming(false)} disabled={busy}>Go back</button>
              <button type="button" className="btn btn-primary" onClick={submit} disabled={busy || (missing.length > 0 && !acknowledge)}>{busy ? 'Submitting…' : 'Submit'}</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default GradeGenerator;

import React, { useCallback, useEffect, useRef, useState } from "react";
import "./ConfirmDialog.css";

// In-app replacement for window.confirm, styled like the portal's other dialogs.
//   const [confirm, confirmDialog] = useConfirm();
//   if (!(await confirm({ title, message, confirmText, danger }))) return;
//   ...render {confirmDialog} once in the page.
export const useConfirm = () => {
  const [options, setOptions] = useState(null);
  const resolver = useRef(null);

  const confirm = useCallback((opts) => new Promise((resolve) => {
    resolver.current = resolve;
    setOptions(typeof opts === "string" ? { message: opts } : opts);
  }), []);

  const close = useCallback((result) => {
    if (resolver.current) resolver.current(result);
    resolver.current = null;
    setOptions(null);
  }, []);

  return [confirm, options ? <ConfirmDialog {...options} onClose={close} /> : null];
};

const ConfirmDialog = ({ title = "Please confirm", message, confirmText = "Confirm", cancelText = "Cancel", danger = false, onClose }) => {
  const confirmRef = useRef(null);

  useEffect(() => {
    confirmRef.current?.focus();
    const onKey = (event) => { if (event.key === "Escape") onClose(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="modal-overlay confirm-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(false); }}>
      <div className="modal confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-message">
        <div className="modal-header"><h3 id="confirm-title">{title}</h3></div>
        <div className="modal-body confirm-body"><p id="confirm-message">{message}</p></div>
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={() => onClose(false)}>{cancelText}</button>
          <button type="button" ref={confirmRef} className={`btn ${danger ? "btn-danger" : "btn-primary"}`} onClick={() => onClose(true)}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;

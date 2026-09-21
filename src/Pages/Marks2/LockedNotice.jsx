import React from 'react';
import { Lock } from 'lucide-react';

// Said up front, so nobody has to hit an error to learn that a section's marks are read-only.
const TEXT = {
  SUBMITTED: { title: 'Submitted for approval', body: 'The administrator is reviewing these results, so marks and assessments are read-only. If a change is needed, ask the administrator to return them to you.' },
  UNDER_REVIEW: { title: 'Under review', body: 'The administrator is reviewing these results, so marks and assessments are read-only. If a change is needed, ask the administrator to return them to you.' },
  APPROVED: { title: 'Approved', body: 'These results are approved and on record, so marks and assessments can no longer be changed here.' },
  PUBLISHED: { title: 'Published', body: 'These results are published, so marks and assessments can no longer be changed here. A correction is made by an administrator as an amendment.' },
  AMENDED: { title: 'Published', body: 'These results are published, so marks and assessments can no longer be changed here. A correction is made by an administrator as an amendment.' },
};
const LOCKED = { title: 'Marks are locked', body: "An administrator has locked this section's marks, so marks and assessments can no longer be changed. If a change is needed, ask the administrator." };

export const lockText = (status) => (status?.marksFrozen ? (TEXT[status.state] || LOCKED) : null);
export const LOCK_HINT = 'This section is read-only.';

const LockedNotice = ({ status }) => {
  const text = lockText(status);
  if (!text) return null;
  return (
    <div className="marks-locked-notice" role="status">
      <Lock size={18} aria-hidden="true" />
      <div><strong>{text.title}. This section is read-only.</strong><p>{text.body}</p></div>
    </div>
  );
};

export default LockedNotice;

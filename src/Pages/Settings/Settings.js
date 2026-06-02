import React, { useState } from 'react';
import axios from 'axios';
import { CheckCircle2, Eye, EyeOff, LockKeyhole, ShieldCheck } from 'lucide-react';
import './Settings.css';

const Settings = () => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [visibleFields, setVisibleFields] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const user = JSON.parse(sessionStorage.getItem('user')) || {};

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
    setMessage('');
    setError('');
  };

  const toggleFieldVisibility = (fieldName) => {
    setVisibleFields((previous) => ({
      ...previous,
      [fieldName]: !previous[fieldName],
    }));
  };

  const getInitial = () => {
    if (user?.name) {
      return user.name.charAt(0).toUpperCase();
    }
    return 'T';
  };

  const validateForm = () => {
    if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
      setError('All password fields are required.');
      return false;
    }

    if (formData.newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return false;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('New password and confirm password do not match.');
      return false;
    }

    if (formData.currentPassword === formData.newPassword) {
      setError('New password must be different from your current password.');
      return false;
    }

    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);
      setError('');
      setMessage('');

      const apiUrl = process.env.REACT_APP_BACKEND_URL;
      await axios.post(`${apiUrl}/api/auth/change-password`, {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });

      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setMessage('Password changed successfully.');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to change password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="settings-page">
      <div className="settings-hero">
        <div>
          <p className="settings-eyebrow">Account Settings</p>
          <h1>Security</h1>
          <p>Update your password after signing in with a temporary password from admin.</p>
        </div>

        <div className="settings-account-card">
          <div className="settings-avatar">{getInitial()}</div>
          <div>
            <span>{user?.name || 'Teacher'}</span>
            <p>{user?.email || 'Teacher account'}</p>
          </div>
        </div>
      </div>

      <div className="settings-grid">
        <aside className="settings-info-panel">
          <div className="settings-info-icon">
            <ShieldCheck size={24} />
          </div>
          <h2>Password Guidelines</h2>
          <p>Choose a password that is private to you and different from the temporary password shared by admin.</p>
          <ul>
            <li><CheckCircle2 size={16} /> Minimum 6 characters</li>
            <li><CheckCircle2 size={16} /> Different from current password</li>
            <li><CheckCircle2 size={16} /> Avoid sharing it with anyone</li>
          </ul>
        </aside>

        <form className="password-reset-panel" onSubmit={handleSubmit}>
          <div className="panel-title-row">
            <div className="panel-title-icon">
              <LockKeyhole size={22} />
            </div>
            <div>
              <h2>Reset Password</h2>
              <p>Enter your current password first, then create a new one.</p>
            </div>
          </div>

          {message && <div className="settings-alert success">{message}</div>}
          {error && <div className="settings-alert error">{error}</div>}

          <label>
            Current Password
            <div className="password-input-wrap">
              <input
                type={visibleFields.currentPassword ? 'text' : 'password'}
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleChange}
                disabled={isSubmitting}
                autoComplete="current-password"
                placeholder="Enter current or temp password"
              />
              <button
                type="button"
                className="password-visibility-button"
                onClick={() => toggleFieldVisibility('currentPassword')}
                aria-label={visibleFields.currentPassword ? 'Hide current password' : 'Show current password'}
              >
                {visibleFields.currentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>

          <label>
            New Password
            <div className="password-input-wrap">
              <input
                type={visibleFields.newPassword ? 'text' : 'password'}
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                disabled={isSubmitting}
                autoComplete="new-password"
                placeholder="Create new password"
              />
              <button
                type="button"
                className="password-visibility-button"
                onClick={() => toggleFieldVisibility('newPassword')}
                aria-label={visibleFields.newPassword ? 'Hide new password' : 'Show new password'}
              >
                {visibleFields.newPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>

          <label>
            Confirm New Password
            <div className="password-input-wrap">
              <input
                type={visibleFields.confirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={isSubmitting}
                autoComplete="new-password"
                placeholder="Re-enter new password"
              />
              <button
                type="button"
                className="password-visibility-button"
                onClick={() => toggleFieldVisibility('confirmPassword')}
                aria-label={visibleFields.confirmPassword ? 'Hide confirm password' : 'Show confirm password'}
              >
                {visibleFields.confirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>

          <button className="update-password-button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </section>
  );
};

export default Settings;

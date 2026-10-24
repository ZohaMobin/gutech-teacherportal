import React, { useState } from 'react';
import axios from 'axios';
import { Eye, EyeOff } from 'lucide-react';
import './Settings.css';
import { formMessageOf } from '../../utils/apiMessage';
import { InlineAlert } from '../../Components/ErrorState/ErrorState';

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
      setError('Fill in all three password fields.');
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
      setError(formMessageOf(requestError, 'Unable to change password. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const field = (name, label, autoComplete, placeholder) => (
    <label className="st-field">
      <span>{label}</span>
      <div className="st-input">
        <input
          type={visibleFields[name] ? 'text' : 'password'}
          name={name}
          value={formData[name]}
          onChange={handleChange}
          disabled={isSubmitting}
          autoComplete={autoComplete}
          placeholder={placeholder}
        />
        <button
          type="button"
          className="st-eye"
          onClick={() => toggleFieldVisibility(name)}
          aria-label={`${visibleFields[name] ? 'Hide' : 'Show'} ${label.toLowerCase()}`}
        >
          {visibleFields[name] ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </label>
  );

  return (
    <div className="st-page">
      <div className="st-header">
        <div>
          <h1>Settings</h1>
          <p>Your account and password</p>
        </div>
      </div>

      <div className="st-grid">
        <section className="st-card st-account" aria-label="Account">
          <div className="st-avatar">{getInitial()}</div>
          <div className="st-who">
            <strong>{user?.name || 'Teacher'}</strong>
            <span>{user?.email || 'Teacher account'}</span>
          </div>
        </section>

        <form className="st-card st-password" onSubmit={handleSubmit} aria-label="Change password">
          <h2>Change password</h2>
          <p className="st-hint">Use at least 6 characters, different from your current or temporary password. Keep it private.</p>

          {message && <div className="st-success" role="status">{message}</div>}
          <InlineAlert message={error} />

          {field('currentPassword', 'Current password', 'current-password', 'Your current or temporary password')}
          {field('newPassword', 'New password', 'new-password', 'At least 6 characters')}
          {field('confirmPassword', 'Confirm new password', 'new-password', 'Type the new password again')}

          <div className="st-actions">
            <button className="st-save" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Updating…' : 'Update password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Settings;

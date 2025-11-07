import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../Components/AuthContext'; // ✅ Import the auth context
import './Signup.css';

const Signup = () => {
  const [isSignupActive, setIsSignupActive] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const departments = [
    'Computer Science', 'Mathematics', 'Physics', 'Chemistry', 'Biology',
    'English', 'History', 'Economics', 'Engineering', 'Other'
  ];
  
  const [signupForm, setSignupForm] = useState({
    name: '',
    email: '',
    employeeId: '',
    department: '',
    password: '',
  });

  const [loginForm, setLoginForm] = useState({
    identifier: '',
    password: '',
  });

  const navigate = useNavigate();
  const { login } = useAuth(); // ✅ Use auth context login function

  const handleSignupChange = (e) => {
    const { name, value } = e.target;
    setSignupForm({ ...signupForm, [name]: value });
    setError('');
  };

  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginForm({ ...loginForm, [name]: value });
    setError('');
  };

  const validateSignupForm = () => {
    if (!signupForm.name || !signupForm.email || !signupForm.employeeId || !signupForm.department || !signupForm.password) {
      setError('All fields are required');
      return false;
    }
    if (!signupForm.email.includes('@') || !signupForm.email.includes('.')) {
      setError('Please enter a valid email address');
      return false;
    }
    if (signupForm.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    return true;
  };

  const validateLoginForm = () => {
    if (!loginForm.identifier || !loginForm.password) {
      setError('All fields are required');
      return false;
    }
    return true;
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!validateSignupForm()) return;

    try {
      setIsSubmitting(true);
      setError('');
      const apiUrl = process.env.REACT_APP_BACKEND_URL;
      const userData = {
        ...signupForm,
        role: 'teacher',
      };

      const response = await axios.post(`${apiUrl}/api/auth/register`, userData);

      setSignupForm({ name: '', email: '', employeeId: '', department: '', password: '' });
      setIsSignupActive(false);
      alert('Registration successful! Please log in with your credentials.');
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Registration failed. Please try again.';
      setError(errorMessage);
      console.error('Registration error:', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!validateLoginForm()) return;

    try {
      setIsSubmitting(true);
      setError('');
      const apiUrl = process.env.REACT_APP_BACKEND_URL;
      const response = await axios.post(`${apiUrl}/api/auth/login`, {
        email: loginForm.identifier,
        password: loginForm.password,
      });

      if (response.data.user.role !== 'teacher') {
        setError('Access denied. This portal is for teachers only.');
        return;
      }

      // Save to session + update context
      sessionStorage.setItem('token', response.data.token);
      sessionStorage.setItem('user', JSON.stringify(response.data.user));
      login(response.data.user, response.data.token); // Pass both user data and token

      navigate("/dashboard");
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Login failed. Please check your credentials.';
      setError(errorMessage);
      console.error('Login error:', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="auth-page">
      <div className={`auth-container ${isSignupActive ? 'active' : ''}`}>
        
        {/* Signup */}
        <div className="form-container sign-up">
          <form onSubmit={handleSignup}>
            <h1 className="form-title">Create Account</h1>
            {error && <div className="error-message">{error}</div>}
            <input type="text" name="name" placeholder="Full Name" value={signupForm.name} onChange={handleSignupChange} disabled={isSubmitting} />
            <input type="email" name="email" placeholder="Institutional Email" value={signupForm.email} onChange={handleSignupChange} disabled={isSubmitting} />
            <input type="text" name="employeeId" placeholder="Employee ID" value={signupForm.employeeId} onChange={handleSignupChange} disabled={isSubmitting} />
            <select name="department" value={signupForm.department} onChange={handleSignupChange} disabled={isSubmitting}>
              <option value="">Select Department</option>
              {departments.map((dept, index) => <option key={index} value={dept}>{dept}</option>)}
            </select>
            <div className="password-field">
              <input type={showPassword ? 'text' : 'password'} name="password" placeholder="Password" value={signupForm.password} onChange={handleSignupChange} disabled={isSubmitting} />
              <div className="password-toggle" onClick={togglePasswordVisibility}>
                {showPassword ? <i className="fas fa-eye-slash"></i> : <i className="fas fa-eye"></i>}
              </div>
            </div>
            <button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Processing...' : 'Register'}</button>
          </form>
        </div>

        {/* Login */}
        <div className="form-container sign-in">
          <form onSubmit={handleLogin}>
            <h1 className="form-title">Sign In</h1>
            {error && <div className="error-message">{error}</div>}
            <input type="text" name="identifier" placeholder="Email or Employee ID" value={loginForm.identifier} onChange={handleLoginChange} disabled={isSubmitting} />
            <div className="password-field">
              <input type={showPassword ? 'text' : 'password'} name="password" placeholder="Password" value={loginForm.password} onChange={handleLoginChange} disabled={isSubmitting} />
              <div className="password-toggle" onClick={togglePasswordVisibility}>
                {showPassword ? <i className="fas fa-eye-slash"></i> : <i className="fas fa-eye"></i>}
              </div>
            </div>
            <Link to="/forgot-password" className="forgot-password">Forgot Your Password?</Link>
            <button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Signing In...' : 'Sign In'}</button>
          </form>
        </div>

        {/* Toggle Panel */}
        <div className="toggle-container">
          <div className="toggle">
            <div className="toggle-panel toggle-left">
              <h1>Welcome</h1>
              <p>Create an account to access all features and services</p>
              <p className="toggle-message">Already have an account?<br />Sign in to continue.</p>
              <button className="toggle-button" onClick={() => setIsSignupActive(false)}>Sign In</button>
            </div>
            <div className="toggle-panel toggle-right">
              <h1>Welcome Back</h1>
              <p>Access your account to use all features and services</p>
              <p className="toggle-message">Don't have an account?<br />Register to get started.</p>
              <button className="toggle-button" onClick={() => setIsSignupActive(true)}>Register</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;

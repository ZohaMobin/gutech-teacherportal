import { BusyLabel } from '../../Components/Loading/Loading';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../Components/AuthContext'; // ✅ Import the auth context
import './Signup.css';
import { formMessageOf } from '../../utils/apiMessage';
import { InlineAlert } from '../../Components/ErrorState/ErrorState';

// Something@something.tld, no spaces: catches typos like "a@." without rejecting real addresses.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;

const Signup = () => {
  const [isSignupActive, setIsSignupActive] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [signupError, setSignupError] = useState('');
  const [loginError, setLoginError] = useState('');
  const [departments, setDepartments] = useState([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(true);
  const [departmentsFailed, setDepartmentsFailed] = useState(false);   // so a failed load is not described as "no departments"
  
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
  const { login, isAuthenticated } = useAuth(); // ✅ Use auth context login function

  // Fetch departments from API
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        setDepartmentsLoading(true);
        setDepartmentsFailed(false);
        const apiUrl = process.env.REACT_APP_BACKEND_URL;
        const response = await axios.get(`${apiUrl}/api/departments`, {
          headers: {
            'Content-Type': 'application/json',
          },
        });
        // Filter only active departments and sort by name
        const activeDepartments = (response.data || [])
          .filter(dept => dept.isActive !== false)
          .sort((a, b) => a.name.localeCompare(b.name));
        setDepartments(activeDepartments);
      } catch (error) {
        console.error('Error fetching departments:', error);
        // Fallback to empty array if API fails
        setDepartments([]);
        setDepartmentsFailed(true);
      } finally {
        setDepartmentsLoading(false);
      }
    };

    fetchDepartments();
  }, []);

  const handleSignupChange = (e) => {
    const { name, value } = e.target;
    setSignupForm({ ...signupForm, [name]: value });
    setSignupError('');
  };

  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginForm({ ...loginForm, [name]: value });
    setLoginError('');
  };

  const validateSignupForm = () => {
    if (!signupForm.name || !signupForm.email || !signupForm.employeeId || !signupForm.department || !signupForm.password) {
      setSignupError('All fields are required');
      return false;
    }
    if (!EMAIL_PATTERN.test(signupForm.email.trim())) {
      setSignupError('Please enter a valid email address');
      return false;
    }
    if (signupForm.password.length < 6) {
      setSignupError('Password must be at least 6 characters long');
      return false;
    }
    return true;
  };

  const validateLoginForm = () => {
    if (!loginForm.identifier || !loginForm.password) {
      setLoginError('All fields are required');
      return false;
    }
    return true;
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!validateSignupForm()) return;

    try {
      setIsRegistering(true);
      setSignupError('');
      const apiUrl = process.env.REACT_APP_BACKEND_URL;
      
      // Find the department ID from the selected department name
      const selectedDepartment = departments.find(dept => dept.name === signupForm.department);
      const departmentId = selectedDepartment ? (selectedDepartment._id || selectedDepartment.id) : null;
      
      const userData = {
        name: signupForm.name,
        email: signupForm.email,
        employeeId: signupForm.employeeId,
        department: departmentId, // Send department ID instead of name
        password: signupForm.password,
        role: 'teacher',
      };

      await axios.post(`${apiUrl}/api/auth/register`, userData);

      setSignupForm({ name: '', email: '', employeeId: '', department: '', password: '' });
      setIsSignupActive(false);
      toast.success('Registration received. An administrator must approve your account before you can log in.', { duration: 8000 });
    } catch (error) {
      const errorMessage = formMessageOf(error, 'Registration failed. Please try again.');
      setSignupError(errorMessage);
      console.error('Registration error:', errorMessage);
    } finally {
      setIsRegistering(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!validateLoginForm()) return;

    try {
      setIsSigningIn(true);
      setLoginError('');
      const apiUrl = process.env.REACT_APP_BACKEND_URL;
      const response = await axios.post(`${apiUrl}/api/auth/login`, {
        email: loginForm.identifier,
        password: loginForm.password,
        portal: 'teacher', // the server refuses other roles here; the check below covers an older server
      });

      if (response.data.user.role !== 'teacher') {
        setLoginError('Access denied. This portal is for teachers only.');
        return;
      }

      // Save to session + update context
      sessionStorage.setItem('token', response.data.token);
      sessionStorage.setItem('user', JSON.stringify(response.data.user));
      login(response.data.user, response.data.token); // Pass both user data and token

      navigate("/dashboard");
    } catch (error) {
      const errorMessage = formMessageOf(error, 'Login failed. Please check your credentials.');
      setLoginError(errorMessage);
      console.error('Login error:', errorMessage);
    } finally {
      setIsSigningIn(false);
    }
  };

  // Already signed in: no reason to show the login page again.
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const passwordToggle = (shown, setShown) => (
    <button
      type="button"
      className="password-toggle"
      onClick={() => setShown(!shown)}
      aria-label={shown ? 'Hide password' : 'Show password'}
      aria-pressed={shown}
    >
      <i className={shown ? 'fas fa-eye-slash' : 'fas fa-eye'} aria-hidden="true"></i>
    </button>
  );

  return (
    <div className="auth-page">
      <div className={`auth-container ${isSignupActive ? 'active' : ''}`}>
        
        {/* Signup */}
        <div className="form-container sign-up">
          <form onSubmit={handleSignup}>
            <h1 className="form-title">Create Account</h1>
            <InlineAlert message={signupError} />
            <input type="text" name="name" placeholder="Full Name" value={signupForm.name} onChange={handleSignupChange} disabled={isRegistering} />
            <input type="email" name="email" placeholder="Institutional Email" value={signupForm.email} onChange={handleSignupChange} disabled={isRegistering} />
            <input type="text" name="employeeId" placeholder="Employee ID" value={signupForm.employeeId} onChange={handleSignupChange} disabled={isRegistering} />
            <select name="department" value={signupForm.department} onChange={handleSignupChange} disabled={isRegistering || departmentsLoading}>
              <option value="">{departmentsLoading ? 'Loading departments...' : 'Select Department'}</option>
              {departments.length === 0 && !departmentsLoading && (
                <option value="" disabled>{departmentsFailed ? "Couldn't load departments. Check your connection and reload." : 'No departments available'}</option>
              )}
              {departments.map((dept) => (
                <option key={dept._id || dept.id} value={dept.name}>
                  {dept.name}
                </option>
              ))}
            </select>
            <div className="password-field">
              <input type={showSignupPassword ? 'text' : 'password'} name="password" placeholder="Password" value={signupForm.password} onChange={handleSignupChange} disabled={isRegistering} />
              {passwordToggle(showSignupPassword, setShowSignupPassword)}
            </div>
            <button type="submit" disabled={isRegistering}><BusyLabel busy={isRegistering} busyText="Registering…" idle="Register" /></button>
          </form>
        </div>

        {/* Login */}
        <div className="form-container sign-in">
          <form onSubmit={handleLogin}>
            <h1 className="form-title">Sign In</h1>
            <InlineAlert message={loginError} />
            <input type="text" name="identifier" placeholder="Email" value={loginForm.identifier} onChange={handleLoginChange} disabled={isSigningIn} />
            <div className="password-field">
              <input type={showLoginPassword ? 'text' : 'password'} name="password" placeholder="Password" value={loginForm.password} onChange={handleLoginChange} disabled={isSigningIn} />
              {passwordToggle(showLoginPassword, setShowLoginPassword)}
            </div>
            <Link to="/forgot-password" className="forgot-password">Forgot Your Password?</Link>
            <button type="submit" disabled={isSigningIn}><BusyLabel busy={isSigningIn} busyText="Signing in…" idle="Sign In" /></button>
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

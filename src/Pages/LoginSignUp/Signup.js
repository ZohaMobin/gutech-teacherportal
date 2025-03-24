import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import './Signup.css';

const Signup = () => {
  const [isActive, setIsActive] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: '',
    employeeID: '',
    password: '',
  });
  const [loginData, setLoginData] = useState({
    emailOrEmployeeID: '',
    password: '',
  });
  const navigate = useNavigate();

  const departments = ['Computer Science', 'Mathematics', 'Physics', 'Chemistry', 'Biology'];

  const handleSignupChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLoginChange = (e) => {
    setLoginData({ ...loginData, [e.target.name]: e.target.value });
  };

  const handleSignup = async () => {
    try {
      const apiUrl = process.env.REACT_APP_BACKEND_URL;
      const response = await axios.post(`${apiUrl}/api/auth/register`, {
        name: formData.name,
        email: formData.email,
        department: formData.department,
        employeeId: formData.employeeID,
        password: formData.password,
        role: 'teacher',
      });
      console.log('Signup successful:', response.data);
      alert('Signup successful! Please log in.');
      setIsActive(false); // Switch to login form
    } catch (error) {
      console.error('Signup error:', error.response?.data?.message || error.message);
      alert('Signup failed: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleLogin = async () => {
    try {
      const apiUrl = process.env.REACT_APP_BACKEND_URL;
      const response = await axios.post(`${apiUrl}/api/auth/login`, {
        email: loginData.emailOrEmployeeID,
        password: loginData.password,
      });
      
      // Store token and user info in session storage
      sessionStorage.setItem('token', response.data.token);
      sessionStorage.setItem('user', JSON.stringify(response.data.user));
      
      // Navigate to dashboard
      navigate('/dashboard');
    } catch (error) {
      console.error('Login error:', error.response?.data?.message || error.message);
      alert('Login failed: ' + (error.response?.data?.message || error.message));
    }
  };

  return (
    <div className={`container ${isActive ? 'active' : ''}`} id="container">
      <div className="form-container sign-up">
        <form onSubmit={(e) => e.preventDefault()}>
          <h1 className="ss">Create Account</h1>
          <input type="text" name="name" placeholder="Name" value={formData.name} onChange={handleSignupChange} />
          <input type="email" name="email" placeholder="GU-Tech E-mail" value={formData.email} onChange={handleSignupChange} />
          <select name="department" value={formData.department} onChange={handleSignupChange}>
            <option value="">Select Department</option>
            {departments.map((dept, index) => (
              <option key={index} value={dept}>{dept}</option>
            ))}
          </select>
          <input type="text" name="employeeID" placeholder="Employee ID" value={formData.employeeID} onChange={handleSignupChange} />
          <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleSignupChange} />
          <button type="button" onClick={handleSignup}>Sign Up</button>
        </form>
      </div>

      <div className="form-container sign-in">
        <form onSubmit={(e) => e.preventDefault()}>
          <h1 className="ss">Sign In</h1>
          <input type="text" name="emailOrEmployeeID" placeholder="Email or Employee ID" value={loginData.emailOrEmployeeID} onChange={handleLoginChange} />
          <div className="password-container">
            <input type={showPassword ? 'text' : 'password'} name="password" placeholder="Password" value={loginData.password} onChange={handleLoginChange} />
            <div className="eye-icon" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <i className="fas fa-eye-slash"></i> : <i className="fas fa-eye"></i>}
            </div>
          </div>
          <Link to="/forgot-password">Forgot Your Password?</Link>
          <button type="button" onClick={handleLogin}>Sign In</button>
        </form>
      </div>

      <div className="toggle-container">
        <div className="toggle">
          <div className="toggle-panel toggle-left">
            <h1>Hello, Friend</h1>
            <p>Register with your personal details to use all of the site's features</p>
            <p className="back">Already Have an Account?<br /> Sign In to Continue!</p>
            <button className="hidden" onClick={() => setIsActive(false)}>Sign In</button>
          </div>
          <div className="toggle-panel toggle-right">
            <h1>Welcome Back!</h1>
            <p>Enter your personal details to use all of the site's features</p>
            <p className="back">Don't Have an Account Yet?<br /> Let's Get You Started!</p>
            <button className="hidden" onClick={() => setIsActive(true)}>Sign Up</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
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
    rollNo: '',
    password: '',
  });
  const [loginData, setLoginData] = useState({
    emailOrRollNo: '',
    password: '',
  });
  const navigate = useNavigate();
  const handleSignupChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLoginChange = (e) => {
    setLoginData({ ...loginData, [e.target.name]: e.target.value });
  };

  const handleSignup = async () => {
    try {
      const apiUrl= process.env.REACT_APP_BACKEND_URL;
      const response = await axios.post(`${apiUrl}/api/auth/register`, {
        name : formData.name,
        rollNumber: formData.rollNo,
        email: formData.email,
        password: formData.password,
        role: 'teacher', // Add a default role (can be dynamic based on your app)
      });
      console.log('Signup successful:', response.data);
      alert('Signup successful! Please log in.');
    } catch (error) {
      console.error('Signup error:', error.response?.data?.message || error.message);
      alert('Signup failed: ' + error.response?.data?.message || error.message);
    }
  };

  const handleLogin = async () => {
    try {
      const apiUrl= process.env.REACT_APP_BACKEND_URL;
      const response = await axios.post(`${apiUrl}/api/auth/login`, {
        email: loginData.emailOrRollNo, // Assuming the backend checks for email or roll number
        password: loginData.password,
      });
      console.log('Login successful:', response.data);
      alert('Login successful!');
      // Save token to localStorage for future authenticated requests
      sessionStorage.setItem('token', response.data.token);
      sessionStorage.setItem('user', JSON.stringify(response.data.user));
      navigate("/dashboard");
    } catch (error) {
      console.error('Login error:', error.response?.data?.message || error.message);
      alert('Login failed: ' + error.response?.data?.message || error.message);
    }
  };

  return (
    <div className={`container ${isActive ? 'active' : ''}`} id="container">
      {/* Sign Up Form */}
      <div className="form-container sign-up">
        <form onSubmit={(e) => e.preventDefault()}>
          <h1 className="ss">Create Account</h1>
          <input
            type="text"
            name="name"
            placeholder="Name"
            value={formData.name}
            onChange={handleSignupChange}
          />
          <input
            type="email"
            name="email"
            placeholder="GU-Tech E-mail"
            value={formData.email}
            onChange={handleSignupChange}
          />
          <input
            type="text"
            name="rollNo"
            placeholder="Roll-No"
            value={formData.rollNo}
            onChange={handleSignupChange}
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleSignupChange}
          />
          <button type="button" onClick={handleSignup}>
            Sign Up
          </button>
        </form>
      </div>

      {/* Sign In Form */}
      <div className="form-container sign-in">
        <form onSubmit={(e) => e.preventDefault()}>
          <h1 className="ss">Sign In</h1>
          <input
            type="text"
            name="emailOrRollNo"
            placeholder="Email or Roll-No"
            value={loginData.emailOrRollNo}
            onChange={handleLoginChange}
          />
          <div className="password-container">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              placeholder="Password"
              value={loginData.password}
              onChange={handleLoginChange}
            />
            <div
              className="eye-icon"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <i className="fas fa-eye-slash"></i>
              ) : (
                <i className="fas fa-eye"></i>
              )}
            </div>
          </div>
          <Link to="/forgot-password">Forgot Your Password?</Link>
          <button type="button" onClick={handleLogin}>
          Sign In
          </button>
        </form>
      </div>

      {/* Toggle Container */}
      <div className="toggle-container">
        <div className="toggle">
          <div className="toggle-panel toggle-left">
            <h1>Hello, Friend</h1>
            <p>Register with your personal details to use all of the site's features</p>
            <p className="back">Already Have an Account?<br /> Sign In to Continue!</p>
            <button className="hidden" onClick={() => setIsActive(false)}>
              Sign In
            </button>
          </div>
          <div className="toggle-panel toggle-right">
            <h1>Welcome Back!</h1>
            <p>Enter your personal details to use all of the site's features</p>
            <p className="back">Don't Have an Account Yet?<br /> Let’s Get You Started!</p>
            <button className="hidden" onClick={() => setIsActive(true)}>
              Sign Up
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;

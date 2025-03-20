import React, { useState } from 'react';

const ComingSoonPage = () => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitted(true);
    setEmail('');
    setTimeout(() => setIsSubmitted(false), 3000);
  };

  return (
    <div className="coming-soon-container">
      <div className="coming-soon-card">
        {/* Header with Logo */}
        
        {/* Main Content */}
        <div className="coming-soon-content">
          <div className="coming-soon-title">
            <h2>Coming Soon</h2>
            <p>We're working on something exciting. Stay tuned for updates!</p>
          </div>
          
          {/* Notification Form */}
          <div className="notification-form-container">
            <h3>Get Notified When We Launch</h3>
            {isSubmitted ? (
              <div className="success-message">
                Thank you! We'll notify you when we launch.
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="notification-form">
                <input
                  type="email"
                  placeholder="Enter your email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <button type="submit">Notify Me</button>
              </form>
            )}
          </div>
        </div>
        
       
      </div>

      <style jsx>{`
        /* Using the exact color palette provided */
        :root {
          --primary-color: #991D20;
          --primary-light: rgba(153, 29, 32, 0.1);
          --primary-dark: #7A1619;
          --secondary-color: #2A6592;
          --secondary-light: rgba(42, 101, 146, 0.1);
          --accent-color: #F5C32C;
          --accent-light: rgba(245, 195, 44, 0.1);
          
          --text-color: #5F6368;
          --text-dark: #292B2C;
          --text-light: #9AA0A6;
          
          --light-bg: #FFFF;
          --white: #FFFFFF;
          --border-color: #E8EAED;
          --shadow-color: rgba(0, 0, 0, 0.08);
          
          --success-color: #34A853;
          --success-light: rgba(52, 168, 83, 0.15);
          --warning-color: #FBBC05;
          --warning-light: rgba(251, 188, 5, 0.15);
          --danger-color: #EA4335;
          --danger-light: rgba(234, 67, 53, 0.15);
          
          --transition: all 0.3s ease;
          --border-radius: 12px;
          --card-shadow: 0 4px 20px var(--shadow-color);
        }

        /* Container styles */
        .coming-soon-container {
          min-height: 20vh;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 24px;
          background-color: var(--light-bg);
          color: var(--text-color);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
        }

        .coming-soon-card {
          width: 100%;
          max-width: 900px;
          background-color: var(--white);
          border-radius: var(--border-radius);
          box-shadow: var(--card-shadow);
          overflow: hidden;
        }

        /* Header styles */
        .coming-soon-header {
          background-color: var(--primary-color);
          padding: 24px;
          text-align: center;
          color: var(--white);
        }

        .coming-soon-header h1 {
          font-size: 28px;
          font-weight: 700;
          margin: 0 0 8px 0;
        }

        .coming-soon-header p {
          font-size: 18px;
          margin: 0;
        }

        /* Content styles */
        .coming-soon-content {
          padding: 32px;
        }

        .coming-soon-title {
          text-align: center;
          margin-bottom: 40px;
        }

        .coming-soon-title h2 {
          font-size: 36px;
          font-weight: 700;
          color: var(--text-dark);
          margin: 0 0 16px 0;
        }

        .coming-soon-title p {
          font-size: 18px;
          margin: 0;
        }

        /* Notification form styles */
        .notification-form-container {
          max-width: 500px;
          margin: 0 auto;
        }

        .notification-form-container h3 {
          font-size: 22px;
          font-weight: 600;
          text-align: center;
          color: var(--text-dark);
          margin: 0 0 16px 0;
        }

        .notification-form {
          display: flex;
          gap: 12px;
        }

        @media (max-width: 640px) {
          .notification-form {
            flex-direction: column;
          }
        }

        .notification-form input {
          flex: 1;
          padding: 12px 16px;
          border: 1px solid var(--border-color);
          border-radius: var(--border-radius);
          font-size: 16px;
          transition: var(--transition);
        }

        .notification-form input:focus {
          outline: none;
          border-color: var(--primary-color);
        }

        .notification-form button {
          background-color: var(--primary-color);
          color: var(--white);
          font-size: 16px;
          font-weight: 500;
          padding: 12px 24px;
          border: none;
          border-radius: var(--border-radius);
          cursor: pointer;
          transition: var(--transition);
        }

        .notification-form button:hover {
          background-color: var(--primary-dark);
        }

        .success-message {
          padding: 16px;
          background-color: var(--success-light);
          color: var(--success-color);
          border-radius: var(--border-radius);
          text-align: center;
        }

        /* Features styles */
        .features-container {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
          padding: 32px;
          background-color: var(--light-bg);
          border-top: 1px solid var(--border-color);
        }

        @media (max-width: 768px) {
          .features-container {
            grid-template-columns: 1fr;
          }
        }

        .feature-box {
          text-align: center;
        }

        .feature-icon {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
          font-size: 24px;
        }

        .feature-icon.primary {
          background-color: var(--primary-light);
          color: var(--primary-color);
        }

        .feature-icon.secondary {
          background-color: var(--secondary-light);
          color: var(--secondary-color);
        }

        .feature-icon.accent {
          background-color: var(--accent-light);
          color: var(--accent-color);
        }

        .feature-box h4 {
          font-size: 18px;
          font-weight: 600;
          color: var(--text-dark);
          margin: 0 0 8px 0;
        }

        .feature-box p {
          color: var(--text-light);
          margin: 0;
        }

        /* Footer styles */
        .coming-soon-footer {
          background-color: var(--text-dark);
          color: var(--white);
          padding: 24px;
          text-align: center;
        }

        .social-links {
          display: flex;
          justify-content: center;
          gap: 24px;
          margin-bottom: 16px;
        }

        .social-link {
          color: var(--white);
          text-decoration: none;
          transition: var(--transition);
        }

        .social-link:hover {
          color: var(--accent-color);
        }

        .coming-soon-footer p {
          font-size: 14px;
          margin: 0;
        }
      `}</style>
    </div>
  );
};

export default ComingSoonPage;
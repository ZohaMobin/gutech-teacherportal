import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/global.css';
import App from './App';
import { installAuthInterceptor } from './api/authInterceptor';
import { installNoWheelNumbers } from './utils/noWheelNumber';

window.addEventListener('error', (event) => {
  const isExtensionError = event.filename?.startsWith('chrome-extension://');
  const isKnownInjectedError = event.message?.includes("Cannot read properties of undefined (reading 'M_ID')");

  if (isExtensionError && isKnownInjectedError) {
    event.preventDefault();
  }
});

// Central token header + 401 handling for every axios call in the portal.
installNoWheelNumbers();
installAuthInterceptor({ tokenKey: 'token', userKey: 'user' });

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

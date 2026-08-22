import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/global.css';
import App from './App';

window.addEventListener('error', (event) => {
  const isExtensionError = event.filename?.startsWith('chrome-extension://');
  const isKnownInjectedError = event.message?.includes("Cannot read properties of undefined (reading 'M_ID')");

  if (isExtensionError && isKnownInjectedError) {
    event.preventDefault();
  }
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

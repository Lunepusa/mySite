// GlobalErrorUI.jsx
import React, { useEffect, useState } from 'react';
import { useAuth } from './Auth.jsx';
import { apiError, browserError } from './Error.js';

export default function ErrorUI() {
  const { user } = useAuth(); 
  const [currentError, setCurrentError] = useState(null);

  useEffect(() => {
    const handleApiError = (event) => {
      const { code, debug } = event.detail;
      const formattedError = apiError(code, debug, user?.username);
      setCurrentError(formattedError);
    };

    const handleBrowserError = (event) => {
      const errorObj = event.error || event.reason;
      
      const diagnosticCode = browserError(errorObj);

      const debugDetails = errorObj 
        ? { message: errorObj.message, stack: errorObj.stack } 
        : { message: 'Unknown browser crash' };
      
      const formattedError = apiError(diagnosticCode, debugDetails, user?.username);
      setCurrentError(formattedError);
    };

    window.addEventListener('api-error', handleApiError);
    window.addEventListener('error', handleBrowserError);
    window.addEventListener('unhandledrejection', handleBrowserError);

    return () => {
      window.removeEventListener('api-error', handleApiError);
      window.removeEventListener('error', handleBrowserError);
      window.removeEventListener('unhandledrejection', handleBrowserError);
    };
  }, [user]);

  if (!currentError) return null;

  const { title, message, fixer, rawError } = currentError;


  return (
    <div style={{
      position: 'fixed',
      bottom: '1.5rem',
      right: '1.5rem',
      padding: '1.25rem',
      backgroundColor: '#1f2937',
      color: '#fff',
      borderLeft: `0.3rem solid red`,
      width: '25rem',
      maxWidth: '90vw',
      zIndex: 9999,
      display: 'inline-block',
      boxSizing: 'border-box'
    }}>
      <div style={{ display: 'inline-block', width: '85%', verticalAlign: 'top' }}>
        <h4 style={{ margin: '0 0 0.5rem 0', color: borderColor, fontSize: '1.1rem' }}>{title}</h4>
        <p style={{ margin: '0', fontSize: '0.9rem', lineHeight: '1.4' }}>{message}</p>
        
        {rawError && (
          <div style={{ 
            marginTop: '1rem', 
            padding: '0.75rem', 
            backgroundColor: '#000', 
            fontSize: '0.8rem',
            display: 'inline-block',
            width: '100%',
            boxSizing: 'border-box'
          }}>
            <strong >RAW DUMP:</strong><br/>
            <code style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
              {rawError.message || JSON.stringify(rawError)}
            </code>
          </div>
        )}
      </div>

      <div style={{ display: 'inline-block', width: '15%', verticalAlign: 'top', textAlign: 'right' }}>
        <button 
          onClick={() => setCurrentError(null)}
          >
          &times;
        </button>
      </div>
    </div>
  );
}
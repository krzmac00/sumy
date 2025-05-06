import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';

const ActivateAccount: React.FC = () => {
  const { t } = useTranslation();
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    const activateAccount = async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/accounts/activate/${token}/`);
        
        if (response.ok) {
          const data = await response.json();
          setStatus('success');
          setMessage(data.message || t('message.activationSuccess'));
          
          // Redirect to login page after 3 seconds
          setTimeout(() => {
            navigate('/auth');
          }, 3000);
        } else {
          const data = await response.json();
          setStatus('error');
          setMessage(data.message || t('message.activationError'));
        }
      } catch (error) {
        console.error('Activation error:', error);
        setStatus('error');
        setMessage(t('message.activationError'));
      }
    };

    if (token) {
      activateAccount();
    } else {
      setStatus('error');
      setMessage('Invalid activation link');
    }
  }, [token, navigate, t]);

  return (
    <div className="activation-container">
      <h1>{t('message.activation')}</h1>
      
      {status === 'loading' && (
        <div className="loading">
          <p>Loading...</p>
        </div>
      )}
      
      {status === 'success' && (
        <div className="success-message">
          <p>{message}</p>
          <p>You will be redirected to the login page in a few seconds...</p>
        </div>
      )}
      
      {status === 'error' && (
        <div className="error-message">
          <p>{message}</p>
          <button onClick={() => navigate('/auth')}>
            Back to Login
          </button>
        </div>
      )}
    </div>
  );
};

export default ActivateAccount;
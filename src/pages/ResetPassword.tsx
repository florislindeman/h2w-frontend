import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './Login.css';

const API_URL = import.meta.env.VITE_API_URL || 'https://h2wchatbot-production.up.railway.app';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [tokenError, setTokenError] = useState('');
  
  // Password strength indicators
  const [passwordStrength, setPasswordStrength] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
  });

  useEffect(() => {
    if (!token) {
      setTokenError('No reset token provided');
      setIsVerifying(false);
      return;
    }

    // Verify token is valid
    const verifyToken = async () => {
      try {
        const response = await fetch(`${API_URL}/auth/verify-reset-token/${token}`);
        const data = await response.json();
        
        if (data.valid) {
          setTokenValid(true);
        } else {
          setTokenError(data.reason || 'Invalid or expired reset token');
        }
      } catch (err) {
        setTokenError('Failed to verify reset token');
      } finally {
        setIsVerifying(false);
      }
    };

    verifyToken();
  }, [token]);

  useEffect(() => {
    // Check password strength
    setPasswordStrength({
      length: newPassword.length >= 8,
      uppercase: /[A-Z]/.test(newPassword),
      lowercase: /[a-z]/.test(newPassword),
      number: /\d/.test(newPassword),
    });
  }, [newPassword]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate password strength
    if (!Object.values(passwordStrength).every(v => v)) {
      setError('Password does not meet requirements');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: token,
          new_password: newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Password reset failed');
      }

      setSuccess(true);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  if (isVerifying) {
    return (
      <div className="login-wrapper">
        <div className="login-background">
          <div className="bg-shape shape-1"></div>
          <div className="bg-shape shape-2"></div>
          <div className="bg-shape shape-3"></div>
        </div>
        <div className="login-container">
          <div className="login-card">
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Verifying reset token...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="login-wrapper">
        <div className="login-background">
          <div className="bg-shape shape-1"></div>
          <div className="bg-shape shape-2"></div>
          <div className="bg-shape shape-3"></div>
        </div>
        <div className="login-container">
          <div className="login-card">
            <div className="error-state">
              <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: '64px', height: '64px', color: '#ef4444', margin: '0 auto 1rem' }}>
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#f1f5f9', marginBottom: '0.5rem' }}>Invalid Reset Link</h2>
              <p style={{ color: '#cbd5e1', marginBottom: '1.5rem' }}>{tokenError}</p>
              <button onClick={() => navigate('/login')} className="btn-submit">
                Back to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="login-wrapper">
        <div className="login-background">
          <div className="bg-shape shape-1"></div>
          <div className="bg-shape shape-2"></div>
          <div className="bg-shape shape-3"></div>
        </div>
        <div className="login-container">
          <div className="login-card">
            <div className="success-message">
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <h3>Password Reset Successful!</h3>
              <p>Your password has been changed. Redirecting to login...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-wrapper">
      <div className="login-background">
        <div className="bg-shape shape-1"></div>
        <div className="bg-shape shape-2"></div>
        <div className="bg-shape shape-3"></div>
      </div>

      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <div className="logo-container">
              <div className="ncg-logo">
                <div className="logo-lines">
                  <div className="logo-line"></div>
                  <div className="logo-line"></div>
                  <div className="logo-line"></div>
                </div>
                <div className="logo-text">
                  <div className="logo-title">NCG</div>
                  <div className="logo-subtitle">CREATING CONCEPTS</div>
                </div>
              </div>
            </div>
            <h1 className="login-title">Create New Password</h1>
            <p className="login-subtitle">Enter your new password below</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            {error && (
              <div className="alert alert-error">
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <div className="form-field">
              <label htmlFor="new-password" className="field-label">New Password</label>
              <div className="input-wrapper">
                <svg className="input-icon" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                <input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="field-input"
                  required
                  autoComplete="new-password"
                />
              </div>
              
              {/* Password strength indicators */}
              {newPassword && (
                <div className="password-requirements">
                  <div className={`requirement ${passwordStrength.length ? 'met' : ''}`}>
                    <svg viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>At least 8 characters</span>
                  </div>
                  <div className={`requirement ${passwordStrength.uppercase ? 'met' : ''}`}>
                    <svg viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>One uppercase letter</span>
                  </div>
                  <div className={`requirement ${passwordStrength.lowercase ? 'met' : ''}`}>
                    <svg viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>One lowercase letter</span>
                  </div>
                  <div className={`requirement ${passwordStrength.number ? 'met' : ''}`}>
                    <svg viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>One number</span>
                  </div>
                </div>
              )}
            </div>

            <div className="form-field">
              <label htmlFor="confirm-password" className="field-label">Confirm Password</label>
              <div className="input-wrapper">
                <svg className="input-icon" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                <input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="field-input"
                  required
                  autoComplete="new-password"
                />
              </div>
              {confirmPassword && newPassword !== confirmPassword && (
                <p style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                  Passwords do not match
                </p>
              )}
            </div>

            <button type="submit" className="btn-submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <span className="spinner"></span>
                  <span>Resetting Password...</span>
                </>
              ) : (
                <span>Reset Password</span>
              )}
            </button>
          </form>

          <div className="login-footer">
            <button 
              type="button"
              onClick={() => navigate('/login')}
              className="forgot-password-link"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const API_URL = 'https://h2wchatbot-production.up.railway.app';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Try with 'username' field first
      console.log('Attempting login with username field...');
      let response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: email,
          password: password,
        }),
      });

      // If that fails with 422, try with 'email' field
      if (!response.ok && response.status === 422) {
        console.log('Retrying with email field instead...');
        response = await fetch(`${API_URL}/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: email,
            password: password,
          }),
        });
      }

      if (!response.ok) {
        let errorMessage = 'Login failed. Please check your credentials.';
        
        try {
          const errorData = await response.json();
          console.log('Error data from server:', errorData);
          
          // Try multiple ways to get the error message
          if (typeof errorData === 'string') {
            errorMessage = errorData;
          } else if (typeof errorData.detail === 'string') {
            errorMessage = errorData.detail;
          } else if (Array.isArray(errorData.detail)) {
            // Handle array of errors (FastAPI validation errors)
            errorMessage = errorData.detail.map((err: any) => err.msg || JSON.stringify(err)).join(', ');
          } else if (typeof errorData.detail === 'object' && errorData.detail !== null) {
            // Handle nested detail object
            if (errorData.detail.message) {
              errorMessage = errorData.detail.message;
            } else {
              errorMessage = JSON.stringify(errorData.detail);
            }
          } else if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          }
          
          // Add status code for debugging
          if (response.status === 401 || response.status === 422) {
            if (!errorMessage.includes('credentials') && !errorMessage.includes('password')) {
              errorMessage = 'Incorrect email or password. Please try again.';
            }
          }
        } catch (parseError) {
          console.error('Could not parse error response:', parseError);
          errorMessage = `Login failed (Status: ${response.status}). Please check your credentials.`;
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('Login successful:', data);
      
      // Handle both flat and nested user data structures
      const user = data.user || {
        email: data.email,
        role: data.role,
        id: data.id || data.user_id
      };
      
      console.log('User object:', user);
      
      // Store token and user data
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user', JSON.stringify(user));

      // Role-based redirect
      if (user.role === 'admin') {
        console.log('Redirecting to admin...');
        navigate('/admin');
      } else {
        console.log('Redirecting to dashboard...');
        navigate('/dashboard');
      }
    } catch (err: any) {
      // Ensure error is always a string
      const errorMessage = err.message || 'An unexpected error occurred. Please try again.';
      setError(String(errorMessage));
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <img 
            src="/images/new-concept-group-logo.jpeg" 
            alt="New Concept Group" 
            className="login-logo-image"
          />
          <h1>Welcome Back</h1>
          <p>Sign in to access your knowledge base</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <div className="error-message">
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <div className="input-wrapper">
              <svg className="input-icon" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="input-wrapper">
              <svg className="input-icon" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>
          </div>

          <button type="submit" disabled={isLoading} className="submit-button">
            {isLoading ? (
              <>
                <div className="spinner"></div>
                Signing in...
              </>
            ) : (
              <>
                Sign In
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </>
            )}
          </button>
        </form>

        <div className="login-footer">
          <a href="#" className="forgot-password">Forgot your password?</a>
          <p className="contact-admin">Need access? Contact your administrator</p>
        </div>
      </div>
    </div>
  );
}


import React, { useState } from 'react';
import { FaEnvelope, FaLock } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { loginAPI } from '../../services/AuthServices';
import './Auth.css';

export default function LoginView() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      setLoading(true);

      const response = await loginAPI(formData);

      if (response.success) {
        navigate('/dashboard');
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth-page">
      <div className="auth-card">

        <div className="auth-heading">
          <h2>Welcome Back</h2>
          <p>Login to your Inkloom AI account.</p>
        </div>

        <form onSubmit={handleSubmit}>

          <div className="auth-input-group">
            <label>Email Address</label>

            <div className="auth-input-wrapper">
              <FaEnvelope />
              <input
                type="email"
                name="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div className="auth-input-group">
            <label>Password</label>

            <div className="auth-input-wrapper">
              <FaLock />
              <input
                type="password"
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                autoComplete="current-password"
                required
              />
            </div>
          </div>

          {error && (
            <p className="auth-error">{error}</p>
          )}

          <button
            type="submit"
            className="auth-submit-btn"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>

        </form>

        <p className="auth-switch-text">
          Don't have an account?{' '}
          <button
            type="button"
            onClick={() => navigate('/register')}
          >
            Register
          </button>
        </p>

      </div>
    </section>
  );
}

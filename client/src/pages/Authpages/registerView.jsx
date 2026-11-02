
import React, { useState } from 'react';
import { FaUser, FaEnvelope, FaLock } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { sendOtpAPI } from '../../services/AuthServices';
import './Auth.css';

export default function RegisterView() {
  const [formData, setFormData] = useState({
    name: '',
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

    if (
      !formData.name.trim() ||
      !formData.email.trim() ||
      !formData.password
    ) {
      setError('Please fill all fields.');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must contain at least 8 characters.');
      return;
    }

    try {
      setLoading(true);

      const response = await sendOtpAPI(formData);

      console.log(response.email)

      if (response.success) {
        navigate('/verify-otp', {
          state: {
            email: response?.email || formData?.email || response?.data?.email,
          },
        });
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth-page">
      <div className="auth-card">

        <div className="auth-heading">
          <h2>Create Account</h2>
          <p>Join Inkloom AI Brand Governance Platform</p>
        </div>

        <form onSubmit={handleSubmit}>

          <div className="auth-input-group">
            <label>Full Name</label>
            <div className="auth-input-wrapper">
              <FaUser />
              <input
                type="text"
                name="name"
                placeholder="Enter your name"
                value={formData.name}
                onChange={handleChange}
                autoComplete="name"
                required
              />
            </div>
          </div>

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
                placeholder="Minimum 8 characters"
                value={formData.password}
                onChange={handleChange}
                autoComplete="new-password"
                minLength={8}
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
            {loading ? 'Sending OTP...' : 'Send OTP'}
          </button>

        </form>

        <p className="auth-switch-text">
          Already have an account?{' '}
          <button
            type="button"
            onClick={() => navigate('/login')}
          >
            Login
          </button>
        </p>

      </div>
    </section>
  );
}

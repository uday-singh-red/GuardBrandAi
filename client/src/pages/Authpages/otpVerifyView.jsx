
import React, { useState } from 'react';
import { FaEnvelope, FaShieldAlt } from 'react-icons/fa';
import { verifyOtpAPI } from '../../services/AuthServices';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import './Auth.css';

export default function OtpView() {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const navigate = useNavigate();
  const location = useLocation();

  const email = location.state?.email;

  // If email is not available, redirect to Register page.
  if (!email) {
    return <Navigate to="/register" replace />;
  }

  const handleVerify = async (e) => {
    e.preventDefault();

    setError('');
    setSuccess('');

    if (!/^\d{6}$/.test(otp)) {
      setError('Please enter a valid 6-digit OTP.');
      return;
    }

    try {
      setLoading(true);

      const response = await verifyOtpAPI({
        email: email,
        otp: otp,
      });

      if (response.success) {
        setSuccess(response.message);

        setTimeout(() => {
          navigate('/dashboard');
        }, 700);
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError(err.message || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth-page">
      <div className="auth-card">

        <div className="auth-icon">
          <FaShieldAlt />
        </div>

        <div className="auth-heading">
          <h2>Verify Your Email</h2>
          <p>Enter the 6-digit OTP to verify your email address.</p>
        </div>

        <div className="otp-email">
          <FaEnvelope />
          <span>{email}</span>
        </div>

        <form onSubmit={handleVerify}>

          <div className="auth-input-group">
            <label>Enter OTP</label>

            <input
              className="otp-input"
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
              value={otp}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '');
                setOtp(value);
              }}
              required
            />
          </div>

          {error && (
            <p className="auth-error">{error}</p>
          )}

          {success && (
            <p className="auth-success">{success}</p>
          )}

          <button
            type="submit"
            className="auth-submit-btn"
            disabled={loading || !!success}
          >
            {loading ? 'Verifying...' : 'Verify OTP'}
          </button>

        </form>

        <button
          type="button"
          className="auth-back-btn"
          onClick={() => navigate('/register')}
        >
          Back to Register
        </button>

      </div>
    </section>
  );
}

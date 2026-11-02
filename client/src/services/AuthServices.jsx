
import { apiRequest } from './api';

// Send OTP
export const sendOtpAPI = async (userData) => {
  return await apiRequest('/api/user/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
};

// Verify OTP
export const verifyOtpAPI = async (otpData) => {
  return await apiRequest('/api/user/verify-otp', {
    method: 'POST',
    body: JSON.stringify(otpData),
  });
};

// Login
export const loginAPI = async (loginData) => {
  return await apiRequest('/api/user/login', {
    method: 'POST',
    body: JSON.stringify(loginData),
  });
};

// Check Authentication
export const checkAuthAPI = async () => {
  return await apiRequest('/api/user/check-auth', {
    method: 'GET',
  });
};

// Logout
export const logoutAPI = async () => {
  return await apiRequest('/api/user/logout', {
    method: 'POST',
  });
};

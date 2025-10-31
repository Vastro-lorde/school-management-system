import apiClient from '@/lib/apiClient';

export async function login(credentials) {
  return apiClient.post('/api/auth/login', credentials);
}

export async function signup(payload) {
  return apiClient.post('/api/auth/signup', payload);
}

export async function forgotPassword(payload) {
  return apiClient.post('/api/auth/forgot-password', payload);
}

export async function resetPassword(payload) {
  return apiClient.post('/api/auth/reset-password', payload);
}

export default { login, signup, forgotPassword, resetPassword };

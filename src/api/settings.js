import apiClient from '@/lib/apiClient';

export function getAbout() {
  return apiClient.get('/api/settings/about');
}

export function getContact() {
  return apiClient.get('/api/settings/contact');
}

export function getHistory() {
  return apiClient.get('/api/settings/history');
}

export default { getAbout, getContact, getHistory };

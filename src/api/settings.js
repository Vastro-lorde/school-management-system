import apiClient from '@/lib/apiClient';

export function getSetting(slug) {
  return apiClient.get(`/api/settings/${slug}`);
}

export function getAllSettings() {
  return apiClient.get('/api/settings');
}

export default { getSetting, getAllSettings };

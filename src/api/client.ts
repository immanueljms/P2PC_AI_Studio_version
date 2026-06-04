import axios from 'axios';

const client = axios.create({
  // Use relative URL to support dynamic AI Studio Cloud Run preview endpoints perfectly
  baseURL: typeof window !== 'undefined' ? `${window.location.origin}` : '',
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default client;

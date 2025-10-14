import axios from 'axios';

export const api = axios.create({
  baseURL: 'http://127.0.0.1:8000',
  withCredentials: true, // cookies de sesión/CSRF
});

let CSRF_TOKEN = null;
export const setCsrfToken = (t) => { CSRF_TOKEN = t; };

api.interceptors.request.use((config) => {
  if (CSRF_TOKEN) config.headers['X-CSRFToken'] = CSRF_TOKEN;
  return config;
});


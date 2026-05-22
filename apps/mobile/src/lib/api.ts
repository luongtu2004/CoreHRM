import axios from 'axios';
import { getToken } from './storage';

const api = axios.create({
  baseURL: 'http://192.168.1.233:4000/api', // IP của máy tính để app trên điện thoại gọi được
});

api.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;

import axios from 'axios';

export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

const KUNCI_TOKEN = 'desa.accessToken';

export const simpanToken = (token: string) => localStorage.setItem(KUNCI_TOKEN, token);
export const ambilToken = () => localStorage.getItem(KUNCI_TOKEN);
export const hapusToken = () => localStorage.removeItem(KUNCI_TOKEN);

api.interceptors.request.use((config) => {
  const token = ambilToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    // TODO: panggil POST /auth/refresh sekali sebelum melempar keluar,
    // agar sesi warga tidak terputus tiap 15 menit.
    if (error.response?.status === 401) {
      hapusToken();
    }
    return Promise.reject(error);
  },
);

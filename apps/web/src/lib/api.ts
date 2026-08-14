import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

export const api = axios.create({
  baseURL: '/api',
  // Wajib: refresh token dikirim lewat cookie httpOnly, bukan di body.
  withCredentials: true,
});

/**
 * Access token disimpan di memori, bukan localStorage.
 *
 * Token di localStorage bisa dibaca skrip mana pun yang berhasil masuk ke
 * halaman. Karena refresh token sudah aman di cookie httpOnly, sesi tetap
 * pulih setelah halaman dimuat ulang tanpa perlu menaruh apa pun di storage.
 */
let accessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
  accessToken = token;
};
export const getAccessToken = () => accessToken;

api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

/** Menampung permintaan yang gagal selagi refresh berlangsung. */
let sedangRefresh: Promise<string | null> | null = null;

async function ambilTokenBaru(): Promise<string | null> {
  try {
    const res = await axios.post<{ ok: true; data: { accessToken: string } }>(
      '/api/auth/refresh',
      {},
      { withCredentials: true },
    );
    setAccessToken(res.data.data.accessToken);
    return res.data.data.accessToken;
  } catch {
    setAccessToken(null);
    return null;
  }
}

/** Dipanggil sekali saat aplikasi dimuat, untuk memulihkan sesi yang masih hidup. */
export const pulihkanSesi = () => ambilTokenBaru();

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const asal = error.config as InternalAxiosRequestConfig & { _sudahCoba?: boolean };

    // Sekali saja, dan jangan pada endpoint refresh itu sendiri —
    // kalau tidak, kegagalan refresh memicu refresh lagi tanpa henti.
    const layakDicoba =
      error.response?.status === 401 &&
      asal &&
      !asal._sudahCoba &&
      !asal.url?.includes('/auth/refresh') &&
      !asal.url?.includes('/auth/login');

    if (!layakDicoba) return Promise.reject(error);

    asal._sudahCoba = true;
    sedangRefresh ??= ambilTokenBaru().finally(() => {
      sedangRefresh = null;
    });

    const token = await sedangRefresh;
    if (!token) return Promise.reject(error);

    asal.headers.Authorization = `Bearer ${token}`;
    return api(asal);
  },
);

/**
 * Mengunduh berkas dari endpoint yang butuh login.
 *
 * Tautan <a href> biasa tidak bisa dipakai: browser tidak menyertakan header
 * Authorization pada navigasi biasa, jadi permintaannya akan ditolak 401.
 * Berkasnya diambil lewat axios (yang menyisipkan token), lalu diserahkan ke
 * browser sebagai object URL.
 */
export async function unduhBerkas(url: string, namaBerkas: string): Promise<void> {
  const res = await api.get(url, { responseType: 'blob' });
  const objectUrl = URL.createObjectURL(res.data as Blob);

  const tautan = document.createElement('a');
  tautan.href = objectUrl;
  tautan.download = namaBerkas;
  document.body.appendChild(tautan);
  tautan.click();
  tautan.remove();

  // Object URL tidak boleh dicabut tepat setelah click(): pada Firefox dan
  // Safari unduhan belum sempat mulai, dan berkasnya batal tersimpan tanpa
  // pesan apa pun. Beri jeda sebelum melepas memorinya.
  setTimeout(() => URL.revokeObjectURL(objectUrl), 10_000);
}

/** Mengambil pesan yang layak ditampilkan dari error API. */
export function pesanError(err: unknown, bawaan = 'Terjadi kesalahan. Coba lagi.'): string {
  const e = err as AxiosError<{ error?: { message?: string } }>;
  return e?.response?.data?.error?.message ?? bawaan;
}

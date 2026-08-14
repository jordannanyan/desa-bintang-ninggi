import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Peran } from '@desa/shared';
import { api, pulihkanSesi, setAccessToken } from './api';

interface Pengguna {
  id: string;
  peran: Peran;
  nama: string | null;
  username: string | null;
}

interface KonteksAuth {
  pengguna: Pengguna | null;
  memuat: boolean;
  loginWarga: (nik: string, pin: string) => Promise<Pengguna>;
  loginPerangkat: (username: string, password: string) => Promise<Pengguna>;
  logout: () => Promise<void>;
}

const Konteks = createContext<KonteksAuth | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [pengguna, setPengguna] = useState<Pengguna | null>(null);
  const [memuat, setMemuat] = useState(true);

  // Access token hanya ada di memori, jadi setelah halaman dimuat ulang sesi
  // dipulihkan dari cookie refresh — bukan dari localStorage.
  useEffect(() => {
    (async () => {
      const token = await pulihkanSesi();
      if (token) {
        try {
          const res = await api.get('/auth/saya');
          setPengguna(res.data.data);
        } catch {
          setAccessToken(null);
        }
      }
      setMemuat(false);
    })();
  }, []);

  async function masuk(jalur: 'login' | 'login-perangkat', body: object): Promise<Pengguna> {
    const res = await api.post(`/auth/${jalur}`, body);
    setAccessToken(res.data.data.accessToken);
    const saya = await api.get('/auth/saya');
    setPengguna(saya.data.data);
    return saya.data.data;
  }

  const nilai: KonteksAuth = {
    pengguna,
    memuat,
    loginWarga: (nik, pin) => masuk('login', { nik, pin }),
    loginPerangkat: (username, password) => masuk('login-perangkat', { username, password }),
    logout: async () => {
      try {
        await api.post('/auth/logout');
      } finally {
        setAccessToken(null);
        setPengguna(null);
      }
    },
  };

  return <Konteks.Provider value={nilai}>{children}</Konteks.Provider>;
}

export function useAuth(): KonteksAuth {
  const konteks = useContext(Konteks);
  if (!konteks) throw new Error('useAuth harus dipakai di dalam <AuthProvider>');
  return konteks;
}

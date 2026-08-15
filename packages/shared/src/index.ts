export * from './constants/sections.js';
export * from './constants/surat.js';
export * from './constants/kependudukan.js';
export * from './constants/umkm.js';
export * from './schemas/penduduk.js';
export * from './schemas/umkm.js';
export * from './schemas/wilayah.js';
export * from './schemas/konten.js';
export * from './schemas/profil.js';
export * from './schemas/keuangan.js';
export * from './schemas/dokumen.js';
export * from './schemas/sektor.js';
export * from './schemas/auth.js';
export * from './schemas/surat.js';
export * from './schemas/pengaduan.js';

/** Bentuk response seragam untuk seluruh endpoint API. */
export interface ApiSuccess<T> {
  ok: true;
  data: T;
  meta?: { page: number; perPage: number; total: number };
}

export interface ApiError {
  ok: false;
  error: { code: string; message: string; fields?: Record<string, string[]> };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

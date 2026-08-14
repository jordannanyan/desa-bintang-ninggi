import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import type { Peran } from '@desa/shared';
import { env } from '../config/env.js';
import { AppError } from './error.js';

export interface PayloadToken {
  sub: string;
  peran: Peran;
  pendudukId?: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: PayloadToken;
    }
  }
}

/** Wajib login. Menolak request tanpa access token yang sah. */
export function wajibLogin(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    throw new AppError(401, 'BELUM_LOGIN', 'Anda harus login terlebih dahulu');
  }

  try {
    req.user = jwt.verify(header.slice(7), env.JWT_SECRET) as PayloadToken;
    next();
  } catch {
    throw new AppError(401, 'TOKEN_TIDAK_VALID', 'Sesi Anda telah berakhir, silakan login ulang');
  }
}

/** Membatasi endpoint pada peran tertentu. Pakai setelah `wajibLogin`. */
export function wajibPeran(...peran: Peran[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) throw new AppError(401, 'BELUM_LOGIN', 'Anda harus login terlebih dahulu');
    if (!peran.includes(req.user.peran)) {
      throw new AppError(403, 'AKSES_DITOLAK', 'Anda tidak berhak mengakses data ini');
    }
    next();
  };
}

/** Mengisi req.user bila token ada, tapi tidak menolak bila tidak ada. */
export function loginOpsional(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    try {
      req.user = jwt.verify(header.slice(7), env.JWT_SECRET) as PayloadToken;
    } catch {
      /* diabaikan — diperlakukan sebagai tamu */
    }
  }
  next();
}

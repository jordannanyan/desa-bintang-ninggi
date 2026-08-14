import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { isProd } from '../config/env.js';

/** Error yang sengaja dilempar handler dan aman ditampilkan ke pengguna. */
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public fields?: Record<string, string[]>,
  ) {
    super(message);
  }
}

export const tidakDitemukan = (req: Request, res: Response) => {
  res.status(404).json({
    ok: false,
    error: { code: 'ROUTE_NOT_FOUND', message: `Endpoint ${req.method} ${req.path} tidak ada` },
  });
};

export const penangananError = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  if (err instanceof ZodError) {
    return res.status(422).json({
      ok: false,
      error: {
        code: 'VALIDASI_GAGAL',
        message: 'Data yang dikirim tidak valid',
        fields: err.flatten().fieldErrors,
      },
    });
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      ok: false,
      error: { code: err.code, message: err.message, fields: err.fields },
    });
  }

  console.error(err);
  return res.status(500).json({
    ok: false,
    error: {
      code: 'KESALAHAN_SERVER',
      message: isProd ? 'Terjadi kesalahan pada server' : String(err),
    },
  });
};

import type { NextFunction, Request, Response } from 'express';
import type { ZodTypeAny } from 'zod';

type Sumber = 'body' | 'query' | 'params';

/**
 * Memvalidasi request dengan skema Zod dari @desa/shared —
 * skema yang sama dipakai frontend, jadi pesan errornya konsisten.
 *
 * Hasil parse `query`/`params` disimpan di `res.locals` karena kedua objek itu
 * read-only sejak Express 5. Ambil dengan `res.locals.query` di handler.
 */
export function validasi(schema: ZodTypeAny, sumber: Sumber = 'body') {
  return (req: Request, res: Response, next: NextFunction) => {
    const hasil = schema.safeParse(req[sumber]);
    if (!hasil.success) return next(hasil.error);

    if (sumber === 'body') req.body = hasil.data;
    else res.locals[sumber] = hasil.data;

    next();
  };
}

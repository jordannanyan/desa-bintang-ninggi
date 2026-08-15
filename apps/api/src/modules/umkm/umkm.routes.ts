import { Router, type NextFunction, type Request, type Response } from 'express';
import { z } from 'zod';
import {
  BATAS_UNGGAH_BUKTI_JAM,
  KATEGORI_UMKM,
  STATUS_PESANAN,
  TRANSISI_PESANAN,
  buatPesananSchema,
  produkSchema,
  ubahStatusPesananSchema,
  ulasanSchema,
  umkmSchema,
  unggahBuktiBayarSchema,
  verifikasiBayarSchema,
  type StatusPesanan,
} from '@desa/shared';
import { prisma } from '../../lib/prisma.js';
import { validasi } from '../../middleware/validate.js';
import { wajibLogin, wajibPeran } from '../../middleware/auth.js';
import { AppError } from '../../middleware/error.js';
import { kodeAcak } from '../../lib/crypto.js';

export const umkmRoutes = Router();

const async_ =
  (fn: (req: Request, res: Response) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) =>
    fn(req, res).catch(next);

const rupiah = (v: unknown) => Number(v ?? 0);

/** Memastikan pemanggil adalah pemilik toko, atau perangkat desa. */
async function pastikanPemilik(req: Request, umkmId: string) {
  const umkm = await prisma.umkm.findUnique({ where: { id: umkmId } });
  if (!umkm) throw new AppError(404, 'TIDAK_DITEMUKAN', 'UMKM tidak ditemukan');

  const bolehKelola =
    umkm.pemilikId === req.user!.sub ||
    req.user!.peran === 'PERANGKAT' ||
    req.user!.peran === 'ADMIN';

  if (!bolehKelola) throw new AppError(403, 'BUKAN_PEMILIK', 'Ini bukan UMKM Anda');
  return umkm;
}

// ─────────────────────────────────────────────
// PUBLIK
// ─────────────────────────────────────────────

const filterSchema = z.object({
  kategori: z.enum(KATEGORI_UMKM).optional(),
  q: z.string().optional(),
});

umkmRoutes.get(
  '/',
  validasi(filterSchema, 'query'),
  async_(async (_req, res) => {
    const { kategori, q } = res.locals.query;

    const daftar = await prisma.umkm.findMany({
      where: {
        aktif: true,
        ...(kategori ? { kategori } : {}),
        ...(q?.trim() ? { nama: { contains: q.trim() } } : {}),
      },
      orderBy: [{ terverifikasi: 'desc' }, { nama: 'asc' }],
      include: {
        logo: true,
        _count: { select: { produk: { where: { aktif: true } } } },
        ulasan: { select: { rating: true } },
      },
    });

    res.json({
      ok: true,
      data: daftar.map((u) => ({
        id: u.id,
        nama: u.nama,
        kategori: u.kategori,
        deskripsi: u.deskripsi,
        alamat: u.alamat,
        whatsapp: u.whatsapp,
        logoUrl: u.logo ? `/uploads/${u.logo.path}` : null,
        terverifikasi: u.terverifikasi,
        jumlahProduk: u._count.produk,
        // Rata-rata dihitung di sini agar setiap kartu tidak perlu memanggil
        // ulang, dan angkanya sama untuk semua pembaca.
        rataRating: u.ulasan.length
          ? Number((u.ulasan.reduce((t, r) => t + r.rating, 0) / u.ulasan.length).toFixed(1))
          : null,
        jumlahUlasan: u.ulasan.length,
      })),
    });
  }),
);

/** Katalog produk lintas toko — jalan masuk yang paling sering dipakai pembeli. */
umkmRoutes.get(
  '/produk',
  validasi(filterSchema, 'query'),
  async_(async (_req, res) => {
    const { kategori, q } = res.locals.query;

    const produk = await prisma.produk.findMany({
      where: {
        aktif: true,
        umkm: { aktif: true, ...(kategori ? { kategori } : {}) },
        ...(q?.trim() ? { nama: { contains: q.trim() } } : {}),
      },
      orderBy: { dibuatPada: 'desc' },
      take: 100,
      include: { foto: true, umkm: { select: { id: true, nama: true, kategori: true } } },
    });

    res.json({
      ok: true,
      data: produk.map((p) => ({
        id: p.id,
        nama: p.nama,
        deskripsi: p.deskripsi,
        harga: rupiah(p.harga),
        satuan: p.satuan,
        stok: p.stok,
        fotoUrl: p.foto ? `/uploads/${p.foto.path}` : null,
        umkm: p.umkm,
      })),
    });
  }),
);

umkmRoutes.get(
  '/:id',
  async_(async (req, res) => {
    const u = await prisma.umkm.findUnique({
      where: { id: req.params.id },
      include: {
        logo: true,
        qrisBerkas: true,
        produk: { where: { aktif: true }, include: { foto: true }, orderBy: { nama: 'asc' } },
        ulasan: {
          orderBy: { dibuatPada: 'desc' },
          take: 20,
          include: { penulis: { include: { penduduk: { select: { nama: true } } } } },
        },
      },
    });

    if (!u || !u.aktif) throw new AppError(404, 'TIDAK_DITEMUKAN', 'UMKM tidak ditemukan');

    res.json({
      ok: true,
      data: {
        id: u.id,
        nama: u.nama,
        kategori: u.kategori,
        deskripsi: u.deskripsi,
        alamat: u.alamat,
        latitude: u.latitude ? Number(u.latitude) : null,
        longitude: u.longitude ? Number(u.longitude) : null,
        whatsapp: u.whatsapp,
        logoUrl: u.logo ? `/uploads/${u.logo.path}` : null,
        terverifikasi: u.terverifikasi,
        // Gambar QRIS baru diberikan saat pembeli membuka detail pesanan,
        // bukan di sini. Menyebarkannya di halaman publik memudahkan orang
        // memasang QRIS penjual di tempat lain tanpa sepengetahuannya.
        punyaQris: Boolean(u.qrisBerkasId),
        namaBank: u.namaBank,
        produk: u.produk.map((p) => ({
          id: p.id,
          nama: p.nama,
          deskripsi: p.deskripsi,
          harga: rupiah(p.harga),
          satuan: p.satuan,
          stok: p.stok,
          fotoUrl: p.foto ? `/uploads/${p.foto.path}` : null,
        })),
        ulasan: u.ulasan.map((r) => ({
          id: r.id,
          rating: r.rating,
          komentar: r.komentar,
          penulis: r.penulis.penduduk?.nama?.split(' ')[0] ?? 'Warga',
          dibuatPada: r.dibuatPada,
        })),
      },
    });
  }),
);

// ─────────────────────────────────────────────
// PENGELOLAAN TOKO
// ─────────────────────────────────────────────

umkmRoutes.get(
  '/saya/toko',
  wajibLogin,
  async_(async (req, res) => {
    const daftar = await prisma.umkm.findMany({
      where: { pemilikId: req.user!.sub },
      include: {
        logo: true,
        qrisBerkas: true,
        _count: { select: { produk: true, pesanan: true } },
      },
    });

    res.json({
      ok: true,
      data: daftar.map((u) => ({
        ...u,
        logoUrl: u.logo ? `/uploads/${u.logo.path}` : null,
        qrisUrl: u.qrisBerkas ? `/uploads/${u.qrisBerkas.path}` : null,
        logo: undefined,
        qrisBerkas: undefined,
      })),
    });
  }),
);

umkmRoutes.post(
  '/',
  wajibLogin,
  validasi(umkmSchema),
  async_(async (req, res) => {
    const u = await prisma.umkm.create({ data: { ...req.body, pemilikId: req.user!.sub } });
    res.status(201).json({ ok: true, data: { id: u.id } });
  }),
);

umkmRoutes.put(
  '/:id',
  wajibLogin,
  validasi(umkmSchema),
  async_(async (req, res) => {
    await pastikanPemilik(req, req.params.id);
    await prisma.umkm.update({ where: { id: req.params.id }, data: req.body });
    res.json({ ok: true, data: { id: req.params.id } });
  }),
);

/** Verifikasi toko oleh perangkat desa — tanda bahwa usahanya benar ada. */
umkmRoutes.patch(
  '/:id/verifikasi',
  wajibLogin,
  wajibPeran('PERANGKAT', 'ADMIN'),
  validasi(z.object({ terverifikasi: z.boolean() })),
  async_(async (req, res) => {
    await prisma.umkm.update({
      where: { id: req.params.id },
      data: { terverifikasi: req.body.terverifikasi },
    });
    res.json({ ok: true, data: { terverifikasi: req.body.terverifikasi } });
  }),
);

umkmRoutes.post(
  '/:id/produk',
  wajibLogin,
  validasi(produkSchema),
  async_(async (req, res) => {
    await pastikanPemilik(req, req.params.id);
    const p = await prisma.produk.create({ data: { ...req.body, umkmId: req.params.id } });
    res.status(201).json({ ok: true, data: { id: p.id } });
  }),
);

umkmRoutes.put(
  '/produk/:id',
  wajibLogin,
  validasi(produkSchema),
  async_(async (req, res) => {
    const p = await prisma.produk.findUnique({ where: { id: req.params.id } });
    if (!p) throw new AppError(404, 'TIDAK_DITEMUKAN', 'Produk tidak ditemukan');
    await pastikanPemilik(req, p.umkmId);
    await prisma.produk.update({ where: { id: req.params.id }, data: req.body });
    res.json({ ok: true, data: { id: req.params.id } });
  }),
);

umkmRoutes.delete(
  '/produk/:id',
  wajibLogin,
  async_(async (req, res) => {
    const p = await prisma.produk.findUnique({ where: { id: req.params.id } });
    if (!p) throw new AppError(404, 'TIDAK_DITEMUKAN', 'Produk tidak ditemukan');
    await pastikanPemilik(req, p.umkmId);
    // Dinonaktifkan, bukan dihapus: produk masih dirujuk nota pesanan lama.
    await prisma.produk.update({ where: { id: req.params.id }, data: { aktif: false } });
    res.json({ ok: true, data: { dinonaktifkan: true } });
  }),
);

// ─────────────────────────────────────────────
// PESANAN
// ─────────────────────────────────────────────

umkmRoutes.post(
  '/pesanan',
  wajibLogin,
  validasi(buatPesananSchema),
  async_(async (req, res) => {
    const { umkmId, item, catatan, alamatKirim } = req.body;

    const produk = await prisma.produk.findMany({
      where: { id: { in: item.map((i: { produkId: string }) => i.produkId) }, aktif: true },
    });
    if (produk.length !== item.length) {
      throw new AppError(400, 'PRODUK_TIDAK_VALID', 'Ada produk yang sudah tidak tersedia');
    }
    if (produk.some((p) => p.umkmId !== umkmId)) {
      throw new AppError(400, 'BEDA_TOKO', 'Semua produk dalam satu pesanan harus dari toko yang sama');
    }

    // Harga disalin ke nota, bukan dirujuk. Harga di katalog boleh berubah
    // kapan saja, tapi nota pesanan lama tidak boleh ikut berubah.
    const baris = item.map((i: { produkId: string; jumlah: number }) => {
      const p = produk.find((x) => x.id === i.produkId)!;
      if (p.stok > 0 && i.jumlah > p.stok) {
        throw new AppError(400, 'STOK_KURANG', `Stok ${p.nama} tinggal ${p.stok}`);
      }
      const hargaSatuan = rupiah(p.harga);
      return {
        produkId: p.id,
        namaProduk: p.nama,
        hargaSatuan,
        jumlah: i.jumlah,
        subtotal: hargaSatuan * i.jumlah,
      };
    });

    const total = baris.reduce((t: number, b: { subtotal: number }) => t + b.subtotal, 0);

    const pesanan = await prisma.pesanan.create({
      data: {
        kodePesanan: `PSN-${new Date().getFullYear()}-${kodeAcak(6)}`,
        pembeliId: req.user!.sub,
        umkmId,
        total,
        catatan,
        alamatKirim,
        status: 'MENUNGGU_PEMBAYARAN',
        kedaluwarsaPada: new Date(Date.now() + BATAS_UNGGAH_BUKTI_JAM * 3_600_000),
        item: { create: baris },
        riwayat: {
          create: { status: 'MENUNGGU_PEMBAYARAN', catatan: 'Pesanan dibuat', olehUserId: req.user!.sub },
        },
      },
    });

    res.status(201).json({ ok: true, data: { id: pesanan.id, kodePesanan: pesanan.kodePesanan, total } });
  }),
);

const bentukPesanan = (p: {
  id: string;
  kodePesanan: string;
  total: unknown;
  status: string;
  catatan: string | null;
  alasanTolak: string | null;
  kedaluwarsaPada: Date | null;
  dibuatPada: Date;
  umkm?: { id: string; nama: string; whatsapp: string } | null;
  item?: Array<{ id: string; namaProduk: string; hargaSatuan: unknown; jumlah: number; subtotal: unknown }>;
}) => ({
  id: p.id,
  kodePesanan: p.kodePesanan,
  total: rupiah(p.total),
  status: p.status,
  catatan: p.catatan,
  alasanTolak: p.alasanTolak,
  kedaluwarsaPada: p.kedaluwarsaPada,
  dibuatPada: p.dibuatPada,
  umkm: p.umkm,
  item: p.item?.map((i) => ({
    id: i.id,
    namaProduk: i.namaProduk,
    hargaSatuan: rupiah(i.hargaSatuan),
    jumlah: i.jumlah,
    subtotal: rupiah(i.subtotal),
  })),
});

umkmRoutes.get(
  '/pesanan/saya',
  wajibLogin,
  async_(async (req, res) => {
    const data = await prisma.pesanan.findMany({
      where: { pembeliId: req.user!.sub },
      orderBy: { dibuatPada: 'desc' },
      include: {
        umkm: { select: { id: true, nama: true, whatsapp: true } },
        item: true,
      },
    });
    res.json({ ok: true, data: data.map(bentukPesanan) });
  }),
);

umkmRoutes.get(
  '/pesanan/masuk',
  wajibLogin,
  async_(async (req, res) => {
    const data = await prisma.pesanan.findMany({
      where: { umkm: { pemilikId: req.user!.sub } },
      orderBy: { dibuatPada: 'desc' },
      include: {
        umkm: { select: { id: true, nama: true, whatsapp: true } },
        item: true,
        pembeli: { include: { penduduk: { select: { nama: true } } } },
        buktiBayar: { include: { berkas: true }, orderBy: { dibuatPada: 'desc' } },
      },
    });

    res.json({
      ok: true,
      data: data.map((p) => ({
        ...bentukPesanan(p),
        pembeli: p.pembeli.penduduk?.nama ?? 'Warga',
        bukti: p.buktiBayar.map((b) => ({
          id: b.id,
          url: `/uploads/${b.berkas.path}`,
          nominal: b.nominal ? rupiah(b.nominal) : null,
          tanggalTransfer: b.tanggalTransfer,
          catatan: b.catatan,
          diterima: b.diterima,
        })),
      })),
    });
  }),
);

/** Detail pesanan untuk pembeli, lengkap dengan QRIS penjual. */
umkmRoutes.get(
  '/pesanan/:id',
  wajibLogin,
  async_(async (req, res) => {
    const p = await prisma.pesanan.findUnique({
      where: { id: req.params.id },
      include: {
        umkm: { include: { qrisBerkas: true } },
        item: true,
        buktiBayar: { include: { berkas: true }, orderBy: { dibuatPada: 'desc' } },
        riwayat: { orderBy: { dibuatPada: 'asc' } },
      },
    });

    if (!p) throw new AppError(404, 'TIDAK_DITEMUKAN', 'Pesanan tidak ditemukan');
    if (p.pembeliId !== req.user!.sub && p.umkm.pemilikId !== req.user!.sub) {
      throw new AppError(403, 'AKSES_DITOLAK', 'Ini bukan pesanan Anda');
    }

    res.json({
      ok: true,
      data: {
        ...bentukPesanan({ ...p, umkm: { id: p.umkm.id, nama: p.umkm.nama, whatsapp: p.umkm.whatsapp } }),
        penjual: {
          nama: p.umkm.nama,
          whatsapp: p.umkm.whatsapp,
          qrisUrl: p.umkm.qrisBerkas ? `/uploads/${p.umkm.qrisBerkas.path}` : null,
          namaBank: p.umkm.namaBank,
          nomorRekening: p.umkm.nomorRekening,
          atasNama: p.umkm.atasNama,
        },
        bukti: p.buktiBayar.map((b) => ({
          id: b.id,
          url: `/uploads/${b.berkas.path}`,
          diterima: b.diterima,
          dibuatPada: b.dibuatPada,
        })),
        riwayat: p.riwayat,
      },
    });
  }),
);

umkmRoutes.post(
  '/pesanan/:id/bukti',
  wajibLogin,
  validasi(unggahBuktiBayarSchema),
  async_(async (req, res) => {
    const p = await prisma.pesanan.findUnique({ where: { id: req.params.id } });
    if (!p) throw new AppError(404, 'TIDAK_DITEMUKAN', 'Pesanan tidak ditemukan');
    if (p.pembeliId !== req.user!.sub) {
      throw new AppError(403, 'AKSES_DITOLAK', 'Ini bukan pesanan Anda');
    }
    if (!['MENUNGGU_PEMBAYARAN', 'DITOLAK'].includes(p.status)) {
      throw new AppError(409, 'STATUS_TIDAK_SESUAI', 'Pesanan ini tidak sedang menunggu pembayaran');
    }

    await prisma.$transaction([
      prisma.buktiBayar.create({ data: { ...req.body, pesananId: p.id } }),
      prisma.pesanan.update({
        where: { id: p.id },
        data: { status: 'MENUNGGU_VERIFIKASI', alasanTolak: null },
      }),
      prisma.riwayatPesanan.create({
        data: {
          pesananId: p.id,
          status: 'MENUNGGU_VERIFIKASI',
          catatan: 'Bukti pembayaran diunggah',
          olehUserId: req.user!.sub,
        },
      }),
    ]);

    res.json({ ok: true, data: { status: 'MENUNGGU_VERIFIKASI' } });
  }),
);

umkmRoutes.post(
  '/pesanan/:id/verifikasi',
  wajibLogin,
  validasi(verifikasiBayarSchema),
  async_(async (req, res) => {
    const p = await prisma.pesanan.findUnique({
      where: { id: req.params.id },
      include: { umkm: true, buktiBayar: { orderBy: { dibuatPada: 'desc' }, take: 1 } },
    });
    if (!p) throw new AppError(404, 'TIDAK_DITEMUKAN', 'Pesanan tidak ditemukan');
    if (p.umkm.pemilikId !== req.user!.sub) {
      throw new AppError(403, 'BUKAN_PENJUAL', 'Hanya penjual yang bisa memverifikasi pembayaran');
    }
    if (p.status !== 'MENUNGGU_VERIFIKASI') {
      throw new AppError(409, 'STATUS_TIDAK_SESUAI', 'Tidak ada bukti bayar yang menunggu diperiksa');
    }

    const status: StatusPesanan = req.body.diterima ? 'DIBAYAR' : 'DITOLAK';

    await prisma.$transaction([
      ...(p.buktiBayar[0]
        ? [
            prisma.buktiBayar.update({
              where: { id: p.buktiBayar[0].id },
              data: {
                diterima: req.body.diterima,
                diverifikasiOleh: req.user!.sub,
                diverifikasiPada: new Date(),
              },
            }),
          ]
        : []),
      prisma.pesanan.update({
        where: { id: p.id },
        data: { status, alasanTolak: req.body.diterima ? null : req.body.alasanTolak },
      }),
      prisma.riwayatPesanan.create({
        data: {
          pesananId: p.id,
          status,
          catatan: req.body.diterima ? 'Pembayaran diverifikasi penjual' : req.body.alasanTolak,
          olehUserId: req.user!.sub,
        },
      }),
    ]);

    res.json({ ok: true, data: { status } });
  }),
);

umkmRoutes.patch(
  '/pesanan/:id/status',
  wajibLogin,
  validasi(ubahStatusPesananSchema),
  async_(async (req, res) => {
    const p = await prisma.pesanan.findUnique({
      where: { id: req.params.id },
      include: { umkm: true },
    });
    if (!p) throw new AppError(404, 'TIDAK_DITEMUKAN', 'Pesanan tidak ditemukan');

    const penjual = p.umkm.pemilikId === req.user!.sub;
    const pembeli = p.pembeliId === req.user!.sub;
    if (!penjual && !pembeli) throw new AppError(403, 'AKSES_DITOLAK', 'Ini bukan pesanan Anda');

    // Perpindahan status dikunci dari daftar bersama, sehingga sisi penjual
    // dan pembeli tidak pernah punya pemahaman berbeda tentang apa yang boleh.
    const boleh = TRANSISI_PESANAN[p.status as StatusPesanan] ?? [];
    if (!boleh.includes(req.body.status)) {
      throw new AppError(
        409,
        'TRANSISI_TIDAK_SAH',
        `Pesanan berstatus ${p.status} tidak bisa langsung menjadi ${req.body.status}`,
      );
    }

    // Pembeli hanya boleh membatalkan; sisanya wewenang penjual.
    if (pembeli && !penjual && req.body.status !== 'DIBATALKAN') {
      throw new AppError(403, 'AKSES_DITOLAK', 'Anda hanya bisa membatalkan pesanan');
    }

    await prisma.$transaction([
      prisma.pesanan.update({ where: { id: p.id }, data: { status: req.body.status } }),
      prisma.riwayatPesanan.create({
        data: {
          pesananId: p.id,
          status: req.body.status,
          catatan: req.body.catatan,
          olehUserId: req.user!.sub,
        },
      }),
    ]);

    res.json({ ok: true, data: { status: req.body.status } });
  }),
);

umkmRoutes.post(
  '/:id/ulasan',
  wajibLogin,
  validasi(ulasanSchema),
  async_(async (req, res) => {
    // Hanya pembeli yang pesanannya sudah selesai yang boleh mengulas.
    // Tanpa syarat itu, kolom ulasan berubah jadi papan komentar bebas.
    const pernahBeli = await prisma.pesanan.findFirst({
      where: { umkmId: req.params.id, pembeliId: req.user!.sub, status: 'SELESAI' },
    });
    if (!pernahBeli) {
      throw new AppError(
        403,
        'BELUM_PERNAH_BELI',
        'Ulasan hanya bisa ditulis setelah pesanan Anda di toko ini selesai',
      );
    }

    const ulasan = await prisma.ulasan.create({
      data: { ...req.body, umkmId: req.params.id, penulisId: req.user!.sub },
    });
    res.status(201).json({ ok: true, data: { id: ulasan.id } });
  }),
);

/** Membatalkan pesanan yang bukti bayarnya tidak kunjung diunggah. */
umkmRoutes.post(
  '/pesanan/bersihkan-kedaluwarsa',
  wajibLogin,
  wajibPeran('ADMIN'),
  async_(async (_req, res) => {
    const hasil = await prisma.pesanan.updateMany({
      where: { status: 'MENUNGGU_PEMBAYARAN', kedaluwarsaPada: { lt: new Date() } },
      data: { status: 'DIBATALKAN' },
    });
    res.json({ ok: true, data: { dibatalkan: hasil.count } });
  }),
);

export const STATUS_PESANAN_TERSEDIA = STATUS_PESANAN;

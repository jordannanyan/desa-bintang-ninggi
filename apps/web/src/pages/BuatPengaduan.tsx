import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { KATEGORI_PENGADUAN } from '@desa/shared';
import { api, pesanError } from '../lib/api';
import { unggahBerkas } from '../lib/unggah';
import { LABEL_KATEGORI } from './Pengaduan';

const gayaInput =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-desa-500 focus:outline-none focus:ring-1 focus:ring-desa-500';

export function BuatPengaduan() {
  const navigate = useNavigate();
  const [kategori, setKategori] = useState<string>('JALAN_RUSAK');
  const [judul, setJudul] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [lokasiTeks, setLokasiTeks] = useState('');
  const [anonim, setAnonim] = useState(false);
  const [foto, setFoto] = useState<File[]>([]);
  const [koordinat, setKoordinat] = useState<{ lat: number; lon: number } | null>(null);
  const [statusLokasi, setStatusLokasi] = useState<string | null>(null);
  const [galat, setGalat] = useState<string | null>(null);
  const [sibuk, setSibuk] = useState(false);

  const ambilLokasi = () => {
    if (!navigator.geolocation) {
      setStatusLokasi('Perangkat ini tidak mendukung lokasi otomatis.');
      return;
    }
    setStatusLokasi('Mencari lokasi…');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setKoordinat({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setStatusLokasi('Lokasi tersimpan.');
      },
      // Izin lokasi sering ditolak, dan itu wajar. Laporan tetap bisa dikirim
      // dengan lokasi yang diketik manual, jadi kegagalan di sini bukan akhir.
      () => setStatusLokasi('Lokasi tidak bisa diambil. Tulis saja lokasinya di bawah.'),
      { timeout: 10_000 },
    );
  };

  const kirim = async (e: React.FormEvent) => {
    e.preventDefault();
    setGalat(null);
    setSibuk(true);

    try {
      const fotoIds = foto.length
        ? (await unggahBerkas(foto, 'pengaduan')).map((b) => b.id)
        : [];

      const res = await api.post('/pengaduan', {
        kategori,
        judul,
        deskripsi,
        lokasiTeks: lokasiTeks || undefined,
        latitude: koordinat?.lat,
        longitude: koordinat?.lon,
        fotoIds,
        anonim,
      });

      navigate(`/pengaduan/lacak/${res.data.data.kodeLacak}`, {
        state: { baru: true },
      });
    } catch (err) {
      setGalat(
        err instanceof Error && !('response' in err)
          ? err.message
          : pesanError(err, 'Laporan gagal dikirim.'),
      );
    } finally {
      setSibuk(false);
    }
  };

  return (
    <div className="kontainer max-w-2xl py-10">
      <Link to="/pengaduan" className="text-sm text-desa-600 hover:underline">
        ← Semua pengaduan
      </Link>

      <h1 className="judul-halaman mt-2">Sampaikan Laporan</h1>
      <p className="mt-1 text-sm text-slate-600">
        Laporan Anda tampil terbuka agar warga lain bisa ikut memantau tindak lanjutnya.
      </p>

      <form onSubmit={kirim} className="mt-6 space-y-5">
        {galat && (
          <div
            role="alert"
            className="rounded-lg border-l-4 border-red-500 bg-red-50 px-3 py-2 text-sm text-red-800"
          >
            {galat}
          </div>
        )}

        <div className="kartu space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Kategori</label>
            <div className="flex flex-wrap gap-2">
              {KATEGORI_PENGADUAN.map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setKategori(k)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                    kategori === k
                      ? 'bg-desa-600 text-white'
                      : 'border border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {LABEL_KATEGORI[k] ?? k}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="judul" className="mb-1 block text-sm font-medium text-slate-700">
              Judul laporan <span className="text-red-500">*</span>
            </label>
            <input
              id="judul"
              required
              minLength={5}
              maxLength={150}
              value={judul}
              onChange={(e) => setJudul(e.target.value)}
              placeholder="Contoh: Jalan berlubang di depan SD"
              className={gayaInput}
            />
          </div>

          <div>
            <label htmlFor="deskripsi" className="mb-1 block text-sm font-medium text-slate-700">
              Uraian <span className="text-red-500">*</span>
            </label>
            <textarea
              id="deskripsi"
              required
              minLength={10}
              maxLength={2000}
              rows={5}
              value={deskripsi}
              onChange={(e) => setDeskripsi(e.target.value)}
              placeholder="Jelaskan masalahnya sejelas mungkin: sejak kapan, seberapa parah, siapa yang terdampak."
              className={gayaInput}
            />
          </div>
        </div>

        <div className="kartu space-y-4">
          <h2 className="text-sm font-semibold text-slate-900">Lokasi</h2>

          <div>
            <label htmlFor="lokasi" className="mb-1 block text-sm font-medium text-slate-700">
              Nama lokasi
            </label>
            <input
              id="lokasi"
              maxLength={255}
              value={lokasiTeks}
              onChange={(e) => setLokasiTeks(e.target.value)}
              placeholder="Contoh: Jl. Poros Desa RT 002, dekat masjid"
              className={gayaInput}
            />
          </div>

          <div>
            <button type="button" onClick={ambilLokasi} className="tombol-sekunder text-xs">
              Ambil titik lokasi saya
            </button>
            {statusLokasi && <p className="mt-1.5 text-xs text-slate-500">{statusLokasi}</p>}
            {koordinat && (
              <p className="mt-1 text-xs text-desa-700">
                Titik tersimpan: {koordinat.lat.toFixed(5)}, {koordinat.lon.toFixed(5)}
              </p>
            )}
            <p className="mt-1 text-xs text-slate-400">
              Titik lokasi hanya dilihat perangkat desa, tidak ditampilkan ke publik.
            </p>
          </div>
        </div>

        <div className="kartu space-y-3">
          <h2 className="text-sm font-semibold text-slate-900">Foto</h2>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => setFoto([...(e.target.files ?? [])].slice(0, 5))}
            className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-desa-600 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-desa-700"
          />
          <p className="text-xs text-slate-400">
            Maksimal 5 foto, masing-masing 5 MB. Foto dikecilkan otomatis, dan data lokasi
            yang menempel di dalamnya dibuang.
          </p>
          {foto.length > 0 && (
            <ul className="text-xs text-slate-600">
              {foto.map((f) => (
                <li key={f.name}>
                  {f.name} — {(f.size / 1024 / 1024).toFixed(1)} MB
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="kartu">
          <label className="flex items-start gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={anonim}
              onChange={(e) => setAnonim(e.target.checked)}
              className="mt-0.5 rounded"
            />
            <span>
              Tampilkan sebagai anonim
              {/* Dikatakan apa adanya. Warga berhak tahu bahwa "anonim" di sini
                  berarti anonim bagi sesama warga, bukan bagi kantor desa. */}
              <span className="block text-xs text-slate-500">
                Nama Anda disembunyikan dari warga lain, tetapi tetap terlihat perangkat desa
                agar laporan bisa ditindaklanjuti dan tidak disalahgunakan.
              </span>
            </span>
          </label>
        </div>

        <button type="submit" disabled={sibuk} className="tombol-utama">
          {sibuk ? 'Mengirim…' : 'Kirim Laporan'}
        </button>
      </form>
    </div>
  );
}

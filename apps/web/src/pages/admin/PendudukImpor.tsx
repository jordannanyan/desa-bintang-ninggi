import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { KOLOM_IMPOR_PENDUDUK, type HasilImporPenduduk } from '@desa/shared';
import { api, pesanError, unduhBerkas } from '../../lib/api';

export function PendudukImpor() {
  const queryClient = useQueryClient();
  const [berkas, setBerkas] = useState<File | null>(null);
  const [perbaruiYangAda, setPerbaruiYangAda] = useState(false);
  const [memproses, setMemproses] = useState(false);
  const [hasil, setHasil] = useState<HasilImporPenduduk | null>(null);
  const [galat, setGalat] = useState<string | null>(null);

  const kirim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!berkas) return;

    setMemproses(true);
    setGalat(null);
    setHasil(null);

    const muatan = new FormData();
    muatan.append('berkas', berkas);
    muatan.append('perbaruiYangAda', String(perbaruiYangAda));

    try {
      const res = await api.post('/kependudukan/impor', muatan);
      setHasil(res.data.data);
      await queryClient.invalidateQueries({ queryKey: ['penduduk'] });
      await queryClient.invalidateQueries({ queryKey: ['statistik-kependudukan'] });
    } catch (err) {
      setGalat(pesanError(err, 'Impor gagal.'));
    } finally {
      setMemproses(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <h1 className="mb-1 text-xl font-bold text-slate-900">Impor Data Penduduk</h1>
      <p className="mb-5 text-sm text-slate-500">
        Memasukkan banyak data sekaligus dari berkas CSV.
      </p>

      <section className="kartu mb-4">
        <h2 className="mb-2 text-sm font-semibold text-slate-900">Susunan kolom</h2>
        <p className="mb-3 text-xs text-slate-600">
          Baris pertama berkas harus berisi judul kolom berikut. Kolom{' '}
          <b>nik, no_kk, nama, jenis_kelamin, tanggal_lahir, alamat, rt, rw</b> wajib ada;
          sisanya boleh dikosongkan.
        </p>
        <div className="overflow-x-auto rounded-lg bg-slate-50 p-3">
          <code className="whitespace-nowrap text-xs text-slate-700">
            {KOLOM_IMPOR_PENDUDUK.join(',')}
          </code>
        </div>
        <ul className="mt-3 space-y-1 text-xs text-slate-500">
          <li>• Jenis kelamin: isi L atau P</li>
          <li>• Tanggal lahir: 1990-05-17 atau 17/05/1990</li>
          <li>• Sel kosong boleh ditulis -, N/A, atau dibiarkan kosong</li>
        </ul>
        <button
          type="button"
          onClick={() => unduhBerkas('/kependudukan/contoh-csv', 'contoh-data-penduduk.csv')}
          className="tombol-sekunder mt-4 text-xs"
        >
          Unduh berkas contoh
        </button>
      </section>

      <form onSubmit={kirim} className="kartu mb-4 space-y-4">
        <div>
          <label
            htmlFor="berkas"
            className="mb-1 block text-sm font-medium text-slate-700"
          >
            Berkas CSV
          </label>
          <input
            id="berkas"
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => setBerkas(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-desa-600 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-desa-700"
          />
        </div>

        <label className="flex items-start gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={perbaruiYangAda}
            onChange={(e) => setPerbaruiYangAda(e.target.checked)}
            className="mt-0.5 rounded"
          />
          <span>
            Perbarui data yang NIK-nya sudah terdaftar
            <span className="block text-xs text-slate-500">
              Bila tidak dicentang, baris dengan NIK yang sudah ada akan dilewati.
            </span>
          </span>
        </label>

        <button type="submit" disabled={!berkas || memproses} className="tombol-utama">
          {memproses ? 'Memproses…' : 'Mulai Impor'}
        </button>
      </form>

      {galat && (
        <div className="mb-4 rounded-lg border-l-4 border-red-500 bg-red-50 px-4 py-3 text-sm text-red-800">
          {galat}
        </div>
      )}

      {hasil && (
        <section className="kartu">
          <h2 className="mb-3 text-sm font-semibold text-slate-900">Hasil Impor</h2>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'Total baris', nilai: hasil.totalBaris, warna: 'text-slate-900' },
              { label: 'Berhasil', nilai: hasil.berhasil, warna: 'text-desa-700' },
              { label: 'Dilewati', nilai: hasil.dilewati, warna: 'text-amber-700' },
              { label: 'Gagal', nilai: hasil.gagal.length, warna: 'text-red-700' },
            ].map((s) => (
              <div key={s.label} className="rounded-lg bg-slate-50 p-3 text-center">
                <p className={`text-xl font-semibold ${s.warna}`}>{s.nilai}</p>
                <p className="text-xs text-slate-500">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Baris yang gagal tidak membatalkan seluruh impor — yang valid tetap
              tersimpan, dan yang gagal dilaporkan dengan nomor barisnya supaya
              bisa diperbaiki lalu diimpor ulang. */}
          {hasil.gagal.length > 0 && (
            <div className="mt-4">
              <h3 className="mb-2 text-sm font-medium text-slate-800">
                Baris yang perlu diperbaiki
              </h3>
              <div className="max-h-72 overflow-y-auto rounded-lg border border-slate-200">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-slate-50 text-left text-xs text-slate-500">
                    <tr>
                      <th className="px-3 py-2 font-medium">Baris</th>
                      <th className="px-3 py-2 font-medium">Nama</th>
                      <th className="px-3 py-2 font-medium">Masalah</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hasil.gagal.map((g) => (
                      <tr key={g.baris} className="border-t border-slate-100">
                        <td className="px-3 py-2 tabular-nums text-slate-500">{g.baris}</td>
                        <td className="px-3 py-2 text-slate-700">{g.nama ?? '—'}</td>
                        <td className="px-3 py-2 text-red-700">{g.pesan}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <Link to="/admin/penduduk" className="tombol-sekunder mt-4 text-xs">
            Lihat data penduduk
          </Link>
        </section>
      )}
    </div>
  );
}

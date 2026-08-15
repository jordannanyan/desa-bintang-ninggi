import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { LABEL_FASILITAS, LABEL_KATEGORI_UMKM, LABEL_STATUS_PROYEK } from '@desa/shared';
import { api } from '../lib/api';
import { KATEGORI, HUE_TUNGGAL } from '../components/viz/tokens';

interface Titik {
  id: string;
  lapisan: 'FASILITAS' | 'PROYEK' | 'UMKM';
  jenis: string;
  nama: string;
  keterangan: string | null;
  latitude: number;
  longitude: number;
  tautan: string | null;
}

const WARNA_LAPISAN: Record<Titik['lapisan'], string> = {
  FASILITAS: HUE_TUNGGAL,
  PROYEK: KATEGORI[1],
  UMKM: KATEGORI[0],
};

const LABEL_LAPISAN: Record<Titik['lapisan'], string> = {
  FASILITAS: 'Fasilitas desa',
  PROYEK: 'Proyek pembangunan',
  UMKM: 'UMKM',
};

function labelJenis(t: Titik) {
  if (t.lapisan === 'FASILITAS') {
    return LABEL_FASILITAS[t.jenis as keyof typeof LABEL_FASILITAS] ?? t.jenis;
  }
  if (t.lapisan === 'UMKM') {
    return LABEL_KATEGORI_UMKM[t.jenis as keyof typeof LABEL_KATEGORI_UMKM] ?? t.jenis;
  }
  return LABEL_STATUS_PROYEK[t.jenis as keyof typeof LABEL_STATUS_PROYEK] ?? t.jenis;
}

/**
 * Peta desa memakai Leaflet dan ubin OpenStreetMap.
 *
 * Dipilih karena gratis dan tanpa kunci API. Google Maps menuntut kartu kredit
 * dan menagih per pemuatan peta — beban berulang yang tidak masuk akal
 * ditanggung anggaran desa untuk menampilkan belasan titik.
 *
 * Leaflet dimuat saat halaman ini dibuka, bukan ikut dalam bundel utama,
 * supaya warga yang hanya mengurus surat tidak perlu mengunduh pustaka peta.
 */
export function Peta() {
  const wadah = useRef<HTMLDivElement>(null);
  const peta = useRef<import('leaflet').Map | null>(null);
  const lapisanRef = useRef<Record<string, import('leaflet').LayerGroup>>({});
  const [aktif, setAktif] = useState<Record<string, boolean>>({
    FASILITAS: true,
    PROYEK: true,
    UMKM: true,
  });
  const [siap, setSiap] = useState(false);

  const { data } = useQuery({
    queryKey: ['peta'],
    queryFn: async () =>
      (await api.get('/peta')).data.data as {
        pusat: { latitude: number; longitude: number };
        titik: Titik[];
      },
  });

  useEffect(() => {
    if (!data || !wadah.current || peta.current) return;

    let batal = false;

    (async () => {
      const L = await import('leaflet');
      if (batal || !wadah.current) return;

      const m = L.map(wadah.current).setView(
        [data.pusat.latitude, data.pusat.longitude],
        data.titik.length ? 14 : 12,
      );

      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; kontributor OpenStreetMap',
      }).addTo(m);

      for (const nama of ['FASILITAS', 'PROYEK', 'UMKM'] as const) {
        const grup = L.layerGroup().addTo(m);
        lapisanRef.current[nama] = grup;

        for (const t of data.titik.filter((x) => x.lapisan === nama)) {
          // Lingkaran berwarna, bukan pin gambar: tidak perlu berkas ikon
          // tambahan dan tetap terbaca di layar ponsel kecil.
          const penanda = L.circleMarker([t.latitude, t.longitude], {
            radius: 8,
            color: '#ffffff',
            weight: 2,
            fillColor: WARNA_LAPISAN[nama],
            fillOpacity: 1,
          });

          penanda.bindPopup(
            `<strong>${t.nama}</strong><br/><span style="color:#64748b">${labelJenis(t)}</span>` +
              (t.keterangan ? `<br/>${t.keterangan}` : '') +
              (t.tautan ? `<br/><a href="${t.tautan}">Lihat detail</a>` : ''),
          );
          penanda.addTo(grup);
        }
      }

      if (data.titik.length) {
        const batas = L.latLngBounds(data.titik.map((t) => [t.latitude, t.longitude]));
        m.fitBounds(batas, { padding: [40, 40], maxZoom: 16 });
      }

      peta.current = m;
      setSiap(true);
    })();

    return () => {
      batal = true;
    };
  }, [data]);

  const ubahLapisan = (nama: string) => {
    setAktif((a) => {
      const baru = { ...a, [nama]: !a[nama] };
      const grup = lapisanRef.current[nama];
      if (grup && peta.current) {
        if (baru[nama]) grup.addTo(peta.current);
        else grup.remove();
      }
      return baru;
    });
  };

  const hitung = (nama: string) => data?.titik.filter((t) => t.lapisan === nama).length ?? 0;

  return (
    <div className="kontainer py-10">
      <h1 className="judul-halaman">Peta Desa Interaktif</h1>
      <p className="mt-1 max-w-2xl text-sm text-slate-600">
        Fasilitas desa, proyek pembangunan, dan UMKM dalam satu peta. Titik pengaduan
        sengaja tidak ditampilkan — koordinatnya menunjuk ke rumah pelapor.
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        {(['FASILITAS', 'PROYEK', 'UMKM'] as const).map((nama) => (
          <button
            key={nama}
            type="button"
            onClick={() => ubahLapisan(nama)}
            aria-pressed={aktif[nama]}
            className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
              aktif[nama]
                ? 'border-slate-300 bg-white text-slate-800'
                : 'border-slate-200 bg-slate-50 text-slate-400'
            }`}
          >
            <span
              aria-hidden
              className="h-2.5 w-2.5 rounded-full"
              style={{ background: aktif[nama] ? WARNA_LAPISAN[nama] : '#cbd5e1' }}
            />
            {LABEL_LAPISAN[nama]} ({hitung(nama)})
          </button>
        ))}
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
        <div ref={wadah} className="h-[28rem] w-full bg-slate-100" />
      </div>

      {siap && data?.titik.length === 0 && (
        <div className="mt-4 rounded-lg border-l-4 border-amber-400 bg-amber-50 p-4 text-sm text-amber-900">
          Belum ada titik yang punya koordinat. Isi koordinat pada fasilitas, proyek
          pembangunan, atau UMKM agar muncul di peta ini.
        </div>
      )}

      <p className="mt-4 text-xs text-slate-400">
        Peta memakai OpenStreetMap — gratis dan tanpa biaya per pemuatan.
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────
// GALERI
// ─────────────────────────────────────────────

interface Media {
  id: string;
  judul: string;
  jenis: 'FOTO' | 'VIDEO' | 'DRONE';
  url: string | null;
  urlEksternal: string | null;
  keterangan: string | null;
  dibuatPada: string;
}

export function Galeri() {
  const [jenis, setJenis] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['galeri', jenis],
    queryFn: async () =>
      (await api.get('/galeri', { params: { jenis: jenis || undefined } })).data.data as Media[],
  });

  return (
    <div className="kontainer py-10">
      <h1 className="judul-halaman">Galeri</h1>
      <p className="mt-1 text-sm text-slate-600">
        Dokumentasi kegiatan Desa Bintang Ninggi I.
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        {['', 'FOTO', 'VIDEO', 'DRONE'].map((j) => (
          <button
            key={j || 'semua'}
            type="button"
            onClick={() => setJenis(j)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition ${
              jenis === j
                ? 'bg-desa-600 text-white'
                : 'border border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            {j ? j.toLowerCase() : 'Semua'}
          </button>
        ))}
      </div>

      {isLoading && <p className="mt-6 text-sm text-slate-500">Memuat…</p>}
      {data?.length === 0 && (
        <div className="mt-6 rounded-lg border-l-4 border-amber-400 bg-amber-50 p-4 text-sm text-amber-900">
          Belum ada dokumentasi yang diunggah.
        </div>
      )}

      <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data?.map((m) => (
          <li key={m.id} className="kartu">
            {m.url ? (
              <a href={m.url} target="_blank" rel="noreferrer">
                <img
                  src={m.url}
                  alt={m.judul}
                  loading="lazy"
                  className="aspect-video w-full rounded-lg object-cover"
                />
              </a>
            ) : m.urlEksternal ? (
              <a
                href={m.urlEksternal}
                target="_blank"
                rel="noreferrer"
                className="grid aspect-video w-full place-items-center rounded-lg bg-slate-100 text-sm text-desa-700"
              >
                Buka video
              </a>
            ) : null}
            <h2 className="mt-2 font-medium text-slate-900">{m.judul}</h2>
            <p className="text-xs text-slate-400">
              {m.jenis.toLowerCase()} ·{' '}
              {new Date(m.dibuatPada).toLocaleDateString('id-ID', { dateStyle: 'long' })}
            </p>
            {m.keterangan && <p className="mt-1 text-sm text-slate-600">{m.keterangan}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}

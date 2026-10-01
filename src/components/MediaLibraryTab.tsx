import React, { useState } from 'react';
import {
  Sparkles,
  Plus,
  Search,
  Filter,
  Play,
  FileText,
  Trash2,
  Download,
  Printer,
  Copy,
  Check,
  Eye,
  Sliders,
  Calendar,
  Layers,
  Volume2,
  Video,
  Gamepad2,
  Tag,
  BookOpen,
} from 'lucide-react';
import { MediaRecord, MediaLibraryStatus, KategoriMediaUtama, TeacherProfile } from '../types';
import { printElementDirectly, downloadElementAsPDF } from '../utils/pdfExport';

interface MediaLibraryTabProps {
  mediaList: MediaRecord[];
  onOpenCreateWizard: () => void;
  onOpenLiveStudio: (media: MediaRecord) => void;
  onDeleteMedia: (id: string) => void;
  onShowToast: (type: 'success' | 'error' | 'info', msg: string) => void;
  profile: TeacherProfile;
}

export const MediaLibraryTab: React.FC<MediaLibraryTabProps> = ({
  mediaList,
  onOpenCreateWizard,
  onOpenLiveStudio,
  onDeleteMedia,
  onShowToast,
  profile,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedDetailMedia, setSelectedDetailMedia] = useState<MediaRecord | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const filteredMedia = mediaList.filter((m) => {
    const matchesSearch =
      m.judul.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.materiPokok.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.mataPelajaran.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.jenisMedia.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.rppJudul.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = filterCategory === 'all' || m.kategori === filterCategory;
    const matchesStatus = filterStatus === 'all' || m.status === filterStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getStatusBadge = (status: MediaLibraryStatus) => {
    switch (status) {
      case 'Final':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Diproduksi':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'Disetujui':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Revisi':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Rancangan':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getCategoryIcon = (cat: KategoriMediaUtama) => {
    switch (cat) {
      case 'Visual':
        return <Layers className="w-3.5 h-3.5 text-blue-600" />;
      case 'Audio':
        return <Volume2 className="w-3.5 h-3.5 text-emerald-600" />;
      case 'Audiovisual':
        return <Video className="w-3.5 h-3.5 text-purple-600" />;
      case 'Interaktif':
        return <Gamepad2 className="w-3.5 h-3.5 text-amber-600" />;
    }
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Top Banner / Actions */}
      <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-indigo-800 rounded-2xl text-white p-5 sm:p-6 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full border border-white/20">
              Media Pembelajaran Digital
            </span>
            <span className="text-xs text-indigo-200">Total: {mediaList.length} Media</span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold">Library Media Pembelajaran Guru</h2>
          <p className="text-xs text-indigo-100 max-w-xl leading-relaxed">
            Kumpulan media visual, audio, audiovisual, dan interaktif yang telah dianalisis serta dirancang selaras dengan Tujuan Pembelajaran dan Pembelajaran Mendalam.
          </p>
        </div>

        <button
          onClick={onOpenCreateWizard}
          className="px-5 py-3 bg-amber-400 hover:bg-amber-300 text-slate-900 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 shadow-lg transition-transform hover:scale-105 shrink-0"
        >
          <Sparkles className="w-4 h-4 text-slate-900" />
          <span>+ BUAT MEDIA DARI MATERI</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2 flex-1 min-w-[240px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari media, materi pokok, atau mata pelajaran..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="py-1.5 px-3 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Semua Kategori</option>
            <option value="Visual">Visual</option>
            <option value="Audio">Audio</option>
            <option value="Audiovisual">Audio Visual</option>
            <option value="Interaktif">Interaktif</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="py-1.5 px-3 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Semua Status</option>
            <option value="Final">Final</option>
            <option value="Diproduksi">Diproduksi</option>
            <option value="Revisi">Revisi</option>
            <option value="Disetujui">Disetujui</option>
            <option value="Rancangan">Rancangan</option>
            <option value="Draft">Draft</option>
          </select>
        </div>
      </div>

      {/* Media Cards Grid */}
      {filteredMedia.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-3">
          <Layers className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-700">Belum ada media pembelajaran ditemukan</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Gunakan wizard AI untuk menganalisis materi dan membuat rancangan media yang sesuai dengan kurikulum Anda.
          </p>
          <button
            onClick={onOpenCreateWizard}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold inline-flex items-center space-x-1.5 shadow-2xs"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Media Pertama Sekarang</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMedia.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between"
            >
              <div>
                {/* Header Tags */}
                <div className="flex items-center justify-between gap-1 mb-2">
                  <div className="flex items-center space-x-1.5">
                    <span className="p-1 rounded-md bg-slate-50 border border-slate-100">
                      {getCategoryIcon(item.kategori)}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                      {item.jenisMedia}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span
                      className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${getStatusBadge(
                        item.status
                      )}`}
                    >
                      {item.status}
                    </span>
                    <span className="text-[9px] font-mono text-slate-500 bg-slate-50 border border-slate-200 px-1 rounded">
                      {item.versi}
                    </span>
                  </div>
                </div>

                <h3 className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-2 leading-snug mb-1">
                  {item.judul}
                </h3>

                <p className="text-[11px] text-slate-500 line-clamp-2 mb-2.5 leading-relaxed">
                  {item.tujuanPembelajaran}
                </p>

                {/* Metadata details */}
                <div className="space-y-1 text-[10px] text-slate-500 bg-slate-50/70 p-2.5 rounded-lg border border-slate-100 mb-3">
                  <div className="flex items-center justify-between">
                    <span>Materi:</span>
                    <strong className="text-slate-700 font-medium truncate max-w-[150px]">{item.materiPokok}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Modul Ajar:</span>
                    <span className="text-indigo-600 font-medium truncate max-w-[150px]">{item.rppJudul}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Kelas & Tanggal:</span>
                    <span className="text-slate-600">{item.kelasFase} • {item.tanggal}</span>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => setSelectedDetailMedia(item)}
                    className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-slate-50 rounded"
                    title="Lihat Detail Naskah & Rancangan"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => {
                      if (item.produkMedia?.markdownLengkap) {
                        navigator.clipboard.writeText(item.produkMedia.markdownLengkap);
                        onShowToast('success', 'Naskah media disalin ke clipboard!');
                      }
                    }}
                    className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-slate-50 rounded"
                    title="Salin Naskah"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => setDeleteConfirmId(item.id)}
                    className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-slate-50 rounded"
                    title="Hapus Media"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  onClick={() => onOpenLiveStudio(item)}
                  className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-lg text-xs flex items-center space-x-1 shadow-2xs transition-colors"
                >
                  <Play className="w-3 h-3 text-indigo-600 fill-indigo-600" />
                  <span>Mainkan di Studio</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-5 max-w-sm w-full space-y-3 shadow-xl">
            <h4 className="text-sm font-bold text-slate-900">Hapus Media Pembelajaran?</h4>
            <p className="text-xs text-slate-600">
              Media ini akan dihapus dari Library Media. Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  onDeleteMedia(deleteConfirmId);
                  setDeleteConfirmId(null);
                  onShowToast('info', 'Media pembelajaran telah dihapus.');
                }}
                className="px-3 py-1.5 text-xs bg-rose-600 text-white font-semibold rounded-lg hover:bg-rose-700"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedDetailMedia && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                  {selectedDetailMedia.kategori} • {selectedDetailMedia.jenisMedia}
                </span>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 mt-1">
                  {selectedDetailMedia.judul}
                </h3>
              </div>
              <button
                onClick={() => setSelectedDetailMedia(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                <p><strong>Mata Pelajaran:</strong> {selectedDetailMedia.mataPelajaran} ({selectedDetailMedia.kelasFase})</p>
                <p><strong>Tujuan Pembelajaran:</strong> {selectedDetailMedia.tujuanPembelajaran}</p>
                <p><strong>Modul Ajar Terkait:</strong> {selectedDetailMedia.rppJudul}</p>
              </div>

              {selectedDetailMedia.rancangan && (
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">Rancangan Media:</h4>
                  <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-2">
                    <p><strong>Struktur Media:</strong> {selectedDetailMedia.rancangan.strukturMedia}</p>
                    <p><strong>Urutan Isi:</strong></p>
                    <ul className="list-disc list-inside pl-2 space-y-0.5 text-slate-600">
                      {selectedDetailMedia.rancangan.urutanIsi.map((u, i) => (
                        <li key={i}>{u}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {selectedDetailMedia.produkMedia?.markdownLengkap && (
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">Naskah & Konten Produksi:</h4>
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg whitespace-pre-wrap font-mono text-[11px] max-h-96 overflow-y-auto text-slate-700">
                    {selectedDetailMedia.produkMedia.markdownLengkap}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-200 flex justify-between">
              <button
                onClick={() => {
                  setSelectedDetailMedia(null);
                  onOpenLiveStudio(selectedDetailMedia);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Mainkan di Live Studio</span>
              </button>

              <button
                onClick={() => setSelectedDetailMedia(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import {
  Save,
  UserCheck,
  School,
  BookOpen,
  Calendar,
  Layers,
  Plus,
  Trash2,
  CheckCircle2,
} from 'lucide-react';
import { TeacherProfile } from '../types';

interface ProfilViewProps {
  profile: TeacherProfile;
  onSaveProfile: (updated: TeacherProfile) => void;
  onShowToast: (type: 'success' | 'error' | 'info', msg: string) => void;
}

export const ProfilView: React.FC<ProfilViewProps> = ({
  profile,
  onSaveProfile,
  onShowToast,
}) => {
  const [formData, setFormData] = useState<TeacherProfile>({
    ...profile,
    kepalaSekolah: profile.kepalaSekolah || { nama: '', nip: '' },
  });
  const [newClassInput, setNewClassInput] = useState('');

  const handleChange = (field: keyof TeacherProfile, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleKepalaSekolahChange = (field: 'nama' | 'nip', value: string) => {
    setFormData((prev) => ({
      ...prev,
      kepalaSekolah: {
        nama: field === 'nama' ? value : prev.kepalaSekolah?.nama || '',
        nip: field === 'nip' ? value : prev.kepalaSekolah?.nip || '',
      },
    }));
  };

  const handleAddClass = () => {
    const trimmed = newClassInput.trim().toUpperCase();
    if (!trimmed) return;
    if (formData.kelasList.includes(trimmed)) {
      onShowToast('info', `Kelas ${trimmed} sudah ada dalam daftar`);
      return;
    }
    const updated = [...formData.kelasList, trimmed];
    setFormData((prev) => ({
      ...prev,
      kelasList: updated,
      kelasAktif: prev.kelasAktif || trimmed,
    }));
    setNewClassInput('');
    onShowToast('success', `Kelas ${trimmed} berhasil ditambahkan`);
  };

  const handleRemoveClass = (kelasName: string) => {
    if (formData.kelasList.length <= 1) {
      onShowToast('error', 'Minimal harus memiliki satu kelas');
      return;
    }
    const updated = formData.kelasList.filter((k) => k !== kelasName);
    setFormData((prev) => ({
      ...prev,
      kelasList: updated,
      kelasAktif: prev.kelasAktif === kelasName ? updated[0] : prev.kelasAktif,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.namaGuru.trim()) {
      onShowToast('error', 'Nama guru tidak boleh kosong');
      return;
    }
    if (!formData.namaSekolah.trim()) {
      onShowToast('error', 'Nama satuan pendidikan tidak boleh kosong');
      return;
    }
    onSaveProfile(formData);
    onShowToast('success', 'Profil Guru dan Identitas Sekolah berhasil diperbarui');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6" id="profil-view-container">
      {/* Header card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs">
        <div className="flex items-center space-x-3 mb-1">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">Identitas Guru & Satuan Pendidikan</h2>
            <p className="text-xs text-slate-500">
              Data ini akan otomatis disematkan pada seluruh dokumen perencanaan, jurnal mengajar, dan rekap penilaian.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Identitas Guru */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center space-x-2">
            <UserCheck className="w-4 h-4 text-indigo-500" />
            <span>A. Identitas Guru Pengajar</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Lengkap & Gelar <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.namaGuru}
                onChange={(e) => handleChange('namaGuru', e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                placeholder="Contoh: Asep Fajar Pratama, S.Pd., Gr."
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                NIP / NIK (Opsional)
              </label>
              <input
                type="text"
                value={formData.nip}
                onChange={(e) => handleChange('nip', e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                placeholder="19880512 201101 1 008"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mata Pelajaran yang Diampu <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.mataPelajaran}
                onChange={(e) => handleChange('mataPelajaran', e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                placeholder="Contoh: Ilmu Pengetahuan Alam (IPA)"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Fase Kurikulum
              </label>
              <input
                type="text"
                value={formData.fase}
                onChange={(e) => handleChange('fase', e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                placeholder="Fase D (SMP/MTs)"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Identitas Satuan Pendidikan & Akademik */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center space-x-2">
            <School className="w-4 h-4 text-emerald-500" />
            <span>B. Satuan Pendidikan & Tahun Pelajaran</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Sekolah (Satuan Pendidikan) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.namaSekolah}
                onChange={(e) => handleChange('namaSekolah', e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                placeholder="Contoh: SMP Negeri 1 Nusantara"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                NPSN Sekolah (Opsional)
              </label>
              <input
                type="text"
                value={formData.npsn}
                onChange={(e) => handleChange('npsn', e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                placeholder="Contoh: 20104523"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tahun Pelajaran <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.tahunPelajaran}
                onChange={(e) => handleChange('tahunPelajaran', e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                placeholder="2025/2026"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Semester Aktif <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.semesterAktif}
                onChange={(e) => handleChange('semesterAktif', e.target.value as 'Ganjil' | 'Genap')}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden bg-white"
              >
                <option value="Ganjil">Semester Ganjil</option>
                <option value="Genap">Semester Genap</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Alokasi Waktu Default
              </label>
              <input
                type="text"
                value={formData.alokasiWaktuDefault}
                onChange={(e) => handleChange('alokasiWaktuDefault', e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                placeholder="2 x 40 menit"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Identitas Kepala Sekolah */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center space-x-2">
              <UserCheck className="w-4 h-4 text-blue-600" />
              <span>C. Pimpinan Satuan Pendidikan (Kepala Sekolah)</span>
            </h3>
            <span className="inline-flex items-center text-[11px] bg-blue-50 text-blue-700 border border-blue-200/60 px-2 py-0.5 rounded font-medium">
              <CheckCircle2 className="w-3 h-3 mr-1 text-blue-600" />
              Otomatis Terisi ke Dokumen & Ekspor
            </span>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            Nama dan NIP Kepala Sekolah ini akan <strong>secara otomatis dicantumkan pada lembar pengesahan dan tanda tangan</strong> di seluruh berkas cetak dan ekspor: <strong>Perencanaan (Modul Ajar)</strong>, <strong>Pelaksanaan (Jurnal KBM)</strong>, <strong>Evaluasi (Asesmen & Remedial)</strong>, serta <strong>Buku Laporan & Ekspor CSV</strong>.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Lengkap Kepala Sekolah Beserta Gelar <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                id="input-kepala-sekolah-nama"
                value={formData.kepalaSekolah?.nama || ''}
                onChange={(e) => handleKepalaSekolahChange('nama', e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                placeholder="Contoh: Drs. H. Mulyadi, M.Pd."
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Digunakan untuk lembar pengesahan dan kolom "Mengetahui, Kepala Sekolah".
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                NIP / NIK Kepala Sekolah
              </label>
              <input
                type="text"
                id="input-kepala-sekolah-nip"
                value={formData.kepalaSekolah?.nip || ''}
                onChange={(e) => handleKepalaSekolahChange('nip', e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                placeholder="Contoh: 19690315 199412 1 002"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Dapat berupa NIP resmi 18 digit atau NIK bagi yayasan/swasta.
              </span>
            </div>
          </div>
        </div>

        {/* Section 4: Rombongan Belajar (Kelas) & KKTP */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center space-x-2">
            <Layers className="w-4 h-4 text-purple-500" />
            <span>D. Kelas yang Diampu & Kriteria Ketercapaian (KKTP)</span>
          </h3>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Daftar Rombel / Kelas yang Dikelola
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {formData.kelasList.map((k) => (
                <span
                  key={k}
                  className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-semibold ${
                    formData.kelasAktif === k
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  <span>{k}</span>
                  {formData.kelasAktif === k && (
                    <span className="text-[10px] bg-white/20 px-1 rounded ml-1">Utama</span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemoveClass(k)}
                    className="hover:text-rose-300 ml-1"
                    title={`Hapus kelas ${k}`}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>

            {/* Add class input */}
            <div className="flex max-w-sm space-x-2">
              <input
                type="text"
                value={newClassInput}
                onChange={(e) => setNewClassInput(e.target.value)}
                placeholder="Tambah kelas, mis: VII-D atau VIII-B"
                className="text-xs p-2 border border-slate-300 rounded-lg flex-1 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
              <button
                type="button"
                onClick={handleAddClass}
                className="px-3 py-2 bg-slate-800 text-white rounded-lg text-xs font-semibold hover:bg-slate-900 flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Pilih Kelas Fokus Saat Ini
              </label>
              <select
                value={formData.kelasAktif}
                onChange={(e) => handleChange('kelasAktif', e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden bg-white"
              >
                {formData.kelasList.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Ambang KKTP Default (Skala 0 - 100)
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={formData.kktpDefault}
                onChange={(e) => handleChange('kktpDefault', parseInt(e.target.value, 10) || 75)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Kriteria Ketercapaian Tujuan Pembelajaran yang dikonfigurasi fleksibel oleh guru.
              </span>
            </div>
          </div>
        </div>

        {/* Submit button bar */}
        <div className="flex items-center justify-end space-x-3 pt-2">
          <button
            type="submit"
            id="btn-save-profile"
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-xs flex items-center space-x-2 shadow-xs transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Perubahan Profil</span>
          </button>
        </div>
      </form>
    </div>
  );
};

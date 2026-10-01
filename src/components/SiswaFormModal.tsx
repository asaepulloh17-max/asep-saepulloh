import React, { useState, useEffect } from 'react';
import { UserPlus, UserCheck, X, Save } from 'lucide-react';
import { PesertaDidik } from '../types';

interface SiswaFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  kelasList: string[];
  currentClass: string;
  initialData?: PesertaDidik | null;
  onSave: (siswa: PesertaDidik) => void;
}

export const SiswaFormModal: React.FC<SiswaFormModalProps> = ({
  isOpen,
  onClose,
  kelasList,
  currentClass,
  initialData,
  onSave,
}) => {
  const [nama, setNama] = useState('');
  const [nis, setNis] = useState('');
  const [nisn, setNisn] = useState('');
  const [jenisKelamin, setJenisKelamin] = useState<'L' | 'P'>('L');
  const [kelas, setKelas] = useState(currentClass || kelasList[0] || 'VII-A');

  useEffect(() => {
    if (initialData) {
      setNama(initialData.nama || '');
      setNis(initialData.nis || '');
      setNisn(initialData.nisn || '');
      setJenisKelamin(initialData.jenisKelamin || 'L');
      setKelas(initialData.kelas || currentClass || kelasList[0] || 'VII-A');
    } else {
      setNama('');
      setNis('');
      setNisn('');
      setJenisKelamin('L');
      setKelas(currentClass || kelasList[0] || 'VII-A');
    }
  }, [initialData, currentClass, kelasList, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim()) return;

    const savedItem: PesertaDidik = {
      id: initialData ? initialData.id : `siswa-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      nama: nama.trim(),
      nis: nis.trim(),
      nisn: nisn.trim(),
      jenisKelamin,
      kelas,
      isDemo: false,
    };

    onSave(savedItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              {initialData ? <UserCheck className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                {initialData ? 'Perbarui Data Siswa' : 'Tambah Peserta Didik Baru'}
              </h3>
              <p className="text-xs text-slate-500">
                Lengkapi identitas peserta didik untuk administrasi kelas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nama Lengkap Siswa <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder="Contoh: Aditya Pratama Ramadhan"
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                NIS (Nomor Induk)
              </label>
              <input
                type="text"
                value={nis}
                onChange={(e) => setNis(e.target.value)}
                placeholder="21001"
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                NISN (10 Digit)
              </label>
              <input
                type="text"
                value={nisn}
                onChange={(e) => setNisn(e.target.value)}
                placeholder="0081234567"
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Jenis Kelamin <span className="text-rose-500">*</span>
              </label>
              <select
                value={jenisKelamin}
                onChange={(e) => setJenisKelamin(e.target.value as 'L' | 'P')}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden bg-white"
              >
                <option value="L">Laki-laki (L)</option>
                <option value="P">Perempuan (P)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kelas / Rombel <span className="text-rose-500">*</span>
              </label>
              <select
                value={kelas}
                onChange={(e) => setKelas(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden bg-white"
              >
                {kelasList.map((k) => (
                  <option key={k} value={k}>
                    Kelas {k}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-semibold transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-2xs"
            >
              <Save className="w-4 h-4" />
              <span>{initialData ? 'Perbarui Siswa' : 'Simpan Siswa'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

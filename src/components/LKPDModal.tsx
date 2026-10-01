import React, { useState } from 'react';
import {
  X,
  Printer,
  Download,
  Sparkles,
  Loader2,
  FileText,
  Edit3,
  Eye,
  Save,
  CheckCircle2,
  Plus,
  Trash2,
  RefreshCw,
  Scale,
  Brain,
  Smile,
  Target,
  Users,
  Compass,
} from 'lucide-react';
import { Perencanaan, LKPDData, TeacherProfile, LKPDRubrikItem } from '../types';
import {
  generateLKPDWithAI,
  createCuratedDefaultLKPD,
  getRegulatoryHierarchy,
} from '../services/aiService';
import { downloadElementAsPDF, printElementDirectly } from '../utils/pdfExport';

interface LKPDModalProps {
  plan: Perencanaan;
  profile: TeacherProfile;
  isOpen: boolean;
  onClose: () => void;
  onSavePlan: (updatedPlan: Perencanaan) => void;
  onShowToast: (type: 'success' | 'error' | 'info', msg: string) => void;
}

export const LKPDModal: React.FC<LKPDModalProps> = ({
  plan,
  profile,
  isOpen,
  onClose,
  onSavePlan,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'edit'>('preview');
  const [isGeneratingAI, setIsGeneratingAI] = useState<boolean>(false);
  const [isExportingPDF, setIsExportingPDF] = useState<boolean>(false);
  const [aiNotes, setAiNotes] = useState<string>('');

  // Initial LKPD: either existing in plan.lkpd, or generate curated default
  const [lkpdData, setLkpdData] = useState<LKPDData>(() => {
    return plan.lkpd || createCuratedDefaultLKPD(plan, profile);
  });

  if (!isOpen) return null;

  const mapel = plan.identitas.mataPelajaran || profile.mataPelajaran;
  const reg = getRegulatoryHierarchy(mapel);

  // Handle Save LKPD to the Perencanaan
  const handleSaveToPlan = (dataToSave = lkpdData) => {
    const updatedPlan: Perencanaan = {
      ...plan,
      lkpd: {
        ...dataToSave,
        updatedAt: new Date().toISOString(),
      },
      updatedAt: new Date().toISOString(),
    };
    onSavePlan(updatedPlan);
    onShowToast('success', 'LKPD berhasil disimpan ke dalam dokumen perencanaan!');
  };

  // Handle AI Generation
  const handleGenerateAI = async () => {
    setIsGeneratingAI(true);
    try {
      const generated = await generateLKPDWithAI(plan, profile, aiNotes);
      setLkpdData(generated);
      handleSaveToPlan(generated);
      onShowToast('success', 'LKPD Pembelajaran Mendalam berhasil disusun oleh AI!');
      setActiveTab('preview');
    } catch (err) {
      console.error(err);
      onShowToast('error', 'Terjadi kesalahan saat menyusun LKPD dengan AI.');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Handle PDF Export
  const handleDownloadPDF = async () => {
    setIsExportingPDF(true);
    const sanitizedTitle = (lkpdData.topikMateri || 'Materi')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .substring(0, 30);
    const filename = `LKPD_${sanitizedTitle}_Kelas_${plan.identitas.kelas}`;

    try {
      const ok = await downloadElementAsPDF('dokumen-lkpd-printable', filename, {
        title: `LKPD: ${lkpdData.topikMateri}`,
      });
      if (ok) {
        onShowToast('success', 'Berkas PDF LKPD berhasil diunduh!');
      } else {
        onShowToast('info', 'Membuka dialog cetak PDF browser...');
      }
    } catch (err) {
      console.error(err);
      printElementDirectly('dokumen-lkpd-printable', filename);
    } finally {
      setIsExportingPDF(false);
    }
  };

  // Handle Direct Print
  const handleDirectPrint = () => {
    const sanitizedTitle = (lkpdData.topikMateri || 'Materi')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .substring(0, 30);
    printElementDirectly('dokumen-lkpd-printable', `LKPD_${sanitizedTitle}_Kelas_${plan.identitas.kelas}`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-5xl w-full max-h-[94vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 no-print flex-wrap gap-2">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 bg-indigo-500/20 text-indigo-400 rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-bold truncate max-w-md">
                  {lkpdData.judulLKPD || 'Lembar Kerja Peserta Didik (LKPD)'}
                </h3>
                <span className="text-[10px] bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-medium">
                  Pembelajaran Mendalam
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Kelas {plan.identitas.kelas} • {mapel} • {plan.identitas.alokasiWaktu}
              </p>
            </div>
          </div>

          {/* Top Actions */}
          <div className="flex items-center space-x-2">
            <div className="bg-slate-800 p-0.5 rounded-lg border border-slate-700 flex text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`px-3 py-1 rounded-md font-medium transition-all flex items-center space-x-1.5 ${
                  activeTab === 'preview'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Pratinjau / Cetak</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('edit')}
                className={`px-3 py-1 rounded-md font-medium transition-all flex items-center space-x-1.5 ${
                  activeTab === 'edit'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Ubah Konten</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={isExportingPDF}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 disabled:opacity-60 shadow-2xs transition-colors"
              title="Unduh Berkas PDF LKPD Resmi"
            >
              {isExportingPDF ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
              ) : (
                <Download className="w-3.5 h-3.5 text-white" />
              )}
              <span className="hidden sm:inline">Unduh PDF</span>
            </button>

            <button
              type="button"
              onClick={handleDirectPrint}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 border border-slate-700 transition-colors"
              title="Cetak Langsung LKPD"
            >
              <Printer className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Cetak</span>
            </button>

            <button
              type="button"
              onClick={() => handleSaveToPlan()}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-2xs transition-colors"
              title="Simpan LKPD ke RPP"
            >
              <Save className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Simpan</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              title="Tutup Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* AI Assistant Banner / Generator Bar */}
        <div className="bg-linear-to-r from-indigo-50 via-purple-50 to-slate-50 border-b border-indigo-100 p-3 no-print">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-start space-x-2">
              <div className="p-1.5 bg-indigo-600 text-white rounded-lg mt-0.5">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                  <span>Asisten AI LKPD Pembelajaran Mendalam</span>
                  <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.2 rounded-full">
                    Tersinkron dengan RPP
                  </span>
                </h4>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Menyusun LKPD otomatis berbasis stimulus fenomena, 3 pengalaman (Memahami, Mengaplikasi, Merefleksi), dan rubrik 4 level.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={aiNotes}
                onChange={(e) => setAiNotes(e.target.value)}
                placeholder="Fokus khusus (cth: studi kasus lokal, perkuat HOTS)..."
                className="text-xs px-2.5 py-1.5 border border-indigo-200 rounded-lg bg-white w-48 sm:w-64 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
              <button
                type="button"
                onClick={handleGenerateAI}
                disabled={isGeneratingAI}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg flex items-center space-x-1.5 disabled:opacity-60 shadow-2xs transition-colors shrink-0"
              >
                {isGeneratingAI ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                )}
                <span>{isGeneratingAI ? 'Menyusun...' : 'Susun Ulang AI'}</span>
              </button>
            </div>
          </div>

          {/* Quick Guidance Tags */}
          <div className="flex items-center space-x-1.5 mt-2 flex-wrap gap-1 text-[10px] text-slate-600">
            <span className="font-semibold text-indigo-700">Fokus Cepat:</span>
            {[
              'Studi Kasus Kontekstual',
              'Tantangan HOTS Mandiri',
              'Eksperimen Sederhana',
              'Mindful & Joyful Kuat',
              'Diferensiasi Minat',
            ].map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setAiNotes(tag)}
                className="px-2 py-0.5 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded text-slate-700 transition-colors"
              >
                + {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto bg-slate-100 p-3 sm:p-5">
          {activeTab === 'preview' ? (
            /* PRINTABLE DOCUMENT PREVIEW */
            <div
              id="dokumen-lkpd-printable"
              className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 sm:p-8 max-w-4xl mx-auto space-y-5 text-xs text-slate-800 print-clean"
            >
              {/* Header LKPD */}
              <div className="border-b-2 border-slate-800 pb-4 text-center">
                <div className="flex items-center justify-between border-b pb-2 mb-3 border-slate-300 text-[11px] text-slate-600">
                  <span className="font-bold text-slate-900 uppercase">
                    {plan.identitas.namaSekolah || profile.namaSekolah}
                  </span>
                  <span>Tahun Pelajaran: {plan.identitas.tahunPelajaran}</span>
                </div>
                <h1 className="text-base sm:text-lg font-black uppercase tracking-wide text-slate-900">
                  {lkpdData.judulLKPD}
                </h1>
                <h2 className="text-xs sm:text-sm font-bold text-indigo-700 mt-1">
                  Pendekatan Pembelajaran Mendalam (Deep Learning)
                </h2>
              </div>

              {/* Data Kelompok & Identitas Siswa */}
              <div className="border border-slate-300 rounded-lg p-3 bg-slate-50/50">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-slate-700 w-28">Mata Pelajaran</span>
                      <span>: <strong>{mapel}</strong></span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-slate-700 w-28">Fase / Kelas</span>
                      <span>: <strong>{plan.identitas.fase || 'Fase D'} / Kelas {plan.identitas.kelas}</strong></span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-slate-700 w-28">Topik / Materi</span>
                      <span>: <strong>{lkpdData.topikMateri}</strong></span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-slate-700 w-28">Alokasi Waktu</span>
                      <span>: {lkpdData.alokasiWaktu}</span>
                    </div>
                  </div>

                  {/* Isian Siswa */}
                  <div className="border border-slate-300 rounded p-2.5 bg-white space-y-1">
                    <div className="font-bold text-slate-800 border-b pb-1 text-[11px] flex justify-between">
                      <span>IDENTITAS KELOMPOK:</span>
                      <span className="text-slate-400 font-normal">Hari / Tgl: ____________</span>
                    </div>
                    <div className="text-[11px] space-y-1 pt-1">
                      <div>Nama Kelompok: _____________________________________</div>
                      <div>Ketua Tim &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: _____________________________________</div>
                      <div>Anggota Tim &nbsp;&nbsp;&nbsp;: 1. __________________ 2. __________________</div>
                      <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 3. __________________ 4. __________________</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pijakan Pembelajaran (TP & KKTP) */}
              <div className="border border-indigo-200 rounded-lg p-3 bg-indigo-50/40 space-y-1.5">
                <h3 className="font-bold text-indigo-900 flex items-center space-x-1.5 text-xs">
                  <Target className="w-3.5 h-3.5 text-indigo-600" />
                  <span>PIJAKAN CAPAIAN & TUJUAN PEMBELAJARAN (TP)</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-700">
                  <div>
                    <span className="font-semibold text-slate-900">Tujuan Pembelajaran (TP):</span>
                    <p className="mt-0.5 italic">{plan.tujuanPembelajaran.tujuanPembelajaran || '-'}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900">Indikator Ketercapaian (KKTP):</span>
                    <p className="mt-0.5 italic">{plan.tujuanPembelajaran.indikatorKetercapaian || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Petunjuk Umum & Pembiasaan Berkesadaran */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="border border-slate-200 rounded-lg p-3 bg-slate-50">
                  <h4 className="font-bold text-slate-900 mb-1.5 flex items-center space-x-1.5 text-xs">
                    <Compass className="w-3.5 h-3.5 text-slate-700" />
                    <span>Petunjuk Umum Kerja Tim</span>
                  </h4>
                  <div className="whitespace-pre-line text-[11px] text-slate-700 leading-relaxed">
                    {lkpdData.petunjukUmum}
                  </div>
                </div>

                <div className="border border-amber-200 rounded-lg p-3 bg-amber-50/50">
                  <h4 className="font-bold text-amber-900 mb-1.5 flex items-center space-x-1.5 text-xs">
                    <Brain className="w-3.5 h-3.5 text-amber-600" />
                    <span>Aktivitas Berkesadaran Awal (Mindful Check-in)</span>
                  </h4>
                  <p className="text-[11px] text-amber-950 leading-relaxed italic">
                    "{lkpdData.aktivitasMindfulAwal}"
                  </p>
                </div>
              </div>

              {/* FASE 1: MEMAHAMI (UNDERSTANDING) */}
              <div className="border border-slate-300 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between border-b pb-1.5 border-slate-200">
                  <h3 className="font-bold text-slate-900 text-xs flex items-center space-x-1.5">
                    <span className="w-5 h-5 bg-indigo-600 text-white rounded-full inline-flex items-center justify-center text-[10px] font-bold">
                      1
                    </span>
                    <span className="uppercase">FASE 1: MEMAHAMI (Eksplorasi Fakta & Konsep Bermakna)</span>
                  </h3>
                  <span className="text-[10px] bg-indigo-100 text-indigo-800 font-semibold px-2 py-0.5 rounded">
                    Meaningful
                  </span>
                </div>

                {/* Stimulus Wacana */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="font-bold text-slate-800 block mb-1 text-[11px]">
                    📰 Stimulus Fenomena Nyata / Wacana Kontekstual:
                  </span>
                  <p className="text-[11px] text-slate-700 leading-relaxed whitespace-pre-line">
                    {lkpdData.faseMemahami.stimulusWacana}
                  </p>
                </div>

                {/* Pertanyaan Eksplorasi */}
                <div className="space-y-2.5">
                  <span className="font-bold text-slate-800 block text-[11px]">
                    Pertanyaan Pemantik & Eksplorasi Konsep:
                  </span>
                  {lkpdData.faseMemahami.pertanyaanEksplorasi.map((q, idx) => (
                    <div key={idx} className="p-2.5 border border-slate-200 rounded-lg bg-white space-y-1">
                      <p className="font-semibold text-slate-900 text-[11px]">
                        {idx + 1}. {q}
                      </p>
                      <div className="h-10 border-b border-dashed border-slate-300 text-[10px] text-slate-400 italic pt-1">
                        [Ruang Jawaban / Gagasan Awal Kelompok]
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* FASE 2: MENGAPLIKASI (APPLYING) */}
              <div className="border border-slate-300 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between border-b pb-1.5 border-slate-200">
                  <h3 className="font-bold text-slate-900 text-xs flex items-center space-x-1.5">
                    <span className="w-5 h-5 bg-indigo-600 text-white rounded-full inline-flex items-center justify-center text-[10px] font-bold">
                      2
                    </span>
                    <span className="uppercase">FASE 2: MENGAPLIKASI (Penyelidikan Kolaboratif & Analisis HOTS)</span>
                  </h3>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded">
                    Active & Collaborative
                  </span>
                </div>

                {/* Alat & Bahan + Langkah Kerja */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="border border-slate-200 rounded-lg p-3 bg-slate-50 sm:col-span-1">
                    <span className="font-bold text-slate-800 block mb-1 text-[11px]">
                      Alat & Bahan:
                    </span>
                    <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-700">
                      {lkpdData.faseMengaplikasi.alatBahan.map((ab, i) => (
                        <li key={i}>{ab}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="border border-slate-200 rounded-lg p-3 bg-slate-50 sm:col-span-2">
                    <span className="font-bold text-slate-800 block mb-1 text-[11px]">
                      Langkah Kerja Penyelidikan:
                    </span>
                    <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-700 leading-relaxed">
                      {lkpdData.faseMengaplikasi.langkahKerja.map((lk, i) => (
                        <li key={i}>{lk}</li>
                      ))}
                    </ol>
                  </div>
                </div>

                {/* Tabel Pengamatan */}
                <div>
                  <span className="font-bold text-slate-900 block mb-1 text-[11px]">
                    {lkpdData.faseMengaplikasi.tabelPengamatan.judulTabel}
                  </span>
                  <div className="overflow-x-auto border border-slate-300 rounded-lg">
                    <table className="w-full text-[11px] text-left border-collapse">
                      <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-300">
                        <tr>
                          {lkpdData.faseMengaplikasi.tabelPengamatan.kolom.map((col, idx) => (
                            <th key={idx} className="p-2 border-r last:border-r-0 border-slate-300">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {lkpdData.faseMengaplikasi.tabelPengamatan.barisPanduan &&
                        lkpdData.faseMengaplikasi.tabelPengamatan.barisPanduan.length > 0 ? (
                          lkpdData.faseMengaplikasi.tabelPengamatan.barisPanduan.map((panduan, rIdx) => (
                            <tr key={rIdx} className="hover:bg-slate-50/50">
                              <td className="p-2 text-center font-bold text-slate-700 border-r border-slate-300 w-10">
                                {rIdx + 1}
                              </td>
                              <td className="p-2 border-r border-slate-300 text-slate-700 italic">
                                {panduan}
                              </td>
                              <td className="p-2 border-r border-slate-300 text-slate-400 italic">
                                [Tuliskan hasil amatan...]
                              </td>
                              <td className="p-2 border-r border-slate-300 text-slate-400 italic">
                                [Kaitkan fakta...]
                              </td>
                              <td className="p-2 text-slate-400 italic">
                                [Catatan tim...]
                              </td>
                            </tr>
                          ))
                        ) : (
                          [1, 2, 3].map((row) => (
                            <tr key={row}>
                              <td className="p-3 text-center border-r border-slate-300 w-10">{row}</td>
                              <td className="p-3 border-r border-slate-300 text-slate-300">.......................</td>
                              <td className="p-3 border-r border-slate-300 text-slate-300">.......................</td>
                              <td className="p-3 border-r border-slate-300 text-slate-300">.......................</td>
                              <td className="p-3 text-slate-300">.......................</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Tugas Pemecahan Masalah (HOTS) */}
                <div className="p-3 bg-purple-50/60 border border-purple-200 rounded-lg">
                  <span className="font-bold text-purple-900 block mb-1 text-[11px]">
                    💡 Tantangan Pemecahan Masalah Nyata (Analisis HOTS):
                  </span>
                  <p className="text-[11px] text-purple-950 whitespace-pre-line leading-relaxed">
                    {lkpdData.faseMengaplikasi.tugasPemecahanMasalah}
                  </p>
                  <div className="mt-2.5 h-14 border border-dashed border-purple-300 rounded bg-white p-2 text-[10px] text-slate-400 italic">
                    [Tuliskan rancangan solusi konkret & argumentasi data kelompok Anda di sini...]
                  </div>
                </div>
              </div>

              {/* FASE 3: MEREFLEKSI (REFLECTING) */}
              <div className="border border-slate-300 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between border-b pb-1.5 border-slate-200">
                  <h3 className="font-bold text-slate-900 text-xs flex items-center space-x-1.5">
                    <span className="w-5 h-5 bg-indigo-600 text-white rounded-full inline-flex items-center justify-center text-[10px] font-bold">
                      3
                    </span>
                    <span className="uppercase">FASE 3: MEREFLEKSI (Kesimpulan, Perasaan Belajar & Aksi Nyata)</span>
                  </h3>
                  <span className="text-[10px] bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded flex items-center space-x-1">
                    <Smile className="w-3 h-3" />
                    <span>Joyful & Reflective</span>
                  </span>
                </div>

                {/* Kesimpulan Bersama */}
                <div className="p-2.5 border border-slate-200 rounded-lg bg-slate-50">
                  <span className="font-bold text-slate-900 block mb-1 text-[11px]">
                    Kesimpulan Kolaboratif Tim:
                  </span>
                  <p className="text-[11px] text-slate-600 italic mb-1.5">
                    {lkpdData.faseMerefleksi.kesimpulanBersama}
                  </p>
                  <div className="h-10 border-b border-dashed border-slate-300 text-[10px] text-slate-400 italic pt-1">
                    [Rumuskan 1-2 kalimat intisari pembelajaran yang kalian temukan bersama...]
                  </div>
                </div>

                {/* Refleksi Diri & Kelompok */}
                <div className="space-y-2">
                  <span className="font-bold text-slate-900 block text-[11px]">
                    Refleksi Diri & Pengalaman Belajar (Mindful & Joyful):
                  </span>
                  {lkpdData.faseMerefleksi.pertanyaanRefleksi.map((ref, idx) => (
                    <div key={idx} className="p-2 border border-slate-200 rounded bg-white text-[11px]">
                      <p className="font-semibold text-slate-800">
                        {idx + 1}. {ref}
                      </p>
                      <div className="h-6 border-b border-dashed border-slate-300 text-[10px] text-slate-400 italic pt-0.5">
                        [Tanggapan refleksi Anda...]
                      </div>
                    </div>
                  ))}
                </div>

                {/* Rencana Aksi Nyata */}
                <div className="p-2.5 bg-emerald-50/60 border border-emerald-200 rounded-lg">
                  <span className="font-bold text-emerald-950 block mb-1 text-[11px]">
                    🌱 Rencana Aksi Nyata (Meaningful Action):
                  </span>
                  <p className="text-[11px] text-emerald-900 italic mb-1">
                    {lkpdData.faseMerefleksi.rencanaAksiNyata}
                  </p>
                  <div className="h-8 border-b border-dashed border-emerald-300 text-[10px] text-emerald-700/60 italic pt-1">
                    [Tindakan nyata yang saya lakukan setelah pembelajaran ini...]
                  </div>
                </div>
              </div>

              {/* RUBRIK ASESMEN FORMATIF */}
              <div className="border border-slate-300 rounded-lg p-4 space-y-2.5">
                <div className="flex items-center justify-between border-b pb-1 border-slate-200">
                  <h3 className="font-bold text-slate-900 text-xs flex items-center space-x-1.5">
                    <Scale className="w-3.5 h-3.5 text-indigo-600" />
                    <span>RUBRIK PENILAIAN FORMATIF KINERJA LKPD</span>
                  </h3>
                  <span className="text-[10px] text-slate-500 font-medium">
                    Kriteria 4 Level Deskriptif
                  </span>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-[10px] border-collapse text-left">
                    <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-300">
                      <tr>
                        <th className="p-2 border-r border-slate-300 w-1/4">Aspek Penilaian</th>
                        <th className="p-2 border-r border-slate-300">Baru Berkembang (1)</th>
                        <th className="p-2 border-r border-slate-300">Layak (2)</th>
                        <th className="p-2 border-r border-slate-300">Cakap (3)</th>
                        <th className="p-2">Mahir (4)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {lkpdData.rubrikPenilaian.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="p-2 font-bold text-slate-800 border-r border-slate-300 bg-slate-50/30">
                            {item.aspek}
                          </td>
                          <td className="p-2 border-r border-slate-300 text-slate-600">
                            {item.baruBerkembang}
                          </td>
                          <td className="p-2 border-r border-slate-300 text-slate-600">
                            {item.layak}
                          </td>
                          <td className="p-2 border-r border-slate-300 text-slate-600">
                            {item.cakap}
                          </td>
                          <td className="p-2 text-slate-600 font-medium">
                            {item.mahir}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Catatan & Tanda Tangan */}
                <div className="pt-3 border-t border-slate-200 grid grid-cols-2 gap-4 text-[11px]">
                  <div>
                    <span className="font-semibold text-slate-800">Catatan Umpan Balik Guru:</span>
                    <p className="text-slate-600 italic mt-0.5">
                      {lkpdData.catatanGuru || 'Bagus, terus tingkatkan penalaran kritis dan kolaborasi tim yang harmonis.'}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 text-center text-[10px]">
                    <div>
                      <p className="text-slate-500">Perwakilan Kelompok,</p>
                      <div className="h-10"></div>
                      <p className="font-semibold text-slate-800">( ____________________ )</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Guru Mata Pelajaran,</p>
                      <div className="h-10"></div>
                      <p className="font-semibold text-slate-800 font-bold underline">
                        {profile.namaGuru || 'Nama Guru'}
                      </p>
                      <p className="text-[9px] text-slate-500">NIP. {profile.nip || '-'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* INTERACTIVE CONTENT EDITOR */
            <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 max-w-4xl mx-auto space-y-5 text-xs text-slate-800">
              <div className="border-b pb-3 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Editor Konten LKPD</h3>
                  <p className="text-xs text-slate-500">
                    Sesuaikan seluruh pertanyaan, aktivitas, tabel kerja, dan rubrik sesuai karakteristik murid Anda.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleSaveToPlan()}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold flex items-center space-x-1.5 shadow-2xs"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Perubahan</span>
                </button>
              </div>

              {/* Judul & Topik */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 mb-1 block">Judul Dokumen LKPD</label>
                  <input
                    type="text"
                    value={lkpdData.judulLKPD}
                    onChange={(e) => setLkpdData({ ...lkpdData, judulLKPD: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 mb-1 block">Alokasi Waktu</label>
                  <input
                    type="text"
                    value={lkpdData.alokasiWaktu}
                    onChange={(e) => setLkpdData({ ...lkpdData, alokasiWaktu: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
              </div>

              {/* Petunjuk & Mindful */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 mb-1 block">Petunjuk Umum Kerja Tim</label>
                  <textarea
                    rows={4}
                    value={lkpdData.petunjukUmum}
                    onChange={(e) => setLkpdData({ ...lkpdData, petunjukUmum: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 mb-1 block">Aktivitas Mindful Awal</label>
                  <textarea
                    rows={4}
                    value={lkpdData.aktivitasMindfulAwal}
                    onChange={(e) => setLkpdData({ ...lkpdData, aktivitasMindfulAwal: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
              </div>

              {/* Fase 1: Memahami */}
              <div className="border border-slate-200 rounded-lg p-4 space-y-3 bg-slate-50/50">
                <h4 className="font-bold text-slate-900 border-b pb-1 text-xs">
                  Fase 1: Memahami (Stimulus Wacana & Pertanyaan Eksplorasi)
                </h4>
                <div>
                  <label className="font-semibold text-slate-700 mb-1 block">
                    Stimulus Wacana / Teks Kasus Nyata:
                  </label>
                  <textarea
                    rows={4}
                    value={lkpdData.faseMemahami.stimulusWacana}
                    onChange={(e) =>
                      setLkpdData({
                        ...lkpdData,
                        faseMemahami: { ...lkpdData.faseMemahami, stimulusWacana: e.target.value },
                      })
                    }
                    className="w-full p-2 border rounded-lg bg-white"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 mb-1 block">
                    Pertanyaan Pemantik & Eksplorasi Konsep (1 per baris):
                  </label>
                  {lkpdData.faseMemahami.pertanyaanEksplorasi.map((q, idx) => (
                    <div key={idx} className="flex items-center space-x-2 mb-2">
                      <span className="font-bold text-slate-500 w-5">{idx + 1}.</span>
                      <input
                        type="text"
                        value={q}
                        onChange={(e) => {
                          const updated = [...lkpdData.faseMemahami.pertanyaanEksplorasi];
                          updated[idx] = e.target.value;
                          setLkpdData({
                            ...lkpdData,
                            faseMemahami: { ...lkpdData.faseMemahami, pertanyaanEksplorasi: updated },
                          });
                        }}
                        className="flex-1 p-2 border rounded-lg bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const updated = lkpdData.faseMemahami.pertanyaanEksplorasi.filter((_, i) => i !== idx);
                          setLkpdData({
                            ...lkpdData,
                            faseMemahami: { ...lkpdData.faseMemahami, pertanyaanEksplorasi: updated },
                          });
                        }}
                        className="p-2 text-rose-500 hover:bg-rose-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setLkpdData({
                        ...lkpdData,
                        faseMemahami: {
                          ...lkpdData.faseMemahami,
                          pertanyaanEksplorasi: [
                            ...lkpdData.faseMemahami.pertanyaanEksplorasi,
                            'Pertanyaan eksplorasi konsep baru...',
                          ],
                        },
                      });
                    }}
                    className="text-xs text-indigo-600 font-semibold hover:underline flex items-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Pertanyaan</span>
                  </button>
                </div>
              </div>

              {/* Fase 2: Mengaplikasi */}
              <div className="border border-slate-200 rounded-lg p-4 space-y-3 bg-slate-50/50">
                <h4 className="font-bold text-slate-900 border-b pb-1 text-xs">
                  Fase 2: Mengaplikasi (Langkah Kerja, Tabel & Tantangan HOTS)
                </h4>

                <div>
                  <label className="font-semibold text-slate-700 mb-1 block">
                    Alat dan Bahan (pisahkan dengan koma atau baris baru):
                  </label>
                  <input
                    type="text"
                    value={lkpdData.faseMengaplikasi.alatBahan.join(', ')}
                    onChange={(e) =>
                      setLkpdData({
                        ...lkpdData,
                        faseMengaplikasi: {
                          ...lkpdData.faseMengaplikasi,
                          alatBahan: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                        },
                      })
                    }
                    className="w-full p-2 border rounded-lg bg-white"
                    placeholder="Buku teks, gawai, spidol, karton..."
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 mb-1 block">
                    Langkah Kerja Penyelidikan:
                  </label>
                  {lkpdData.faseMengaplikasi.langkahKerja.map((lk, idx) => (
                    <div key={idx} className="flex items-center space-x-2 mb-2">
                      <span className="font-bold text-slate-500 w-5">{idx + 1}.</span>
                      <input
                        type="text"
                        value={lk}
                        onChange={(e) => {
                          const updated = [...lkpdData.faseMengaplikasi.langkahKerja];
                          updated[idx] = e.target.value;
                          setLkpdData({
                            ...lkpdData,
                            faseMengaplikasi: { ...lkpdData.faseMengaplikasi, langkahKerja: updated },
                          });
                        }}
                        className="flex-1 p-2 border rounded-lg bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const updated = lkpdData.faseMengaplikasi.langkahKerja.filter((_, i) => i !== idx);
                          setLkpdData({
                            ...lkpdData,
                            faseMengaplikasi: { ...lkpdData.faseMengaplikasi, langkahKerja: updated },
                          });
                        }}
                        className="p-2 text-rose-500 hover:bg-rose-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setLkpdData({
                        ...lkpdData,
                        faseMengaplikasi: {
                          ...lkpdData.faseMengaplikasi,
                          langkahKerja: [...lkpdData.faseMengaplikasi.langkahKerja, 'Langkah kerja penyelidikan berikutnya...'],
                        },
                      });
                    }}
                    className="text-xs text-indigo-600 font-semibold hover:underline flex items-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Langkah Kerja</span>
                  </button>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 mb-1 block">
                    Tantangan Pemecahan Masalah Nyata (HOTS):
                  </label>
                  <textarea
                    rows={3}
                    value={lkpdData.faseMengaplikasi.tugasPemecahanMasalah}
                    onChange={(e) =>
                      setLkpdData({
                        ...lkpdData,
                        faseMengaplikasi: { ...lkpdData.faseMengaplikasi, tugasPemecahanMasalah: e.target.value },
                      })
                    }
                    className="w-full p-2 border rounded-lg bg-white"
                  />
                </div>
              </div>

              {/* Fase 3: Merefleksi */}
              <div className="border border-slate-200 rounded-lg p-4 space-y-3 bg-slate-50/50">
                <h4 className="font-bold text-slate-900 border-b pb-1 text-xs">
                  Fase 3: Merefleksi (Kesimpulan & Aksi Nyata)
                </h4>

                <div>
                  <label className="font-semibold text-slate-700 mb-1 block">
                    Panduan Kesimpulan Bersama:
                  </label>
                  <textarea
                    rows={2}
                    value={lkpdData.faseMerefleksi.kesimpulanBersama}
                    onChange={(e) =>
                      setLkpdData({
                        ...lkpdData,
                        faseMerefleksi: { ...lkpdData.faseMerefleksi, kesimpulanBersama: e.target.value },
                      })
                    }
                    className="w-full p-2 border rounded-lg bg-white"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 mb-1 block">
                    Pertanyaan Refleksi Siswa:
                  </label>
                  {lkpdData.faseMerefleksi.pertanyaanRefleksi.map((ref, idx) => (
                    <div key={idx} className="flex items-center space-x-2 mb-2">
                      <span className="font-bold text-slate-500 w-5">{idx + 1}.</span>
                      <input
                        type="text"
                        value={ref}
                        onChange={(e) => {
                          const updated = [...lkpdData.faseMerefleksi.pertanyaanRefleksi];
                          updated[idx] = e.target.value;
                          setLkpdData({
                            ...lkpdData,
                            faseMerefleksi: { ...lkpdData.faseMerefleksi, pertanyaanRefleksi: updated },
                          });
                        }}
                        className="flex-1 p-2 border rounded-lg bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const updated = lkpdData.faseMerefleksi.pertanyaanRefleksi.filter((_, i) => i !== idx);
                          setLkpdData({
                            ...lkpdData,
                            faseMerefleksi: { ...lkpdData.faseMerefleksi, pertanyaanRefleksi: updated },
                          });
                        }}
                        className="p-2 text-rose-500 hover:bg-rose-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <div>
                  <label className="font-semibold text-slate-700 mb-1 block">
                    Rencana Aksi Nyata (Meaningful Action):
                  </label>
                  <input
                    type="text"
                    value={lkpdData.faseMerefleksi.rencanaAksiNyata}
                    onChange={(e) =>
                      setLkpdData({
                        ...lkpdData,
                        faseMerefleksi: { ...lkpdData.faseMerefleksi, rencanaAksiNyata: e.target.value },
                      })
                    }
                    className="w-full p-2 border rounded-lg bg-white"
                  />
                </div>
              </div>

              {/* Rubrik Penilaian Formatif Editor */}
              <div className="border border-slate-200 rounded-lg p-4 space-y-3 bg-slate-50/50">
                <h4 className="font-bold text-slate-900 border-b pb-1 text-xs flex items-center justify-between">
                  <span>Rubrik Penilaian Formatif (4 Kriteria Deskriptif)</span>
                  <button
                    type="button"
                    onClick={() => {
                      const newRubrik: LKPDRubrikItem = {
                        aspek: 'Aspek Penilaian Baru',
                        baruBerkembang: 'Deskripsi kriteria baru berkembang...',
                        layak: 'Deskripsi kriteria layak...',
                        cakap: 'Deskripsi kriteria cakap...',
                        mahir: 'Deskripsi kriteria mahir...',
                      };
                      setLkpdData({
                        ...lkpdData,
                        rubrikPenilaian: [...lkpdData.rubrikPenilaian, newRubrik],
                      });
                    }}
                    className="text-[11px] text-indigo-600 font-semibold hover:underline flex items-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Aspek Rubrik</span>
                  </button>
                </h4>

                <div className="space-y-3">
                  {lkpdData.rubrikPenilaian.map((rubrik, idx) => (
                    <div key={idx} className="p-3 border border-slate-200 rounded-lg bg-white space-y-2">
                      <div className="flex items-center justify-between">
                        <input
                          type="text"
                          value={rubrik.aspek}
                          onChange={(e) => {
                            const updated = [...lkpdData.rubrikPenilaian];
                            updated[idx].aspek = e.target.value;
                            setLkpdData({ ...lkpdData, rubrikPenilaian: updated });
                          }}
                          className="font-bold text-slate-900 p-1 border rounded w-2/3"
                          placeholder="Nama Aspek"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const updated = lkpdData.rubrikPenilaian.filter((_, i) => i !== idx);
                            setLkpdData({ ...lkpdData, rubrikPenilaian: updated });
                          }}
                          className="p-1 text-rose-500 hover:bg-rose-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-[11px]">
                        <div>
                          <label className="text-[10px] text-slate-500 block mb-0.5">Baru Berkembang (1)</label>
                          <textarea
                            rows={2}
                            value={rubrik.baruBerkembang}
                            onChange={(e) => {
                              const updated = [...lkpdData.rubrikPenilaian];
                              updated[idx].baruBerkembang = e.target.value;
                              setLkpdData({ ...lkpdData, rubrikPenilaian: updated });
                            }}
                            className="w-full p-1.5 border rounded"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 block mb-0.5">Layak (2)</label>
                          <textarea
                            rows={2}
                            value={rubrik.layak}
                            onChange={(e) => {
                              const updated = [...lkpdData.rubrikPenilaian];
                              updated[idx].layak = e.target.value;
                              setLkpdData({ ...lkpdData, rubrikPenilaian: updated });
                            }}
                            className="w-full p-1.5 border rounded"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 block mb-0.5">Cakap (3)</label>
                          <textarea
                            rows={2}
                            value={rubrik.cakap}
                            onChange={(e) => {
                              const updated = [...lkpdData.rubrikPenilaian];
                              updated[idx].cakap = e.target.value;
                              setLkpdData({ ...lkpdData, rubrikPenilaian: updated });
                            }}
                            className="w-full p-1.5 border rounded"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 block mb-0.5">Mahir (4)</label>
                          <textarea
                            rows={2}
                            value={rubrik.mahir}
                            onChange={(e) => {
                              const updated = [...lkpdData.rubrikPenilaian];
                              updated[idx].mahir = e.target.value;
                              setLkpdData({ ...lkpdData, rubrikPenilaian: updated });
                            }}
                            className="w-full p-1.5 border rounded"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Catatan Guru */}
              <div>
                <label className="font-semibold text-slate-700 mb-1 block">Catatan Umpan Balik Guru:</label>
                <input
                  type="text"
                  value={lkpdData.catatanGuru || ''}
                  onChange={(e) => setLkpdData({ ...lkpdData, catatanGuru: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                  placeholder="Umpan balik formatif positif bagi murid..."
                />
              </div>

              <div className="pt-3 border-t flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('preview')}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg"
                >
                  Lihat Pratinjau
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveToPlan()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg flex items-center space-x-1.5 shadow-2xs"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan ke RPP</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

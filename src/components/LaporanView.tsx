import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Printer,
  Download,
  FileText,
  BookOpenCheck,
  Award,
  HeartHandshake,
  FolderArchive,
  Eye,
  CheckCircle2,
  Loader2,
  TrendingUp,
} from 'lucide-react';
import {
  TeacherProfile,
  Perencanaan,
  JurnalMengajar,
  RencanaAsesmenItem,
  NilaiSiswa,
  PesertaDidik,
  TindakLanjutData,
  RefleksiEvaluasiData,
} from '../types';
import { downloadElementAsPDF, printElementDirectly } from '../utils/pdfExport';
import { VisualisasiTrenNilai } from './VisualisasiTrenNilai';

interface LaporanViewProps {
  profile: TeacherProfile;
  perencanaanList: Perencanaan[];
  jurnalList: JurnalMengajar[];
  asesmenList: RencanaAsesmenItem[];
  nilaiList: NilaiSiswa[];
  siswaList: PesertaDidik[];
  tindakLanjutList: TindakLanjutData[];
  refleksiList: RefleksiEvaluasiData[];
  onShowToast: (type: 'success' | 'error' | 'info', msg: string) => void;
  onOpenGoogleSheets?: () => void;
}

type DocType =
  | 'visualisasi_tren'
  | 'rekap_jurnal'
  | 'rekap_nilai'
  | 'perencanaan'
  | 'analisis_tindak_lanjut'
  | 'jurnal_harian'
  | 'portofolio_lengkap';

export const LaporanView: React.FC<LaporanViewProps> = ({
  profile,
  perencanaanList,
  jurnalList,
  asesmenList,
  nilaiList,
  siswaList,
  tindakLanjutList,
  refleksiList,
  onShowToast,
  onOpenGoogleSheets,
}) => {
  const [selectedDoc, setSelectedDoc] = useState<DocType>('visualisasi_tren');
  const [selectedKelas, setSelectedKelas] = useState<string>(profile.kelasAktif || 'VII-A');
  const [selectedPlanId, setSelectedPlanId] = useState<string>(perencanaanList[0]?.id || '');
  const [selectedAsesmenId, setSelectedAsesmenId] = useState<string>(asesmenList[0]?.id || '');
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  // Filtered datasets based on active selection
  const activePlan = perencanaanList.find((p) => p.id === selectedPlanId) || perencanaanList[0];
  const activeAsesmen = asesmenList.find((a) => a.id === selectedAsesmenId) || asesmenList[0];
  const classJurnals = jurnalList.filter((j) => !j.kelas || j.kelas === selectedKelas);
  const classStudents = siswaList.filter((s) => !s.kelas || s.kelas === selectedKelas);
  const classGrades = nilaiList.filter(
    (n) => (!n.kelas || n.kelas === selectedKelas) && (!selectedAsesmenId || n.asesmenId === selectedAsesmenId)
  );

  // CSV Exporters
  const downloadCSV = (filename: string, rows: string[][]) => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      rows.map((e) => e.map((val) => `"${(val || '').toString().replace(/"/g, '""')}"`).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onShowToast('success', `Berkas ${filename} berhasil diunduh`);
  };

  const exportJurnalCSV = () => {
    const rows = [
      ['No', 'Tanggal', 'Pertemuan', 'Kelas', 'Jam', 'Topik / Materi', 'Status Ketercapaian', 'Hadir', 'Sakit', 'Izin', 'Alpa', 'Refleksi Guru'],
      ...classJurnals.map((j, idx) => [
        (idx + 1).toString(),
        j.tanggal,
        j.pertemuanKe.toString(),
        j.kelas,
        j.jamKe || j.jamPelajaran || '-',
        j.topikMateri,
        j.statusKetercapaian,
        j.presensi.hadir.toString(),
        j.presensi.sakit.toString(),
        j.presensi.izin.toString(),
        j.presensi.alpa.toString(),
        j.refleksiGuru,
      ]),
      [''],
      ['Mengetahui,', '', '', '', '', '', 'Guru Mata Pelajaran,'],
      [`Kepala ${profile.namaSekolah}`, '', '', '', '', '', profile.namaSekolah],
      [profile.kepalaSekolah?.nama || 'Kepala Sekolah', '', '', '', '', '', profile.namaGuru],
      [
        profile.kepalaSekolah?.nip ? `NIP. ${profile.kepalaSekolah.nip}` : 'NIP. -',
        '',
        '',
        '',
        '',
        '',
        profile.nip ? `NIP. ${profile.nip}` : 'NIP. -',
      ],
    ];
    downloadCSV(`Rekap_Jurnal_Mengajar_${selectedKelas}_${profile.tahunPelajaran.replace('/', '-')}.csv`, rows);
  };

  const exportNilaiCSV = () => {
    const rows = [
      ['No', 'NISN', 'Nama Siswa', 'Kelas', 'Asesmen', 'Nilai', 'Status KKTP', 'Catatan Deskripsi'],
      ...classStudents.map((s, idx) => {
        const grade = classGrades.find((g) => g.siswaId === s.id);
        const score = grade ? grade.nilaiAngka : 75;
        const status = score >= (profile.kktpDefault || 75) ? 'Tuntas' : 'Perlu Penguatan';
        return [
          (idx + 1).toString(),
          s.nisn || s.nis || '-',
          s.nama,
          selectedKelas,
          activeAsesmen?.judulAsesmen || 'Asesmen',
          score.toString(),
          status,
          grade?.catatanDeskripsi || '-',
        ];
      }),
      [''],
      ['Mengetahui,', '', '', '', 'Guru Mata Pelajaran,'],
      [`Kepala ${profile.namaSekolah}`, '', '', '', profile.namaSekolah],
      [profile.kepalaSekolah?.nama || 'Kepala Sekolah', '', '', '', profile.namaGuru],
      [
        profile.kepalaSekolah?.nip ? `NIP. ${profile.kepalaSekolah.nip}` : 'NIP. -',
        '',
        '',
        '',
        profile.nip ? `NIP. ${profile.nip}` : 'NIP. -',
      ],
    ];
    downloadCSV(`Rekap_Nilai_${selectedKelas}_${activeAsesmen?.judulAsesmen || 'Asesmen'}.csv`, rows);
  };

  const exportTrenCSV = () => {
    const formatifAssessments = asesmenList.filter(
      (a) => (!a.kelas || a.kelas === selectedKelas) && (a.jenisAsesmen === 'Formatif' || a.jenisAsesmen === 'Diagnostik/Awal')
    );
    const sumatifAssessments = asesmenList.filter(
      (a) => (!a.kelas || a.kelas === selectedKelas) && a.jenisAsesmen === 'Sumatif'
    );
    const kktp = profile.kktpDefault || 75;

    const rows = [
      ['No', 'NISN', 'Nama Siswa', 'Kelas', 'Rerata Formatif', 'Rerata Sumatif', 'Nilai Akhir (40% F + 60% S)', 'Pertumbuhan (Delta)', 'Kategori KKTP', 'Rekomendasi Tindak Lanjut'],
      ...classStudents.map((s, idx) => {
        const fGrades = nilaiList.filter(
          (n) => n.siswaId === s.id && formatifAssessments.some((fa) => fa.id === n.asesmenId)
        );
        const sGrades = nilaiList.filter(
          (n) => n.siswaId === s.id && sumatifAssessments.some((sa) => sa.id === n.asesmenId)
        );

        const fAvg = fGrades.length > 0
          ? Math.round((fGrades.reduce((acc, curr) => acc + (curr.nilaiAngka || 0), 0) / fGrades.length) * 10) / 10
          : 78;
        const sAvg = sGrades.length > 0
          ? Math.round((sGrades.reduce((acc, curr) => acc + (curr.nilaiAngka || 0), 0) / sGrades.length) * 10) / 10
          : 82;
        const finalScore = Math.round((fAvg * 0.4 + sAvg * 0.6) * 10) / 10;
        const delta = Math.round((sAvg - fAvg) * 10) / 10;
        const kategori = finalScore >= 90 ? 'Mahir' : finalScore >= kktp ? 'Cakap' : finalScore >= 60 ? 'Layak' : 'Baru Berkembang';
        const rekomendasi = kategori === 'Mahir' ? 'Pengayaan & Tutor Sebaya' : kategori === 'Cakap' ? 'Pertahankan Ritme Belajar' : 'Remedial Terfokus';

        return [
          (idx + 1).toString(),
          s.nisn || s.nis || '-',
          s.nama,
          selectedKelas,
          fAvg.toString(),
          sAvg.toString(),
          finalScore.toString(),
          (delta >= 0 ? `+${delta}` : delta.toString()),
          kategori,
          rekomendasi,
        ];
      }),
      [''],
      ['Mengetahui,', '', '', '', '', '', '', '', 'Guru Mata Pelajaran,'],
      [`Kepala ${profile.namaSekolah}`, '', '', '', '', '', '', '', profile.namaSekolah],
      [profile.kepalaSekolah?.nama || 'Kepala Sekolah', '', '', '', '', '', '', '', profile.namaGuru],
      [
        profile.kepalaSekolah?.nip ? `NIP. ${profile.kepalaSekolah.nip}` : 'NIP. -',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        profile.nip ? `NIP. ${profile.nip}` : 'NIP. -',
      ],
    ];
    downloadCSV(`Rekap_Tren_Nilai_Formatif_Sumatif_${selectedKelas}.csv`, rows);
  };

  const getActiveDocTitle = () => {
    switch (selectedDoc) {
      case 'visualisasi_tren':
        return `Visualisasi_Tren_Nilai_Formatif_Sumatif_${selectedKelas}`;
      case 'rekap_jurnal':
        return `Rekap_Jurnal_Tatap_Muka_${selectedKelas}`;
      case 'rekap_nilai':
        return `Rekap_Nilai_${selectedKelas}_${(activeAsesmen?.judulAsesmen || 'Asesmen').replace(/[^a-zA-Z0-9]/g, '_')}`;
      case 'perencanaan':
        return `Modul_Ajar_${(activePlan?.judul || 'RPP').replace(/[^a-zA-Z0-9]/g, '_')}`;
      case 'analisis_tindak_lanjut':
        return `Analisis_Evaluasi_Tindak_Lanjut_${selectedKelas}`;
      case 'jurnal_harian':
        return `Jurnal_Mengajar_Harian_${selectedKelas}`;
      case 'portofolio_lengkap':
        return `Portofolio_Administrasi_Guru_${selectedKelas}`;
      default:
        return `Dokumen_Laporan_${selectedKelas}`;
    }
  };

  const handleDownloadPDF = async () => {
    setIsExportingPDF(true);
    const targetElementId = selectedDoc === 'visualisasi_tren' ? 'visualisasi-recharts-dashboard' : 'dokumen-laporan-cetak';
    const filename = `${getActiveDocTitle()}.pdf`;
    const docTitle = `Dokumen ${selectedDoc.replace(/_/g, ' ').toUpperCase()}`;
    const ok = await downloadElementAsPDF(targetElementId, filename, { title: docTitle });
    if (ok) {
      onShowToast('success', `Dokumen ${filename} berhasil diunduh dalam format PDF.`);
    } else {
      onShowToast('error', 'Gagal memproses berkas PDF. Silakan coba gunakan fitur Cetak Dokumen.');
    }
    setIsExportingPDF(false);
  };

  const handlePrint = () => {
    const targetElementId = selectedDoc === 'visualisasi_tren' ? 'visualisasi-recharts-dashboard' : 'dokumen-laporan-cetak';
    printElementDirectly(targetElementId, getActiveDocTitle());
  };

  return (
    <div className="space-y-6" id="laporan-view-container">
      {/* Top Options Bar (No Print) */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs no-print space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <FileSpreadsheet className="w-5 h-5 text-purple-600" />
              <span>Pusat Laporan & Ekspor Administrasi Guru</span>
            </h3>
            <p className="text-xs text-slate-500">
              Cetak atau ekspor berkas administrasi siap telaah pengawas, kepala sekolah, dan arsip guru.
            </p>
          </div>

          <div className="flex items-center space-x-2 flex-wrap gap-y-2">
            {selectedDoc === 'visualisasi_tren' && (
              <button
                type="button"
                onClick={exportTrenCSV}
                className="px-3 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold flex items-center space-x-1.5"
              >
                <Download className="w-4 h-4 text-emerald-600" />
                <span>Unduh CSV Tren Nilai</span>
              </button>
            )}
            {selectedDoc === 'rekap_jurnal' && (
              <button
                type="button"
                onClick={exportJurnalCSV}
                className="px-3 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold flex items-center space-x-1.5"
              >
                <Download className="w-4 h-4 text-emerald-600" />
                <span>Unduh CSV Jurnal</span>
              </button>
            )}
            {selectedDoc === 'rekap_nilai' && (
              <button
                type="button"
                onClick={exportNilaiCSV}
                className="px-3 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold flex items-center space-x-1.5"
              >
                <Download className="w-4 h-4 text-emerald-600" />
                <span>Unduh CSV Nilai</span>
              </button>
            )}

            {/* Direct PDF Download Button */}
            <button
              type="button"
              disabled={isExportingPDF}
              onClick={handleDownloadPDF}
              id="btn-download-pdf-laporan"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-2xs transition-all disabled:opacity-60"
            >
              {isExportingPDF ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memproses PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Unduh Dokumen PDF</span>
                </>
              )}
            </button>

            {/* Direct Print Button */}
            <button
              type="button"
              onClick={handlePrint}
              id="btn-print-laporan"
              className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-800 rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-2xs transition-all"
            >
              <Printer className="w-4 h-4 text-indigo-600" />
              <span>Cetak Dokumen</span>
            </button>

            {/* Google Sheets & AppSheet Cloud Sync Button */}
            {onOpenGoogleSheets && (
              <button
                type="button"
                onClick={onOpenGoogleSheets}
                className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-2xs transition-all"
                title="Buka atau sinkronkan data ke Google Sheets & AppSheet"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span className="hidden sm:inline">Google Sheets & AppSheet</span>
                <span className="sm:hidden">Sheets</span>
              </button>
            )}
          </div>
        </div>

        {/* Document Switcher */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 pt-2 border-t border-slate-100 text-xs">
          {[
            { id: 'visualisasi_tren' as DocType, label: 'Visualisasi Tren Nilai', icon: TrendingUp },
            { id: 'rekap_jurnal' as DocType, label: 'Rekap Jurnal Tatap Muka', icon: BookOpenCheck },
            { id: 'rekap_nilai' as DocType, label: 'Daftar Nilai Siswa', icon: Award },
            { id: 'perencanaan' as DocType, label: 'Modul Ajar / RPP', icon: FileText },
            { id: 'analisis_tindak_lanjut' as DocType, label: 'Analisis & Tindak Lanjut', icon: HeartHandshake },
            { id: 'jurnal_harian' as DocType, label: 'Jurnal Harian Tunggal', icon: BookOpenCheck },
            { id: 'portofolio_lengkap' as DocType, label: 'Cover & Portofolio', icon: FolderArchive },
          ].map((doc) => {
            const Icon = doc.icon;
            const isSelected = selectedDoc === doc.id;
            return (
              <button
                key={doc.id}
                onClick={() => setSelectedDoc(doc.id)}
                className={`p-2.5 rounded-lg border text-left transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 font-bold shadow-2xs'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-600 font-medium'
                }`}
              >
                <Icon className={`w-4 h-4 mb-1.5 ${isSelected ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span className="leading-tight text-[11px]">{doc.label}</span>
              </button>
            );
          })}
        </div>

        {/* Dynamic Filters depending on document */}
        <div className="flex items-center space-x-3 text-xs bg-slate-50 p-2 rounded-lg border border-slate-200">
          <div className="flex items-center space-x-1">
            <span className="font-semibold text-slate-700">Pilih Kelas:</span>
            <select
              value={selectedKelas}
              onChange={(e) => setSelectedKelas(e.target.value)}
              className="bg-white border rounded px-2 py-1"
            >
              {profile.kelasList.map((k) => (
                <option key={k} value={k}>
                  Kelas {k}
                </option>
              ))}
            </select>
          </div>

          {selectedDoc === 'perencanaan' && (
            <div className="flex items-center space-x-1">
              <span className="font-semibold text-slate-700">Pilih Dokumen:</span>
              <select
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                className="bg-white border rounded px-2 py-1 max-w-xs truncate"
              >
                {perencanaanList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.judul}
                  </option>
                ))}
              </select>
            </div>
          )}

          {selectedDoc === 'rekap_nilai' && (
            <div className="flex items-center space-x-1">
              <span className="font-semibold text-slate-700">Pilih Asesmen:</span>
              <select
                value={selectedAsesmenId}
                onChange={(e) => setSelectedAsesmenId(e.target.value)}
                className="bg-white border rounded px-2 py-1 max-w-xs truncate"
              >
                {asesmenList.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.judulAsesmen}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* 1. VISUALISASI TREN NILAI (RECHARTS) VIEW */}
      {/* ============================================================ */}
      {selectedDoc === 'visualisasi_tren' ? (
        <VisualisasiTrenNilai
          profile={profile}
          asesmenList={asesmenList}
          nilaiList={nilaiList}
          siswaList={siswaList}
          selectedKelas={selectedKelas}
          onSelectKelas={setSelectedKelas}
          onShowToast={onShowToast}
          onDownloadPDF={handleDownloadPDF}
          onPrint={handlePrint}
        />
      ) : (
        /* ============================================================ */
        /* 2. PRINTABLE PREVIEW CANVAS (Standard Indonesian Official Format) */
        /* ============================================================ */
        <div id="dokumen-laporan-cetak" className="bg-white rounded-xl border border-slate-200 shadow-xs p-8 sm:p-12 print:border-none print:shadow-none print:p-0 print-clean">
        {/* Kop Surat Standar Satuan Pendidikan */}
        <div className="text-center border-b-2 border-slate-900 pb-3 mb-6">
          <h2 className="text-base sm:text-lg font-bold uppercase tracking-wider text-slate-900">
            PEMERINTAH KABUPATEN / KOTA DINAS PENDIDIKAN
          </h2>
          <h1 className="text-lg sm:text-xl font-extrabold uppercase text-slate-900 leading-tight">
            {profile.namaSekolah}
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            NPSN: {profile.npsn || '20104523'} • Kurikulum Merdeka • Fase D (SMP/MTs)
          </p>
          <p className="text-xs text-slate-500">
            Tahun Pelajaran {profile.tahunPelajaran} • Semester {profile.semesterAktif} • MKPS-SMP_GARUT
          </p>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* VIEW 1: REKAP JURNAL MENGAJAR SEMESTER */}
        {/* ------------------------------------------------------------- */}
        {selectedDoc === 'rekap_jurnal' && (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <h3 className="text-sm sm:text-base font-bold uppercase underline">
                REKAPITULASI JURNAL MENGAJAR TATAP MUKA
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                Mata Pelajaran: <strong>{profile.mataPelajaran}</strong> | Kelas: <strong>{selectedKelas}</strong>
              </p>
            </div>

            <table className="w-full text-left text-[11px] border-collapse border border-slate-900">
              <thead>
                <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-900 text-center">
                  <th className="border border-slate-900 p-2 w-8">No</th>
                  <th className="border border-slate-900 p-2 w-20">Tanggal</th>
                  <th className="border border-slate-900 p-2 w-12">P.Ke</th>
                  <th className="border border-slate-900 p-2">Materi Pembelajaran</th>
                  <th className="border border-slate-900 p-2 w-32">Ketercapaian</th>
                  <th className="border border-slate-900 p-2 w-28">Presensi</th>
                  <th className="border border-slate-900 p-2">Refleksi / Catatan Guru</th>
                </tr>
              </thead>
              <tbody>
                {classJurnals.map((j, idx) => (
                  <tr key={j.id} className="border-b border-slate-900">
                    <td className="border border-slate-900 p-2 text-center">{idx + 1}</td>
                    <td className="border border-slate-900 p-2 text-center whitespace-nowrap">{j.tanggal}</td>
                    <td className="border border-slate-900 p-2 text-center font-bold">{j.pertemuanKe}</td>
                    <td className="border border-slate-900 p-2">
                      <div className="font-semibold text-slate-900">{j.topikMateri}</div>
                      <div className="text-[10px] text-slate-600 line-clamp-1">{j.kegiatanTerlaksana}</div>
                    </td>
                    <td className="border border-slate-900 p-2 text-center font-medium">
                      {j.statusKetercapaian}
                    </td>
                    <td className="border border-slate-900 p-2 text-center text-[10px]">
                      H:{j.presensi.hadir} S:{j.presensi.sakit} I:{j.presensi.izin} A:{j.presensi.alpa}
                    </td>
                    <td className="border border-slate-900 p-2 text-[10px] italic">
                      {j.refleksiGuru || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* VIEW 2: REKAP DAFTAR NILAI SISWA */}
        {/* ------------------------------------------------------------- */}
        {selectedDoc === 'rekap_nilai' && (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <h3 className="text-sm sm:text-base font-bold uppercase underline">
                DAFTAR NILAI DAN KETERCAPAIAN KOMPETENSI SISWA
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                Asesmen: <strong>{activeAsesmen?.judulAsesmen}</strong> | Kelas: <strong>{selectedKelas}</strong> | Ambang KKTP: <strong>{profile.kktpDefault || 75}</strong>
              </p>
            </div>

            <table className="w-full text-left text-[11px] border-collapse border border-slate-900">
              <thead>
                <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-900 text-center">
                  <th className="border border-slate-900 p-2 w-8">No</th>
                  <th className="border border-slate-900 p-2 w-24">NISN</th>
                  <th className="border border-slate-900 p-2 min-w-[150px]">Nama Peserta Didik</th>
                  <th className="border border-slate-900 p-2 w-16">Nilai</th>
                  <th className="border border-slate-900 p-2 w-24">Status KKTP</th>
                  <th className="border border-slate-900 p-2">Deskripsi Capaian Kompetensi</th>
                </tr>
              </thead>
              <tbody>
                {classStudents.map((s, idx) => {
                  const grade = classGrades.find((g) => g.siswaId === s.id);
                  const score = grade ? grade.nilaiAngka : 75;
                  const isTuntas = score >= (profile.kktpDefault || 75);

                  return (
                    <tr key={s.id} className="border-b border-slate-900">
                      <td className="border border-slate-900 p-2 text-center">{idx + 1}</td>
                      <td className="border border-slate-900 p-2 text-center font-mono">{s.nisn}</td>
                      <td className="border border-slate-900 p-2 font-semibold">{s.nama}</td>
                      <td className="border border-slate-900 p-2 text-center font-bold">{score}</td>
                      <td className="border border-slate-900 p-2 text-center">
                        {isTuntas ? 'Tuntas' : 'Perlu Bimbingan'}
                      </td>
                      <td className="border border-slate-900 p-2 text-[10px]">
                        {grade?.catatanDeskripsi || 'Menunjukkan capaian pemahaman yang sesuai harapan.'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* VIEW 3: DOKUMEN MODUL AJAR (PERENCANAAN) */}
        {/* ------------------------------------------------------------- */}
        {selectedDoc === 'perencanaan' && activePlan && (
          <div className="space-y-4 text-xs">
            <div className="text-center mb-4">
              <h3 className="text-base font-bold uppercase underline">
                MODUL AJAR / RPP PEMBELAJARAN MENDALAM
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                Topik: <strong>{activePlan.identitas.topikMateri}</strong> | Kelas: <strong>{activePlan.identitas.kelas}</strong>
              </p>
            </div>

            <div className="border border-slate-900 p-3 mb-3">
              <h4 className="font-bold border-b border-slate-900 pb-1 mb-2">I. IDENTITAS PEMBELAJARAN</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>Mata Pelajaran: <strong>{activePlan.identitas.mataPelajaran}</strong></div>
                <div>Fase / Kelas: <strong>{activePlan.identitas.fase} / {activePlan.identitas.kelas}</strong></div>
                <div>Alokasi Waktu: <strong>{activePlan.identitas.alokasiWaktu}</strong></div>
                <div>Pertemuan Ke: <strong>{activePlan.identitas.pertemuanKe || 1}</strong></div>
              </div>
            </div>

            <div className="border border-slate-900 p-3 mb-3">
              <h4 className="font-bold border-b border-slate-900 pb-1 mb-2">II. TUJUAN PEMBELAJARAN</h4>
              <p className="leading-relaxed whitespace-pre-wrap">{activePlan.tujuanPembelajaran.tujuanPembelajaran}</p>
              <div className="mt-2 font-semibold">Indikator Ketercapaian:</div>
              <p className="whitespace-pre-wrap text-slate-700">{activePlan.tujuanPembelajaran.indikatorKetercapaian}</p>
            </div>

            <div className="border border-slate-900 p-3 mb-3">
              <h4 className="font-bold border-b border-slate-900 pb-1 mb-2">III. LANGKAH PEMBELAJARAN</h4>
              <div className="space-y-2">
                <div>
                  <strong>A. Pendahuluan ({activePlan.rencanaKegiatan.durasiPendahuluan}):</strong>
                  <p className="whitespace-pre-wrap mt-0.5">{activePlan.rencanaKegiatan.pendahuluan}</p>
                </div>
                <div>
                  <strong>B. Kegiatan Inti ({activePlan.rencanaKegiatan.durasiInti}):</strong>
                  <p className="whitespace-pre-wrap mt-0.5">{activePlan.rencanaKegiatan.kegiatanInti}</p>
                </div>
                <div>
                  <strong>C. Penutup ({activePlan.rencanaKegiatan.durasiPenutup}):</strong>
                  <p className="whitespace-pre-wrap mt-0.5">{activePlan.rencanaKegiatan.penutup}</p>
                </div>
              </div>
            </div>

            <div className="border border-slate-900 p-3">
              <h4 className="font-bold border-b border-slate-900 pb-1 mb-2">IV. RENCANA ASESMEN</h4>
              <div className="grid grid-cols-3 gap-2">
                <div><strong>Awal:</strong> {activePlan.rencanaAsesmen.asesmenAwal || '-'}</div>
                <div><strong>Proses:</strong> {activePlan.rencanaAsesmen.asesmenProses || '-'}</div>
                <div><strong>Akhir:</strong> {activePlan.rencanaAsesmen.asesmenAkhir || '-'}</div>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* VIEW 4: LEMBAR ANALISIS & TINDAK LANJUT */}
        {/* ------------------------------------------------------------- */}
        {selectedDoc === 'analisis_tindak_lanjut' && (
          <div className="space-y-4 text-xs">
            <div className="text-center mb-4">
              <h3 className="text-base font-bold uppercase underline">
                LEMBAR ANALISIS EVALUASI & TINDAK LANJUT
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                Tahun Pelajaran: {profile.tahunPelajaran} • Kelas: {selectedKelas}
              </p>
            </div>

            <div className="border border-slate-900 p-3">
              <h4 className="font-bold border-b border-slate-900 pb-1 mb-2">A. ANALISIS HASIL BELAJAR</h4>
              <p className="leading-relaxed">
                Berdasarkan evaluasi terhadap materi {activeAsesmen?.topikMateri || 'pembelajaran'}, mayoritas peserta didik telah mencapai ambang Kriteria Ketercapaian Tujuan Pembelajaran (KKTP). Bagi peserta didik yang belum tuntas, diadakan program pendampingan remedial secara terarah.
              </p>
            </div>

            <div className="border border-slate-900 p-3">
              <h4 className="font-bold border-b border-slate-900 pb-1 mb-2">B. PROGRAM REMEDIAL</h4>
              <p className="mb-2"><strong>Bentuk Pendampingan:</strong> Bimbingan terfokus dan tutor sebaya dalam kelompok kecil santai.</p>
              <p><strong>Materi Pengulangan:</strong> Penguatan konsep mendasar dan latihan bertahap.</p>
            </div>

            <div className="border border-slate-900 p-3">
              <h4 className="font-bold border-b border-slate-900 pb-1 mb-2">C. PROGRAM PENGAYAAN</h4>
              <p className="mb-2"><strong>Bentuk Aktivitas:</strong> Studi kasus penyelidikan mandiri dan pembuatan karya edukatif.</p>
              <p><strong>Tujuan:</strong> Menumbuhkan daya nalar kritis dan kreativitas pemecahan masalah.</p>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* VIEW 5: JURNAL HARIAN TUNGGAL */}
        {/* ------------------------------------------------------------- */}
        {selectedDoc === 'jurnal_harian' && classJurnals[0] && (
          <div className="space-y-4 text-xs">
            <div className="text-center mb-4">
              <h3 className="text-base font-bold uppercase underline">
                LEMBAR JURNAL PELAKSANAAN HARIAN
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                Pertemuan Ke-{classJurnals[0].pertemuanKe} • {classJurnals[0].tanggal}
              </p>
            </div>

            <div className="border border-slate-900 p-4 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>Mata Pelajaran: <strong>{profile.mataPelajaran}</strong></div>
                <div>Kelas / Jam: <strong>{classJurnals[0].kelas} / {classJurnals[0].jamKe}</strong></div>
                <div className="col-span-2">Topik: <strong>{classJurnals[0].topikMateri}</strong></div>
              </div>
              <div className="border-t border-slate-300 pt-2">
                <strong>Kegiatan yang Terlaksana:</strong>
                <p className="whitespace-pre-wrap mt-1">{classJurnals[0].kegiatanTerlaksana}</p>
              </div>
              <div className="border-t border-slate-300 pt-2">
                <strong>Catatan Kejadian & Solusi:</strong>
                <p className="mt-1">{classJurnals[0].solusiTindakan || 'Pembelajaran terlaksana dengan tertib dan lancar.'}</p>
              </div>
              <div className="border-t border-slate-300 pt-2">
                <strong>Refleksi Guru:</strong>
                <p className="mt-1 italic">{classJurnals[0].refleksiGuru}</p>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* VIEW 6: COVER & PORTOFOLIO */}
        {/* ------------------------------------------------------------- */}
        {selectedDoc === 'portofolio_lengkap' && (
          <div className="text-center py-16 space-y-6">
            <div className="border-4 border-double border-slate-900 p-12 max-w-xl mx-auto space-y-8">
              <div className="space-y-2">
                <h2 className="text-xl font-extrabold uppercase tracking-widest text-slate-900">
                  BUKU ADMINISTRASI PEMBELAJARAN
                </h2>
                <h3 className="text-sm font-semibold text-slate-700 tracking-wider">
                  KURIKULUM MERDEKA • PEMBELAJARAN MENDALAM
                </h3>
              </div>

              <div className="py-8 space-y-2">
                <p className="text-xs uppercase text-slate-500">Mata Pelajaran</p>
                <p className="text-lg font-bold text-slate-900">{profile.mataPelajaran}</p>
                <p className="text-sm font-semibold text-slate-700">Fase D (SMP/MTs)</p>
              </div>

              <div className="border-t border-slate-400 pt-6 space-y-2">
                <p className="text-xs text-slate-500 uppercase">Disusun Oleh:</p>
                <p className="text-base font-bold text-slate-900">{profile.namaGuru}</p>
                {profile.nip && <p className="text-xs text-slate-600">NIP. {profile.nip}</p>}

                <div className="pt-2 text-xs text-slate-700">
                  <span className="text-slate-500 uppercase block text-[10px]">Mengetahui Kepala Sekolah:</span>
                  <p className="font-bold text-slate-900">
                    {profile.kepalaSekolah?.nama || 'Kepala Sekolah'}
                  </p>
                  {profile.kepalaSekolah?.nip && (
                    <p className="text-slate-600 text-[11px]">NIP. {profile.kepalaSekolah.nip}</p>
                  )}
                </div>

                <p className="text-sm font-semibold text-slate-800 pt-3">{profile.namaSekolah}</p>
                <p className="text-xs text-slate-600">Tahun Pelajaran {profile.tahunPelajaran}</p>
              </div>
            </div>
          </div>
        )}

        {/* Tanda Tangan Resmi Pengesahan (Kepala Sekolah & Guru Mata Pelajaran) */}
        <div className="mt-12 pt-6 grid grid-cols-2 text-xs text-slate-900 text-center gap-8">
          <div>
            <p>Mengetahui,</p>
            <p className="font-semibold">Kepala {profile.namaSekolah}</p>
            <div className="h-20" />
            <p className="font-bold underline text-slate-950">
              {profile.kepalaSekolah?.nama || 'Kepala Sekolah'}
            </p>
            <p className="text-[11px] text-slate-600">
              {profile.kepalaSekolah?.nip ? `NIP. ${profile.kepalaSekolah.nip}` : 'NIP. -'}
            </p>
          </div>

          <div>
            <p>Guru Mata Pelajaran,</p>
            <div className="h-24" />
            <p className="font-bold underline text-slate-950">{profile.namaGuru}</p>
            <p className="text-[11px] text-slate-600">
              {profile.nip ? `NIP. ${profile.nip}` : 'Guru Mata Pelajaran'}
            </p>
          </div>
        </div>

        {/* Footnote Dokumen Resmi Cetak */}
        <div className="mt-8 pt-3 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500">
          <span>Format Administrasi Guru SMP Berbasis Kurikulum Merdeka</span>
          <span className="font-bold text-slate-700 tracking-wider">MKPS-SMP_GARUT</span>
        </div>
      </div>
      )}
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  Award,
  Users,
  Target,
  Filter,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Layers,
  ArrowUpDown,
  BookOpen,
} from 'lucide-react';
import {
  TeacherProfile,
  RencanaAsesmenItem,
  NilaiSiswa,
  PesertaDidik,
} from '../types';

interface EvaluasiVisualisasiNilaiProps {
  profile: TeacherProfile;
  asesmenList: RencanaAsesmenItem[];
  nilaiList: NilaiSiswa[];
  siswaList: PesertaDidik[];
  selectedKelas: string;
  onSelectKelas?: (kelas: string) => void;
  kktpThreshold: number;
  onUpdateKktp?: (val: number) => void;
  onShowToast?: (type: 'success' | 'error' | 'info', msg: string) => void;
}

type VisualisasiMode =
  | 'distribusi_mapel'
  | 'rata_rata_mapel'
  | 'nilai_per_siswa'
  | 'kategori_kktp';

const BRACKET_COLORS = {
  perluBimbingan: '#EF4444', // Red / Rose (<60)
  belumTuntas: '#F59E0B',    // Amber (60 - 74)
  tuntasCakap: '#3B82F6',    // Blue (75 - 84)
  mahir: '#10B981',          // Emerald (85 - 100)
};

export const EvaluasiVisualisasiNilai: React.FC<EvaluasiVisualisasiNilaiProps> = ({
  profile,
  asesmenList,
  nilaiList,
  siswaList,
  selectedKelas,
  onSelectKelas,
  kktpThreshold,
  onUpdateKktp,
  onShowToast,
}) => {
  const [activeMode, setActiveMode] = useState<VisualisasiMode>('distribusi_mapel');
  const [selectedMapelFilter, setSelectedMapelFilter] = useState<string>('all');
  const [selectedAsesmenFilter, setSelectedAsesmenFilter] = useState<string>('all');
  const [selectedJenisFilter, setSelectedJenisFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'nama' | 'nilai_desc' | 'nilai_asc'>('nilai_desc');

  // Extract all available subjects across profile and assessments
  const availableMapelList = useMemo(() => {
    const set = new Set<string>();
    if (profile.mataPelajaran) set.add(profile.mataPelajaran);
    asesmenList.forEach((a) => {
      if (a.mataPelajaran?.trim()) set.add(a.mataPelajaran.trim());
    });
    return Array.from(set);
  }, [profile.mataPelajaran, asesmenList]);

  // Filter students by selected class
  const classStudents = useMemo(() => {
    return siswaList.filter((s) => !s.kelas || s.kelas === selectedKelas);
  }, [siswaList, selectedKelas]);

  // Filter assessments
  const filteredAssessments = useMemo(() => {
    return asesmenList.filter((a) => {
      const matchKelas = !a.kelas || a.kelas === selectedKelas;
      const matchMapel =
        selectedMapelFilter === 'all' ||
        (a.mataPelajaran || profile.mataPelajaran) === selectedMapelFilter;
      const matchJenis =
        selectedJenisFilter === 'all' || a.jenisAsesmen === selectedJenisFilter;
      return matchKelas && matchMapel && matchJenis;
    });
  }, [asesmenList, selectedKelas, selectedMapelFilter, selectedJenisFilter, profile.mataPelajaran]);

  // Compile all relevant grades
  const relevantGrades = useMemo(() => {
    return nilaiList.filter((n) => {
      const matchKelas = !n.kelas || n.kelas === selectedKelas;
      if (!matchKelas) return false;
      const relatedAsesmen = asesmenList.find((a) => a.id === n.asesmenId);
      if (!relatedAsesmen) return true;
      const matchMapel =
        selectedMapelFilter === 'all' ||
        (relatedAsesmen.mataPelajaran || profile.mataPelajaran) === selectedMapelFilter;
      const matchAsesmen =
        selectedAsesmenFilter === 'all' || n.asesmenId === selectedAsesmenFilter;
      const matchJenis =
        selectedJenisFilter === 'all' ||
        relatedAsesmen.jenisAsesmen === selectedJenisFilter;
      return matchMapel && matchAsesmen && matchJenis;
    });
  }, [
    nilaiList,
    selectedKelas,
    asesmenList,
    selectedMapelFilter,
    selectedAsesmenFilter,
    selectedJenisFilter,
    profile.mataPelajaran,
  ]);

  // 1. DATA DISTRIBUSI NILAI PER MATA PELAJARAN (atau per Lingkup Asesmen jika mapel tunggal)
  const distributionData = useMemo(() => {
    // If multiple subjects exist, group by subject.
    // If only 1 subject exists, group by assessment/topic so teacher gets clear distribution comparison bars!
    const isMultiMapel = availableMapelList.length > 1 && selectedMapelFilter === 'all';

    if (isMultiMapel) {
      return availableMapelList.map((mapel) => {
        const mapelAsesmenIds = asesmenList
          .filter((a) => (a.mataPelajaran || profile.mataPelajaran) === mapel)
          .map((a) => a.id);

        const grades = relevantGrades.filter((g) => mapelAsesmenIds.includes(g.asesmenId));
        const scores = grades.map((g) => g.nilaiAngka ?? 75);
        const total = scores.length;
        const sum = scores.reduce((a, b) => a + b, 0);
        const rataRata = total > 0 ? Math.round((sum / total) * 10) / 10 : 0;

        const perluBimbingan = scores.filter((s) => s < 60).length;
        const belumTuntas = scores.filter((s) => s >= 60 && s < kktpThreshold).length;
        const tuntasCakap = scores.filter((s) => s >= kktpThreshold && s < 85).length;
        const mahir = scores.filter((s) => s >= 85).length;
        const tuntasTotal = tuntasCakap + mahir;
        const persentaseTuntas = total > 0 ? Math.round((tuntasTotal / total) * 100) : 0;

        return {
          namaKelompok: mapel.length > 18 ? mapel.substring(0, 16) + '...' : mapel,
          namaLengkap: mapel,
          totalSiswa: total,
          rataRata,
          perluBimbingan,
          belumTuntas,
          tuntasCakap,
          mahir,
          persentaseTuntas,
        };
      });
    }

    // Single subject mode: breakdown by each assessment/topic
    return filteredAssessments.map((a) => {
      const grades = relevantGrades.filter((g) => g.asesmenId === a.id);
      const scores = grades.map((g) => g.nilaiAngka ?? 75);
      const total = scores.length;
      const sum = scores.reduce((acc, curr) => acc + curr, 0);
      const rataRata = total > 0 ? Math.round((sum / total) * 10) / 10 : 0;

      const perluBimbingan = scores.filter((s) => s < 60).length;
      const belumTuntas = scores.filter((s) => s >= 60 && s < kktpThreshold).length;
      const tuntasCakap = scores.filter((s) => s >= kktpThreshold && s < 85).length;
      const mahir = scores.filter((s) => s >= 85).length;
      const tuntasTotal = tuntasCakap + mahir;
      const persentaseTuntas = total > 0 ? Math.round((tuntasTotal / total) * 100) : 0;

      const shortTitle =
        a.judulAsesmen.length > 20 ? a.judulAsesmen.substring(0, 18) + '...' : a.judulAsesmen;

      return {
        namaKelompok: shortTitle,
        namaLengkap: a.judulAsesmen,
        jenis: a.jenisAsesmen,
        totalSiswa: total,
        rataRata,
        perluBimbingan,
        belumTuntas,
        tuntasCakap,
        mahir,
        persentaseTuntas,
      };
    });
  }, [
    availableMapelList,
    selectedMapelFilter,
    asesmenList,
    relevantGrades,
    filteredAssessments,
    kktpThreshold,
    profile.mataPelajaran,
  ]);

  // 2. DATA RATA-RATA NILAI & AMBANG KKTP
  const averageData = useMemo(() => {
    return distributionData.map((d) => ({
      nama: d.namaKelompok,
      namaLengkap: d.namaLengkap,
      rataRata: d.rataRata,
      totalSiswa: d.totalSiswa,
      kktp: kktpThreshold,
      isTuntas: d.rataRata >= kktpThreshold,
      persentaseTuntas: d.persentaseTuntas,
    }));
  }, [distributionData, kktpThreshold]);

  // 3. DATA NILAI PER SISWA
  const studentScoresData = useMemo(() => {
    // If specific assessment selected, use that assessment's grades
    // Otherwise calculate average per student
    const activeAsesmenId =
      selectedAsesmenFilter !== 'all' ? selectedAsesmenFilter : filteredAssessments[0]?.id;

    const data = classStudents.map((siswa) => {
      let score = 75;
      if (activeAsesmenId) {
        const found = relevantGrades.find(
          (g) => g.siswaId === siswa.id && g.asesmenId === activeAsesmenId,
        );
        score = found?.nilaiAngka ?? 75;
      } else {
        const studentGrades = relevantGrades.filter((g) => g.siswaId === siswa.id);
        if (studentGrades.length > 0) {
          const sum = studentGrades.reduce((a, b) => a + (b.nilaiAngka ?? 75), 0);
          score = Math.round(sum / studentGrades.length);
        }
      }

      return {
        id: siswa.id,
        nama: siswa.nama.length > 16 ? siswa.nama.substring(0, 14) + '...' : siswa.nama,
        namaLengkap: siswa.nama,
        nisn: siswa.nisn || siswa.nis || '-',
        nilai: score,
        isTuntas: score >= kktpThreshold,
        status: score >= kktpThreshold ? 'Tuntas KKTP' : 'Perlu Penguatan',
      };
    });

    if (sortBy === 'nilai_desc') {
      return [...data].sort((a, b) => b.nilai - a.nilai);
    } else if (sortBy === 'nilai_asc') {
      return [...data].sort((a, b) => a.nilai - b.nilai);
    } else {
      return [...data].sort((a, b) => a.namaLengkap.localeCompare(b.namaLengkap));
    }
  }, [
    classStudents,
    selectedAsesmenFilter,
    filteredAssessments,
    relevantGrades,
    kktpThreshold,
    sortBy,
  ]);

  // 4. DATA PIE / DONUT KELOMPOK KKTP
  const pieDistributionData = useMemo(() => {
    let perluBimbingan = 0;
    let belumTuntas = 0;
    let tuntasCakap = 0;
    let mahir = 0;

    relevantGrades.forEach((g) => {
      const score = g.nilaiAngka ?? 75;
      if (score < 60) perluBimbingan++;
      else if (score < kktpThreshold) belumTuntas++;
      else if (score < 85) tuntasCakap++;
      else mahir++;
    });

    const total = perluBimbingan + belumTuntas + tuntasCakap + mahir || 1;

    return [
      {
        name: 'Mahir (85 - 100)',
        value: mahir,
        percent: Math.round((mahir / total) * 100),
        color: BRACKET_COLORS.mahir,
      },
      {
        name: 'Cakap / Tuntas (75 - 84)',
        value: tuntasCakap,
        percent: Math.round((tuntasCakap / total) * 100),
        color: BRACKET_COLORS.tuntasCakap,
      },
      {
        name: `Belum Tuntas (60 - ${kktpThreshold - 1})`,
        value: belumTuntas,
        percent: Math.round((belumTuntas / total) * 100),
        color: BRACKET_COLORS.belumTuntas,
      },
      {
        name: 'Perlu Bimbingan (< 60)',
        value: perluBimbingan,
        percent: Math.round((perluBimbingan / total) * 100),
        color: BRACKET_COLORS.perluBimbingan,
      },
    ].filter((item) => item.value > 0);
  }, [relevantGrades, kktpThreshold]);

  // Global Key Statistics
  const overallStats = useMemo(() => {
    const scores = relevantGrades.map((g) => g.nilaiAngka ?? 75);
    const total = scores.length;
    if (total === 0) {
      return { total: 0, rataRata: 0, tuntas: 0, persentase: 0, max: 0, min: 0 };
    }
    const sum = scores.reduce((a, b) => a + b, 0);
    const rataRata = Math.round((sum / total) * 10) / 10;
    const tuntas = scores.filter((s) => s >= kktpThreshold).length;
    const persentase = Math.round((tuntas / total) * 100);
    const max = Math.max(...scores);
    const min = Math.min(...scores);
    return { total, rataRata, tuntas, persentase, max, min };
  }, [relevantGrades, kktpThreshold]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-6">
      {/* Visual Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-bold text-slate-800 text-sm sm:text-base leading-tight">
                Visualisasi Grafik Distribusi Nilai Siswa (Recharts)
              </h3>
              <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/80 px-2 py-0.5 rounded-full">
                Interaktif
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Distribusi capaian hasil belajar per mata pelajaran, ketercapaian KKTP, dan komparasi nilai siswa
            </p>
          </div>
        </div>

        {/* View Mode Buttons */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold overflow-x-auto self-start lg:self-auto">
          <button
            type="button"
            onClick={() => setActiveMode('distribusi_mapel')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 whitespace-nowrap ${
              activeMode === 'distribusi_mapel'
                ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Distribusi Rentang Nilai</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMode('rata_rata_mapel')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 whitespace-nowrap ${
              activeMode === 'rata_rata_mapel'
                ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Rata-Rata & KKTP</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMode('nilai_per_siswa')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 whitespace-nowrap ${
              activeMode === 'nilai_per_siswa'
                ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Grafik Siswa</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMode('kategori_kktp')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 whitespace-nowrap ${
              activeMode === 'kategori_kktp'
                ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            <span>Proporsi Kelulusan</span>
          </button>
        </div>
      </div>

      {/* Filter Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/80 text-xs">
        {/* Filter Mapel */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
            Mata Pelajaran:
          </label>
          <select
            value={selectedMapelFilter}
            onChange={(e) => setSelectedMapelFilter(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
          >
            <option value="all">Semua Mata Pelajaran ({availableMapelList.length})</option>
            {availableMapelList.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        {/* Filter Jenis Asesmen */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
            Jenis Asesmen:
          </label>
          <select
            value={selectedJenisFilter}
            onChange={(e) => setSelectedJenisFilter(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
          >
            <option value="all">Semua Jenis Asesmen</option>
            <option value="Formatif">Formatif</option>
            <option value="Sumatif">Sumatif</option>
            <option value="Diagnostik/Awal">Diagnostik / Awal</option>
          </select>
        </div>

        {/* Filter Asesmen Spesifik */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
            Fokus Asesmen / Materi:
          </label>
          <select
            value={selectedAsesmenFilter}
            onChange={(e) => setSelectedAsesmenFilter(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden truncate"
          >
            <option value="all">Semua Instrumen Asesmen</option>
            {filteredAssessments.map((a) => (
              <option key={a.id} value={a.id}>
                {a.judulAsesmen}
              </option>
            ))}
          </select>
        </div>

        {/* KKTP Threshold Slider / Input */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[11px] font-semibold text-slate-600">Ambang KKTP:</label>
            <span className="font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200">
              {kktpThreshold}
            </span>
          </div>
          <input
            type="range"
            min={50}
            max={90}
            step={1}
            value={kktpThreshold}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              if (onUpdateKktp) onUpdateKktp(val);
            }}
            className="w-full accent-indigo-600 cursor-pointer"
          />
        </div>
      </div>

      {/* Mini Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 bg-slate-50/60 rounded-xl border border-slate-200/80">
          <span className="text-[11px] text-slate-500 font-medium">Rata-Rata Nilai</span>
          <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5">
            {overallStats.rataRata}
          </div>
          <span className="text-[10px] text-slate-400">Dari total {overallStats.total} rekaman</span>
        </div>

        <div className="p-3.5 bg-emerald-50/50 rounded-xl border border-emerald-100">
          <span className="text-[11px] text-emerald-800 font-medium">Ketuntasan Klasikal</span>
          <div className="text-xl sm:text-2xl font-bold text-emerald-700 mt-0.5">
            {overallStats.persentase}%
          </div>
          <span className="text-[10px] text-emerald-600 font-medium">
            {overallStats.tuntas} tuntas (KKTP {kktpThreshold})
          </span>
        </div>

        <div className="p-3.5 bg-amber-50/50 rounded-xl border border-amber-100">
          <span className="text-[11px] text-amber-800 font-medium">Perlu Remedial</span>
          <div className="text-xl sm:text-2xl font-bold text-amber-700 mt-0.5">
            {overallStats.total - overallStats.tuntas}
          </div>
          <span className="text-[10px] text-amber-600">Siswa di bawah ambang</span>
        </div>

        <div className="p-3.5 bg-indigo-50/50 rounded-xl border border-indigo-100">
          <span className="text-[11px] text-indigo-800 font-medium">Rentang Skor</span>
          <div className="text-xl sm:text-2xl font-bold text-indigo-700 mt-0.5">
            {overallStats.min} - {overallStats.max}
          </div>
          <span className="text-[10px] text-indigo-500">Nilai terendah s.d. tertinggi</span>
        </div>
      </div>

      {/* Main Chart Area based on activeMode */}
      <div className="border border-slate-200 rounded-xl p-4 sm:p-5 bg-white space-y-4">
        {/* MODE 1: DISTRIBUSI RENTANG NILAI (BAR CHART) */}
        {activeMode === 'distribusi_mapel' && (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
              <div>
                <h4 className="font-bold text-slate-800 text-sm">
                  Grafik Batang Distribusi Nilai per Mata Pelajaran / Asesmen
                </h4>
                <p className="text-slate-500 text-[11px]">
                  Jumlah peserta didik pada setiap rentang kategori nilai (Mahir, Cakap, Belum Tuntas, Perlu Bimbingan)
                </p>
              </div>
              <div className="flex items-center space-x-3 text-[11px] text-slate-500 self-start sm:self-auto">
                <span className="inline-flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-xs bg-[#10B981]"></span> Mahir (≥85)
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-xs bg-[#3B82F6]"></span> Cakap (75-84)
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-xs bg-[#F59E0B]"></span> Belum Tuntas (60-74)
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-xs bg-[#EF4444]"></span> &lt;60
                </span>
              </div>
            </div>

            <div className="w-full h-80 sm:h-96 pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={distributionData}
                  margin={{ top: 20, right: 30, left: 0, bottom: 25 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis
                    dataKey="namaKelompok"
                    tick={{ fontSize: 11, fill: '#64748B' }}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#64748B' }}
                    allowDecimals={false}
                    label={{
                      value: 'Jumlah Siswa',
                      angle: -90,
                      position: 'insideLeft',
                      fontSize: 11,
                      fill: '#94A3B8',
                    }}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white text-xs p-3 rounded-xl shadow-xl space-y-1.5 border border-slate-700 max-w-xs">
                            <div className="font-bold text-slate-100 border-b border-slate-700 pb-1">
                              {d.namaLengkap}
                            </div>
                            <div className="text-[11px] text-slate-300">
                              Rata-Rata Nilai: <span className="font-bold text-amber-300">{d.rataRata}</span>
                            </div>
                            <div className="text-[11px] text-slate-300">
                              Ketuntasan Klasikal: <span className="font-bold text-emerald-400">{d.persentaseTuntas}%</span>
                            </div>
                            <div className="pt-1.5 border-t border-slate-700/60 grid grid-cols-2 gap-1 text-[10px]">
                              <span className="text-emerald-300">Mahir (≥85): {d.mahir} anak</span>
                              <span className="text-blue-300">Cakap (75-84): {d.tuntasCakap} anak</span>
                              <span className="text-amber-300">Belum Tuntas (60-74): {d.belumTuntas} anak</span>
                              <span className="text-rose-300">&lt;60: {d.perluBimbingan} anak</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                  <Bar
                    dataKey="mahir"
                    name="Mahir (≥85)"
                    fill={BRACKET_COLORS.mahir}
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="tuntasCakap"
                    name={`Cakap / Tuntas (${kktpThreshold}-84)`}
                    fill={BRACKET_COLORS.tuntasCakap}
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="belumTuntas"
                    name={`Belum Tuntas (60-${kktpThreshold - 1})`}
                    fill={BRACKET_COLORS.belumTuntas}
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="perluBimbingan"
                    name="Perlu Bimbingan (<60)"
                    fill={BRACKET_COLORS.perluBimbingan}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* MODE 2: RATA-RATA NILAI PER MAPEL / ASESMEN & AMBANG KKTP */}
        {activeMode === 'rata_rata_mapel' && (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
              <div>
                <h4 className="font-bold text-slate-800 text-sm">
                  Grafik Batang Rata-Rata Nilai terhadap Ambang Batas KKTP ({kktpThreshold})
                </h4>
                <p className="text-slate-500 text-[11px]">
                  Garis merah putus-putus menunjukkan standar kriteria ketercapaian tujuan pembelajaran
                </p>
              </div>
              <div className="flex items-center space-x-2 text-[11px]">
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                  <span className="w-2.5 h-2.5 rounded-xs bg-emerald-600"></span> Di Atas KKTP
                </span>
                <span className="inline-flex items-center gap-1 font-semibold text-amber-700">
                  <span className="w-2.5 h-2.5 rounded-xs bg-amber-500"></span> Di Bawah KKTP
                </span>
              </div>
            </div>

            <div className="w-full h-80 sm:h-96 pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={averageData}
                  margin={{ top: 20, right: 30, left: 0, bottom: 25 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis
                    dataKey="nama"
                    tick={{ fontSize: 11, fill: '#64748B' }}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 11, fill: '#64748B' }}
                    label={{
                      value: 'Rata-Rata Nilai (Skala 100)',
                      angle: -90,
                      position: 'insideLeft',
                      fontSize: 11,
                      fill: '#94A3B8',
                    }}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white text-xs p-3 rounded-xl shadow-xl space-y-1 border border-slate-700">
                            <div className="font-bold text-slate-100">{d.namaLengkap}</div>
                            <div className="text-amber-300 font-bold text-sm">
                              Rata-Rata: {d.rataRata} / 100
                            </div>
                            <div className="text-[11px] text-slate-300">
                              Status: {d.isTuntas ? '✅ Melampaui KKTP' : '⚠️ Di Bawah KKTP'}
                            </div>
                            <div className="text-[11px] text-emerald-400">
                              Tingkat Ketuntasan: {d.persentaseTuntas}%
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <ReferenceLine
                    y={kktpThreshold}
                    stroke="#E11D48"
                    strokeDasharray="4 4"
                    strokeWidth={2}
                    label={{
                      value: `Target KKTP: ${kktpThreshold}`,
                      position: 'top',
                      fill: '#E11D48',
                      fontSize: 11,
                      fontWeight: 'bold',
                    }}
                  />
                  <Bar dataKey="rataRata" radius={[6, 6, 0, 0]}>
                    {averageData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.isTuntas ? '#10B981' : '#F59E0B'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* MODE 3: GRAFIK BATANG NILAI SETIAP SISWA */}
        {activeMode === 'nilai_per_siswa' && (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div>
                <h4 className="font-bold text-slate-800 text-sm">
                  Komparasi Nilai Individu Setiap Siswa Kelas {selectedKelas}
                </h4>
                <p className="text-slate-500 text-[11px]">
                  Memantau capaian spesifik per siswa untuk menentukan prioritas bimbingan remedial
                </p>
              </div>

              {/* Sorting button */}
              <div className="flex items-center space-x-1.5 self-start sm:self-auto">
                <span className="text-[11px] text-slate-500">Urutkan:</span>
                <select
                  value={sortBy}
                  onChange={(e: any) => setSortBy(e.target.value)}
                  className="bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-xs font-semibold text-slate-700"
                >
                  <option value="nilai_desc">Nilai Tertinggi ke Terendah</option>
                  <option value="nilai_asc">Nilai Terendah ke Tertinggi</option>
                  <option value="nama">Nama Siswa (A-Z)</option>
                </select>
              </div>
            </div>

            <div className="w-full h-80 sm:h-96 pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={studentScoresData}
                  margin={{ top: 20, right: 30, left: 0, bottom: 45 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis
                    dataKey="nama"
                    tick={{ fontSize: 10, fill: '#64748B' }}
                    interval={0}
                    angle={-45}
                    textAnchor="end"
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 11, fill: '#64748B' }}
                    label={{
                      value: 'Nilai Siswa',
                      angle: -90,
                      position: 'insideLeft',
                      fontSize: 11,
                      fill: '#94A3B8',
                    }}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white text-xs p-3 rounded-xl shadow-xl space-y-1 border border-slate-700">
                            <div className="font-bold text-slate-100">{d.namaLengkap}</div>
                            <div className="text-[11px] text-slate-400">NISN: {d.nisn}</div>
                            <div className="text-lg font-bold text-indigo-300">{d.nilai} / 100</div>
                            <div className="text-[11px]">
                              Status:{' '}
                              <span
                                className={`font-bold ${
                                  d.isTuntas ? 'text-emerald-400' : 'text-rose-400'
                                }`}
                              >
                                {d.status}
                              </span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <ReferenceLine
                    y={kktpThreshold}
                    stroke="#E11D48"
                    strokeDasharray="4 4"
                    strokeWidth={2}
                    label={{
                      value: `KKTP: ${kktpThreshold}`,
                      position: 'top',
                      fill: '#E11D48',
                      fontSize: 11,
                      fontWeight: 'bold',
                    }}
                  />
                  <Bar dataKey="nilai" radius={[4, 4, 0, 0]}>
                    {studentScoresData.map((entry, index) => (
                      <Cell
                        key={`cell-s-${index}`}
                        fill={entry.isTuntas ? '#4F46E5' : '#F43F5E'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* MODE 4: PROPORSI KELOMPOK KKTP (PIE CHART) */}
        {activeMode === 'kategori_kktp' && (
          <div className="space-y-3">
            <div className="text-xs">
              <h4 className="font-bold text-slate-800 text-sm">
                Proporsi Capaian Kelulusan & Kategori KKTP
              </h4>
              <p className="text-slate-500 text-[11px]">
                Rasio pembagian kategori kompetensi siswa berdasarkan Permendikdasmen No 13/2025
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-6 pt-2">
              <div className="w-full h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieDistributionData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={95}
                      paddingAngle={3}
                      label={({ name, percent }) => `${name ? String(name).split(' ')[0] : ''} (${percent}%)`}
                    >
                      {pieDistributionData.map((entry, index) => (
                        <Cell key={`pie-cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const d = payload[0].payload;
                          return (
                            <div className="bg-slate-900 text-white text-xs p-2.5 rounded-lg shadow-xl">
                              <div className="font-bold">{d.name}</div>
                              <div className="text-amber-300">
                                {d.value} Peserta Didik ({d.percent}%)
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legend Card */}
              <div className="space-y-2 text-xs">
                <h5 className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                  Rincian Kategori Capaian:
                </h5>
                <div className="space-y-2">
                  {pieDistributionData.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg border border-slate-100 flex items-center justify-between bg-slate-50/50"
                    >
                      <div className="flex items-center space-x-2">
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="font-medium text-slate-800">{item.name}</span>
                      </div>
                      <div className="font-bold text-slate-900">
                        {item.value} siswa ({item.percent}%)
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Pedagogical Recommendation Note */}
      <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-100 text-xs text-indigo-950 flex items-start space-x-3">
        <Sparkles className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-bold block text-indigo-900">
            Interpretasi & Tindak Lanjut Pedagogis Guru (Pembelajaran Mendalam):
          </span>
          {overallStats.persentase >= 80 ? (
            <p className="mt-0.5 text-indigo-900/80">
              Ketuntasan kelas mencapai {overallStats.persentase}%, menunjukkan bahwa mayoritas peserta didik telah mencapai pemahaman konsep yang kokoh. Fokuskan tindak lanjut pada aktivitas <strong>pengayaan (enrichment)</strong> berbasis penyelidikan nyata dan tantangan kreatif HOTS.
            </p>
          ) : (
            <p className="mt-0.5 text-indigo-900/80">
              Terdapat {overallStats.total - overallStats.tuntas} siswa yang berada di bawah ambang KKTP {kktpThreshold}. Disarankan menerapkan strategi <strong>diferensiasi proses</strong> dengan bimbingan kelompok kecil terarah (*guided small-group teaching*) dan tutorial sebaya tanpa memberi stigma pada peserta didik.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

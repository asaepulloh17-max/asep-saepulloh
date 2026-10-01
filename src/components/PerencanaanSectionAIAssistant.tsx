import React, { useState } from 'react';
import { Sparkles, Loader2, Lightbulb, MessageSquarePlus, ChevronDown, ChevronUp, Scale, BookCheck } from 'lucide-react';
import { getRegulatoryHierarchy } from '../services/aiService';

export interface SectionAIAssistantProps {
  sectionNumber: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  title: string;
  subtitle: string;
  badge: string;
  isGenerating: boolean;
  notes: string;
  onNotesChange: (val: string) => void;
  onGenerate: () => void;
  quickTags?: string[];
  topicPlaceholderWarning?: boolean;
  mapel?: string;
}

export const PerencanaanSectionAIAssistant: React.FC<SectionAIAssistantProps> = ({
  sectionNumber,
  title,
  subtitle,
  badge,
  isGenerating,
  notes,
  onNotesChange,
  onGenerate,
  quickTags = [],
  topicPlaceholderWarning = false,
  mapel = '',
}) => {
  const [showNotes, setShowNotes] = useState(false);
  const [showRegulasi, setShowRegulasi] = useState(false);

  const reg = getRegulatoryHierarchy(mapel);

  const handleTagClick = (tag: string) => {
    if (!notes.trim()) {
      onNotesChange(tag);
    } else if (!notes.includes(tag)) {
      onNotesChange(`${notes}, ${tag}`);
    }
  };

  return (
    <div
      id={`ai-assistant-section-${sectionNumber}`}
      className="bg-gradient-to-r from-indigo-50/90 via-violet-50/70 to-white p-3.5 sm:p-4 rounded-xl border border-indigo-100 shadow-2xs mb-4 transition-all"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
              <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200">
                {badge}
              </span>
              <span className="text-xs font-bold text-slate-800">{title}</span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
              {subtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center flex-wrap gap-y-2">
          <button
            type="button"
            onClick={() => setShowRegulasi(!showRegulasi)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border flex items-center space-x-1 transition-all ${
              showRegulasi
                ? 'bg-amber-100/90 border-amber-300 text-amber-900 shadow-2xs'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
            title="Lihat dasar hukum & regulasi yang diintegrasikan oleh AI"
          >
            <Scale className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden md:inline">Regulasi Terintegrasi</span>
            {reg.isAgama && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-0.5" title="Revisi Agama 020/2026 Aktif" />
            )}
            {showRegulasi ? <ChevronUp className="w-3 h-3 ml-0.5" /> : <ChevronDown className="w-3 h-3 ml-0.5" />}
          </button>

          <button
            type="button"
            onClick={() => setShowNotes(!showNotes)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border flex items-center space-x-1 transition-all ${
              showNotes || notes.trim()
                ? 'bg-indigo-100/70 border-indigo-200 text-indigo-700'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
            title="Tambah instruksi/fokus khusus untuk AI"
          >
            <MessageSquarePlus className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Instruksi Khusus</span>
            {showNotes ? <ChevronUp className="w-3 h-3 ml-0.5" /> : <ChevronDown className="w-3 h-3 ml-0.5" />}
          </button>

          <button
            type="button"
            disabled={isGenerating}
            onClick={onGenerate}
            id={`btn-ai-generate-section-${sectionNumber}`}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-xs ${
              isGenerating
                ? 'bg-indigo-400 text-white cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white active:scale-95 hover:shadow-md'
            }`}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Menyusun Bagian {sectionNumber}...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Bantu Tulis Bagian {sectionNumber} (AI)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Expandable Legal Regulatory Hierarchy Info */}
      {showRegulasi && (
        <div className="mt-3 p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-xs space-y-2 text-amber-950 transition-all">
          <div className="flex items-center justify-between font-bold text-amber-900 border-b border-amber-200/80 pb-1.5">
            <span className="flex items-center space-x-1.5">
              <Scale className="w-4 h-4 text-amber-700" />
              <span>Hierarki Regulasi Nasional yang Wajib Diintegrasikan AI:</span>
            </span>
            {reg.isAgama && (
              <span className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold px-2 py-0.5 rounded-full flex items-center space-x-1">
                <BookCheck className="w-3 h-3" />
                <span>Modul Pendidikan Agama Aktif</span>
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] pt-1 leading-relaxed">
            <div className="p-2 bg-white/80 rounded-lg border border-amber-100 shadow-2xs">
              <span className="font-bold text-amber-900 block">1. Standar Kompetensi Lulusan (SKL)</span>
              <p className="text-slate-700 mt-0.5 font-medium">Permendikdasmen No. 10 Tahun 2025</p>
              <p className="text-slate-500 mt-0.5">Goal akhir kompetensi murid, karakter holistik, dan dimensi profil kelulusan.</p>
            </div>
            <div className="p-2 bg-white/80 rounded-lg border border-amber-100 shadow-2xs">
              <span className="font-bold text-amber-900 block">2. Standar Isi</span>
              <p className="text-slate-700 mt-0.5 font-medium">Permendikdasmen No. 12 Tahun 2025</p>
              <p className="text-slate-500 mt-0.5">Ruang lingkup materi esensial & bermakna, menghindari kurikulum padat hafalan.</p>
            </div>
            <div className="p-2 bg-white/80 rounded-lg border border-amber-100 shadow-2xs">
              <span className="font-bold text-amber-900 block">
                3. Capaian Pembelajaran (CP)
                {reg.isAgama && <span className="text-emerald-700 ml-1 font-bold">(Khusus Agama)</span>}
              </span>
              <p className="text-slate-700 mt-0.5 font-medium">{reg.cp}</p>
              <p className="text-slate-500 mt-0.5">
                {reg.isAgama
                  ? 'Revisi terbatas resmi dari 046/H/KR/2025 untuk target kompetensi elemen Pendidikan Agama.'
                  : 'Target kompetensi per fase dan elemen Capaian Pembelajaran kurikulum.'}
              </p>
            </div>
            <div className="p-2 bg-white/80 rounded-lg border border-amber-100 shadow-2xs">
              <span className="font-bold text-amber-900 block">4. Standar Proses</span>
              <p className="text-slate-700 mt-0.5 font-medium">Permendikdasmen No. 1 Tahun 2026</p>
              <p className="text-slate-500 mt-0.5">Fleksibel, jelas, interaktif, menyenangkan, menantang, berpusat murid & <strong>mengutamakan asesmen formatif</strong>.</p>
            </div>
          </div>
          <div className="text-[10px] text-amber-800 bg-amber-100/50 p-2 rounded-lg flex items-center justify-between">
            <span>💡 Dilengkapi Prinsip Pembelajaran Mendalam (Permendikdasmen No 13/2025 & Kepmendikdasmen No 126/P/2025)</span>
            <span className="font-semibold">3 Pilar & 3 Pengalaman Belajar</span>
          </div>
        </div>
      )}

      {topicPlaceholderWarning && (
        <div className="mt-2.5 py-1.5 px-2.5 bg-amber-50/80 border border-amber-200/70 rounded-lg text-[11px] text-amber-800 flex items-center space-x-2">
          <Lightbulb className="w-3.5 h-3.5 shrink-0 text-amber-600" />
          <span>
            Tips: Pastikan Topik/Materi pada Bagian 1 sudah terisi agar AI dapat merumuskan konten yang spesifik dan akurat.
          </span>
        </div>
      )}

      {/* Expandable Teacher Prompt & Quick Tags */}
      {(showNotes || notes.trim()) && (
        <div className="mt-3 pt-2.5 border-t border-indigo-100/80 space-y-2">
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span className="font-medium text-slate-700 flex items-center space-x-1">
              <Lightbulb className="w-3 h-3 text-amber-500" />
              <span>Instruksi/Fokus Khusus Guru (Opsional):</span>
            </span>
            {notes && (
              <button
                type="button"
                onClick={() => onNotesChange('')}
                className="text-indigo-600 hover:underline text-[10px]"
              >
                Reset
              </button>
            )}
          </div>
          <input
            type="text"
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder="Contoh: Tekankan praktikum sederhana, siswa heterogen, atau masalah sampah di sekolah..."
            className="w-full text-xs p-2 bg-white border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-slate-800 placeholder-slate-400"
          />

          {quickTags.length > 0 && (
            <div className="flex items-center space-x-1.5 flex-wrap gap-y-1 pt-1">
              <span className="text-[10px] text-slate-500">Kata kunci cepat:</span>
              {quickTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleTagClick(tag)}
                  className={`text-[10px] px-2 py-0.5 rounded-md border transition-all ${
                    notes.includes(tag)
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white hover:bg-indigo-50 text-indigo-700 border-indigo-200'
                  }`}
                >
                  + {tag}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import { PesertaDidik } from '../types';

export interface ParsedStudentRow {
  nama: string;
  nis?: string;
  nisn?: string;
  jenisKelamin?: 'L' | 'P';
  kelas?: string;
}

export interface ImportParseResult {
  success: boolean;
  students: ParsedStudentRow[];
  detectedClasses: string[];
  totalRows: number;
  error?: string;
  sourceType: 'excel' | 'word' | 'text';
}

/**
 * Normalizes gender value to 'L' or 'P'
 */
function normalizeGender(val: any): 'L' | 'P' | undefined {
  if (!val) return undefined;
  const str = String(val).trim().toUpperCase();
  if (str === 'L' || str === 'LAKI-LAKI' || str === 'LAKI' || str === 'PRIA' || str === 'MALE' || str === 'M') {
    return 'L';
  }
  if (str === 'P' || str === 'PEREMPUAN' || str === 'WANITA' || str === 'FEMALE' || str === 'F') {
    return 'P';
  }
  return undefined;
}

/**
 * Normalizes text string
 */
function cleanText(val: any): string {
  if (val === null || val === undefined) return '';
  return String(val).trim();
}

/**
 * Parses Excel files (.xlsx, .xls, .csv)
 */
export async function parseStudentsFromExcel(file: File, fallbackClass: string): Promise<ImportParseResult> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      return { success: false, students: [], detectedClasses: [], totalRows: 0, error: 'Berkas Excel kosong atau tidak memiliki lembar kerja (sheet).', sourceType: 'excel' };
    }

    const worksheet = workbook.Sheets[firstSheetName];
    // Convert to array of arrays to handle flexible header structures
    const rawData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

    if (!rawData || rawData.length === 0) {
      return { success: false, students: [], detectedClasses: [], totalRows: 0, error: 'Lembar kerja Excel tidak berisi data.', sourceType: 'excel' };
    }

    // Find the header row (look for row containing 'nama' or 'siswa')
    let headerRowIndex = -1;
    let colIndices = {
      nama: -1,
      nis: -1,
      nisn: -1,
      jk: -1,
      kelas: -1,
    };

    for (let r = 0; r < Math.min(rawData.length, 15); r++) {
      const row = rawData[r];
      if (!Array.isArray(row)) continue;

      const lowerRow = row.map((cell) => cleanText(cell).toLowerCase());
      const namaIdx = lowerRow.findIndex((c) =>
        c.includes('nama') || c === 'peserta didik' || c === 'siswa' || c === 'student' || c === 'nama lengkap' || c === 'nama siswa'
      );

      if (namaIdx !== -1) {
        headerRowIndex = r;
        colIndices.nama = namaIdx;

        colIndices.nis = lowerRow.findIndex((c) => c === 'nis' || c.includes('no induk') || c === 'nomor induk' || c === 'no. induk');
        colIndices.nisn = lowerRow.findIndex((c) => c.includes('nisn'));
        colIndices.jk = lowerRow.findIndex((c) => c === 'jk' || c.includes('kelamin') || c.includes('gender') || c === 'l/p' || c === 'l / p');
        colIndices.kelas = lowerRow.findIndex((c) => c.includes('kelas') || c.includes('rombel') || c === 'tingkat');
        break;
      }
    }

    const students: ParsedStudentRow[] = [];
    const detectedClassesSet = new Set<string>();

    if (headerRowIndex !== -1 && colIndices.nama !== -1) {
      // Parsed using identified headers
      for (let r = headerRowIndex + 1; r < rawData.length; r++) {
        const row = rawData[r];
        if (!row || row.length === 0) continue;

        const nama = cleanText(row[colIndices.nama]);
        if (!nama || /^\d+$/.test(nama) || nama.toLowerCase().includes('jumlah') || nama.toLowerCase().includes('total')) {
          continue; // skip empty or summary rows
        }

        const nis = colIndices.nis !== -1 ? cleanText(row[colIndices.nis]) : undefined;
        const nisn = colIndices.nisn !== -1 ? cleanText(row[colIndices.nisn]) : undefined;
        const jk = colIndices.jk !== -1 ? normalizeGender(row[colIndices.jk]) : undefined;
        const rawKelas = colIndices.kelas !== -1 ? cleanText(row[colIndices.kelas]) : '';
        const kelas = rawKelas || fallbackClass;

        if (kelas) detectedClassesSet.add(kelas);

        students.push({
          nama,
          nis: nis ? String(nis) : undefined,
          nisn: nisn ? String(nisn) : undefined,
          jenisKelamin: jk,
          kelas,
        });
      }
    } else {
      // Fallback: If no header found, heuristic check:
      // Typically col 0 is No, col 1 is NIS/NISN or Nama, col 2 is Nama or JK
      for (let r = 0; r < rawData.length; r++) {
        const row = rawData[r];
        if (!row || row.length === 0) continue;

        // Find cell with text of reasonable length (>= 3 chars) that isn't purely digits
        let candidateName = '';
        let candidateNis: string | undefined;
        let candidateNisn: string | undefined;
        let candidateJk: 'L' | 'P' | undefined;
        let candidateKelas: string = fallbackClass;

        for (let c = 0; c < row.length; c++) {
          const val = cleanText(row[c]);
          if (!val) continue;

          // Check for gender
          const gender = normalizeGender(val);
          if (gender && (val.length === 1 || val.length <= 9)) {
            candidateJk = gender;
            continue;
          }

          // Check for NISN (usually 10 digits) or NIS (4-8 digits)
          if (/^\d{8,12}$/.test(val) && !candidateNisn) {
            candidateNisn = val;
            continue;
          }
          if (/^\d{4,7}$/.test(val) && !candidateNis) {
            candidateNis = val;
            continue;
          }

          // Check for class (e.g. VII-A, 7A, VIII.1)
          if (/^(VII|VIII|IX|X|XI|XII|[789]|1[012])[-_.\s]?[A-Za-z0-9]+$/i.test(val) && val.length <= 10) {
            candidateKelas = val.toUpperCase();
            detectedClassesSet.add(candidateKelas);
            continue;
          }

          // Check for name (contains letters, not pure numbers, length >= 3)
          if (/[a-zA-Z]{3,}/.test(val) && !candidateName && !/^(no|nomor|nama|kelas|nis|nisn|jk)$/i.test(val)) {
            candidateName = val;
          }
        }

        if (candidateName) {
          students.push({
            nama: candidateName,
            nis: candidateNis,
            nisn: candidateNisn,
            jenisKelamin: candidateJk,
            kelas: candidateKelas,
          });
        }
      }
    }

    if (students.length === 0) {
      return {
        success: false,
        students: [],
        detectedClasses: [],
        totalRows: rawData.length,
        error: 'Tidak ditemukan baris data nama siswa yang valid pada berkas Excel.',
        sourceType: 'excel',
      };
    }

    return {
      success: true,
      students,
      detectedClasses: Array.from(detectedClassesSet),
      totalRows: students.length,
      sourceType: 'excel',
    };
  } catch (err: any) {
    return {
      success: false,
      students: [],
      detectedClasses: [],
      totalRows: 0,
      error: 'Gagal membaca berkas Excel: ' + (err.message || 'Format tidak valid'),
      sourceType: 'excel',
    };
  }
}

/**
 * Parses MS Word documents (.docx)
 */
export async function parseStudentsFromWord(file: File, fallbackClass: string): Promise<ImportParseResult> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    // Convert to HTML to preserve table structure
    const htmlResult = await mammoth.convertToHtml({ arrayBuffer });
    const html = htmlResult.value;

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const tables = doc.querySelectorAll('table');

    const students: ParsedStudentRow[] = [];
    const detectedClassesSet = new Set<string>();

    if (tables.length > 0) {
      // Process tables inside Word document
      tables.forEach((table) => {
        const trs = Array.from(table.querySelectorAll('tr'));
        if (trs.length === 0) return;

        let colIndices = {
          nama: -1,
          nis: -1,
          nisn: -1,
          jk: -1,
          kelas: -1,
        };
        let headerFound = false;

        // Look for header row in first 3 rows
        for (let r = 0; r < Math.min(trs.length, 3); r++) {
          const cells = Array.from(trs[r].querySelectorAll('th, td')).map((c) => cleanText(c.textContent).toLowerCase());
          const namaIdx = cells.findIndex((c) => c.includes('nama') || c === 'siswa' || c === 'peserta didik');
          if (namaIdx !== -1) {
            headerFound = true;
            colIndices.nama = namaIdx;
            colIndices.nis = cells.findIndex((c) => c === 'nis' || c.includes('no induk'));
            colIndices.nisn = cells.findIndex((c) => c.includes('nisn'));
            colIndices.jk = cells.findIndex((c) => c === 'jk' || c.includes('kelamin') || c.includes('l/p') || c === 'gender');
            colIndices.kelas = cells.findIndex((c) => c.includes('kelas') || c.includes('rombel'));
            trs.splice(0, r + 1); // remove rows up to header
            break;
          }
        }

        trs.forEach((tr) => {
          const cells = Array.from(tr.querySelectorAll('td, th')).map((c) => cleanText(c.textContent));
          if (cells.length === 0) return;

          let nama = '';
          let nis: string | undefined;
          let nisn: string | undefined;
          let jk: 'L' | 'P' | undefined;
          let kelas = fallbackClass;

          if (headerFound && colIndices.nama !== -1 && cells[colIndices.nama]) {
            nama = cells[colIndices.nama];
            if (colIndices.nis !== -1 && cells[colIndices.nis]) nis = cells[colIndices.nis];
            if (colIndices.nisn !== -1 && cells[colIndices.nisn]) nisn = cells[colIndices.nisn];
            if (colIndices.jk !== -1 && cells[colIndices.jk]) jk = normalizeGender(cells[colIndices.jk]);
            if (colIndices.kelas !== -1 && cells[colIndices.kelas]) kelas = cells[colIndices.kelas] || fallbackClass;
          } else {
            // Heuristic cell inspection
            for (let i = 0; i < cells.length; i++) {
              const val = cells[i];
              if (!val) continue;

              const gender = normalizeGender(val);
              if (gender && val.length <= 9) {
                jk = gender;
                continue;
              }
              if (/^\d{8,12}$/.test(val) && !nisn) {
                nisn = val;
                continue;
              }
              if (/^\d{4,7}$/.test(val) && !nis) {
                nis = val;
                continue;
              }
              if (/[a-zA-Z]{3,}/.test(val) && !nama && !/^(no|nomor|nama|kelas|nis|nisn|jk)$/i.test(val)) {
                nama = val;
              }
            }
          }

          if (nama && !/^(jumlah|total|rekapitulasi)$/i.test(nama)) {
            if (kelas) detectedClassesSet.add(kelas);
            students.push({
              nama,
              nis,
              nisn,
              jenisKelamin: jk,
              kelas,
            });
          }
        });
      });
    }

    // If no students found from tables, try parsing raw paragraphs / lists
    if (students.length === 0) {
      const textResult = await mammoth.extractRawText({ arrayBuffer });
      const rawText = textResult.value;
      const textLines = rawText.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);

      textLines.forEach((line) => {
        // Match numbered lists like "1. Ahmad Pratama (L)" or "1 - Ahmad Pratama" or "Ahmad Pratama\tL"
        const cleanLine = line.replace(/^\d+[\.\-\)\s]+/, '').trim();
        if (cleanLine.length < 3) return;

        // Check if line contains tab
        if (cleanLine.includes('\t')) {
          const parts = cleanLine.split('\t').map((p) => p.trim()).filter(Boolean);
          if (parts.length > 0) {
            const nama = parts[0];
            const jk = parts.length > 1 ? normalizeGender(parts[1]) : undefined;
            if (nama && /[a-zA-Z]/.test(nama)) {
              students.push({ nama, jenisKelamin: jk, kelas: fallbackClass });
            }
          }
        } else {
          // Check for trailing gender like " (L)" or " - P"
          const genderMatch = cleanLine.match(/[\s\(\-\,\/]+([LP]|Laki-laki|Perempuan)[\)\s]*$/i);
          let nama = cleanLine;
          let jk: 'L' | 'P' | undefined;

          if (genderMatch) {
            jk = normalizeGender(genderMatch[1]);
            nama = cleanLine.substring(0, genderMatch.index).trim();
          }

          if (nama && /[a-zA-Z]{3,}/.test(nama) && !/^(daftar|nama|siswa|tabel|rekap)/i.test(nama)) {
            students.push({
              nama,
              jenisKelamin: jk,
              kelas: fallbackClass,
            });
          }
        }
      });
    }

    if (students.length === 0) {
      return {
        success: false,
        students: [],
        detectedClasses: [],
        totalRows: 0,
        error: 'Tidak ditemukan tabel atau daftar nama siswa yang dapat diuraikan dari dokumen Word ini. Pastikan format tabel memiliki kolom Nama Siswa.',
        sourceType: 'word',
      };
    }

    return {
      success: true,
      students,
      detectedClasses: Array.from(detectedClassesSet),
      totalRows: students.length,
      sourceType: 'word',
    };
  } catch (err: any) {
    return {
      success: false,
      students: [],
      detectedClasses: [],
      totalRows: 0,
      error: 'Gagal membaca dokumen Word (.docx): ' + (err.message || 'Format tidak valid'),
      sourceType: 'word',
    };
  }
}

/**
 * Parses raw text pasted by user (copy-pasted from Excel or Word)
 */
export function parseStudentsFromPastedText(text: string, fallbackClass: string): ImportParseResult {
  try {
    const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
    if (lines.length === 0) {
      return { success: false, students: [], detectedClasses: [], totalRows: 0, error: 'Teks yang ditempelkan kosong.', sourceType: 'text' };
    }

    const students: ParsedStudentRow[] = [];
    const detectedClassesSet = new Set<string>();

    lines.forEach((line) => {
      // Split by tab or semicolon or comma
      let parts: string[] = [];
      if (line.includes('\t')) {
        parts = line.split('\t').map((p) => cleanText(p));
      } else if (line.includes(';') && (line.match(/;/g) || []).length >= 2) {
        parts = line.split(';').map((p) => cleanText(p));
      } else if (line.includes(',') && (line.match(/,/g) || []).length >= 2) {
        parts = line.split(',').map((p) => cleanText(p));
      } else {
        // Plain single line per name: strip leading numbers "1. ", "2) "
        const cleanName = line.replace(/^\d+[\.\-\)\s]+/, '').trim();
        if (cleanName.length >= 3 && /[a-zA-Z]/.test(cleanName) && !/^(no|nama|siswa)/i.test(cleanName)) {
          students.push({
            nama: cleanName,
            kelas: fallbackClass,
          });
        }
        return;
      }

      if (parts.length === 0) return;

      // Filter out header row
      const combined = parts.join(' ').toLowerCase();
      if ((combined.includes('nama') || combined.includes('siswa')) && (combined.includes('no') || combined.includes('nis'))) {
        return;
      }

      let candidateName = '';
      let candidateNis: string | undefined;
      let candidateNisn: string | undefined;
      let candidateJk: 'L' | 'P' | undefined;
      let candidateKelas: string = fallbackClass;

      parts.forEach((p) => {
        if (!p) return;
        const jk = normalizeGender(p);
        if (jk && p.length <= 9) {
          candidateJk = jk;
          return;
        }
        if (/^\d{8,12}$/.test(p) && !candidateNisn) {
          candidateNisn = p;
          return;
        }
        if (/^\d{4,7}$/.test(p) && !candidateNis) {
          candidateNis = p;
          return;
        }
        if (/^(VII|VIII|IX|X|XI|XII|[789]|1[012])[-_.\s]?[A-Za-z0-9]+$/i.test(p) && p.length <= 10) {
          candidateKelas = p.toUpperCase();
          detectedClassesSet.add(candidateKelas);
          return;
        }
        if (/[a-zA-Z]{3,}/.test(p) && !candidateName) {
          candidateName = p.replace(/^\d+[\.\-\)\s]+/, '').trim();
        }
      });

      if (candidateName) {
        students.push({
          nama: candidateName,
          nis: candidateNis,
          nisn: candidateNisn,
          jenisKelamin: candidateJk,
          kelas: candidateKelas,
        });
      }
    });

    if (students.length === 0) {
      return { success: false, students: [], detectedClasses: [], totalRows: 0, error: 'Tidak ada data nama siswa yang dapat diuraikan.', sourceType: 'text' };
    }

    return {
      success: true,
      students,
      detectedClasses: Array.from(detectedClassesSet),
      totalRows: students.length,
      sourceType: 'text',
    };
  } catch (err: any) {
    return {
      success: false,
      students: [],
      detectedClasses: [],
      totalRows: 0,
      error: 'Gagal memproses teks tempelan: ' + (err.message || 'Kesalahan parsing'),
      sourceType: 'text',
    };
  }
}

/**
 * Generates and downloads a clean Excel template (.xlsx) for student data
 */
export function downloadStudentTemplateExcel(targetClass = 'VII-A'): void {
  const data = [
    ['No', 'NISN (10 Digit)', 'NIS (Sekolah)', 'Nama Lengkap Siswa', 'Jenis Kelamin (L/P)', 'Kelas / Rombel'],
    [1, '0081234567', '21001', 'Aditya Pratama Ramadhan', 'L', targetClass],
    [2, '0087654321', '21002', 'Annisa Zahra Nuraini', 'P', targetClass],
    [3, '0082345678', '21003', 'Bagus Wicaksono', 'L', targetClass],
    [4, '0083456789', '21004', 'Citra Dewi Sartika', 'P', targetClass],
    [5, '0084567890', '21005', 'Dimas Arya Pamungkas', 'L', targetClass],
  ];

  const ws = XLSX.utils.aoa_to_sheet(data);

  // Set column widths
  ws['!cols'] = [
    { wch: 6 },
    { wch: 18 },
    { wch: 15 },
    { wch: 32 },
    { wch: 20 },
    { wch: 15 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Data_Siswa');

  XLSX.writeFile(wb, `Template_Data_Siswa_${targetClass.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`);
}

/**
 * Converts parsed student rows into PesertaDidik items with unique IDs
 */
export function convertToPesertaDidik(rows: ParsedStudentRow[], assignedClass?: string): PesertaDidik[] {
  const now = Date.now();
  return rows.map((row, idx) => ({
    id: `siswa-${now}-${idx}-${Math.random().toString(36).substring(2, 7)}`,
    nama: row.nama,
    nis: row.nis || '',
    nisn: row.nisn || '',
    jenisKelamin: row.jenisKelamin,
    kelas: assignedClass || row.kelas || 'VII-A',
    isDemo: false,
  }));
}

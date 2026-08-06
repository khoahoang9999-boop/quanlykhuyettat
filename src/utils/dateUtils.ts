import { SubjectRecord, AgeGroup } from '../types';

export function parseDate(val: string | Date | null | undefined): Date | null {
  if (!val) return null;
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return null;
    // Normalize Date to UTC midnight for date calculations
    return new Date(Date.UTC(val.getUTCFullYear(), val.getUTCMonth(), val.getUTCDate()));
  }

  const str = String(val).trim();
  if (!str) return null;

  // Try DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY (with 2 or 4 digit year)
  const dmMatch = str.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/);
  if (dmMatch) {
    const day = parseInt(dmMatch[1], 10);
    const month = parseInt(dmMatch[2], 10) - 1;
    let year = parseInt(dmMatch[3], 10);
    if (dmMatch[3].length === 2) {
      year = year > 30 ? 1900 + year : 2000 + year;
    }
    const d = new Date(Date.UTC(year, month, day));
    if (!isNaN(d.getTime())) return d;
  }

  // Try standard YYYY-MM-DD or YYYY/MM/DD
  const ymMatch = str.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})/);
  if (ymMatch) {
    const year = parseInt(ymMatch[1], 10);
    const month = parseInt(ymMatch[2], 10) - 1;
    const day = parseInt(ymMatch[3], 10);
    const d = new Date(Date.UTC(year, month, day));
    if (!isNaN(d.getTime())) return d;
  }

  // Try YYYY only (e.g., "1985")
  if (/^\d{4}$/.test(str)) {
    const year = parseInt(str, 10);
    const d = new Date(Date.UTC(year, 0, 1));
    if (!isNaN(d.getTime())) return d;
  }

  return null;
}

export function formatDateVN(val: string | Date | null | undefined): string {
  if (typeof val === 'string') {
    const str = val.trim();
    const dmMatch = str.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/);
    if (dmMatch) {
      const day = dmMatch[1].padStart(2, '0');
      const month = dmMatch[2].padStart(2, '0');
      let year = dmMatch[3];
      if (year.length === 2) {
        const yNum = parseInt(year, 10);
        year = yNum > 30 ? `19${year}` : `20${year}`;
      }
      return `${day}/${month}/${year}`;
    }
    const ymMatch = str.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})/);
    if (ymMatch) {
      const year = ymMatch[1];
      const month = ymMatch[2].padStart(2, '0');
      const day = ymMatch[3].padStart(2, '0');
      return `${day}/${month}/${year}`;
    }
  }

  const d = parseDate(val);
  if (!d) return String(val || '');
  const day = String(d.getUTCDate()).padStart(2, '0');
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const year = d.getUTCFullYear();
  return `${day}/${month}/${year}`;
}

export function getDateParts(val: string | Date | null | undefined) {
  if (typeof val === 'string') {
    const str = val.trim();
    const dmMatch = str.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/);
    if (dmMatch) {
      let year = dmMatch[3];
      if (year.length === 2) {
        const yNum = parseInt(year, 10);
        year = yNum > 30 ? `19${year}` : `20${year}`;
      }
      return {
        day: dmMatch[1].padStart(2, '0'),
        month: dmMatch[2].padStart(2, '0'),
        year
      };
    }
    const ymMatch = str.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})/);
    if (ymMatch) {
      return {
        day: ymMatch[3].padStart(2, '0'),
        month: ymMatch[2].padStart(2, '0'),
        year: ymMatch[1]
      };
    }
  }

  const d = parseDate(val);
  if (!d) return { day: '', month: '', year: '' };
  return {
    day: String(d.getUTCDate()).padStart(2, '0'),
    month: String(d.getUTCMonth() + 1).padStart(2, '0'),
    year: String(d.getUTCFullYear())
  };
}

export function processSubjectAge(subject: SubjectRecord, evalDateStr: string): SubjectRecord {
  const dob = parseDate(subject.ngaySinh);
  const evalDate = parseDate(evalDateStr) || new Date();

  // If nhomTuoi is explicitly defined (e.g. from Excel Sheet "Dưới 6 tuổi" or "Từ 6 tuổi trở lên"), respect original Excel classification!
  if (subject.nhomTuoi && subject.nhomTuoi !== 'Không xác định') {
    return {
      ...subject,
      tuoiNgay: dob ? Math.floor((evalDate.getTime() - dob.getTime()) / (1000 * 60 * 60 * 24)) : undefined,
      ngaySinhFormat: dob ? formatDateVN(dob) : subject.ngaySinh
    };
  }

  if (!dob) {
    return {
      ...subject,
      nhomTuoi: subject.nhomTuoi || 'Không xác định',
      ngaySinhFormat: subject.ngaySinh
    };
  }

  const diffMs = evalDate.getTime() - dob.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const isUnder6 = diffDays <= Math.floor(365.25 * 6);

  const nhomTuoi: AgeGroup = isUnder6 ? 'Dưới 6 tuổi' : 'Từ 6 tuổi trở lên';

  return {
    ...subject,
    tuoiNgay: diffDays,
    nhomTuoi,
    ngaySinhFormat: formatDateVN(dob)
  };
}

export function sanitizeFilename(name: string): string {
  return name
    .trim()
    .replace(/[\\/*?:"<>|]/g, '')
    .replace(/\s+/g, '_') || 'doi_tuong';
}

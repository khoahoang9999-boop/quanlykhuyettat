import * as XLSX from 'xlsx';
import { SubjectRecord, DisabilityType, DisabilityLevel, AgeGroup } from '../types';

export function parseExcelDate(val: any): string {
  if (val === null || val === undefined || val === '') return '';

  if (val instanceof Date) {
    if (isNaN(val.getTime())) return '';
    const d = String(val.getUTCDate()).padStart(2, '0');
    const m = String(val.getUTCMonth() + 1).padStart(2, '0');
    const y = val.getUTCFullYear();
    return `${d}/${m}/${y}`;
  }

  // Handle Excel Serial Number (e.g. 45586)
  if (typeof val === 'number' || (typeof val === 'string' && /^\d{5}(\.\d+)?$/.test(val.trim()))) {
    const num = typeof val === 'number' ? val : parseFloat(val.trim());
    if (num > 10000 && num < 100000) {
      const date = new Date(Math.round((num - 25569) * 86400 * 1000));
      if (!isNaN(date.getTime())) {
        const d = String(date.getUTCDate()).padStart(2, '0');
        const m = String(date.getUTCMonth() + 1).padStart(2, '0');
        const y = date.getUTCFullYear();
        return `${d}/${m}/${y}`;
      }
    }
  }

  const str = String(val).trim();

  // Try DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY (with 2 or 4 digit year)
  const dmMatch = str.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/);
  if (dmMatch) {
    const d = dmMatch[1].padStart(2, '0');
    const m = dmMatch[2].padStart(2, '0');
    let y = dmMatch[3];
    if (y.length === 2) {
      const yNum = parseInt(y, 10);
      y = yNum > 30 ? `19${y}` : `20${y}`;
    }
    return `${d}/${m}/${y}`;
  }

  // Try YYYY-MM-DD or YYYY/MM/DD
  const ymMatch = str.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})/);
  if (ymMatch) {
    const y = ymMatch[1];
    const m = ymMatch[2].padStart(2, '0');
    const d = ymMatch[3].padStart(2, '0');
    return `${d}/${m}/${y}`;
  }

  // Try YYYY only
  if (/^\d{4}$/.test(str)) {
    return `01/01/${str}`;
  }

  return str;
}

function normalizeDangTat(val: string): DisabilityType | string {
  const str = (val || '').trim();
  if (!str) return 'Không xác định';

  const lower = str.toLowerCase();

  if (lower.includes('không xác định') || lower.includes('khong xac dinh') || lower.includes('chưa xác định') || lower.includes('chua xac dinh') || lower.includes('chưa kết luận') || lower.includes('không kết luận') || lower.includes('không đưa ra được')) return 'Không xác định';
  if (lower.includes('không khuyết tật') || lower.includes('khong khuyet tat')) return 'Không khuyết tật';

  // Return the full string to preserve combined disability types (e.g. "Trí tuệ, vận động", "Nhìn, Vận động", "Trí tuệ, khác")
  return str;
}

function normalizeMucDo(val: string): DisabilityLevel {
  const str = (val || '').trim();
  const lower = str.toLowerCase();

  if (lower.includes('không xác định') || lower.includes('khong xac dinh') || lower.includes('chưa xác định') || lower.includes('chua xac dinh') || lower.includes('chưa kết luận') || lower.includes('không kết luận') || lower.includes('không đưa ra được') || lower.includes('chưa đủ điều kiện')) return 'Không xác định';
  if (lower.includes('không khuyết tật') || lower.includes('khong khuyet tat')) return 'Không khuyết tật';
  if (lower.includes('đặc biệt') || lower.includes('dac biet')) return 'Đặc biệt nặng';
  if (lower.includes('nặng') || lower.includes('nang')) return 'Nặng';
  if (lower.includes('nhẹ') || lower.includes('nhe')) return 'Nhẹ';

  // Section IV codes from Circular 01/2019 (e.g. 1.4, 1,4 -> Đặc biệt nặng; 2.1, 2,1 -> Nặng)
  if (/\b1[\.,][1-7]\b/.test(str) || /^1[\.,][1-7]$/.test(str)) return 'Đặc biệt nặng';
  if (/\b2[\.,][1-6]\b/.test(str) || /^2[\.,][1-6]$/.test(str)) return 'Nặng';

  return 'Không xác định';
}

export function parseExcelFile(file: File): Promise<SubjectRecord[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        
        const allRecords: SubjectRecord[] = [];
        const seenKeys = new Set<string>();
        let sttCounter = 1;

        for (let sheetIdx = 0; sheetIdx < workbook.SheetNames.length; sheetIdx++) {
          const sheetName = workbook.SheetNames[sheetIdx];
          const worksheet = workbook.Sheets[sheetName];
          if (!worksheet) continue;

          let sheetNhomTuoi: AgeGroup | undefined = undefined;
          const lowerSheet = sheetName.toLowerCase().trim();
          if (
            lowerSheet.includes('dưới 6') || lowerSheet.includes('duoi 6') ||
            lowerSheet.includes('< 6') || lowerSheet.includes('<6') ||
            lowerSheet.includes('mẫu 02') || lowerSheet.includes('mau 02') ||
            lowerSheet.includes('sheet2') || lowerSheet.includes('sheet 2') ||
            lowerSheet.includes('trẻ em') || lowerSheet.includes('tre em') ||
            (workbook.SheetNames.length > 1 && sheetIdx === 1)
          ) {
            sheetNhomTuoi = 'Dưới 6 tuổi';
          } else if (
            lowerSheet.includes('trên 6') || lowerSheet.includes('tren 6') ||
            lowerSheet.includes('từ 6') || lowerSheet.includes('tu 6') ||
            lowerSheet.includes('> 6') || lowerSheet.includes('>= 6') ||
            lowerSheet.includes('mẫu 01') || lowerSheet.includes('mau 01') ||
            lowerSheet.includes('sheet1') || lowerSheet.includes('sheet 1') ||
            lowerSheet.includes('người lớn') || lowerSheet.includes('nguoi lon') ||
            (workbook.SheetNames.length > 1 && sheetIdx === 0)
          ) {
            sheetNhomTuoi = 'Từ 6 tuổi trở lên';
          }

          const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false, dateNF: 'dd/mm/yyyy' });

          if (!rawRows || rawRows.length === 0) {
            continue;
          }

          // Step 1: Find Header Row in this sheet using scoring
          let headerRowIdx = -1;
          let bestScore = -1;

          for (let r = 0; r < Math.min(30, rawRows.length); r++) {
            const row = rawRows[r] || [];
            const rowStr = row.map(cell => String(cell || '').toLowerCase()).join(' ');

            let score = 0;
            if (rowStr.includes('họ') || rowStr.includes('tên') || rowStr.includes('họ và tên')) score += 3;
            if (rowStr.includes('stt')) score += 1;
            if (rowStr.includes('sinh') || rowStr.includes('ngày sinh') || rowStr.includes('năm sinh')) score += 2;
            if (rowStr.includes('giới tính') || rowStr.includes('giới') || rowStr.includes('nam/nữ')) score += 2;
            if (rowStr.includes('dạng tật') || rowStr.includes('loại tật')) score += 2;
            if (rowStr.includes('mức độ')) score += 2;
            if (rowStr.includes('thôn') || rowStr.includes('địa chỉ') || rowStr.includes('xóm')) score += 1;
            if (rowStr.includes('ghi chú')) score += 1;

            if (score > bestScore && score >= 3) {
              bestScore = score;
              headerRowIdx = r;
            }
          }

          if (headerRowIdx === -1) {
            headerRowIdx = 0;
          }

          const headerRow = rawRows[headerRowIdx] || [];
          const nextHeaderRow = rawRows[headerRowIdx + 1] || [];
          const nextNextHeaderRow = rawRows[headerRowIdx + 2] || [];
          const maxCols = Math.max(headerRow.length, nextHeaderRow.length, nextNextHeaderRow.length, 12);

          let colHoTen = -1;
          let colNgaySinh = -1;
          let colGioiTinh = -1;
          let colThon = -1;
          let colCMND = -1;
          let colDangTat = -1;
          let colMucDo = -1;
          let colGhiChu = -1;
          let colNguoiDaiDien = -1;
          let colMoiQuanHe = -1;
          let colSDT = -1;
          let colTongDiem = -1;

          for (let c = 0; c < maxCols; c++) {
            const topCell = String(headerRow[c] || '').trim().toLowerCase();
            const subCell1 = String(nextHeaderRow[c] || '').trim().toLowerCase();
            const subCell2 = String(nextNextHeaderRow[c] || '').trim().toLowerCase();
            const combined = `${topCell} ${subCell1} ${subCell2}`.trim();

            if (colHoTen === -1 && (combined.includes('họ') || combined.includes('tên')) && !combined.includes('người đại diện') && !combined.includes('dạng tật')) {
              colHoTen = c;
            } else if (colNgaySinh === -1 && (combined.includes('ngày') || combined.includes('năm sinh') || combined.includes('sinh') || combined.includes('dob'))) {
              colNgaySinh = c;
            } else if (colGioiTinh === -1 && (combined.includes('giới') || combined.includes('nam/nữ') || combined.includes('sex') || combined.includes('nữ') || combined.includes('nam') || combined === 'gt')) {
              colGioiTinh = c;
            } else if (colThon === -1 && (combined.includes('thôn') || combined.includes('bản') || combined.includes('xóm') || combined.includes('ấp') || combined.includes('tổ') || combined.includes('địa chỉ'))) {
              colThon = c;
            } else if (colCMND === -1 && (combined.includes('cmnd') || combined.includes('cccd') || combined.includes('căn cước')) && !combined.includes('đại diện')) {
              colCMND = c;
            } else if (colDangTat === -1 && (combined.includes('dạng tật') || combined.includes('loại tật') || combined.includes('tên dạng tật'))) {
              colDangTat = c;
            } else if (colMucDo === -1 && (combined.includes('mức độ') || combined.includes('đánh giá mức độ'))) {
              colMucDo = c;
            } else if (colGhiChu === -1 && (combined.includes('ghi chú') || combined.includes('bệnh') || combined.includes('lý do'))) {
              colGhiChu = c;
            } else if (colNguoiDaiDien === -1 && (combined.includes('đại diện') || combined.includes('người giám hộ'))) {
              colNguoiDaiDien = c;
            } else if (colMoiQuanHe === -1 && (combined.includes('mối quan hệ') || combined.includes('quan hệ'))) {
              colMoiQuanHe = c;
            } else if (colSDT === -1 && (combined.includes('sđt') || combined.includes('điện thoại') || combined.includes('thoại'))) {
              colSDT = c;
            } else if (colTongDiem === -1 && (combined.includes('tổng điểm') || combined.includes('điểm'))) {
              colTongDiem = c;
            }
          }

          // Smart fallbacks if colHoTen is still -1
          if (colHoTen === -1) {
            let col0HasNames = false;
            let col1HasNames = false;
            for (let r = headerRowIdx + 1; r < Math.min(headerRowIdx + 10, rawRows.length); r++) {
              const rRow = rawRows[r];
              if (!rRow) continue;
              const val0 = String(rRow[0] || '').trim();
              const val1 = String(rRow[1] || '').trim();
              if (val0 && /[a-zA-Zàáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ]/i.test(val0) && !/^\d+$/.test(val0)) {
                col0HasNames = true;
              }
              if (val1 && /[a-zA-Zàáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ]/i.test(val1) && !/^\d+$/.test(val1)) {
                col1HasNames = true;
              }
            }
            if (col1HasNames) colHoTen = 1;
            else if (col0HasNames) colHoTen = 0;
            else colHoTen = 1;
          }

          if (colNgaySinh === -1) colNgaySinh = colHoTen + 1;

          // Smart detection of colGioiTinh vs colThon vs colDangTat
          if (colGioiTinh === -1) {
            let hasGenderInPlus2 = false;
            for (let r = headerRowIdx + 1; r < Math.min(headerRowIdx + 15, rawRows.length); r++) {
              const val = String(rawRows[r]?.[colHoTen + 2] || '').trim().toLowerCase();
              if (val === 'nam' || val === 'nữ' || val === 'nu' || val === 'm' || val === 'f') {
                hasGenderInPlus2 = true;
                break;
              }
            }
            if (hasGenderInPlus2 || (colThon !== -1 && colThon > colHoTen + 2)) {
              colGioiTinh = colHoTen + 2;
            }
          }

          if (colThon === -1) {
            colThon = colGioiTinh !== -1 ? colGioiTinh + 1 : colHoTen + 2;
          }

          if (colDangTat === -1) {
            colDangTat = colThon !== -1 ? colThon + 1 : colHoTen + 3;
          }

          let startRow = headerRowIdx + 1;
          const noiseKeywords = [
            'stt', 'họ và tên', 'họ tên', 'tên dạng tật', 'mức độ khuyết tật', 'mục', 'cộng',
            'tổng', 'ghi chú', 'phụ lục', 'biểu', 'bảng', 'danh sách', 'hội đồng', 'thực hiện được',
            'không thực hiện được', 'chủ tịch', 'thành viên', 'uỷ ban', 'ngày', 'tháng', 'năm'
          ];

          while (startRow < rawRows.length) {
            const candidateRow = rawRows[startRow] || [];
            const rawHoTenCandidate = String(candidateRow[colHoTen] || '').trim();
            const lowerCandidate = rawHoTenCandidate.toLowerCase();

            // If colHoTen contains a valid person name, it is a DATA row, NOT a sub-header!
            const hasLetters = /[a-zA-Zàáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ]/i.test(rawHoTenCandidate);
            const isNoise = noiseKeywords.some(kw => lowerCandidate === kw || lowerCandidate.startsWith(kw + ' ') || lowerCandidate.startsWith(kw + ':'));

            if (rawHoTenCandidate && hasLetters && !isNoise) {
              break; // Stop skipping, we reached real person data!
            }

            const subRowText = candidateRow.map(cell => String(cell || '').toLowerCase()).join(' ');
            if (!rawHoTenCandidate || subRowText.includes('tên dạng tật') || subRowText.includes('hoạt động') || /^\(\d+\)$/.test(rawHoTenCandidate)) {
              startRow++;
            } else {
              break;
            }
          }

          for (let r = startRow; r < rawRows.length; r++) {
            const row = rawRows[r];
            if (!row || row.length === 0) continue;

            const rawHoTen = String(row[colHoTen] || '').trim();

            if (!rawHoTen) continue;

            const lowerName = rawHoTen.toLowerCase();

            // Skip non-person header or footer lines
            const noiseKeywords = [
              'stt', 'họ và tên', 'họ tên', 'tên dạng tật', 'mức độ khuyết tật', 'mục', 'cộng',
              'tổng', 'ghi chú', 'phụ lục', 'biểu', 'bảng', 'danh sách', 'hội đồng', 'thực hiện được',
              'không thực hiện được', 'chủ tịch', 'thành viên', 'uỷ ban', 'ngày', 'tháng', 'năm'
            ];

            if (noiseKeywords.some(kw => lowerName === kw || lowerName.startsWith(kw + ' ') || lowerName.startsWith(kw + ':'))) {
              continue;
            }

            // Ensure the name actually has Vietnamese or alphabetical letters (not pure numbers or symbols)
            if (!/[a-zA-Zàáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ]/i.test(rawHoTen)) {
              continue;
            }

            const rawNgaySinh = row[colNgaySinh];
            const ngaySinhFormatted = parseExcelDate(rawNgaySinh);

            const rawGioiTinh = String(colGioiTinh !== -1 && row[colGioiTinh] !== undefined ? row[colGioiTinh] : '').trim();
            let gioiTinh: 'Nam' | 'Nữ' = 'Nam';
            const lowerGT = rawGioiTinh.toLowerCase();
            if (lowerGT.includes('nữ') || lowerGT.includes('nu') || lowerGT === 'n' || lowerGT === 'f') {
              gioiTinh = 'Nữ';
            } else if (lowerGT.includes('nam') || lowerGT === 'm') {
              gioiTinh = 'Nam';
            } else {
              if (/\bthị\b/i.test(rawHoTen) || /\bthi\b/i.test(rawHoTen)) {
                gioiTinh = 'Nữ';
              } else {
                gioiTinh = 'Nam';
              }
            }

            const thon = String(row[colThon] || '').trim();
            const cmnd = colCMND !== -1 ? String(row[colCMND] || '').trim() : '';
            const rawDangTat = String(row[colDangTat] || '').trim();
            const rawMucDo = String(row[colMucDo] || '').trim();
            const ghiChu = String(row[colGhiChu] || '').trim();
            const nguoiDaiDien = colNguoiDaiDien !== -1 ? String(row[colNguoiDaiDien] || '').trim() : '';
            const moiQuanHe = colMoiQuanHe !== -1 ? String(row[colMoiQuanHe] || '').trim() : '';
            const sdtNguoiDaiDien = colSDT !== -1 ? String(row[colSDT] || '').trim() : '';
            let tongDiem = colTongDiem !== -1 ? String(row[colTongDiem] || '').trim() : '';

            // Try to find 10 consecutive activity score columns (values 0, 1, 2)
            let parsedScores10: number[] | undefined = undefined;
            let searchStart = colTongDiem !== -1 ? colTongDiem + 1 : (colMucDo !== -1 ? colMucDo + 1 : -1);

            if (searchStart !== -1 && searchStart + 10 <= row.length) {
              const candidateScores: number[] = [];
              for (let c = searchStart; c < searchStart + 10; c++) {
                const valStr = String(row[c] !== undefined && row[c] !== null ? row[c] : '').trim().replace(',', '.');
                const valNum = Number(valStr);
                if (!isNaN(valNum) && valStr !== '' && valNum >= 0 && valNum <= 2) {
                  candidateScores.push(valNum);
                }
              }
              if (candidateScores.length === 10) {
                parsedScores10 = candidateScores;
              }
            }

            // Fallback search across row for 10 adjacent numbers in [0, 2]
            if (!parsedScores10) {
              for (let c = 0; c <= row.length - 10; c++) {
                const candidateScores: number[] = [];
                for (let k = 0; k < 10; k++) {
                  const valStr = String(row[c + k] !== undefined && row[c + k] !== null ? row[c + k] : '').trim().replace(',', '.');
                  const valNum = Number(valStr);
                  if (!isNaN(valNum) && valStr !== '' && valNum >= 0 && valNum <= 2) {
                    candidateScores.push(valNum);
                  } else {
                    break;
                  }
                }
                if (candidateScores.length === 10) {
                  parsedScores10 = candidateScores;
                  break;
                }
              }
            }

            if (parsedScores10 && !tongDiem) {
              tongDiem = String(parsedScores10.reduce((a, b) => a + b, 0));
            }

            // De-duplicate if exact person already exists in the same sheet
            const dupKey = `${rawHoTen.toLowerCase()}_${ngaySinhFormatted}_${thon.toLowerCase()}_sheet${sheetIdx}`;
            if (seenKeys.has(dupKey)) {
              continue;
            }
            seenKeys.add(dupKey);

            let parsedMucDo = normalizeMucDo(rawMucDo);
            if (parsedMucDo === 'Không xác định') {
              for (let c = 0; c < row.length; c++) {
                const cellVal = String(row[c] !== undefined && row[c] !== null ? row[c] : '').trim();
                if (!cellVal) continue;
                const normCell = normalizeMucDo(cellVal);
                if (normCell !== 'Không xác định') {
                  parsedMucDo = normCell;
                  break;
                }
              }
            }

            allRecords.push({
              id: `excel-${sttCounter}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
              stt: sttCounter,
              hoTen: rawHoTen,
              ngaySinh: ngaySinhFormatted,
              gioiTinh,
              thon,
              cmnd,
              dangTat: normalizeDangTat(rawDangTat),
              mucDo: parsedMucDo,
              nhomTuoi: sheetNhomTuoi,
              ghiChu,
              nguoiDaiDien,
              moiQuanHe,
              sdtNguoiDaiDien,
              tongDiem: tongDiem ? Number(tongDiem) || tongDiem : undefined,
              scores10: parsedScores10
            });

            sttCounter++;
          }
        }

        resolve(allRecords);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}

export function exportToExcel(records: SubjectRecord[], filename: string) {
  const mapRecord = (r: SubjectRecord, idx: number) => ({
    'STT': idx + 1,
    'Họ và tên': r.hoTen,
    'Ngày tháng năm sinh': r.ngaySinhFormat || r.ngaySinh,
    'Giới tính': r.gioiTinh,
    'Thôn': r.thon,
    'Dạng tật': r.dangTat,
    'Mức độ khuyết tật': r.mucDo,
    'Nhóm tuổi': r.nhomTuoi || '',
    'Số CMND/CCCD': r.cmnd || '',
    'Người đại diện': r.nguoiDaiDien || '',
    'Mối quan hệ': r.moiQuanHe || '',
    'SĐT người đại diện': r.sdtNguoiDaiDien || '',
    'Ghi chú': r.ghiChu || ''
  });

  const workbook = XLSX.utils.book_new();

  const over6 = records.filter(r => r.nhomTuoi === 'Từ 6 tuổi trở lên');
  const under6 = records.filter(r => r.nhomTuoi === 'Dưới 6 tuổi');

  if (over6.length > 0 && under6.length > 0) {
    const wsOver6 = XLSX.utils.json_to_sheet(over6.map(mapRecord));
    XLSX.utils.book_append_sheet(workbook, wsOver6, 'Trên 6 tuổi');
    const wsUnder6 = XLSX.utils.json_to_sheet(under6.map(mapRecord));
    XLSX.utils.book_append_sheet(workbook, wsUnder6, 'Dưới 6 tuổi');
  } else if (under6.length > 0 && over6.length === 0) {
    const wsUnder6 = XLSX.utils.json_to_sheet(under6.map(mapRecord));
    XLSX.utils.book_append_sheet(workbook, wsUnder6, 'Dưới 6 tuổi');
  } else if (over6.length > 0 && under6.length === 0) {
    const wsOver6 = XLSX.utils.json_to_sheet(over6.map(mapRecord));
    XLSX.utils.book_append_sheet(workbook, wsOver6, 'Trên 6 tuổi');
  } else {
    const wsAll = XLSX.utils.json_to_sheet(records.map(mapRecord));
    XLSX.utils.book_append_sheet(workbook, wsAll, 'Danh_sach_doi_tuong');
  }

  XLSX.writeFile(workbook, filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`);
}

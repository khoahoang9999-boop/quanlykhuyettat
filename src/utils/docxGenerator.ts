import {
  Document,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  PageOrientation,
  BorderStyle,
  Packer,
  VerticalAlign,
  HeightRule,
  TableLayoutType
} from 'docx';
import saveAs from 'file-saver';
import JSZip from 'jszip';
import { SubjectRecord, AdminConfig } from '../types';
import { getDateParts, sanitizeFilename } from './dateUtils';

const FONT_FAMILY = 'Times New Roman';

// Margins according to Decree 30/2020/NĐ-CP (Top 20mm, Bottom 20mm, Left 30mm, Right 15mm)
const A4_PORTRAIT_MARGINS = {
  top: 1134,    // 20 mm
  bottom: 1134, // 20 mm
  left: 1701,   // 30 mm
  right: 850    // 15 mm
};

const A4_PORTRAIT_SIZE = {
  width: 11906, // 210 mm
  height: 16838 // 297 mm
};

const A4_LANDSCAPE_SIZE = {
  width: 16838, // 297 mm
  height: 11906, // 210 mm
  orientation: PageOrientation.LANDSCAPE
};

const A4_LANDSCAPE_MARGINS = {
  top: 1134,    // 20 mm
  bottom: 1134, // 20 mm
  left: 1134,   // 20 mm
  right: 1134   // 20 mm
};

const NO_BORDER_STYLE = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };

function formatLocationWithTai(location?: string): string {
  let trimmed = (location || '').trim();
  if (!trimmed) return 'Tại hội trường UBND xã';
  // Strip all repeated leading "tại" / "Tại" / "TẠI" words plus spaces
  trimmed = trimmed.replace(/^(tại\s+)+/i, '');
  return 'Tại ' + trimmed;
}

export function isRecordUndetermined(subject: SubjectRecord): boolean {
  const mucDo = String(subject.mucDo || '').trim();

  // If mucDo is explicitly set to one of the defined levels, it is NOT undetermined
  if (
    mucDo === 'Đặc biệt nặng' ||
    mucDo === 'Nặng' ||
    mucDo === 'Nhẹ' ||
    mucDo === 'Không khuyết tật'
  ) {
    return false;
  }

  const mucDoLower = mucDo.toLowerCase();
  if (
    mucDoLower.includes('đặc biệt nặng') ||
    mucDoLower.includes('nặng') ||
    mucDoLower.includes('nhẹ') ||
    mucDoLower.includes('không khuyết tật')
  ) {
    if (!mucDoLower.includes('không xác định') && !mucDoLower.includes('chưa xác định')) {
      return false;
    }
  }

  if (
    mucDoLower.includes('không xác định') ||
    mucDoLower.includes('chưa xác định') ||
    mucDoLower.includes('không đưa ra được') ||
    mucDoLower.includes('chưa kết luận') ||
    mucDoLower.includes('không kết luận') ||
    mucDoLower.includes('chưa đủ điều kiện')
  ) return true;

  // Only check dangTat and ghiChu if mucDo is empty or 'Không xác định'
  if (!mucDo || mucDo === 'Không xác định') {
    const dangTatLower = String(subject.dangTat || '').toLowerCase();
    if (
      dangTatLower.includes('không xác định') ||
      dangTatLower.includes('chưa xác định') ||
      dangTatLower.includes('không đưa ra được') ||
      dangTatLower.includes('chưa kết luận') ||
      dangTatLower.includes('không kết luận')
    ) return true;

    const ghiChuLower = (subject.ghiChu || '').toLowerCase();
    if (
      ghiChuLower.includes('không xác định') ||
      ghiChuLower.includes('chưa xác định') ||
      ghiChuLower.includes('không đưa ra được kết luận') ||
      ghiChuLower.includes('chưa kết luận') ||
      ghiChuLower.includes('chưa đủ điều kiện')
    ) return true;
  }

  return false;
}

function getSubItemKey(dangTat?: string, ghiChu?: string): { groupIdx: number; itemStt: string } {
  const dt = (dangTat || '').toLowerCase();
  const gc = (ghiChu || '').toLowerCase();

  if (dt.includes('vận động')) {
    if (gc.includes('mềm nhẽo') || gc.includes('co cứng') || gc.includes('liệt toàn thân')) return { groupIdx: 1, itemStt: '1.1' };
    if (gc.includes('hai tay') || gc.includes('thiếu tay')) return { groupIdx: 1, itemStt: '1.2' };
    if (gc.includes('hai chân') || gc.includes('thiếu chân') || gc.includes('chân')) return { groupIdx: 1, itemStt: '1.3' };
    if (gc.includes('gù') || gc.includes('cong') || gc.includes('vẹo') || gc.includes('dị dạng') || gc.includes('cột sống')) return { groupIdx: 1, itemStt: '1.5' };
    if (gc.includes('y tế') || gc.includes('kết luận') || gc.includes('bệnh viện')) return { groupIdx: 1, itemStt: '1.6' };
    return { groupIdx: 1, itemStt: '1.4' };
  }
  if (dt.includes('nghe') || dt.includes('nói')) {
    if (gc.includes('không nói') || gc.includes('câm')) return { groupIdx: 2, itemStt: '2.1' };
    if (gc.includes('điếc') || gc.includes('không nghe')) return { groupIdx: 2, itemStt: '2.3' };
    if (gc.includes('tai') || gc.includes('vành tai')) return { groupIdx: 2, itemStt: '2.5' };
    return { groupIdx: 2, itemStt: '2.2' };
  }
  if (dt.includes('nhìn')) {
    if (gc.includes('mù')) return { groupIdx: 3, itemStt: '3.1' };
    if (gc.includes('thiếu')) return { groupIdx: 3, itemStt: '3.2' };
    return { groupIdx: 3, itemStt: '3.3' };
  }
  if (dt.includes('thần kinh') || dt.includes('tâm thần')) {
    if (gc.includes('co giật')) return { groupIdx: 4, itemStt: '4.1' };
    if (gc.includes('mất trí') || gc.includes('lang thang')) return { groupIdx: 4, itemStt: '4.4' };
    return { groupIdx: 4, itemStt: '4.2' };
  }
  if (dt.includes('trí tuệ')) {
    if (gc.includes('giao tiếp') || gc.includes('nhận biết')) return { groupIdx: 5, itemStt: '5.1' };
    if (gc.includes('đọc') || gc.includes('viết') || gc.includes('tính')) return { groupIdx: 5, itemStt: '5.3' };
    return { groupIdx: 5, itemStt: '5.2' };
  }
  // Khác
  if (gc.includes('hô hấp') || gc.includes('tim')) return { groupIdx: 6, itemStt: '6.2' };
  if (gc.includes('tự kỷ')) return { groupIdx: 6, itemStt: '6.3' };
  return { groupIdx: 6, itemStt: '6.1' };
}

export function getSec4SubItemStt(mucDo?: string, dangTat?: string, ghiChu?: string, isUnder6?: boolean): string {
  const md = (mucDo || '').toLowerCase();
  const gc = (ghiChu || '').toLowerCase();

  if (!md || md.includes('không xác định') || md.includes('nhẹ') || md.includes('không khuyết tật')) {
    return '';
  }

  if (md.includes('đặc biệt nặng')) {
    if (gc.includes('mềm nhẽo') || gc.includes('co cứng') || gc.includes('liệt toàn thân') || gc.includes('1.1')) return '1.1';
    if (gc.includes('thiếu hai tay') || gc.includes('thiếu 2 tay') || gc.includes('1.2')) return '1.2';
    if (gc.includes('thiếu hai chân') || gc.includes('thiếu 2 chân') || gc.includes('liệt hai chân') || gc.includes('liệt 2 chân')) {
      return isUnder6 ? '1.3' : '';
    }
    if (gc.includes('thiếu một tay và thiếu một chân') || gc.includes('thiếu 1 tay 1 chân')) {
      return isUnder6 ? '1.4' : '';
    }
    if (gc.includes('mù hai mắt') || gc.includes('mù 2 mắt') || gc.includes('thiếu hai mắt') || gc.includes('thiếu 2 mắt') || gc.includes('1.3') || gc.includes('1.5')) {
      return isUnder6 ? '1.5' : '1.3';
    }
    if (gc.includes('liệt nửa người') || gc.includes('liệt hai tay') || gc.includes('liệt 2 tay') || gc.includes('1.4') || gc.includes('1.6')) {
      return isUnder6 ? '1.6' : '1.4';
    }
    if (gc.includes('bại não') || gc.includes('não úng thủy') || gc.includes('tâm thần phân liệt') || gc.includes('1.5') || gc.includes('1.7')) {
      return isUnder6 ? '1.7' : '1.5';
    }
    return ''; // DO NOT default/fallback! If no specific observation sign, evaluated by scoring
  } else if (md.includes('nặng')) {
    if (gc.includes('câm và điếc hoàn toàn') || gc.includes('câm điếc hoàn toàn') || gc.includes('câm điếc') || gc.includes('2.6') || gc.includes('2.1')) {
      return isUnder6 ? '2.6' : '2.1';
    }
    if (isUnder6) {
      if (gc.includes('không cử động được một tay') || gc.includes('không cử động được một chân') || gc.includes('2.1')) return '2.1';
      if (gc.includes('thiếu một tay') || gc.includes('thiếu 1 tay') || gc.includes('2.2')) return '2.2';
      if (gc.includes('thiếu một chân') || gc.includes('thiếu 1 chân') || gc.includes('2.3')) return '2.3';
      if (gc.includes('mù một mắt') || gc.includes('mù 1 mắt') || gc.includes('2.4')) return '2.4';
      if (gc.includes('thiếu một mắt') || gc.includes('thiếu 1 mắt') || gc.includes('2.5')) return '2.5';
    }
    return '';
  }
  return '';
}

export function getScoresFor10Activities(subject: SubjectRecord): { scores: number[]; totalScore: number } {
  if (subject.scores10 && Array.isArray(subject.scores10) && subject.scores10.length === 10) {
    const scores = subject.scores10.map(s => Number(s) || 0);
    const totalScore = scores.reduce((a, b) => a + b, 0);
    return { scores, totalScore };
  }

  let targetScore = 0;
  const md = (subject.mucDo || '').toLowerCase();

  if (subject.tongDiem !== undefined && subject.tongDiem !== null && !isNaN(Number(subject.tongDiem)) && Number(subject.tongDiem) > 0) {
    targetScore = Number(subject.tongDiem);
    // Ensure targetScore matches declared level
    if (md.includes('đặc biệt nặng') && targetScore < 13) targetScore = 15;
    else if (md.includes('nặng') && (targetScore < 7 || targetScore > 12)) targetScore = 9;
    else if (md.includes('nhẹ') && targetScore > 6) targetScore = 3;
  } else {
    if (md.includes('đặc biệt nặng')) targetScore = 15;
    else if (md.includes('nặng')) targetScore = 9;
    else targetScore = 3; // Nhẹ or default
  }

  const dt = (subject.dangTat || '').toLowerCase();
  let priorityIndices = [0, 7, 8, 3, 4, 6, 5, 9, 1, 2];
  if (dt.includes('vận động')) {
    priorityIndices = [0, 3, 4, 7, 8, 1, 2, 6, 5, 9];
  } else if (dt.includes('nghe') || dt.includes('nói')) {
    priorityIndices = [5, 6, 8, 7, 9, 0, 1, 2, 3, 4];
  } else if (dt.includes('nhìn')) {
    priorityIndices = [0, 9, 7, 8, 3, 4, 1, 2, 5, 6];
  } else if (dt.includes('thần kinh') || dt.includes('tâm thần')) {
    priorityIndices = [8, 7, 6, 5, 9, 3, 4, 0, 1, 2];
  } else if (dt.includes('trí tuệ')) {
    priorityIndices = [9, 8, 6, 5, 7, 3, 4, 0, 1, 2];
  }

  const scores = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  let pointsLeft = targetScore;

  for (const idx of priorityIndices) {
    if (pointsLeft <= 0) break;
    const add = Math.min(2, pointsLeft);
    scores[idx] += add;
    pointsLeft -= add;
  }

  for (let i = 0; i < 10 && pointsLeft > 0; i++) {
    const space = 2 - scores[i];
    if (space > 0) {
      const add = Math.min(space, pointsLeft);
      scores[i] += add;
      pointsLeft -= add;
    }
  }

  const actualTotal = scores.reduce((a, b) => a + b, 0);
  return { scores, totalScore: actualTotal };
}

const NO_BORDERS = {
  top: NO_BORDER_STYLE,
  bottom: NO_BORDER_STYLE,
  left: NO_BORDER_STYLE,
  right: NO_BORDER_STYLE,
  insideHorizontal: NO_BORDER_STYLE,
  insideVertical: NO_BORDER_STYLE
};

function createNoBorderCell(content: Paragraph[], widthPercent: number): TableCell {
  return new TableCell({
    width: { size: widthPercent, type: WidthType.PERCENTAGE },
    borders: NO_BORDERS,
    children: content
  });
}

function createBorderedCell(content: Paragraph[], widthPercent?: number, align: any = VerticalAlign.CENTER, bgColor?: string): TableCell {
  return new TableCell({
    width: widthPercent ? { size: widthPercent, type: WidthType.PERCENTAGE } : undefined,
    verticalAlign: align as any,
    shading: bgColor ? { fill: bgColor } : undefined,
    margins: { top: 120, bottom: 120, left: 180, right: 180 },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
      left: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
      right: { style: BorderStyle.SINGLE, size: 4, color: '000000' }
    },
    children: content
  });
}

function buildHeaderTable(config: AdminConfig, isNotice = false): Table {
  const xaUpper = (config.xaName || 'HÀM YÊN').toUpperCase();
  const leftText1 = isNotice ? 'ỦY BAN NHÂN DÂN' : 'UBND XÃ ' + xaUpper;
  const leftText2 = isNotice ? `XÃ ${xaUpper}` : 'HỘI ĐỒNG XÁC ĐỊNH MĐKT';
  const leftText3 = isNotice ? `Số: ${config.soThongBao || '40/TB-UBND'}` : undefined;

  const dateParts = getDateParts(config.ngayHop);

  const leftParagraphs = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 20 },
      children: [new TextRun({ text: leftText1, font: FONT_FAMILY, size: leftText1.startsWith('UBND') ? 22 : 24, bold: !leftText1.startsWith('UBND') })]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 20 },
      children: [new TextRun({ text: leftText2, bold: true, font: FONT_FAMILY, size: 24 })]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 20 },
      children: [new TextRun({ text: '---------------', bold: true, font: FONT_FAMILY, size: 18 })]
    })
  ];

  if (leftText3) {
    leftParagraphs.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 40, after: 20 },
        children: [new TextRun({ text: leftText3, font: FONT_FAMILY, size: 26 })]
      })
    );
  }

  const rightParagraphs = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 20 },
      children: [new TextRun({ text: 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM', bold: true, font: FONT_FAMILY, size: 24 })]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 20 },
      children: [new TextRun({ text: 'Độc lập – Tự do – Hạnh phúc', bold: true, font: FONT_FAMILY, size: 26 })]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 40 },
      children: [new TextRun({ text: '-----------------------', bold: true, font: FONT_FAMILY, size: 18 })]
    })
  ];

  if (isNotice) {
    rightParagraphs.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 40 },
        children: [
          new TextRun({
            text: `${config.xaName || 'Hàm Yên'}, ngày ${dateParts.day} tháng ${dateParts.month} năm ${dateParts.year}`,
            italics: true,
            font: FONT_FAMILY,
            size: 26
          })
        ]
      })
    );
  }

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: NO_BORDERS,
    rows: [
      new TableRow({
        children: [
          createNoBorderCell(leftParagraphs, 45),
          createNoBorderCell(rightParagraphs, 55)
        ]
      })
    ]
  });
}

/**
 * Generate Mẫu 02 (Under 6 years old) or Mẫu 01 (6+ years old) Blob
 */
export function buildPhieuChildren(subject: SubjectRecord, config: AdminConfig) {
  const isUnder6 = subject.nhomTuoi === 'Dưới 6 tuổi';
  const titleText = isUnder6
    ? 'PHIẾU XÁC ĐỊNH MỨC ĐỘ KHUYẾT TẬT ĐỐI VỚI TRẺ EM DƯỚI 6 TUỔI'
    : 'PHIẾU XÁC ĐỊNH MỨC ĐỘ KHUYẾT TẬT ĐỐI VỚI NGƯỜI TỪ ĐỦ 6 TUỔI TRỞ LÊN';

  const dateParts = getDateParts(config.ngayHop);
  const dobParts = getDateParts(subject.ngaySinh);

  // Group 4 items vary by age group according to Circular 01/2019
  const group4Items = isUnder6
    ? [
        { stt: '4.1', text: 'Thường xuyên lên cơn co giật' },
        { stt: '4.2', text: 'Có kết luận của cơ sở y tế cấp tỉnh trở lên về bệnh thần kinh, tâm thần, tâm thần phân liệt' }
      ]
    : [
        { stt: '4.1', text: 'Thường ngồi một mình, chơi một mình, không bao giờ nói chuyện hoặc quan tâm tới bất kỳ ai' },
        { stt: '4.2', text: 'Có những hành vi bất thường như kích động, cáu giận hoặc sợ hãi vô cớ gây ảnh hưởng đến sức khỏe, sự an toàn của bản thân và người khác' },
        { stt: '4.3', text: 'Bất ngờ dừng mọi hoạt động, mắt mở trừng trừng không chớp, co giật chân tay; môi, mặt tím tái bất thần lịm ngã xuống, co giật, sủi bọt mép, gọi hỏi không biết' },
        { stt: '4.4', text: 'Bị mất trí nhớ, bỏ nhà đi lang thang' },
        { stt: '4.5', text: 'Có kết luận của cơ sở y tế cấp tỉnh trở lên về suy giảm thần kinh, tâm thần, tâm thần phân liệt' }
      ];

  const sec3Sel = getSubItemKey(subject.dangTat, subject.ghiChu);
  const sec4SelStt = getSec4SubItemStt(subject.mucDo, subject.dangTat, subject.ghiChu, isUnder6);
  const isByFrame = subject.danhGiaTheoKhung === true || (subject.danhGiaTheoKhung !== false && Boolean(sec4SelStt));
  const { scores: actScores, totalScore: computedTotalScore } = getScoresFor10Activities(subject);

  return [
    ...(isUnder6 ? [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 40 },
        children: [new TextRun({ text: 'Mẫu số 02', bold: true, font: FONT_FAMILY, size: 24 })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 120 },
        children: [new TextRun({ text: '(Ban hành kèm theo Thông tư số 01/2019/TT-BLĐTBXH ngày 02 tháng 01 năm 2019)', italics: true, font: FONT_FAMILY, size: 20 })]
      })
    ] : []),
    buildHeaderTable(config, false),
    new Paragraph({ text: '', spacing: { before: 150 } }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 180, after: 180 },
      children: [
        new TextRun({
          text: titleText,
          bold: true,
          font: FONT_FAMILY,
          size: 28
        })
      ]
    }),

    // Section I
    new Paragraph({
      spacing: { before: 150, after: 80 },
      children: [
        new TextRun({
          text: 'I. Thông tin người được xác định mức độ khuyết tật',
          bold: true,
          font: FONT_FAMILY,
          size: 26
        })
      ]
    }),
    new Paragraph({
      spacing: { after: 50 },
      children: [
        new TextRun({ text: `- Họ và tên: ${subject.hoTen}`, font: FONT_FAMILY, size: 26 })
      ]
    }),
    new Paragraph({
      spacing: { after: 50 },
      children: [
        new TextRun({
          text: `- Sinh ngày ${dobParts.day} tháng ${dobParts.month} năm ${dobParts.year}    Giới tính: ${subject.gioiTinh}`,
          font: FONT_FAMILY,
          size: 26
        })
      ]
    }),
    new Paragraph({
      spacing: { after: 50 },
      children: [
        new TextRun({
          text: `- Hộ khẩu thường trú: Thôn ${subject.thon}, xã ${config.xaName}, tỉnh ${config.tinhName}`,
          font: FONT_FAMILY,
          size: 26
        })
      ]
    }),
    new Paragraph({
      spacing: { after: 50 },
      children: [
        new TextRun({
          text: `- Số CMND hoặc căn cước công dân (nếu có): ${subject.cmnd || '................................................'}`,
          font: FONT_FAMILY,
          size: 26
        })
      ]
    }),
    new Paragraph({
      spacing: { after: 50 },
      children: [
        new TextRun({
          text: `- Nơi ở hiện nay : Thôn ${subject.thon}, xã ${config.xaName}, tỉnh ${config.tinhName}`,
          font: FONT_FAMILY,
          size: 26
        })
      ]
    }),

    // Section II
    new Paragraph({
      spacing: { before: 150, after: 80 },
      children: [
        new TextRun({
          text: 'II. Thông tin người đại diện hợp pháp (nếu có)',
          bold: true,
          font: FONT_FAMILY,
          size: 26
        })
      ]
    }),
    new Paragraph({
      spacing: { after: 50 },
      children: [
        new TextRun({ text: `- Họ và tên: ${subject.nguoiDaiDien || '............................................................'}`, font: FONT_FAMILY, size: 26 })
      ]
    }),
    new Paragraph({
      spacing: { after: 50 },
      children: [
        new TextRun({ text: `- Mối quan hệ với người được xác định khuyết tật: ${subject.moiQuanHe || '...................'}`, font: FONT_FAMILY, size: 26 })
      ]
    }),
    new Paragraph({
      spacing: { after: 50 },
      children: [
        new TextRun({ text: `- Số CMND hoặc căn cước công dân: ${subject.cmndNguoiDaiDien || '................................................'}`, font: FONT_FAMILY, size: 26 })
      ]
    }),
    new Paragraph({
      spacing: { after: 50 },
      children: [
        new TextRun({
          text: `- Hộ khẩu thường trú: ${subject.nguoiDaiDien ? `Thôn ${subject.thon}, xã ${config.xaName}, tỉnh ${config.tinhName}` : '............................................................'}`,
          font: FONT_FAMILY,
          size: 26
        })
      ]
    }),
    new Paragraph({
      spacing: { after: 50 },
      children: [
        new TextRun({ text: `- Số điện thoại: ${subject.sdtNguoiDaiDien || '................................................'}`, font: FONT_FAMILY, size: 26 })
      ]
    }),

    // Section III: Table of Disability Types
    new Paragraph({
      spacing: { before: 150, after: 80 },
      children: [
        new TextRun({ text: 'III. Xác định dạng khuyết tật', bold: true, font: FONT_FAMILY, size: 26 })
      ]
    }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        // Header
        new TableRow({
          children: [
            createBorderedCell([new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'STT', bold: true, font: FONT_FAMILY, size: 22 })] })], 8),
            createBorderedCell([new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Các dạng khuyết tật', bold: true, font: FONT_FAMILY, size: 22 })] })], 64),
            createBorderedCell([new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Có', bold: true, font: FONT_FAMILY, size: 22 })] })], 14),
            createBorderedCell([new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Không', bold: true, font: FONT_FAMILY, size: 22 })] })], 14)
          ]
        }),
        // Group 1: Vận động
        new TableRow({
          children: [
            createBorderedCell([new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '1', bold: true, font: FONT_FAMILY, size: 22 })] })], 8, VerticalAlign.CENTER, 'F2F4F7'),
            createBorderedCell([new Paragraph({ children: [new TextRun({ text: 'Khuyết tật vận động', bold: true, font: FONT_FAMILY, size: 22 })] })], 64, VerticalAlign.CENTER, 'F2F4F7'),
            createBorderedCell([new Paragraph({ children: [new TextRun({ text: subject.dangTat === 'Vận động' ? 'X' : '', bold: true, font: FONT_FAMILY, size: 22 })], alignment: AlignmentType.CENTER })], 14, VerticalAlign.CENTER, 'F2F4F7'),
            createBorderedCell([new Paragraph({ children: [new TextRun({ text: subject.dangTat && subject.dangTat !== 'Vận động' ? 'X' : '', bold: true, font: FONT_FAMILY, size: 22 })], alignment: AlignmentType.CENTER })], 14, VerticalAlign.CENTER, 'F2F4F7')
          ]
        }),
        ...[
          { stt: '1.1', text: 'Mềm nhẽo hoặc co cứng toàn thân' },
          { stt: '1.2', text: 'Thiếu tay hoặc không cử động được tay' },
          { stt: '1.3', text: 'Thiếu chân hoặc không cử động được chân' },
          { stt: '1.4', text: 'Yếu, liệt, teo cơ hoặc hạn chế vận động tay, chân, lưng, cổ' },
          { stt: '1.5', text: 'Cong, vẹo, chân tay, lưng, cổ; gù cột sống lưng hoặc dị dạng, biến dạng khác trên cơ thể ở đầu, cổ, lưng, tay, chân' },
          { stt: '1.6', text: 'Có kết luận của cơ sở y tế cấp tỉnh trở lên về suy giảm chức năng vận động' }
        ].map(item => {
          const isSelected = subject.dangTat === 'Vận động' && item.stt === sec3Sel.itemStt;
          return new TableRow({
            children: [
              createBorderedCell([new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: item.stt, font: FONT_FAMILY, size: 22 })] })], 8),
              createBorderedCell([new Paragraph({ children: [new TextRun({ text: item.text, font: FONT_FAMILY, size: 22 })] })], 64),
              createBorderedCell([new Paragraph({ children: [new TextRun({ text: isSelected ? 'X' : '', bold: true, font: FONT_FAMILY, size: 22 })], alignment: AlignmentType.CENTER })], 14),
              createBorderedCell([new Paragraph({ children: [new TextRun({ text: subject.dangTat === 'Vận động' ? (!isSelected ? 'X' : '') : (subject.dangTat ? 'X' : ''), bold: true, font: FONT_FAMILY, size: 22 })], alignment: AlignmentType.CENTER })], 14)
            ]
          });
        }),

        // Group 2: Nghe, nói
        new TableRow({
          children: [
            createBorderedCell([new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '2', bold: true, font: FONT_FAMILY, size: 22 })] })], 8, VerticalAlign.CENTER, 'F2F4F7'),
            createBorderedCell([new Paragraph({ children: [new TextRun({ text: 'Khuyết tật nghe, nói', bold: true, font: FONT_FAMILY, size: 22 })] })], 64, VerticalAlign.CENTER, 'F2F4F7'),
            createBorderedCell([new Paragraph({ children: [new TextRun({ text: subject.dangTat === 'Nghe, nói' ? 'X' : '', bold: true, font: FONT_FAMILY, size: 22 })], alignment: AlignmentType.CENTER })], 14, VerticalAlign.CENTER, 'F2F4F7'),
            createBorderedCell([new Paragraph({ children: [new TextRun({ text: subject.dangTat && subject.dangTat !== 'Nghe, nói' ? 'X' : '', bold: true, font: FONT_FAMILY, size: 22 })], alignment: AlignmentType.CENTER })], 14, VerticalAlign.CENTER, 'F2F4F7')
          ]
        }),
        ...[
          { stt: '2.1', text: 'Không phát ra âm thanh, lời nói' },
          { stt: '2.2', text: 'Phát ra âm thanh, lời nói nhưng không rõ tiếng, rõ câu' },
          { stt: '2.3', text: 'Không nghe được' },
          { stt: '2.4', text: 'Khiếm khuyết hoặc dị dạng cơ quan phát âm ảnh hưởng đến việc phát âm' },
          { stt: '2.5', text: 'Khiếm khuyết hoặc dị dạng vành tai hoặc ống tai ngoài ảnh hưởng đến nghe' },
          { stt: '2.6', text: 'Có kết luận của cơ sở y tế cấp tỉnh trở lên về suy giảm chức năng nghe, nói' }
        ].map(item => {
          const isSelected = subject.dangTat === 'Nghe, nói' && item.stt === sec3Sel.itemStt;
          return new TableRow({
            children: [
              createBorderedCell([new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: item.stt, font: FONT_FAMILY, size: 22 })] })], 8),
              createBorderedCell([new Paragraph({ children: [new TextRun({ text: item.text, font: FONT_FAMILY, size: 22 })] })], 64),
              createBorderedCell([new Paragraph({ children: [new TextRun({ text: isSelected ? 'X' : '', bold: true, font: FONT_FAMILY, size: 22 })], alignment: AlignmentType.CENTER })], 14),
              createBorderedCell([new Paragraph({ children: [new TextRun({ text: subject.dangTat === 'Nghe, nói' ? (!isSelected ? 'X' : '') : (subject.dangTat ? 'X' : ''), bold: true, font: FONT_FAMILY, size: 22 })], alignment: AlignmentType.CENTER })], 14)
            ]
          });
        }),

        // Group 3: Nhìn
        new TableRow({
          children: [
            createBorderedCell([new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '3', bold: true, font: FONT_FAMILY, size: 22 })] })], 8, VerticalAlign.CENTER, 'F2F4F7'),
            createBorderedCell([new Paragraph({ children: [new TextRun({ text: 'Khuyết tật nhìn', bold: true, font: FONT_FAMILY, size: 22 })] })], 64, VerticalAlign.CENTER, 'F2F4F7'),
            createBorderedCell([new Paragraph({ children: [new TextRun({ text: subject.dangTat === 'Nhìn' ? 'X' : '', bold: true, font: FONT_FAMILY, size: 22 })], alignment: AlignmentType.CENTER })], 14, VerticalAlign.CENTER, 'F2F4F7'),
            createBorderedCell([new Paragraph({ children: [new TextRun({ text: subject.dangTat && subject.dangTat !== 'Nhìn' ? 'X' : '', bold: true, font: FONT_FAMILY, size: 22 })], alignment: AlignmentType.CENTER })], 14, VerticalAlign.CENTER, 'F2F4F7')
          ]
        }),
        ...[
          { stt: '3.1', text: 'Mù một hoặc hai mắt' },
          { stt: '3.2', text: 'Thiếu một hoặc hai mắt' },
          { stt: '3.3', text: 'Khó khăn khi nhìn hoặc không nhìn thấy các đồ vật' },
          { stt: '3.4', text: 'Khó khăn khi phân biệt màu sắc' },
          { stt: '3.5', text: 'Rung, giật nhãn thị, đục nhân mắt hoặc sẹo loét giác mạc' },
          { stt: '3.6', text: 'Bị dị tật, biến dạng ở vùng mắt' },
          { stt: '3.7', text: 'Có kết luận của cơ sở y tế cấp tỉnh trở lên về suy giảm chức năng nhìn' }
        ].map(item => {
          const isSelected = subject.dangTat === 'Nhìn' && item.stt === sec3Sel.itemStt;
          return new TableRow({
            children: [
              createBorderedCell([new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: item.stt, font: FONT_FAMILY, size: 22 })] })], 8),
              createBorderedCell([new Paragraph({ children: [new TextRun({ text: item.text, font: FONT_FAMILY, size: 22 })] })], 64),
              createBorderedCell([new Paragraph({ children: [new TextRun({ text: isSelected ? 'X' : '', bold: true, font: FONT_FAMILY, size: 22 })], alignment: AlignmentType.CENTER })], 14),
              createBorderedCell([new Paragraph({ children: [new TextRun({ text: subject.dangTat === 'Nhìn' ? (!isSelected ? 'X' : '') : (subject.dangTat ? 'X' : ''), bold: true, font: FONT_FAMILY, size: 22 })], alignment: AlignmentType.CENTER })], 14)
            ]
          });
        }),

        // Group 4: Thần kinh, tâm thần
        new TableRow({
          children: [
            createBorderedCell([new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '4', bold: true, font: FONT_FAMILY, size: 22 })] })], 8, VerticalAlign.CENTER, 'F2F4F7'),
            createBorderedCell([new Paragraph({ children: [new TextRun({ text: 'Khuyết tật thần kinh, tâm thần', bold: true, font: FONT_FAMILY, size: 22 })] })], 64, VerticalAlign.CENTER, 'F2F4F7'),
            createBorderedCell([new Paragraph({ children: [new TextRun({ text: subject.dangTat === 'Thần kinh, tâm thần' ? 'X' : '', bold: true, font: FONT_FAMILY, size: 22 })], alignment: AlignmentType.CENTER })], 14, VerticalAlign.CENTER, 'F2F4F7'),
            createBorderedCell([new Paragraph({ children: [new TextRun({ text: subject.dangTat && subject.dangTat !== 'Thần kinh, tâm thần' ? 'X' : '', bold: true, font: FONT_FAMILY, size: 22 })], alignment: AlignmentType.CENTER })], 14, VerticalAlign.CENTER, 'F2F4F7')
          ]
        }),
        ...group4Items.map(item => {
          const isSelected = subject.dangTat === 'Thần kinh, tâm thần' && item.stt === sec3Sel.itemStt;
          return new TableRow({
            children: [
              createBorderedCell([new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: item.stt, font: FONT_FAMILY, size: 22 })] })], 8),
              createBorderedCell([new Paragraph({ children: [new TextRun({ text: item.text, font: FONT_FAMILY, size: 22 })] })], 64),
              createBorderedCell([new Paragraph({ children: [new TextRun({ text: isSelected ? 'X' : '', bold: true, font: FONT_FAMILY, size: 22 })], alignment: AlignmentType.CENTER })], 14),
              createBorderedCell([new Paragraph({ children: [new TextRun({ text: subject.dangTat === 'Thần kinh, tâm thần' ? (!isSelected ? 'X' : '') : (subject.dangTat ? 'X' : ''), bold: true, font: FONT_FAMILY, size: 22 })], alignment: AlignmentType.CENTER })], 14)
            ]
          });
        }),

        // Group 5: Trí tuệ
        new TableRow({
          children: [
            createBorderedCell([new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '5', bold: true, font: FONT_FAMILY, size: 22 })] })], 8, VerticalAlign.CENTER, 'F2F4F7'),
            createBorderedCell([new Paragraph({ children: [new TextRun({ text: 'Khuyết tật trí tuệ', bold: true, font: FONT_FAMILY, size: 22 })] })], 64, VerticalAlign.CENTER, 'F2F4F7'),
            createBorderedCell([new Paragraph({ children: [new TextRun({ text: subject.dangTat === 'Trí tuệ' ? 'X' : '', bold: true, font: FONT_FAMILY, size: 22 })], alignment: AlignmentType.CENTER })], 14, VerticalAlign.CENTER, 'F2F4F7'),
            createBorderedCell([new Paragraph({ children: [new TextRun({ text: subject.dangTat && subject.dangTat !== 'Trí tuệ' ? 'X' : '', bold: true, font: FONT_FAMILY, size: 22 })], alignment: AlignmentType.CENTER })], 14, VerticalAlign.CENTER, 'F2F4F7')
          ]
        }),
        ...[
          { stt: '5.1', text: 'Khó khăn trong việc nhận biết người thân trong gia đình hoặc khó khăn trong giao tiếp với những người xung quanh so với người cùng lứa tuổi' },
          { stt: '5.2', text: 'Chậm chạp, ngờ nghệch hoặc không thể làm được một việc đơn giản (so với tuổi) dù đã được hướng dẫn' },
          { stt: '5.3', text: 'Khó khăn trong đọc, viết, tính toán và kỹ năng học tập khác so với người cùng tuổi do chậm phát triển trí tuệ' },
          { stt: '5.4', text: 'Có kết luận cơ sở y tế cấp tỉnh trở lên về chậm phát triển trí tuệ' }
        ].map(item => {
          const isSelected = subject.dangTat === 'Trí tuệ' && item.stt === sec3Sel.itemStt;
          return new TableRow({
            children: [
              createBorderedCell([new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: item.stt, font: FONT_FAMILY, size: 22 })] })], 8),
              createBorderedCell([new Paragraph({ children: [new TextRun({ text: item.text, font: FONT_FAMILY, size: 22 })] })], 64),
              createBorderedCell([new Paragraph({ children: [new TextRun({ text: isSelected ? 'X' : '', bold: true, font: FONT_FAMILY, size: 22 })], alignment: AlignmentType.CENTER })], 14),
              createBorderedCell([new Paragraph({ children: [new TextRun({ text: subject.dangTat === 'Trí tuệ' ? (!isSelected ? 'X' : '') : (subject.dangTat ? 'X' : ''), bold: true, font: FONT_FAMILY, size: 22 })], alignment: AlignmentType.CENTER })], 14)
            ]
          });
        }),

        // Group 6: Khác
        new TableRow({
          children: [
            createBorderedCell([new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '6', bold: true, font: FONT_FAMILY, size: 22 })] })], 8, VerticalAlign.CENTER, 'F2F4F7'),
            createBorderedCell([new Paragraph({ children: [new TextRun({ text: 'Khuyết tật khác', bold: true, font: FONT_FAMILY, size: 22 })] })], 64, VerticalAlign.CENTER, 'F2F4F7'),
            createBorderedCell([new Paragraph({ children: [new TextRun({ text: subject.dangTat === 'Khác' ? 'X' : '', bold: true, font: FONT_FAMILY, size: 22 })], alignment: AlignmentType.CENTER })], 14, VerticalAlign.CENTER, 'F2F4F7'),
            createBorderedCell([new Paragraph({ children: [new TextRun({ text: subject.dangTat && subject.dangTat !== 'Khác' ? 'X' : '', bold: true, font: FONT_FAMILY, size: 22 })], alignment: AlignmentType.CENTER })], 14, VerticalAlign.CENTER, 'F2F4F7')
          ]
        }),
        ...[
          { stt: '6.1', text: 'Có kết luận của cơ sở y tế cấp tỉnh trở lên về bệnh tê bì, mất cảm giác ở tay, chân hoặc sự bất thường của cơ thể làm giảm khả năng thực hiện các hoạt động; lao động; đọc, viết, tính toán và kỹ năng học tập khác; sinh hoạt hoặc giao tiếp' },
          { stt: '6.2', text: 'Có kết luận của cơ sở y tế cấp tỉnh trở lên về bệnh hô hấp hoặc do bệnh tim mạch hoặc do rối loạn đại, tiểu tiện mặc dù đã được điều trị liên tục trên 3 tháng, làm giảm khả năng thực hiện các hoạt động; lao động; đọc, viết, tính toán và kỹ năng học tập khác; sinh hoạt hoặc giao tiếp' },
          { stt: '6.3', text: 'Có kết luận của cơ sở y tế cấp tỉnh trở lên về rối loạn phổ tự kỷ hoặc các loại bệnh hiểm' }
        ].map(item => {
          const isSelected = subject.dangTat === 'Khác' && item.stt === sec3Sel.itemStt;
          return new TableRow({
            children: [
              createBorderedCell([new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: item.stt, font: FONT_FAMILY, size: 22 })] })], 8),
              createBorderedCell([new Paragraph({ children: [new TextRun({ text: item.text, font: FONT_FAMILY, size: 22 })] })], 64),
              createBorderedCell([new Paragraph({ children: [new TextRun({ text: isSelected ? 'X' : '', bold: true, font: FONT_FAMILY, size: 22 })], alignment: AlignmentType.CENTER })], 14),
              createBorderedCell([new Paragraph({ children: [new TextRun({ text: subject.dangTat === 'Khác' ? (!isSelected ? 'X' : '') : (subject.dangTat ? 'X' : ''), bold: true, font: FONT_FAMILY, size: 22 })], alignment: AlignmentType.CENTER })], 14)
            ]
          });
        })
      ]
    }),

    // Section IV: Level of Disability Determination
    new Paragraph({
      spacing: { before: 200, after: 80 },
      children: [new TextRun({ text: 'IV. Xác định mức độ khuyết tật', bold: true, font: FONT_FAMILY, size: 26 })]
    }),
    ...(isUnder6 ? [] : [
      new Paragraph({
        spacing: { after: 100 },
        children: [
          new TextRun({
            text: 'Phần 1. Người khuyết tật được xác định mức độ khuyết tật đặc biệt nặng, khuyết tật nặng khi quan sát có một trong những dấu hiệu sau đây:',
            bold: true,
            font: FONT_FAMILY,
            size: 24
          })
        ]
      })
    ]),

    // Table IV.1: Signs for Level Determination
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            createBorderedCell([new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'STT', bold: true, font: FONT_FAMILY, size: 22 })] })], 8),
            createBorderedCell([new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Các dấu hiệu', bold: true, font: FONT_FAMILY, size: 22 })] })], 64),
            createBorderedCell([new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Có', bold: true, font: FONT_FAMILY, size: 22 })] })], 14),
            createBorderedCell([new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Không', bold: true, font: FONT_FAMILY, size: 22 })] })], 14)
          ]
        }),
        // Group 1: Đặc biệt nặng
        ...(() => {
          const isGroup1Selected = isByFrame && subject.mucDo === 'Đặc biệt nặng' && sec4SelStt.startsWith('1.');
          const isGroup2Selected = isByFrame && (
            isUnder6
              ? (subject.mucDo === 'Nặng' && sec4SelStt.startsWith('2.'))
              : (subject.mucDo === 'Nặng' && (sec4SelStt === '2.1' || sec4SelStt === '2'))
          );

          return [
            new TableRow({
              children: [
                createBorderedCell([new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '1', bold: true, font: FONT_FAMILY, size: 22 })] })], 8, VerticalAlign.CENTER, 'F2F4F7'),
                createBorderedCell([new Paragraph({ children: [new TextRun({ text: 'Khuyết tật đặc biệt nặng', bold: true, font: FONT_FAMILY, size: 22 })] })], 64, VerticalAlign.CENTER, 'F2F4F7'),
                createBorderedCell([new Paragraph({ children: [new TextRun({ text: isGroup1Selected ? 'X' : '', bold: true, font: FONT_FAMILY, size: 22 })], alignment: AlignmentType.CENTER })], 14, VerticalAlign.CENTER, 'F2F4F7'),
                createBorderedCell([new Paragraph({ children: [new TextRun({ text: !isGroup1Selected ? 'X' : '', bold: true, font: FONT_FAMILY, size: 22 })], alignment: AlignmentType.CENTER })], 14, VerticalAlign.CENTER, 'F2F4F7')
              ]
            }),
            ...(isUnder6
              ? [
                  { stt: '1.1', text: 'Mềm nhẽo hoặc co cứng toàn thân hoặc liệt toàn thân' },
                  { stt: '1.2', text: 'Thiếu hai tay' },
                  { stt: '1.3', text: 'Thiếu hai chân hoặc liệt hoàn toàn hai chân' },
                  { stt: '1.4', text: 'Thiếu một tay và thiếu một chân' },
                  { stt: '1.5', text: 'Mù hai mắt hoặc thiếu hai mắt' },
                  { stt: '1.6', text: 'Liệt hoàn toàn hai tay hoặc liệt nửa người' },
                  { stt: '1.7', text: 'Có kết luận của cơ sở y tế cấp tỉnh trở lên mắc một hoặc nhiều loại bệnh: bệnh bại não, não úng thủy, tâm thần phân liệt' }
                ]
              : [
                  { stt: '1.1', text: 'Mềm nhẽo hoặc co cứng toàn thân hoặc liệt toàn thân' },
                  { stt: '1.2', text: 'Thiếu hai tay' },
                  { stt: '1.3', text: 'Mù hai mắt hoặc thiếu hai mắt' },
                  { stt: '1.4', text: 'Liệt hoàn toàn hai tay hoặc liệt nửa người' },
                  { stt: '1.5', text: 'Có kết luận của cơ sở y tế cấp tỉnh trở lên mắc một hoặc nhiều loại bệnh: bệnh bại não, não úng thủy, tâm thần phân liệt' }
                ]
            ).map(item => {
              const isSelected = isByFrame && subject.mucDo === 'Đặc biệt nặng' && item.stt === sec4SelStt;
              return new TableRow({
                children: [
                  createBorderedCell([new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: item.stt, font: FONT_FAMILY, size: 22 })] })], 8),
                  createBorderedCell([new Paragraph({ children: [new TextRun({ text: item.text, font: FONT_FAMILY, size: 22 })] })], 64),
                  createBorderedCell([new Paragraph({ children: [new TextRun({ text: isSelected ? 'X' : '', bold: true, font: FONT_FAMILY, size: 22 })], alignment: AlignmentType.CENTER })], 14),
                  createBorderedCell([new Paragraph({ children: [new TextRun({ text: !isSelected ? 'X' : '', bold: true, font: FONT_FAMILY, size: 22 })], alignment: AlignmentType.CENTER })], 14)
                ]
              });
            }),

            // Group 2: Nặng
            new TableRow({
              children: [
                createBorderedCell([new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '2', bold: true, font: FONT_FAMILY, size: 22 })] })], 8, VerticalAlign.CENTER, 'F2F4F7'),
                createBorderedCell([new Paragraph({ children: [new TextRun({ text: 'Khuyết tật nặng', bold: true, font: FONT_FAMILY, size: 22 })] })], 64, VerticalAlign.CENTER, 'F2F4F7'),
                createBorderedCell([new Paragraph({ children: [new TextRun({ text: isGroup2Selected ? 'X' : '', bold: true, font: FONT_FAMILY, size: 22 })], alignment: AlignmentType.CENTER })], 14, VerticalAlign.CENTER, 'F2F4F7'),
                createBorderedCell([new Paragraph({ children: [new TextRun({ text: !isGroup2Selected ? 'X' : '', bold: true, font: FONT_FAMILY, size: 22 })], alignment: AlignmentType.CENTER })], 14, VerticalAlign.CENTER, 'F2F4F7')
              ]
            }),
            ...(isUnder6
              ? [
                  { stt: '2.1', text: 'Không cử động được một tay hoặc không cử động được một chân' },
                  { stt: '2.2', text: 'Thiếu một tay' },
                  { stt: '2.3', text: 'Thiếu một chân' },
                  { stt: '2.4', text: 'Mù một mắt' },
                  { stt: '2.5', text: 'Thiếu một mắt' },
                  { stt: '2.6', text: 'Câm và điếc hoàn toàn' }
                ]
              : [
                  { stt: '', text: 'Câm và điếc hoàn toàn' }
                ]
            ).map(item => {
              const isSelected = isByFrame && (
                isUnder6
                  ? (subject.mucDo === 'Nặng' && item.stt === sec4SelStt)
                  : isGroup2Selected
              );
              return new TableRow({
                children: [
                  createBorderedCell([new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: item.stt, font: FONT_FAMILY, size: 22 })] })], 8),
                  createBorderedCell([new Paragraph({ children: [new TextRun({ text: item.text, font: FONT_FAMILY, size: 22 })] })], 64),
                  createBorderedCell([new Paragraph({ children: [new TextRun({ text: isSelected ? 'X' : '', bold: true, font: FONT_FAMILY, size: 22 })], alignment: AlignmentType.CENTER })], 14),
                  createBorderedCell([new Paragraph({ children: [new TextRun({ text: !isSelected ? 'X' : '', bold: true, font: FONT_FAMILY, size: 22 })], alignment: AlignmentType.CENTER })], 14)
                ]
              });
            })
          ];
        })()
      ]
    }),

    // Part 2 for 6+ years old only
    ...(!isUnder6 ? [
      new Paragraph({
        spacing: { before: 150, after: 100 },
        children: [
          new TextRun({
            text: 'Phần 2. Trường hợp người khuyết tật không thuộc mức độ khuyết tật đặc biệt nặng và khuyết tật nặng quy định ở Phần 1 thì đánh giá mức độ khuyết tật dựa trên các tiêu chí phục vụ nhu cầu sinh hoạt cá nhân như sau:',
            bold: true,
            font: FONT_FAMILY,
            size: 24
          })
        ]
      }),

      // Table IV.2: Scoring Table for Daily Life Activities
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              createBorderedCell([new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Mức độ thực hiện /', bold: true, font: FONT_FAMILY, size: 22 }), new TextRun({ text: 'Các hoạt động', break: 1, bold: true, font: FONT_FAMILY, size: 22 })] })], 40),
              createBorderedCell([new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Thực hiện được', bold: true, font: FONT_FAMILY, size: 22 }), new TextRun({ text: '(0 điểm)', break: 1, bold: true, font: FONT_FAMILY, size: 22 })] })], 15),
              createBorderedCell([new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Thực hiện được', bold: true, font: FONT_FAMILY, size: 22 }), new TextRun({ text: 'nhưng cần trợ giúp', break: 1, bold: true, font: FONT_FAMILY, size: 22 }), new TextRun({ text: '(1 điểm)', break: 1, bold: true, font: FONT_FAMILY, size: 22 })] })], 15),
              createBorderedCell([new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Không thực hiện được', bold: true, font: FONT_FAMILY, size: 22 }), new TextRun({ text: '(2 điểm)', break: 1, bold: true, font: FONT_FAMILY, size: 22 })] })], 15),
              createBorderedCell([new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Không xác định được', bold: true, font: FONT_FAMILY, size: 22 }), new TextRun({ text: '(đánh dấu X)', break: 1, bold: true, font: FONT_FAMILY, size: 22 })] })], 15)
            ]
          }),
          ...[
            '1. Đi lại',
            '2. Ăn, uống',
            '3. Tiểu tiện, đại tiện',
            '4. Vệ sinh cá nhân như đánh răng, rửa mặt, tắm rửa...',
            '5. Mặc, cởi quần áo, giày dép',
            '6. Nghe và hiểu người khác nói gì',
            '7. Diễn đạt được ý muốn và suy nghĩ của bản thân qua lời nói',
            '8. Làm các việc gia đình như gấp quần áo, quét nhà, rửa bát, nấu cơm phù hợp với độ tuổi; hoạt động; lao động, sản xuất tạo thu nhập',
            '9. Giao tiếp xã hội, hòa nhập cộng đồng phù hợp với độ tuổi',
            '10. Đọc, viết, tính toán và kỹ năng học tập khác'
          ].map((actText, idx) => {
            const score = actScores[idx];
            const isUndetermined = isRecordUndetermined(subject);
            const showScore = !isUndetermined && !isByFrame;
            return new TableRow({
              children: [
                createBorderedCell([new Paragraph({ children: [new TextRun({ text: actText, font: FONT_FAMILY, size: 22 })] })], 40),
                createBorderedCell([new Paragraph({ children: [new TextRun({ text: (showScore && score === 0) ? '0' : '', bold: true, font: FONT_FAMILY, size: 22 })], alignment: AlignmentType.CENTER })], 15),
                createBorderedCell([new Paragraph({ children: [new TextRun({ text: (showScore && score === 1) ? '1' : '', bold: true, font: FONT_FAMILY, size: 22 })], alignment: AlignmentType.CENTER })], 15),
                createBorderedCell([new Paragraph({ children: [new TextRun({ text: (showScore && score === 2) ? '2' : '', bold: true, font: FONT_FAMILY, size: 22 })], alignment: AlignmentType.CENTER })], 15),
                createBorderedCell([new Paragraph({ children: [new TextRun({ text: isUndetermined ? 'X' : '', bold: true, font: FONT_FAMILY, size: 22 })], alignment: AlignmentType.CENTER })], 15)
              ]
            });
          })
        ]
      }),

      new Paragraph({
        spacing: { before: 100, after: 50 },
        children: [
          new TextRun({ text: `Tổng số điểm: `, bold: true, font: FONT_FAMILY, size: 24 }),
          new TextRun({ 
            text: isRecordUndetermined(subject) 
              ? 'Không xác định' 
              : (isByFrame ? '.....................................................' : `${computedTotalScore} điểm`), 
            bold: true, 
            font: FONT_FAMILY, 
            size: 24 
          })
        ]
      }),
      new Paragraph({
        spacing: { after: 150 },
        children: [
          new TextRun({
            text: '(Mức độ đặc biệt nặng: Từ 14 điểm trở lên; Mức độ nặng: Từ 7-13 điểm; Mức độ nhẹ: Từ 0-6 điểm)',
            italics: true,
            font: FONT_FAMILY,
            size: 22
          })
        ]
      })
    ] : []),

    // Section V
    new Paragraph({
      spacing: { before: 150, after: 80 },
      children: [
        new TextRun({ text: isUnder6 ? 'V. Đề xuất kết luận dạng khuyết tật và mức độ khuyết tật:' : 'V. Đề xuất xác định mức độ khuyết tật:', bold: true, font: FONT_FAMILY, size: 26 })
      ]
    }),
    ...(() => {
      const isUndet = isRecordUndetermined(subject);
      const isNoDisability = subject.mucDo === 'Không khuyết tật' || subject.dangTat === 'Không khuyết tật';
      const dtText = isUndet ? 'Không xác định' : (isNoDisability ? 'Không khuyết tật' : (subject.dangTat || '.....................................................'));
      const mdText = isUndet ? 'Không xác định' : (isNoDisability ? 'Không khuyết tật' : (subject.mucDo || '.....................................................'));
      const gcText = isUndet ? (subject.ghiChu || 'Chưa đủ điều kiện kết luận về dạng tật và mức độ khuyết tật.') : '.....................................................';

      return [
        new Paragraph({
          spacing: { after: 50 },
          children: [
            new TextRun({ text: `1. Dạng khuyết tật (Ghi rõ dạng khuyết tật hoặc không khuyết tật): ${dtText}`, font: FONT_FAMILY, size: 26 })
          ]
        }),
        new Paragraph({
          spacing: { after: 50 },
          children: [
            new TextRun({ text: `2. Mức độ khuyết tật: ${mdText}`, font: FONT_FAMILY, size: 26 })
          ]
        }),
        new Paragraph({
          spacing: { after: 100 },
          children: [
            new TextRun({ text: `3. Không đưa ra được kết luận về dạng khuyết tật, mức độ khuyết tật: ${gcText}`, font: FONT_FAMILY, size: 26 })
          ]
        })
      ];
    })(),

    // Date & Signatures
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      spacing: { before: 250, after: 100 },
      children: [
        new TextRun({
          text: `${config.xaName}, ngày ${dateParts.day} tháng ${dateParts.month} năm ${dateParts.year}`,
          italics: true,
          font: FONT_FAMILY,
          size: 26
        })
      ]
    }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: NO_BORDERS,
      rows: [
        new TableRow({
          children: [
            createNoBorderCell([
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: 'NGƯỜI GHI PHIẾU', bold: true, font: FONT_FAMILY, size: 24 }),
                  new TextRun({ text: '(Ký, ghi rõ họ tên)', break: 1, italics: true, font: FONT_FAMILY, size: 22 })
                ]
              })
            ], 50),
            createNoBorderCell([
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: 'CHỦ TỊCH HỘI ĐỒNG', bold: true, font: FONT_FAMILY, size: 24 }),
                  new TextRun({ text: '(Ký tên, đóng dấu)', break: 1, italics: true, font: FONT_FAMILY, size: 22 })
                ]
              })
            ], 50)
          ]
        }),
        new TableRow({
          children: [
            createNoBorderCell([
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 1000 },
                children: [
                  new TextRun({ text: config.nguoiLap, bold: true, font: FONT_FAMILY, size: 24 })
                ]
              })
            ], 50),
            createNoBorderCell([
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 1000 },
                children: [
                  new TextRun({ text: config.chuTich, bold: true, font: FONT_FAMILY, size: 24 })
                ]
              })
            ], 50)
          ]
        })
      ]
    })
  ];
}

export async function generatePhieuDocx(subject: SubjectRecord, config: AdminConfig): Promise<Blob> {
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: A4_PORTRAIT_SIZE,
            margin: A4_PORTRAIT_MARGINS
          }
        },
        children: buildPhieuChildren(subject, config)
      }
    ]
  });

  return await Packer.toBlob(doc);
}

/**
 * Generate 01 merged Word file containing evaluation forms for all passed subjects
 */
export async function generateMergedPhieuDocx(subjects: SubjectRecord[], config: AdminConfig): Promise<Blob> {
  const doc = new Document({
    sections: subjects.map(s => ({
      properties: {
        page: {
          size: A4_PORTRAIT_SIZE,
          margin: A4_PORTRAIT_MARGINS
        }
      },
      children: buildPhieuChildren(s, config)
    }))
  });

  return await Packer.toBlob(doc);
}

export function buildBienBanChildren(subject: SubjectRecord, config: AdminConfig) {
  const dateParts = getDateParts(config.ngayHop);
  const dobParts = getDateParts(subject.ngaySinh);
  
  const startHourNum = parseInt(config.gioHop || '8', 10);
  const startHourValid = isNaN(startHourNum) ? 8 : (Math.max(0, startHourNum) % 24);
  const endHourNum = (startHourValid + 1) % 24;

  const formattedGioHop = String(startHourValid).padStart(2, '0');
  const formattedEndHour = String(endHourNum).padStart(2, '0');
  const formattedPhutHop = String(parseInt(config.phutHop || '0', 10) || 0).padStart(2, '0');

  const noteContent = subject.ghiChu ? subject.ghiChu.trim() : '';
  let yKienText = 'Thống nhất hoàn toàn với kết quả thu thập thông tin Phiếu xác định và đánh giá thực tế đối tượng.';
  if (noteContent) {
    const formattedNote = noteContent.endsWith('.') ? noteContent : `${noteContent}.`;
    yKienText = `Thống nhất hoàn toàn với kết quả thu thập thông tin Phiếu xác định và đánh giá thực tế đối tượng: ${formattedNote}`;
  }

  return [
    buildHeaderTable(config, false),
    new Paragraph({ text: '', spacing: { before: 150 } }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 150, after: 50 },
      children: [
        new TextRun({ text: 'BIÊN BẢN', bold: true, font: FONT_FAMILY, size: 28 })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [
        new TextRun({ text: 'HỌP KẾT LUẬN DẠNG KHUYẾT TẬT VÀ MỨC ĐỘ KHUYẾT TẬT', bold: true, font: FONT_FAMILY, size: 28 })
      ]
    }),

    // Section I
    new Paragraph({
      spacing: { before: 100, after: 50 },
      children: [
        new TextRun({ text: 'I. Thời gian, địa điểm', bold: true, font: FONT_FAMILY, size: 26 })
      ]
    }),
    new Paragraph({
      spacing: { after: 100 },
      alignment: AlignmentType.JUSTIFIED,
      indent: { firstLine: 567 },
      children: [
        new TextRun({
          text: `Hôm nay, vào hồi ${formattedGioHop} giờ ${formattedPhutHop} phút ngày ${dateParts.day} tháng ${dateParts.month} năm ${dateParts.year}, ${formatLocationWithTai(config.diaDiemHop)}`,
          font: FONT_FAMILY,
          size: 26
        })
      ]
    }),

    // Section II
    new Paragraph({
      spacing: { before: 100, after: 50 },
      children: [
        new TextRun({ text: 'II. Thành phần Hội đồng xác định mức độ khuyết tật', bold: true, font: FONT_FAMILY, size: 26 })
      ]
    }),
    new Paragraph({
      spacing: { after: 30 },
      indent: { firstLine: 280 },
      children: [new TextRun({ text: `1. Ông ${config.chuTich} - Chủ tịch Hội đồng, chủ trì cuộc họp;`, font: FONT_FAMILY, size: 26 })]
    }),
    new Paragraph({
      spacing: { after: 30 },
      indent: { firstLine: 280 },
      children: [new TextRun({ text: `2. Ông ${config.yTe} - Giám đốc Trạm y tế cấp xã, thành viên;`, font: FONT_FAMILY, size: 26 })]
    }),
    new Paragraph({
      spacing: { after: 30 },
      indent: { firstLine: 280 },
      children: [new TextRun({ text: `3. Ông ${config.mttq} - Phó Chủ tịch UB MTTQ xã, chủ tịch Hội CCB xã, thành viên;`, font: FONT_FAMILY, size: 26 })]
    }),
    new Paragraph({
      spacing: { after: 100 },
      indent: { firstLine: 280 },
      children: [new TextRun({ text: `4. Bà ${config.nguoiLap} - Trưởng phòng Văn hóa - Xã hội xã, người ghi biên bản;`, font: FONT_FAMILY, size: 26 })]
    }),

    // Section III
    new Paragraph({
      spacing: { before: 100, after: 50 },
      children: [
        new TextRun({ text: 'III. Nội dung', bold: true, font: FONT_FAMILY, size: 26 })
      ]
    }),
    new Paragraph({
      spacing: { after: 30 },
      indent: { firstLine: 280 },
      children: [new TextRun({ text: '1. Xác định dạng khuyết tật và mức độ khuyết tật cho:', bold: true, font: FONT_FAMILY, size: 26 })]
    }),
    new Paragraph({
      spacing: { after: 30 },
      indent: { firstLine: 567 },
      children: [new TextRun({ text: `Ông (bà): ${subject.hoTen}; Giới tính: ${subject.gioiTinh}`, font: FONT_FAMILY, size: 26 })]
    }),
    new Paragraph({
      spacing: { after: 30 },
      indent: { firstLine: 567 },
      children: [new TextRun({ text: `Ngày, tháng, năm sinh: ${dobParts.day}/${dobParts.month}/${dobParts.year}`, font: FONT_FAMILY, size: 26 })]
    }),
    new Paragraph({
      spacing: { after: 80 },
      indent: { firstLine: 567 },
      children: [new TextRun({ text: `Nơi ở hiện nay: Thôn ${subject.thon}, xã ${config.xaName}, tỉnh ${config.tinhName}`, font: FONT_FAMILY, size: 26 })]
    }),

    new Paragraph({
      spacing: { after: 50 },
      alignment: AlignmentType.JUSTIFIED,
      indent: { firstLine: 280 },
      children: [new TextRun({ text: '2. Hội đồng quan sát, phỏng vấn người được xác định mức độ khuyết tật hoặc người đại diện hợp pháp của họ..', font: FONT_FAMILY, size: 26 })]
    }),
    new Paragraph({
      spacing: { after: 50 },
      alignment: AlignmentType.JUSTIFIED,
      indent: { firstLine: 280 },
      children: [new TextRun({ text: '3. Trưởng phòng Văn hóa - Xã hội cấp xã báo cáo kết quả thu thập thông tin Phiếu xác định mức độ khuyết tật.', font: FONT_FAMILY, size: 26 })]
    }),
    new Paragraph({
      spacing: { after: 50 },
      indent: { firstLine: 280 },
      children: [new TextRun({ text: '4. Ý kiến của các thành viên dự họp (Ghi chi tiết):', font: FONT_FAMILY, size: 26 })]
    }),
    new Paragraph({
      spacing: { after: 100 },
      alignment: AlignmentType.JUSTIFIED,
      indent: { firstLine: 567 },
      children: [new TextRun({ text: yKienText, font: FONT_FAMILY, size: 26 })]
    }),

    // 5. Voting Table
    new Paragraph({
      spacing: { before: 100, after: 50 },
      children: [new TextRun({ text: '5. Kết quả biểu quyết', bold: true, font: FONT_FAMILY, size: 26 })]
    }),
    (() => {
      const isUndet = isRecordUndetermined(subject);
      const isNoDisability = subject.mucDo === 'Không khuyết tật' || subject.dangTat === 'Không khuyết tật';

      return new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              createBorderedCell([new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Nội dung biểu quyết', bold: true, font: FONT_FAMILY, size: 24 })] })], 65),
              createBorderedCell([new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Số ý kiến đồng ý', bold: true, font: FONT_FAMILY, size: 24 })] })], 35)
            ]
          }),
          new TableRow({
            children: [
              createBorderedCell([new Paragraph({ children: [new TextRun({ text: '1. Dạng khuyết tật', bold: true, font: FONT_FAMILY, size: 24 })] })], 65),
              createBorderedCell([new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: (!isUndet && !isNoDisability) ? '4/4 (100%)' : '0', font: FONT_FAMILY, size: 24 })] })], 35)
            ]
          }),
          new TableRow({
            children: [
              createBorderedCell([new Paragraph({ children: [new TextRun({ text: `   ${(!isUndet && !isNoDisability) ? (subject.dangTat || '') : ''}`, font: FONT_FAMILY, size: 24 })] })], 65),
              createBorderedCell([new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: (!isUndet && !isNoDisability) ? '4/4 (100%)' : '0', font: FONT_FAMILY, size: 24 })] })], 35)
            ]
          }),
          new TableRow({
            children: [
              createBorderedCell([new Paragraph({ children: [new TextRun({ text: '2. Mức độ khuyết tật', bold: true, font: FONT_FAMILY, size: 24 })] })], 65),
              createBorderedCell([new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: (!isUndet && !isNoDisability) ? '4/4 (100%)' : '0', font: FONT_FAMILY, size: 24 })] })], 35)
            ]
          }),
          new TableRow({
            children: [
              createBorderedCell([new Paragraph({ children: [new TextRun({ text: `   ${(!isUndet && !isNoDisability) ? (subject.mucDo || '') : ''}`, font: FONT_FAMILY, size: 24 })] })], 65),
              createBorderedCell([new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: (!isUndet && !isNoDisability) ? '4/4 (100%)' : '0', font: FONT_FAMILY, size: 24 })] })], 35)
            ]
          }),
          new TableRow({
            children: [
              createBorderedCell([new Paragraph({ children: [new TextRun({ text: '3. Không khuyết tật', bold: true, font: FONT_FAMILY, size: 24 })] })], 65),
              createBorderedCell([new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: isNoDisability ? '4/4 (100%)' : '0', font: FONT_FAMILY, size: 24 })] })], 35)
            ]
          }),
          new TableRow({
            children: [
              createBorderedCell([new Paragraph({ children: [new TextRun({ text: '4. Không đưa ra được kết luận về dạng tật, mức độ khuyết tật', bold: true, font: FONT_FAMILY, size: 24 })] })], 65),
              createBorderedCell([new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: isUndet ? '4/4 (100%)' : '0', font: FONT_FAMILY, size: 24 })] })], 35)
            ]
          })
        ]
      });
    })(),

    // 6. Conclusion
    new Paragraph({
      spacing: { before: 150, after: 50 },
      children: [new TextRun({ text: '6. Kết luận', bold: true, font: FONT_FAMILY, size: 26 })]
    }),
    new Paragraph({
      spacing: { after: 30 },
      indent: { firstLine: 280 },
      children: [new TextRun({ text: 'Hội đồng thống nhất kết luận như sau:', font: FONT_FAMILY, size: 26 })]
    }),
    ...(() => {
      const isUndet = isRecordUndetermined(subject);
      const isNoDisability = subject.mucDo === 'Không khuyết tật' || subject.dangTat === 'Không khuyết tật';

      return [
        new Paragraph({
          spacing: { after: 30 },
          indent: { firstLine: 280 },
          children: [
            new TextRun({ text: `${(!isUndet && !isNoDisability) ? '☑' : '☐'} Dạng khuyết tật (ghi rõ): ${(!isUndet && !isNoDisability) ? subject.dangTat : '.....................................................'}`, font: FONT_FAMILY, size: 26 })
          ]
        }),
        new Paragraph({
          spacing: { after: 30 },
          indent: { firstLine: 280 },
          children: [
            new TextRun({ text: `${(!isUndet && !isNoDisability) ? '☑' : '☐'} Mức độ khuyết tật (ghi rõ): ${(!isUndet && !isNoDisability) ? subject.mucDo : '.....................................................'}`, font: FONT_FAMILY, size: 26 })
          ]
        }),
        new Paragraph({
          spacing: { after: 30 },
          indent: { firstLine: 280 },
          children: [
            new TextRun({ text: `${isNoDisability ? '☑' : '☐'} Không khuyết tật`, font: FONT_FAMILY, size: 26 })
          ]
        }),
        new Paragraph({
          spacing: { after: 80 },
          indent: { firstLine: 280 },
          children: [
            new TextRun({ text: `${isUndet ? '☑' : '☐'} Không đưa ra được kết luận về dạng khuyết tật, mức độ khuyết tật${isUndet && subject.ghiChu ? `: ${subject.ghiChu}` : ''}`, font: FONT_FAMILY, size: 26 })
          ]
        })
      ];
    })(),

    new Paragraph({
      spacing: { before: 100, after: 50 },
      alignment: AlignmentType.JUSTIFIED,
      indent: { firstLine: 567 },
      children: [
        new TextRun({
          text: `Cuộc họp kết thúc hồi ${formattedEndHour} giờ ${formattedPhutHop} phút ngày ${dateParts.day} tháng ${dateParts.month} năm ${dateParts.year}`,
          font: FONT_FAMILY,
          size: 26
        })
      ]
    }),
    new Paragraph({
      spacing: { after: 200 },
      alignment: AlignmentType.JUSTIFIED,
      indent: { firstLine: 567 },
      children: [
        new TextRun({
          text: 'Biên bản này được lập thành 03 bản, 01 bản bổ sung hồ sơ xác định khuyết tật, 01 bản gửi Chủ tịch UBND xã, 01 bản lưu./.',
          font: FONT_FAMILY,
          size: 26
        })
      ]
    }),

    // Signatures - Matching template in sample image
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: NO_BORDERS,
      rows: [
        new TableRow({
          children: [
            createNoBorderCell([
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: 'NGƯỜI GHI BIÊN BẢN', bold: true, font: FONT_FAMILY, size: 24 })
                ]
              })
            ], 50),
            createNoBorderCell([
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: 'CÁC THÀNH VIÊN THAM DỰ', bold: true, font: FONT_FAMILY, size: 24 })
                ]
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 60 },
                children: [
                  new TextRun({ text: '................................................', font: FONT_FAMILY, size: 20 })
                ]
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 60 },
                children: [
                  new TextRun({ text: '................................................', font: FONT_FAMILY, size: 20 })
                ]
              })
            ], 50)
          ]
        }),
        new TableRow({
          children: [
            createNoBorderCell([
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 800 },
                children: [
                  new TextRun({ text: config.nguoiLap, bold: true, font: FONT_FAMILY, size: 24 })
                ]
              })
            ], 50),
            createNoBorderCell([], 50)
          ]
        })
      ]
    }),

    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 300, after: 1400 },
      children: [
        new TextRun({ text: 'CHỦ TỊCH HỘI ĐỒNG', bold: true, font: FONT_FAMILY, size: 24 })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
      children: [
        new TextRun({ text: 'PHÓ CHỦ TỊCH UBND XÃ', bold: true, font: FONT_FAMILY, size: 24 })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: config.chuTich, bold: true, font: FONT_FAMILY, size: 24 })
      ]
    })
  ];
}

/**
 * Generate Mẫu 03 (Biên bản họp Hội đồng xác định MĐKT)
 */
export async function generateBienBanDocx(subject: SubjectRecord, config: AdminConfig): Promise<Blob> {
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: A4_PORTRAIT_SIZE,
            margin: A4_PORTRAIT_MARGINS
          }
        },
        children: buildBienBanChildren(subject, config)
      }
    ]
  });

  return await Packer.toBlob(doc);
}

/**
 * Generate 01 merged Word file containing minutes for all passed subjects
 */
export async function generateMergedBienBanDocx(subjects: SubjectRecord[], config: AdminConfig): Promise<Blob> {
  const doc = new Document({
    sections: subjects.map(s => ({
      properties: {
        page: {
          size: A4_PORTRAIT_SIZE,
          margin: A4_PORTRAIT_MARGINS
        }
      },
      children: buildBienBanChildren(s, config)
    }))
  });

  return await Packer.toBlob(doc);
}

/**
 * Generate Mẫu 04 (Thông báo niêm yết 05 ngày làm việc + Bảng danh sách A4 xoay ngang)
 */
export async function generateThongBaoNiemYetDocx(records: SubjectRecord[], config: AdminConfig): Promise<Blob> {
  const dateParts = getDateParts(config.ngayHop);

  // Section 1: Portrait Notice Document
  const noticeSectionChildren = [
    buildHeaderTable(config, true),
    new Paragraph({ text: '', spacing: { before: 150 } }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 150, after: 30 },
      children: [new TextRun({ text: 'THÔNG BÁO', bold: true, font: FONT_FAMILY, size: 28 })]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 30 },
      children: [new TextRun({ text: 'Về việc niêm yết công khai kết quả họp kết luận', bold: true, font: FONT_FAMILY, size: 26 })]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [new TextRun({ text: 'dạng tật và mức độ khuyết tật', bold: true, font: FONT_FAMILY, size: 26 })]
    }),

    // Decrees / Legal basis exactly matching uploaded template
    new Paragraph({
      spacing: { after: 80 },
      alignment: AlignmentType.JUSTIFIED,
      indent: { firstLine: 567 },
      children: [new TextRun({ text: 'Căn cứ Nghị định số 28/2012/NĐ-CP ngày 10/4/2012 của Chính phủ quy định chi tiết và hướng dẫn thi hành một số điều của Luật Người khuyết tật;', font: FONT_FAMILY, size: 26 })]
    }),
    new Paragraph({
      spacing: { after: 80 },
      alignment: AlignmentType.JUSTIFIED,
      indent: { firstLine: 567 },
      children: [new TextRun({ text: 'Căn cứ Thông tư số 01/2019/TT-BLĐTBXH ngày 02/01/2019 của Bộ Lao động - Thương binh và Xã hội quy định về việc xác định mức độ khuyết tật do Hội đồng xác định mức độ khuyết tật thực hiện;', font: FONT_FAMILY, size: 26 })]
    }),
    new Paragraph({
      spacing: { after: 80 },
      alignment: AlignmentType.JUSTIFIED,
      indent: { firstLine: 567 },
      children: [new TextRun({ text: 'Căn cứ Thông tư số 19/2026/TT-BYT ngày 09/6/2026 của Bộ Y tế sửa đổi, bổ sung một số điều của Thông tư số 01/2019/TT-BLĐTBXH ngày 02 tháng 01 năm 2019 của Bộ trưởng Bộ Lao động - Thương binh và Xã hội quy định về việc xác định mức độ khuyết tật do Hội đồng xác định mức độ khuyết tật thực hiện;', font: FONT_FAMILY, size: 26 })]
    }),
    new Paragraph({
      spacing: { after: 150 },
      alignment: AlignmentType.JUSTIFIED,
      indent: { firstLine: 567 },
      children: [new TextRun({ text: `Căn cứ kết quả họp kết luận dạng khuyết tật và mức độ khuyết tật ngày ${dateParts.day}/${dateParts.month}/${dateParts.year} của Hội đồng xác định mức độ khuyết tật xã ${config.xaName}.`, font: FONT_FAMILY, size: 26 })]
    }),

    // Body
    new Paragraph({
      spacing: { after: 80 },
      alignment: AlignmentType.JUSTIFIED,
      indent: { firstLine: 567 },
      children: [
        new TextRun({ text: `Ủy ban nhân dân xã ${config.xaName} tổ chức tiến hành niêm yết công khai kết quả họp kết luận dạng khuyết tật và mức độ khuyết tật cho `, font: FONT_FAMILY, size: 26 }),
        new TextRun({ text: `${records.length} `, font: FONT_FAMILY, size: 26 }),
        new TextRun({ text: 'trường hợp ', font: FONT_FAMILY, size: 26 }),
        new TextRun({ text: '(Có danh sách kèm theo)', italics: true, font: FONT_FAMILY, size: 26 })
      ]
    }),
    new Paragraph({
      spacing: { after: 50 },
      indent: { firstLine: 567 },
      children: [new TextRun({ text: `Địa điểm: ${config.diaDiemNiemYet}`, font: FONT_FAMILY, size: 26 })]
    }),
    new Paragraph({
      spacing: { after: 150 },
      indent: { firstLine: 567 },
      children: [new TextRun({ text: `Thời gian niêm yết: ${config.thoiGianNiemYet}`, font: FONT_FAMILY, size: 26 })]
    }),
    new Paragraph({
      spacing: { after: 200 },
      alignment: AlignmentType.JUSTIFIED,
      indent: { firstLine: 567 },
      children: [
        new TextRun({
          text: `Ủy ban nhân dân xã ${config.xaName} thông báo để các cá nhân, hộ gia đình nếu có thắc mắc, kiến nghị về nội dung công khai trên thì nộp đơn tại trụ sở Ủy ban nhân dân xã ${config.xaName} để được giải quyết. Sau thời gian niêm yết, nếu không có ý kiến khiếu nại của người dân thì Ủy ban nhân dân xã sẽ tiến hành làm các thủ tục tiếp theo cho đối tượng trên theo quy định./.`,
          font: FONT_FAMILY,
          size: 26
        })
      ]
    }),

    // Signatures
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: NO_BORDERS,
      rows: [
        new TableRow({
          children: [
            createNoBorderCell([
              new Paragraph({
                children: [
                  new TextRun({ text: 'Nơi nhận:', bold: true, italics: true, font: FONT_FAMILY, size: 22 }),
                  new TextRun({ text: '- Niêm yết tại Trụ sở UBND xã;', break: 1, font: FONT_FAMILY, size: 22 }),
                  new TextRun({ text: '- Lưu: VT, UBND.', break: 1, font: FONT_FAMILY, size: 22 })
                ]
              })
            ], 50),
            createNoBorderCell([
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: 'KT. CHỦ TỊCH', bold: true, font: FONT_FAMILY, size: 24 }),
                  new TextRun({ text: 'PHÓ CHỦ TỊCH', break: 1, bold: true, font: FONT_FAMILY, size: 24 })
                ]
              })
            ], 50)
          ]
        }),
        new TableRow({
          children: [
            createNoBorderCell([], 50),
            createNoBorderCell([
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 1000 },
                children: [
                  new TextRun({ text: config.chuTich, bold: true, font: FONT_FAMILY, size: 24 })
                ]
              })
            ], 50)
          ]
        })
      ]
    })
  ];

  // Section 2: Landscape List Table
  const tableHeaderRow = new TableRow({
    children: [
      createBorderedCell([new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'STT', bold: true, font: FONT_FAMILY, size: 22 })] })], 6),
      createBorderedCell([new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Họ và tên', bold: true, font: FONT_FAMILY, size: 22 })] })], 20),
      createBorderedCell([new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Ngày sinh', bold: true, font: FONT_FAMILY, size: 22 })] })], 12),
      createBorderedCell([new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Thôn', bold: true, font: FONT_FAMILY, size: 22 })] })], 14),
      createBorderedCell([new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Dạng tật', bold: true, font: FONT_FAMILY, size: 22 })] })], 16),
      createBorderedCell([new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Mức độ khuyết tật', bold: true, font: FONT_FAMILY, size: 22 })] })], 16),
      createBorderedCell([new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Ghi chú', bold: true, font: FONT_FAMILY, size: 22 })] })], 16)
    ]
  });

  const tableDataRows = records.map((r, idx) => {
    const dobParts = getDateParts(r.ngaySinh);
    return new TableRow({
      children: [
        createBorderedCell([new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(idx + 1), font: FONT_FAMILY, size: 22 })] })]),
        createBorderedCell([new Paragraph({ children: [new TextRun({ text: r.hoTen, font: FONT_FAMILY, size: 22 })] })]),
        createBorderedCell([new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${dobParts.day}/${dobParts.month}/${dobParts.year}`, font: FONT_FAMILY, size: 22 })] })]),
        createBorderedCell([new Paragraph({ children: [new TextRun({ text: r.thon, font: FONT_FAMILY, size: 22 })] })]),
        createBorderedCell([new Paragraph({ children: [new TextRun({ text: r.dangTat, font: FONT_FAMILY, size: 22 })] })]),
        createBorderedCell([new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: r.mucDo, font: FONT_FAMILY, size: 22 })] })]),
        createBorderedCell([new Paragraph({ children: [new TextRun({ text: r.ghiChu || '', font: FONT_FAMILY, size: 22 })] })])
      ]
    });
  });

  const listTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [tableHeaderRow, ...tableDataRows]
  });

  const landscapeSectionChildren = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 100, after: 50 },
      children: [new TextRun({ text: 'DANH SÁCH THÔNG BÁO NIÊM YẾT KẾT QUẢ XÁC ĐỊNH MỨC ĐỘ KHUYẾT TẬT', bold: true, font: FONT_FAMILY, size: 26 })]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 150 },
      children: [new TextRun({ text: `(Kèm theo Thông báo số ${config.soThongBao} ngày ${dateParts.day}/${dateParts.month}/${dateParts.year} của UBND xã ${config.xaName})`, italics: true, font: FONT_FAMILY, size: 24 })]
    }),
    listTable
  ];

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: A4_PORTRAIT_SIZE,
            margin: A4_PORTRAIT_MARGINS
          }
        },
        children: noticeSectionChildren
      },
      {
        properties: {
          page: {
            size: A4_LANDSCAPE_SIZE,
            margin: A4_LANDSCAPE_MARGINS
          }
        },
        children: landscapeSectionChildren
      }
    ]
  });

  return await Packer.toBlob(doc);
}

/**
 * Helper to generate paragraphs for Giấy Giới Thiệu (Referral Letter)
 */
export function getGiayGioiThieuParagraphs(subject: SubjectRecord, config: AdminConfig): (Paragraph | Table)[] {
  const isMale = subject.gioiTinh === 'Nam';
  const prefix = isMale ? 'ông' : 'bà';
  const nameParts = subject.hoTen.trim().split(' ');
  const shortName = nameParts.length > 1 ? nameParts.slice(-2).join(' ') : subject.hoTen;

  const tenXaUpper = (config.xaName || 'HÀM YÊN').toUpperCase();
  const tenXaStr = config.xaName || 'Hàm Yên';
  const tenTinhStr = config.tinhName || 'Tuyên Quang';
  const dateSource = config.ngayGiayGioiThieu || new Date().toISOString().split('T')[0];
  const dateParts = getDateParts(dateSource);
  const ngayCapNhat = `ngày ${dateParts.day} tháng ${dateParts.month} năm ${dateParts.year}`;

  const isNhe = subject.mucDo === 'Nhẹ';
  const reasonGhiChu = subject.ghiChu ? subject.ghiChu.trim() : 'có tình trạng sức khỏe/bệnh lý bất thường';

  let matchExplanation = '';
  if (isNhe) {
    matchExplanation = `Hội đồng xác định mức độ khuyết tật xã ${tenXaStr} xác định dạng tật ${subject.dangTat || 'khác'}, mức độ khuyết tật nhẹ.`;
  } else {
    matchExplanation = `Hội đồng xác định mức độ khuyết tật xã ${tenXaStr} xác định dạng tật ${subject.dangTat || 'khác'}, tuy nhiên không xác định được mức độ khuyết tật do vượt quá khả năng chuyên môn.`;
  }

  // Header Table (2 Columns, no border)
  const headerTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: NO_BORDERS,
    rows: [
      new TableRow({
        children: [
          createNoBorderCell([
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({ text: 'ỦY BAN NHÂN DÂN', bold: true, font: FONT_FAMILY, size: 24 }),
                new TextRun({ text: `XÃ ${tenXaUpper}`, break: 1, bold: true, font: FONT_FAMILY, size: 24 }),
                new TextRun({ text: 'Số:       /GT- UBND', break: 1, font: FONT_FAMILY, size: 24 })
              ]
            })
          ], 45),
          createNoBorderCell([
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({ text: 'CỘNG HOÀ XÃ HỘI CHỦ NGHĨA VIỆT NAM', bold: true, font: FONT_FAMILY, size: 24 }),
                new TextRun({ text: 'Độc lập - Tự do - Hạnh phúc', break: 1, bold: true, underline: {}, font: FONT_FAMILY, size: 24 }),
                new TextRun({ text: `${tenXaStr}, ${ngayCapNhat}`, break: 1, italics: true, font: FONT_FAMILY, size: 24 })
              ]
            })
          ], 55)
        ]
      })
    ]
  });

  // Photo Box (Left side below header) - Exact 3cm x 4cm (1701 dxa x 2268 dxa)
  const PHOTO_WIDTH_DXA = 1701; // 3cm
  const PHOTO_HEIGHT_DXA = 2268; // 4cm
  const REMAINING_WIDTH_DXA = 7654; // Printable width 9355 - 1701

  const photoTable = new Table({
    width: { size: 9355, type: WidthType.DXA },
    layout: TableLayoutType.FIXED,
    borders: NO_BORDERS,
    columnWidths: [PHOTO_WIDTH_DXA, REMAINING_WIDTH_DXA],
    rows: [
      new TableRow({
        height: { value: PHOTO_HEIGHT_DXA, rule: HeightRule.EXACT },
        cantSplit: true,
        children: [
          new TableCell({
            width: { size: PHOTO_WIDTH_DXA, type: WidthType.DXA },
            verticalAlign: VerticalAlign.CENTER,
            margins: { top: 100, bottom: 100, left: 100, right: 100 },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
              bottom: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
              left: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
              right: { style: BorderStyle.SINGLE, size: 6, color: '000000' }
            },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 0, after: 0, line: 240 },
                children: [
                  new TextRun({ text: 'Ảnh', font: FONT_FAMILY, size: 24 }),
                  new TextRun({ text: '(3 x 4 cm)', break: 1, italics: true, font: FONT_FAMILY, size: 20 })
                ]
              })
            ]
          }),
          new TableCell({
            width: { size: REMAINING_WIDTH_DXA, type: WidthType.DXA },
            borders: NO_BORDERS,
            children: [new Paragraph({ children: [] })]
          })
        ]
      })
    ]
  });

  const titleParagraph = new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 250, after: 200 },
    children: [
      new TextRun({ text: 'GIẤY GIỚI THIỆU', bold: true, font: FONT_FAMILY, size: 34 })
    ]
  });

  const bodyParagraphs = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 50, after: 80 },
      children: [
        new TextRun({ text: `Kính gửi: `, bold: true, font: FONT_FAMILY, size: 26 }),
        new TextRun({ text: `Hội đồng Giám định Y khoa tỉnh ${tenTinhStr}.`, font: FONT_FAMILY, size: 26 })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 200 },
      children: [
        new TextRun({ text: `Ủy ban nhân dân xã ${tenXaStr} tỉnh ${tenTinhStr}:`, bold: true, font: FONT_FAMILY, size: 26 })
      ]
    }),
    new Paragraph({
      indent: { firstLine: 720 },
      spacing: { before: 100, after: 100, line: 360 },
      children: [
        new TextRun({ text: `Trân trọng giới thiệu: `, font: FONT_FAMILY, size: 26 }),
        new TextRun({ text: `${prefix} `, font: FONT_FAMILY, size: 26 }),
        new TextRun({ text: subject.hoTen, bold: true, font: FONT_FAMILY, size: 26 })
      ]
    }),
    new Paragraph({
      indent: { firstLine: 720 },
      spacing: { before: 100, after: 100, line: 360 },
      children: [
        new TextRun({ text: `Sinh ngày: `, font: FONT_FAMILY, size: 26 }),
        new TextRun({ text: `${subject.ngaySinhFormat || subject.ngaySinh}`, font: FONT_FAMILY, size: 26 }),
        new TextRun({ text: `                    Giới tính: `, font: FONT_FAMILY, size: 26 }),
        new TextRun({ text: subject.gioiTinh, font: FONT_FAMILY, size: 26 })
      ]
    }),
    new Paragraph({
      indent: { firstLine: 720 },
      spacing: { before: 100, after: 150, line: 360 },
      children: [
        new TextRun({ text: `Cư trú tại: `, font: FONT_FAMILY, size: 26 }),
        new TextRun({ text: `Thôn ${subject.thon}, xã ${tenXaStr}, tỉnh ${tenTinhStr}.`, font: FONT_FAMILY, size: 26 })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      indent: { firstLine: 720 },
      spacing: { before: 100, after: 150, line: 360 },
      children: [
        new TextRun({ text: `Tại thời điểm quan sát, phỏng vấn: `, font: FONT_FAMILY, size: 26 }),
        new TextRun({ text: `${prefix} ${subject.hoTen} `, font: FONT_FAMILY, size: 26 }),
        new TextRun({ text: `${reasonGhiChu}. `, font: FONT_FAMILY, size: 26 }),
        new TextRun({ text: matchExplanation, font: FONT_FAMILY, size: 26 })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      indent: { firstLine: 720 },
      spacing: { before: 100, after: 150, line: 360 },
      children: [
        new TextRun({ text: `Ủy ban nhân dân xã ${tenXaStr}, tỉnh ${tenTinhStr} giới thiệu tới Hội đồng giám định Y khoa tỉnh ${tenTinhStr} để khám, xác định và đánh giá mức độ khuyết tật đối với `, font: FONT_FAMILY, size: 26 }),
        new TextRun({ text: `${prefix} ${subject.hoTen}.`, font: FONT_FAMILY, size: 26 })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      indent: { firstLine: 720 },
      spacing: { before: 100, after: 250, line: 360 },
      children: [
        new TextRun({ text: `Đề nghị Hội đồng giám định Y khoa tỉnh ${tenTinhStr} hết sức giúp đỡ để `, font: FONT_FAMILY, size: 26 }),
        new TextRun({ text: `${prefix} ${shortName}`, font: FONT_FAMILY, size: 26 }),
        new TextRun({ text: ` có kết luận chính xác về xác định mức độ khuyết tật./.`, font: FONT_FAMILY, size: 26 })
      ]
    })
  ];

  // Sign-off table
  const signTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: NO_BORDERS,
    rows: [
      new TableRow({
        children: [
          createNoBorderCell([
            new Paragraph({ children: [] })
          ], 50),
          createNoBorderCell([
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 100, after: 50 },
              children: [
                new TextRun({ text: 'KT. CHỦ TỊCH', bold: true, font: FONT_FAMILY, size: 24 }),
                new TextRun({ text: 'PHÓ CHỦ TỊCH', break: 1, bold: true, font: FONT_FAMILY, size: 24 })
              ]
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 1200, after: 0 },
              children: [
                new TextRun({ text: config.chuTich || 'Nguyễn Hữu Hồng', bold: true, font: FONT_FAMILY, size: 26 })
              ]
            })
          ], 50)
        ]
      })
    ]
  });

  return [
    headerTable,
    photoTable,
    titleParagraph,
    ...bodyParagraphs,
    signTable
  ];
}

/**
 * Generate a single Giấy Giới Thiệu Word document
 */
export async function generateGiayGioiThieuDocx(subject: SubjectRecord, config: AdminConfig): Promise<Blob> {
  const children = getGiayGioiThieuParagraphs(subject, config);
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: A4_PORTRAIT_SIZE,
            margin: A4_PORTRAIT_MARGINS
          }
        },
        children
      }
    ]
  });

  return await Packer.toBlob(doc);
}

/**
 * Generate a merged Word document containing all Giấy Giới Thiệu
 */
export async function generateMergedGiayGioiThieuDocx(subjects: SubjectRecord[], config: AdminConfig): Promise<Blob> {
  const sections = subjects.map((subject) => ({
    properties: {
      page: {
        size: A4_PORTRAIT_SIZE,
        margin: A4_PORTRAIT_MARGINS
      }
    },
    children: getGiayGioiThieuParagraphs(subject, config)
  }));

  const doc = new Document({ sections });
  return await Packer.toBlob(doc);
}

/**
 * Batch ZIP generation for selected or all subject documents
 */
export async function downloadBatchZip(
  type: 'phieu' | 'bienban' | 'giaygioithieu',
  subjects: SubjectRecord[],
  config: AdminConfig,
  zipFilename: string
) {
  const zip = new JSZip();

  for (let i = 0; i < subjects.length; i++) {
    const s = subjects[i];
    const nameSanitized = sanitizeFilename(s.hoTen);
    let blob: Blob;
    let fileName: string;

    if (type === 'phieu') {
      blob = await generatePhieuDocx(s, config);
      const isUnder6 = s.nhomTuoi === 'Dưới 6 tuổi';
      fileName = `${isUnder6 ? 'Phieu_XDKT_Duoi_6_Tuoi' : 'Phieu_XDKT_Tu_6_Tuoi'}_${nameSanitized}.docx`;
    } else if (type === 'bienban') {
      blob = await generateBienBanDocx(s, config);
      fileName = `Bien_Ban_Hop_Hoi_Dong_${nameSanitized}.docx`;
    } else {
      blob = await generateGiayGioiThieuDocx(s, config);
      fileName = `Giay_Gioi_Thieu_${nameSanitized}.docx`;
    }

    const arrayBuffer = await blob.arrayBuffer();
    zip.file(fileName, arrayBuffer);
  }

  const content = await zip.generateAsync({ type: 'blob' });
  saveAs(content, zipFilename.endsWith('.zip') ? zipFilename : `${zipFilename}.zip`);
}

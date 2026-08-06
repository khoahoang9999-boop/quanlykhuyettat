export type DisabilityType = 
  | 'Vận động'
  | 'Nghe, nói'
  | 'Nhìn'
  | 'Trí tuệ'
  | 'Thần kinh, tâm thần'
  | 'Khác'
  | 'Không xác định'
  | 'Không khuyết tật';

export type DisabilityLevel = 
  | 'Đặc biệt nặng'
  | 'Nặng'
  | 'Nhẹ'
  | 'Không xác định'
  | 'Không khuyết tật';

export type AgeGroup = 
  | 'Dưới 6 tuổi'
  | 'Từ 6 tuổi trở lên'
  | 'Không xác định';

export interface SubjectRecord {
  id: string;
  stt?: number;
  hoTen: string;
  ngaySinh: string; // YYYY-MM-DD or DD/MM/YYYY
  gioiTinh: 'Nam' | 'Nữ';
  thon: string;
  cmnd: string;
  dangTat: DisabilityType | string;
  mucDo: DisabilityLevel | string;
  ghiChu: string;
  nguoiDaiDien?: string;
  moiQuanHe?: string;
  sdtNguoiDaiDien?: string;
  cmndNguoiDaiDien?: string;
  tongDiem?: number | string; // Points for 6+ years old evaluation
  scores10?: number[]; // Scores for 10 daily life activities (0, 1, or 2 each)
  danhGiaTheoKhung?: boolean; // True: Evaluated by visual frame signs (Section IV.1), False: Evaluated by scoring (Section IV.2)
  
  // Computed fields
  tuoiNgay?: number;
  nhomTuoi?: AgeGroup;
  ngaySinhFormat?: string;
}

export interface AdminConfig {
  xaName: string;
  tinhName: string;
  chuTich: string;
  nguoiLap: string;
  yTe: string;
  mttq: string;
  soThongBao: string;
  diaDiemHop: string;
  diaDiemNiemYet: string;
  thoiGianNiemYet: string;
  ngayHop: string; // YYYY-MM-DD
  ngayGiayGioiThieu?: string; // YYYY-MM-DD for Giấy giới thiệu / Giấy mời
  gioHop: string;
  phutHop: string;
}

export interface AIAssessmentRequest {
  description: string;
  ageGroup?: string;
  dob?: string;
}

export interface AIAssessmentResponse {
  dangTat: string;
  mucDo: string;
  tongDiemLyThuyet?: string;
  lyDo: string;
  goiYTroCap?: string;
}

import React, { useState } from 'react';
import { SubjectRecord, DisabilityType, DisabilityLevel } from '../types';
import { X, Save, Calculator } from 'lucide-react';

interface SubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: SubjectRecord) => void;
  subject?: SubjectRecord | null;
}

const DISABILITY_TYPES: DisabilityType[] = [
  'Vận động',
  'Nghe, nói',
  'Nhìn',
  'Trí tuệ',
  'Thần kinh, tâm thần',
  'Khác',
  'Không xác định',
  'Không khuyết tật'
];

const DISABILITY_LEVELS: DisabilityLevel[] = [
  'Đặc biệt nặng',
  'Nặng',
  'Nhẹ',
  'Không xác định',
  'Không khuyết tật'
];

export const SubjectModal: React.FC<SubjectModalProps> = ({
  isOpen,
  onClose,
  onSave,
  subject
}) => {
  if (!isOpen) return null;

  const [hoTen, setHoTen] = useState(subject?.hoTen || '');
  const [ngaySinh, setNgaySinh] = useState(subject?.ngaySinh || '');
  const [gioiTinh, setGioiTinh] = useState<'Nam' | 'Nữ'>(subject?.gioiTinh || 'Nam');
  const [thon, setThon] = useState(subject?.thon || '');
  const [cmnd, setCmnd] = useState(subject?.cmnd || '');
  const [dangTat, setDangTat] = useState<DisabilityType>(subject?.dangTat || 'Vận động');
  const [mucDo, setMucDo] = useState<DisabilityLevel>(subject?.mucDo || 'Nặng');
  const [ghiChu, setGhiChu] = useState(subject?.ghiChu || '');
  const [nguoiDaiDien, setNguoiDaiDien] = useState(subject?.nguoiDaiDien || '');
  const [moiQuanHe, setMoiQuanHe] = useState(subject?.moiQuanHe || '');
  const [sdtNguoiDaiDien, setSdtNguoiDaiDien] = useState(subject?.sdtNguoiDaiDien || '');
  const [cmndNguoiDaiDien, setCmndNguoiDaiDien] = useState(subject?.cmndNguoiDaiDien || '');
  const [tongDiem, setTongDiem] = useState<number | string>(subject?.tongDiem || 12);
  const [phuongPhap, setPhuongPhap] = useState<'auto' | 'khung' | 'cham_diem'>(
    subject?.danhGiaTheoKhung === true ? 'khung' : (subject?.danhGiaTheoKhung === false ? 'cham_diem' : 'auto')
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hoTen.trim()) return;

    onSave({
      id: subject?.id || `sub-new-${Date.now()}`,
      stt: subject?.stt,
      hoTen: hoTen.trim(),
      ngaySinh: ngaySinh.trim(),
      gioiTinh,
      thon: thon.trim(),
      cmnd: cmnd.trim(),
      dangTat,
      mucDo,
      ghiChu: ghiChu.trim(),
      nguoiDaiDien: nguoiDaiDien.trim(),
      moiQuanHe: moiQuanHe.trim(),
      sdtNguoiDaiDien: sdtNguoiDaiDien.trim(),
      cmndNguoiDaiDien: cmndNguoiDaiDien.trim(),
      tongDiem: tongDiem ? Number(tongDiem) : undefined,
      danhGiaTheoKhung: phuongPhap === 'khung' ? true : (phuongPhap === 'cham_diem' ? false : undefined)
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[999999] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200">
        <div className="bg-gradient-to-r from-red-800 to-red-900 text-white px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <span>{subject ? '✏️ Chỉnh Sửa Thông Tin Đối Tượng' : '➕ Thêm Mới Đối Tượng'}</span>
          </h2>
          <button
            onClick={onClose}
            className="text-red-100 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Họ và tên *</label>
              <input
                type="text"
                required
                value={hoTen}
                onChange={(e) => setHoTen(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:outline-none"
                placeholder="Nguyễn Văn A"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Ngày sinh (YYYY-MM-DD hoặc DD/MM/YYYY) *</label>
              <input
                type="text"
                required
                value={ngaySinh}
                onChange={(e) => setNgaySinh(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:outline-none"
                placeholder="2021-05-10"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Giới tính</label>
              <select
                value={gioiTinh}
                onChange={(e) => setGioiTinh(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:outline-none"
              >
                <option value="Nam">Nam</option>
                <option value="Nữ">Nữ</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Thôn / Bản / Xóm</label>
              <input
                type="text"
                value={thon}
                onChange={(e) => setThon(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:outline-none"
                placeholder="Thôn Tân Tiến"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Số CMND / CCCD (nếu có)</label>
              <input
                type="text"
                value={cmnd}
                onChange={(e) => setCmnd(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:outline-none"
                placeholder="001091001234"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Dạng tật</label>
              <select
                value={dangTat}
                onChange={(e) => setDangTat(e.target.value as DisabilityType)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:outline-none"
              >
                {DISABILITY_TYPES.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Mức độ khuyết tật</label>
              <select
                value={mucDo}
                onChange={(e) => setMucDo(e.target.value as DisabilityLevel)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:outline-none font-bold text-red-700"
              >
                {DISABILITY_LEVELS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Phương pháp xác định</label>
              <select
                value={phuongPhap}
                onChange={(e) => setPhuongPhap(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:outline-none"
              >
                <option value="auto">Tự động (Dựa theo ghi chú/dấu hiệu)</option>
                <option value="khung">Đánh giá theo khung (Phần 1 - Không chấm điểm)</option>
                <option value="cham_diem">Chấm điểm sinh hoạt (Phần 2 - Bảng 10 tiêu chí)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Điểm sinh hoạt (người ≥ 6t)</label>
              <input
                type="number"
                disabled={phuongPhap === 'khung'}
                value={tongDiem}
                onChange={(e) => setTongDiem(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400"
                placeholder={phuongPhap === 'khung' ? 'Không cần chấm điểm' : '12'}
              />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200">
            <h3 className="text-xs font-bold uppercase text-slate-600 mb-2">Thông tin người đại diện hợp pháp</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                type="text"
                value={nguoiDaiDien}
                onChange={(e) => setNguoiDaiDien(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                placeholder="Họ tên người đại diện"
              />
              <input
                type="text"
                value={moiQuanHe}
                onChange={(e) => setMoiQuanHe(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                placeholder="Mối quan hệ (Bố đẻ, Mẹ đẻ...)"
              />
              <input
                type="text"
                value={sdtNguoiDaiDien}
                onChange={(e) => setSdtNguoiDaiDien(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                placeholder="Số điện thoại người đại diện"
              />
              <input
                type="text"
                value={cmndNguoiDaiDien}
                onChange={(e) => setCmndNguoiDaiDien(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                placeholder="CMND/CCCD người đại diện"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Ghi chú / Kết luận tình trạng</label>
            <textarea
              rows={2}
              value={ghiChu}
              onChange={(e) => setGhiChu(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              placeholder="Tóm tắt tình trạng y tế hoặc ý kiến hội đồng"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-medium text-sm hover:bg-slate-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-gradient-to-r from-red-700 to-red-800 text-white rounded-lg font-bold text-sm shadow-md hover:from-red-800 hover:to-red-900 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>Lưu Thông Tin</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

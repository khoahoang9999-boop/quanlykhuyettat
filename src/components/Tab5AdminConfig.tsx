import React, { useState } from 'react';
import { AdminConfig } from '../types';
import { Settings, Save, CheckCircle2, Building2, UserCheck, Calendar, MapPin } from 'lucide-react';

interface Tab5AdminConfigProps {
  config: AdminConfig;
  onUpdateConfig: (newConfig: AdminConfig) => void;
}

export const Tab5AdminConfig: React.FC<Tab5AdminConfigProps> = ({ config, onUpdateConfig }) => {
  const [formData, setFormData] = useState<AdminConfig>(config);
  const [savedMsg, setSavedMsg] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateConfig(formData);
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Banner */}
      <div className="bg-white border border-red-200 border-l-4 border-l-red-700 rounded-xl p-5 shadow-sm flex items-start gap-4">
        <div className="bg-gradient-to-br from-red-700 to-red-900 text-white font-black text-xs px-3 py-1.5 rounded-lg border border-amber-400/50 shadow-sm shrink-0">
          TAB 5
        </div>
        <div>
          <h2 className="text-base font-bold text-red-900 uppercase">
            CẤU HÌNH HÀNH CHÍNH & THÀNH PHẦN HỘI ĐỒNG CẤP XÃ
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Cấu hình đơn vị hành chính, họ tên thành viên Hội đồng XĐMĐKT cấp Xã để tự động thay thế vào toàn bộ Mẫu 01, Mẫu 02, Mẫu 03 & Mẫu 04.
          </p>
        </div>
      </div>

      {savedMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-4 flex items-center gap-2 text-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span>Đã lưu thành công cấu hình hành chính! Các tài liệu xuất mới sẽ tự động sử dụng thông tin này.</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
        {/* Section 1: Đơn vị hành chính */}
        <div>
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
            <Building2 className="w-4 h-4 text-red-700" />
            1. Đơn Vị Hành Chính Cấp Xã / Tỉnh
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Tên Xã / Phường / Thị trấn *</label>
              <input
                type="text"
                required
                value={formData.xaName}
                onChange={(e) => setFormData({ ...formData, xaName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-red-500 focus:outline-none"
                placeholder="Hàm Yên"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Tên Tỉnh / Thành phố trực thuộc TƯ *</label>
              <input
                type="text"
                required
                value={formData.tinhName}
                onChange={(e) => setFormData({ ...formData, tinhName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-red-500 focus:outline-none"
                placeholder="Tuyên Quang"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Thành phần Hội đồng */}
        <div>
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
            <UserCheck className="w-4 h-4 text-red-700" />
            2. Thành Phần Hội Đồng Xác Định Mức Độ Khuyết Tật Cấp Xã
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Chủ tịch Hội đồng (Chủ tịch / Phó CT UBND Xã) *</label>
              <input
                type="text"
                required
                value={formData.chuTich}
                onChange={(e) => setFormData({ ...formData, chuTich: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-red-500 focus:outline-none"
                placeholder="Nguyễn Hữu Hồng"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Công chức Văn hóa - Xã hội (Người lập / Ghi biên bản) *</label>
              <input
                type="text"
                required
                value={formData.nguoiLap}
                onChange={(e) => setFormData({ ...formData, nguoiLap: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-red-500 focus:outline-none"
                placeholder="Phạm Thùy Dương"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Trưởng Trạm Y tế Cấp xã (Thành viên) *</label>
              <input
                type="text"
                required
                value={formData.yTe}
                onChange={(e) => setFormData({ ...formData, yTe: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-red-500 focus:outline-none"
                placeholder="Hoàng Văn Quỳnh"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Đại diện Ủy ban MTTQ Xã (Thành viên) *</label>
              <input
                type="text"
                required
                value={formData.mttq}
                onChange={(e) => setFormData({ ...formData, mttq: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-red-500 focus:outline-none"
                placeholder="Trịnh Trọng Duẩn"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Địa điểm & Niêm yết */}
        <div>
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
            <MapPin className="w-4 h-4 text-red-700" />
            3. Thông Tin Họp & Niêm Yết Công Khai
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Ngày họp Hội đồng *</label>
              <input
                type="date"
                required
                value={formData.ngayHop}
                onChange={(e) => setFormData({ ...formData, ngayHop: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-red-500 focus:outline-none"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold uppercase text-slate-700">Ngày Giấy Giới Thiệu / Giấy Mời</label>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, ngayGiayGioiThieu: new Date().toISOString().split('T')[0] })}
                  className="text-[11px] font-medium text-blue-700 hover:underline cursor-pointer"
                >
                  Mặc định ngày hiện tại
                </button>
              </div>
              <input
                type="date"
                value={formData.ngayGiayGioiThieu || new Date().toISOString().split('T')[0]}
                onChange={(e) => setFormData({ ...formData, ngayGiayGioiThieu: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-red-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Giờ họp Hội đồng bắt đầu (định dạng 24h) *</label>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-lg px-2 py-1.5 focus-within:ring-2 focus-within:ring-red-500 w-full">
                  <input
                    type="number"
                    min={0}
                    max={23}
                    value={formData.gioHop || '08'}
                    onChange={(e) => {
                      let val = e.target.value;
                      if (val !== '' && Number(val) > 23) val = '23';
                      if (val !== '' && Number(val) < 0) val = '00';
                      setFormData({ ...formData, gioHop: val });
                    }}
                    onBlur={() => {
                      const num = parseInt(formData.gioHop || '8', 10);
                      const formatted = isNaN(num) ? '08' : String(Math.min(23, Math.max(0, num))).padStart(2, '0');
                      setFormData({ ...formData, gioHop: formatted });
                    }}
                    className="w-12 text-center font-bold text-sm text-slate-800 outline-none bg-transparent"
                    placeholder="08"
                  />
                  <span className="text-xs font-semibold text-slate-500">giờ</span>
                  <input
                    type="number"
                    min={0}
                    max={59}
                    value={formData.phutHop || '00'}
                    onChange={(e) => {
                      let val = e.target.value;
                      if (val !== '' && Number(val) > 59) val = '59';
                      if (val !== '' && Number(val) < 0) val = '00';
                      setFormData({ ...formData, phutHop: val });
                    }}
                    onBlur={() => {
                      const num = parseInt(formData.phutHop || '0', 10);
                      const formatted = isNaN(num) ? '00' : String(Math.min(59, Math.max(0, num))).padStart(2, '0');
                      setFormData({ ...formData, phutHop: formatted });
                    }}
                    className="w-12 text-center font-bold text-sm text-slate-800 outline-none bg-transparent"
                    placeholder="00"
                  />
                  <span className="text-xs font-semibold text-slate-500">phút</span>
                </div>
                <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded shrink-0">
                  {String(parseInt(formData.gioHop || '8', 10) || 0).padStart(2, '0')}h{String(parseInt(formData.phutHop || '0', 10) || 0).padStart(2, '0')} (24h)
                </span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Số văn bản Thông báo niêm yết</label>
              <input
                type="text"
                value={formData.soThongBao}
                onChange={(e) => setFormData({ ...formData, soThongBao: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-red-500 focus:outline-none"
                placeholder="40/TB-UBND"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Thời gian niêm yết công khai</label>
              <input
                type="text"
                value={formData.thoiGianNiemYet}
                onChange={(e) => setFormData({ ...formData, thoiGianNiemYet: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-red-500 focus:outline-none"
                placeholder="15 ngày (kể từ ngày niêm yết)"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Địa điểm tổ chức cuộc họp Hội đồng</label>
              <input
                type="text"
                value={formData.diaDiemHop}
                onChange={(e) => setFormData({ ...formData, diaDiemHop: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-red-500 focus:outline-none"
                placeholder="Phòng 110, tầng 1, trụ sở Ủy ban nhân dân xã Hàm Yên"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Địa điểm niêm yết công khai kết quả</label>
              <input
                type="text"
                value={formData.diaDiemNiemYet}
                onChange={(e) => setFormData({ ...formData, diaDiemNiemYet: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-red-500 focus:outline-none"
                placeholder="Tại Trụ sở UBND xã và Nhà văn hóa các thôn"
              />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-200 flex justify-end">
          <button
            type="submit"
            className="py-3 px-6 bg-gradient-to-r from-red-700 to-red-800 hover:from-red-800 hover:to-red-900 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>Lưu Cấu Hình Hành Chính</span>
          </button>
        </div>
      </form>
    </div>
  );
};

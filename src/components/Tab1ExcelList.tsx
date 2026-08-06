import React, { useRef, useState } from 'react';
import { SubjectRecord, AdminConfig } from '../types';
import { parseExcelFile, exportToExcel } from '../utils/excelUtils';
import { processSubjectAge } from '../utils/dateUtils';
import { isRecordUndetermined } from '../utils/docxGenerator';
import { initialSampleData } from '../data/sampleData';
import { CustomDialog, DialogOptions } from './CustomDialog';
import { 
  FileSpreadsheet, 
  Upload, 
  Download, 
  Trash2, 
  CheckCircle2, 
  Plus, 
  Pencil, 
  Search, 
  Filter, 
  Sparkles,
  RefreshCw
} from 'lucide-react';

interface Tab1ExcelListProps {
  records: SubjectRecord[];
  onUpdateRecords: (records: SubjectRecord[]) => void;
  config: AdminConfig;
  onUpdateConfig: (config: AdminConfig) => void;
  onOpenSubjectModal: (subject?: SubjectRecord) => void;
}

export const Tab1ExcelList: React.FC<Tab1ExcelListProps> = ({
  records,
  onUpdateRecords,
  config,
  onUpdateConfig,
  onOpenSubjectModal
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [filterMode, setFilterMode] = useState<'all' | 'under6' | 'over6'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [dialogOptions, setDialogOptions] = useState<DialogOptions | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setErrorMsg(null);
    try {
      const parsed = await parseExcelFile(file);
      const processed = parsed.map(r => processSubjectAge(r, config.ngayHop));
      onUpdateRecords(processed);
      setSuccessMsg(`Tải lên thành công file "${file.name}" (đã tổng hợp dữ liệu từ tất cả các sheet) với tổng số ${processed.length} đối tượng!`);
    } catch (err: any) {
      setErrorMsg(`Lỗi khi đọc file Excel: ${err?.message || 'Không thể xử lý dữ liệu'}`);
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleLoadSample = () => {
    const processed = initialSampleData.map(r => processSubjectAge(r, config.ngayHop));
    onUpdateRecords(processed);
    setSuccessMsg('Đã tải dữ liệu mẫu thử nghiệm thành công với 20 đối tượng!');
  };

  const handleSaveAndClassify = () => {
    if (records.length === 0) return;
    const reProcessed = records.map(r => processSubjectAge(r, config.ngayHop));
    onUpdateRecords(reProcessed);
    setSuccessMsg('Đã cập nhật phân loại độ tuổi và thông tin thành công!');
  };

  const handleClearData = () => {
    setDialogOptions({
      isOpen: true,
      title: 'Xác Nhận Xóa Danh Sách',
      message: 'Bạn có chắc chắn muốn xóa toàn bộ danh sách đối tượng hiện tại không? Tất cả dữ liệu chưa lưu sẽ bị xóa hoàn toàn.',
      confirmText: 'Xóa toàn bộ',
      cancelText: 'Hủy bỏ',
      variant: 'danger',
      onConfirm: () => {
        onUpdateRecords([]);
        setSuccessMsg('Đã xóa dữ liệu thành công.');
      }
    });
  };

  const handleDeleteRecord = (record: SubjectRecord) => {
    setDialogOptions({
      isOpen: true,
      title: 'Xóa Đối Tượng',
      message: `Bạn có chắc chắn muốn xóa đối tượng "${record.hoTen}" (${record.thon || 'Chưa rõ thôn'}) khỏi danh sách?`,
      confirmText: 'Xóa đối tượng',
      cancelText: 'Hủy bỏ',
      variant: 'danger',
      onConfirm: () => {
        const updated = records.filter(r => r.id !== record.id);
        onUpdateRecords(updated);
        setSuccessMsg(`Đã xóa đối tượng "${record.hoTen}".`);
      }
    });
  };

  const handleExportCurrent = () => {
    if (filteredRecords.length === 0) return;
    const tag = filterMode === 'under6' ? 'Duoi_6_Tuoi' : filterMode === 'over6' ? 'Tu_6_Tuoi_Tro_Len' : 'Tat_Ca';
    exportToExcel(filteredRecords, `Danh_Sach_Doi_Tuong_${tag}_Xa_${config.xaName || 'Ham_Yen'}`);
  };

  const processedRecords = records.map(r => processSubjectAge(r, config.ngayHop));
  const under6List = processedRecords.filter(r => r.nhomTuoi === 'Dưới 6 tuổi');
  const over6List = processedRecords.filter(r => r.nhomTuoi === 'Từ 6 tuổi trở lên');

  const filteredRecords = processedRecords.filter(r => {
    const matchesFilter =
      filterMode === 'all'
        ? true
        : filterMode === 'under6'
        ? r.nhomTuoi === 'Dưới 6 tuổi'
        : r.nhomTuoi === 'Từ 6 tuổi trở lên';

    const s = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !s ||
      r.hoTen.toLowerCase().includes(s) ||
      r.thon.toLowerCase().includes(s) ||
      r.cmnd.toLowerCase().includes(s) ||
      r.dangTat.toLowerCase().includes(s) ||
      r.mucDo.toLowerCase().includes(s);

    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-white border border-red-200 border-l-4 border-l-red-700 rounded-xl p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="bg-gradient-to-br from-red-700 to-red-900 text-white font-black text-xs px-3 py-1.5 rounded-lg border border-amber-400/50 shadow-sm shrink-0">
            TAB 1
          </div>
          <div>
            <h2 className="text-base font-bold text-red-900 uppercase">
              BIỂU XÁC ĐỊNH DẠNG TẬT VÀ MỨC ĐỘ KHUYẾT TẬT DÀNH CHO THÀNH VIÊN HỘI ĐỒNG XÁC ĐỊNH MỨC ĐỘ CẤP XÃ
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Tải tệp Excel danh sách đối tượng, lưu dữ liệu, phân loại nhóm tuổi tự động và xem tổng số người.
            </p>
          </div>
        </div>
      </div>

      {/* Action Messages */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-4 flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-700 font-bold hover:underline">Đóng</button>
        </div>
      )}

      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-4 flex items-center justify-between text-sm">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="text-rose-700 font-bold hover:underline">Đóng</button>
        </div>
      )}

      {/* Main Grid Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Col 1 & 2: Upload or Load Sample */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
            <div className="w-7 h-7 bg-red-100 text-red-700 font-bold text-xs rounded-lg flex items-center justify-center">1</div>
            <h3 className="font-bold text-slate-800 text-sm">Tải lên danh sách Excel đối tượng hoặc dùng Mẫu Thử Nghiệm</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 hover:border-red-500 hover:bg-red-50/50 transition-colors flex flex-col items-center justify-center text-center cursor-pointer"
                 onClick={() => fileInputRef.current?.click()}>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Upload className="w-8 h-8 text-red-700 mb-2" />
              <span className="text-xs font-bold text-slate-800">Chọn file Excel (.xlsx, .xls)</span>
              <span className="text-[11px] text-slate-500 mt-1">Nhấp vào đây để chọn file từ máy tính</span>
            </div>

            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  Dữ Liệu Thử Nghiệm Chuẩn
                </span>
                <p className="text-[11px] text-slate-600 mt-1">
                  Nạp ngay 7 bản ghi mẫu đầy đủ thông tin chuẩn Thông tư 01/2019/TT-BLĐTBXH.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 mt-3">
                <button
                  onClick={handleLoadSample}
                  className="w-full py-2 px-3 bg-red-700 hover:bg-red-800 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                >
                  🚀 Nạp dữ liệu mẫu
                </button>
                <button
                  onClick={() => exportToExcel(initialSampleData, 'File_Mau_Danh_Sach_Doi_Tuong')}
                  className="w-full py-2 px-3 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  Tải Excel mẫu
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Col 3: Config Date & Actions */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3 mb-4">
              <div className="w-7 h-7 bg-red-100 text-red-700 font-bold text-xs rounded-lg flex items-center justify-center">2</div>
              <h3 className="font-bold text-slate-800 text-sm">Cấu Hình Ngày Họp & Thao Tác</h3>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Ngày họp đánh giá</label>
                <input
                  type="date"
                  value={config.ngayHop}
                  onChange={(e) => onUpdateConfig({ ...config, ngayHop: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-red-500 focus:outline-none"
                />
                <p className="text-[11px] text-slate-500 mt-1">Căn cứ để tự động tính độ tuổi (&lt;6t vs ≥6t).</p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Giờ họp Hội đồng (định dạng 24h)</label>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 focus-within:ring-2 focus-within:ring-red-500">
                    <input
                      type="number"
                      min={0}
                      max={23}
                      value={config.gioHop || '08'}
                      onChange={(e) => {
                        let val = e.target.value;
                        if (val !== '' && Number(val) > 23) val = '23';
                        if (val !== '' && Number(val) < 0) val = '00';
                        onUpdateConfig({ ...config, gioHop: val });
                      }}
                      onBlur={() => {
                        const num = parseInt(config.gioHop || '8', 10);
                        const formatted = isNaN(num) ? '08' : String(Math.min(23, Math.max(0, num))).padStart(2, '0');
                        onUpdateConfig({ ...config, gioHop: formatted });
                      }}
                      className="w-12 text-center font-bold text-sm text-slate-800 outline-none bg-transparent"
                      placeholder="08"
                    />
                    <span className="text-xs font-semibold text-slate-500">giờ</span>
                    <input
                      type="number"
                      min={0}
                      max={59}
                      value={config.phutHop || '00'}
                      onChange={(e) => {
                        let val = e.target.value;
                        if (val !== '' && Number(val) > 59) val = '59';
                        if (val !== '' && Number(val) < 0) val = '00';
                        onUpdateConfig({ ...config, phutHop: val });
                      }}
                      onBlur={() => {
                        const num = parseInt(config.phutHop || '0', 10);
                        const formatted = isNaN(num) ? '00' : String(Math.min(59, Math.max(0, num))).padStart(2, '0');
                        onUpdateConfig({ ...config, phutHop: formatted });
                      }}
                      className="w-12 text-center font-bold text-sm text-slate-800 outline-none bg-transparent"
                      placeholder="00"
                    />
                    <span className="text-xs font-semibold text-slate-500">phút</span>
                  </div>
                  <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded">
                    {String(parseInt(config.gioHop || '8', 10) || 0).padStart(2, '0')}h{String(parseInt(config.phutHop || '0', 10) || 0).padStart(2, '0')} (24h)
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2">
            <button
              onClick={handleSaveAndClassify}
              disabled={records.length === 0}
              className="w-full py-2.5 bg-gradient-to-r from-red-700 to-red-800 hover:from-red-800 hover:to-red-900 disabled:opacity-50 text-white font-bold text-xs rounded-lg shadow-xs flex items-center justify-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Lưu & Phân loại
            </button>
            <button
              onClick={handleClearData}
              disabled={records.length === 0}
              className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 disabled:opacity-50 text-rose-700 font-bold text-xs rounded-lg border border-rose-200 flex items-center justify-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Xóa dữ liệu
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tổng số người trong danh sách</div>
            <div className="text-3xl font-light italic text-slate-900 mt-1">
              {processedRecords.length} <span className="text-xs font-normal not-italic text-slate-500">người</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-lg">
            📊
          </div>
        </div>

        <div className="bg-white border border-blue-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-blue-700 uppercase tracking-wider">Nhóm 1: Dưới 6 tuổi (Mẫu 02)</div>
            <div className="text-3xl font-light italic text-blue-700 mt-1">
              {under6List.length} <span className="text-xs font-normal not-italic text-blue-500">hồ sơ</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-lg">
            👶
          </div>
        </div>

        <div className="bg-white border border-orange-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-amber-700 uppercase tracking-wider">Nhóm 2: Từ 6 tuổi trở lên (Mẫu 01)</div>
            <div className="text-3xl font-light italic text-amber-700 mt-1">
              {over6List.length} <span className="text-xs font-normal not-italic text-amber-500">hồ sơ</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-lg">
            🧑
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        {/* Filter and Search Bar */}
        <div className="p-4 md:p-6 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            <span className="text-xs font-bold text-slate-600 uppercase flex items-center gap-1 shrink-0 mr-1">
              <Filter className="w-3.5 h-3.5" /> Lọc danh sách:
            </span>
            <button
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                filterMode === 'all'
                  ? 'bg-red-700 text-white shadow-xs'
                  : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
            >
              Tất cả ({processedRecords.length})
            </button>
            <button
              onClick={() => setFilterMode('under6')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                filterMode === 'under6'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white border border-slate-300 text-blue-700 hover:bg-blue-50'
              }`}
            >
              Nhóm 1: Dưới 6 tuổi ({under6List.length})
            </button>
            <button
              onClick={() => setFilterMode('over6')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                filterMode === 'over6'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white border border-slate-300 text-amber-700 hover:bg-amber-50'
              }`}
            >
              Nhóm 2: Từ 6 tuổi trở lên ({over6List.length})
            </button>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative w-full md:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm tên, thôn, dạng tật..."
                className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-red-500 focus:outline-none"
              />
            </div>

            <button
              onClick={() => onOpenSubjectModal()}
              className="py-1.5 px-3 bg-red-700 hover:bg-red-800 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1 shrink-0 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" /> Thêm mới
            </button>

            <button
              onClick={handleExportCurrent}
              disabled={filteredRecords.length === 0}
              className="py-1.5 px-3 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1 shrink-0 shadow-xs disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" /> Excel
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 uppercase font-bold text-[11px] tracking-wider">
                <th className="py-3 px-4 w-12 text-center">STT</th>
                <th className="py-3 px-4">Họ và tên</th>
                <th className="py-3 px-4 text-center">Ngày sinh</th>
                <th className="py-3 px-4">Giới tính</th>
                <th className="py-3 px-4">Thôn</th>
                <th className="py-3 px-4">Dạng tật</th>
                <th className="py-3 px-4 text-center">Mức độ khuyết tật</th>
                <th className="py-3 px-4 text-center">Nhóm tuổi (Tự động)</th>
                <th className="py-3 px-4">Ghi chú</th>
                <th className="py-3 px-4 text-center w-20">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredRecords.length > 0 ? (
                filteredRecords.map((r, idx) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 text-center font-bold text-slate-600">{idx + 1}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{r.hoTen}</td>
                    <td className="py-3 px-4 text-center font-mono">{r.ngaySinhFormat || r.ngaySinh}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                        r.gioiTinh === 'Nữ' 
                          ? 'bg-pink-100 text-pink-800 border border-pink-200' 
                          : 'bg-blue-100 text-blue-800 border border-blue-200'
                      }`}>
                        {r.gioiTinh}
                      </span>
                    </td>
                    <td className="py-3 px-4">{r.thon}</td>
                    <td className="py-3 px-4 font-semibold text-slate-700">{r.dangTat}</td>
                    <td className="py-3 px-4 text-center">
                      {isRecordUndetermined(r) ? (
                        <span className="inline-block px-2 py-0.5 rounded-md font-bold text-[11px] bg-purple-100 text-purple-800 border border-purple-300">
                          Không xác định
                        </span>
                      ) : (
                        <span className={`inline-block px-2 py-0.5 rounded-md font-bold text-[11px] ${
                          r.mucDo === 'Đặc biệt nặng'
                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                            : r.mucDo === 'Nặng'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        }`}>
                          {r.mucDo}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                        r.nhomTuoi === 'Dưới 6 tuổi'
                          ? 'bg-blue-100 text-blue-800 border border-blue-300'
                          : 'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}>
                        {r.nhomTuoi}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 truncate max-w-xs">{r.ghiChu}</td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => onOpenSubjectModal(r)}
                          className="p-1.5 text-slate-600 hover:text-red-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="Chỉnh sửa đối tượng"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteRecord(r)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Xóa đối tượng này"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-500">
                    <FileSpreadsheet className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold">Chưa có dữ liệu danh sách đối tượng.</p>
                    <p className="text-xs text-slate-400 mt-1">Vui lòng tải file Excel hoặc nhấp <b>"Nạp dữ liệu mẫu"</b> ở trên.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Center Custom Dialog Popup */}
      <CustomDialog
        options={dialogOptions}
        onClose={() => setDialogOptions(null)}
      />
    </div>
  );
};

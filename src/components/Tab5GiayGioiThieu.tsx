import React, { useState } from 'react';
import { SubjectRecord, AdminConfig } from '../types';
import { isRecordUndetermined, generateGiayGioiThieuDocx, generateMergedGiayGioiThieuDocx, downloadBatchZip } from '../utils/docxGenerator';
import { sanitizeFilename, getDateParts } from '../utils/dateUtils';
import saveAs from 'file-saver';
import { 
  FileText, 
  Download, 
  Search, 
  CheckSquare, 
  Square, 
  Eye, 
  FileDown, 
  UserCheck, 
  Building2,
  Calendar
} from 'lucide-react';

interface Tab5GiayGioiThieuProps {
  records: SubjectRecord[];
  config: AdminConfig;
  onUpdateConfig?: (newConfig: AdminConfig) => void;
}

export const Tab5GiayGioiThieu: React.FC<Tab5GiayGioiThieuProps> = ({ records, config, onUpdateConfig }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'eligible' | 'nhe' | 'undetermined' | 'all'>('eligible');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activePreviewId, setActivePreviewId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Date for Giấy giới thiệu (default to today if empty)
  const giayGioiThieuDate = config.ngayGiayGioiThieu || new Date().toISOString().split('T')[0];
  const giayGioiThieuDateParts = getDateParts(giayGioiThieuDate);

  const handleDateChange = (newDate: string) => {
    if (onUpdateConfig) {
      onUpdateConfig({
        ...config,
        ngayGiayGioiThieu: newDate
      });
    }
  };

  // Filter records
  const eligibleRecords = records.filter(r => r.mucDo === 'Nhẹ' || isRecordUndetermined(r));
  
  const displayRecords = records.filter(r => {
    // Filter by type
    if (filterType === 'eligible' && (r.mucDo !== 'Nhẹ' && !isRecordUndetermined(r))) return false;
    if (filterType === 'nhe' && r.mucDo !== 'Nhẹ') return false;
    if (filterType === 'undetermined' && !isRecordUndetermined(r)) return false;

    // Filter by search
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchName = r.hoTen.toLowerCase().includes(term);
      const matchThon = (r.thon || '').toLowerCase().includes(term);
      const matchDangTat = (r.dangTat || '').toLowerCase().includes(term);
      return matchName || matchThon || matchDangTat;
    }
    return true;
  });

  // Default active preview to first eligible record
  const currentPreviewRecord = records.find(r => r.id === (activePreviewId || (displayRecords[0]?.id || records[0]?.id)));

  // Toggle selection
  const handleToggleSelectAll = () => {
    if (selectedIds.length === displayRecords.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(displayRecords.map(r => r.id));
    }
  };

  const handleToggleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // Single export
  const handleExportSingle = async (subject: SubjectRecord) => {
    try {
      setIsExporting(true);
      const blob = await generateGiayGioiThieuDocx(subject, config);
      const filename = `Giay_Gioi_Thieu_${sanitizeFilename(subject.hoTen)}.docx`;
      saveAs(blob, filename);
    } catch (err) {
      console.error('Error generating single Giay Gioi Thieu:', err);
      alert('Có lỗi xảy ra khi tạo file Giấy Giới Thiệu!');
    } finally {
      setIsExporting(false);
    }
  };

  // Merged export (All selected or display records in 1 DOCX)
  const handleExportMerged = async () => {
    const targetRecords = selectedIds.length > 0 
      ? records.filter(r => selectedIds.includes(r.id))
      : displayRecords;

    if (targetRecords.length === 0) {
      alert('Vui lòng chọn ít nhất 1 đối tượng để xuất file!');
      return;
    }

    try {
      setIsExporting(true);
      const blob = await generateMergedGiayGioiThieuDocx(targetRecords, config);
      const filename = `Gop_Giay_Gioi_Thieu_${targetRecords.length}_Doi_Tuong.docx`;
      saveAs(blob, filename);
    } catch (err) {
      console.error('Error generating merged Giay Gioi Thieu:', err);
      alert('Có lỗi xảy ra khi gộp file Giấy Giới Thiệu!');
    } finally {
      setIsExporting(false);
    }
  };

  // Batch ZIP export
  const handleExportZip = async () => {
    const targetRecords = selectedIds.length > 0 
      ? records.filter(r => selectedIds.includes(r.id))
      : displayRecords;

    if (targetRecords.length === 0) {
      alert('Vui lòng chọn ít nhất 1 đối tượng để xuất ZIP!');
      return;
    }

    try {
      setIsExporting(true);
      const zipName = `Zip_Giay_Gioi_Thieu_${targetRecords.length}_Doi_Tuong.zip`;
      await downloadBatchZip('giaygioithieu', targetRecords, config, zipName);
    } catch (err) {
      console.error('Error generating zip:', err);
      alert('Có lỗi xảy ra khi tạo nén ZIP Giấy Giới Thiệu!');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Stats */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-lg border border-blue-800/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-200 border border-blue-400/30 px-3 py-1 rounded-full text-xs font-semibold mb-2">
              <Building2 className="w-3.5 h-3.5" />
              <span>Hội Đồng Giám Định Y Khoa Tỉnh</span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight">
              Giấy Giới Thiệu Khám Giám Định Mức Độ Khuyết Tật
            </h2>
            <p className="text-blue-200 text-xs md:text-sm mt-1 max-w-3xl">
              Cấp cho các đối tượng khuyết tật mức độ <strong className="text-amber-300">Nhẹ</strong> hoặc <strong className="text-purple-300">Không xác định được mức độ</strong> (vượt quá khả năng chuyên môn của Hội đồng cấp xã).
            </p>
          </div>

          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-3 rounded-xl border border-white/10 shrink-0">
            <div className="p-2.5 bg-blue-500/20 rounded-lg text-blue-300">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-white">{eligibleRecords.length}</div>
              <div className="text-[11px] text-blue-200 uppercase font-medium">Hồ sơ đủ điều kiện cấp</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Control & List, Right Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Filter & List */}
        <div className="lg:col-span-5 space-y-4">
          {/* Action Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
            {/* Date Config for Giấy Giới Thiệu / Giấy Mời */}
            <div className="bg-blue-50/70 border border-blue-200 p-3 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-700" />
                  <span>Ngày phát hành Giấy giới thiệu / Giấy mời:</span>
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={giayGioiThieuDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="px-2.5 py-1.5 bg-white border border-blue-300 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1"
                />
                <button
                  type="button"
                  onClick={() => handleDateChange(new Date().toISOString().split('T')[0])}
                  className="px-2.5 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold shrink-0 transition-colors shadow-2xs"
                  title="Đặt theo ngày hiện tại"
                >
                  Hôm nay
                </button>
                <button
                  type="button"
                  onClick={() => handleDateChange(config.ngayHop)}
                  className="px-2.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-medium shrink-0 transition-colors"
                  title="Theo ngày họp Hội đồng"
                >
                  Ngày họp
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm kiếm họ tên, thôn, dạng tật..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="py-1.5 px-2.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="eligible">Đủ điều kiện ({eligibleRecords.length})</option>
                <option value="undetermined">Không xác định ({records.filter(r => isRecordUndetermined(r)).length})</option>
                <option value="nhe">Mức độ nhẹ ({records.filter(r => r.mucDo === 'Nhẹ').length})</option>
                <option value="all">Tất cả hồ sơ ({records.length})</option>
              </select>
            </div>

            {/* Batch Action Buttons */}
            <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
              <button
                onClick={handleExportMerged}
                disabled={isExporting || displayRecords.length === 0}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold transition-all shadow-xs disabled:opacity-50"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>Xuất Gộp 1 File Word</span>
              </button>
              
              <button
                onClick={handleExportZip}
                disabled={isExporting || displayRecords.length === 0}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition-all shadow-xs disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Tải Zip {selectedIds.length > 0 ? `(${selectedIds.length})` : ''}</span>
              </button>
            </div>
          </div>

          {/* Subject List */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-bold text-slate-700">
              <button 
                onClick={handleToggleSelectAll}
                className="flex items-center gap-2 hover:text-blue-700 transition-colors"
              >
                {selectedIds.length === displayRecords.length && displayRecords.length > 0 ? (
                  <CheckSquare className="w-4 h-4 text-blue-700" />
                ) : (
                  <Square className="w-4 h-4 text-slate-400" />
                )}
                <span>Danh sách đối tượng ({displayRecords.length})</span>
              </button>
              {selectedIds.length > 0 && (
                <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                  Đã chọn {selectedIds.length}
                </span>
              )}
            </div>

            <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
              {displayRecords.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  Không tìm thấy hồ sơ phù hợp.
                </div>
              ) : (
                displayRecords.map((r) => {
                  const isUndet = isRecordUndetermined(r);
                  const isNhe = r.mucDo === 'Nhẹ';
                  const isEligible = isUndet || isNhe;
                  const isSelected = selectedIds.includes(r.id);
                  const isPreviewing = currentPreviewRecord?.id === r.id;

                  return (
                    <div
                      key={r.id}
                      className={`p-3 transition-colors flex items-start justify-between gap-3 ${
                        isPreviewing ? 'bg-blue-50/70 border-l-4 border-l-blue-600' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start gap-2.5 flex-1 min-w-0">
                        <button
                          onClick={() => handleToggleSelectOne(r.id)}
                          className="mt-0.5 text-slate-400 hover:text-blue-600 shrink-0"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                        
                        <div 
                          className="cursor-pointer flex-1 min-w-0"
                          onClick={() => setActivePreviewId(r.id)}
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-900 hover:text-blue-700 truncate">
                              {r.stt}. {r.hoTen}
                            </span>
                            <span className="text-[10px] text-slate-500 whitespace-nowrap">
                              ({r.gioiTinh}, {r.ngaySinhFormat || r.ngaySinh})
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-600">
                            <span>Thôn {r.thon}</span>
                            <span>•</span>
                            <span className="truncate">{r.dangTat || 'Chưa rõ dạng tật'}</span>
                          </div>

                          <div className="flex items-center gap-1.5 mt-1.5">
                            {isUndet ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                                Không xác định được
                              </span>
                            ) : isNhe ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                                Mức độ Nhẹ
                              </span>
                            ) : (
                              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                                {r.mucDo}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => setActivePreviewId(r.id)}
                          title="Xem trước Giấy giới thiệu"
                          className={`p-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                            isPreviewing
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleExportSingle(r)}
                          disabled={isExporting}
                          title="Tải Word Giấy giới thiệu này"
                          className="p-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 text-xs font-semibold transition-colors disabled:opacity-50"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Document Live Preview */}
        <div className="lg:col-span-7 space-y-4">
          {currentPreviewRecord ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-md p-6 md:p-10 space-y-6 relative text-slate-900 font-serif">
              {/* Floating Action Badge */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-4 font-sans">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-700" />
                  <span className="font-bold text-sm text-slate-800">Xem Trước Giấy Giới Thiệu In/Xuất File</span>
                </div>
                <button
                  onClick={() => handleExportSingle(currentPreviewRecord)}
                  disabled={isExporting}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold transition-all shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Xuất File Word (.docx)</span>
                </button>
              </div>

              {/* Document Container simulating A4 sheet */}
              <div className="bg-white p-8 md:p-12 border border-slate-300 shadow-lg rounded-sm max-w-2xl mx-auto space-y-6 leading-relaxed text-sm">
                {/* Header 2 columns */}
                <div className="grid grid-cols-2 gap-4 text-center font-sans">
                  <div>
                    <div className="font-bold text-xs uppercase tracking-tight">ỦY BAN NHÂN DÂN</div>
                    <div className="font-bold text-xs uppercase tracking-tight">XÃ {(config.xaName || 'HÀM YÊN').toUpperCase()}</div>
                    <div className="text-xs text-slate-700 mt-1">Số: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;/GT- UBND</div>
                  </div>

                  <div>
                    <div className="font-bold text-xs uppercase tracking-tight">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
                    <div className="font-bold text-xs underline decoration-1 underline-offset-4 tracking-tight">Độc lập - Tự do - Hạnh phúc</div>
                    <div className="text-xs italic text-slate-700 mt-1">
                      {config.xaName || 'Hàm Yên'}, ngày {giayGioiThieuDateParts.day} tháng {giayGioiThieuDateParts.month} năm {giayGioiThieuDateParts.year}
                    </div>
                  </div>
                </div>

                {/* Photo box frame on left */}
                <div className="w-[3cm] h-[4cm] border border-black flex flex-col items-center justify-center text-slate-900 font-serif text-sm my-2">
                  <span>Ảnh</span>
                  <span className="text-xs italic">(3 x 4 cm)</span>
                </div>

                {/* Main Heading */}
                <div className="text-center space-y-1">
                  <h1 className="text-xl font-bold uppercase tracking-wider text-slate-900">
                    GIẤY GIỚI THIỆU
                  </h1>
                </div>

                {/* Kính gửi */}
                <div className="text-center space-y-1 font-sans">
                  <p className="font-bold text-xs md:text-sm text-slate-800">
                    Kính gửi: <span className="font-bold">Hội đồng Giám định Y khoa tỉnh {config.tinhName || 'Tuyên Quang'}.</span>
                  </p>
                  <p className="font-bold text-xs md:text-sm text-slate-800">
                    Ủy ban nhân dân xã {config.xaName || 'Hàm Yên'} tỉnh {config.tinhName || 'Tuyên Quang'}:
                  </p>
                </div>

                {/* Document Body */}
                <div className="space-y-3 font-serif leading-relaxed text-slate-900 text-sm">
                  <p className="indent-8">
                    Trân trọng giới thiệu: {currentPreviewRecord.gioiTinh === 'Nam' ? 'ông' : 'bà'}{' '}
                    <strong className="font-bold">{currentPreviewRecord.hoTen}</strong>
                  </p>

                  <div className="grid grid-cols-2 gap-4 indent-8">
                    <div>
                      Sinh ngày: {currentPreviewRecord.ngaySinhFormat || currentPreviewRecord.ngaySinh}
                    </div>
                    <div>
                      Giới tính: {currentPreviewRecord.gioiTinh}
                    </div>
                  </div>

                  <p className="indent-8">
                    Cư trú tại: Thôn {currentPreviewRecord.thon}, xã {config.xaName || 'Hàm Yên'}, tỉnh {config.tinhName || 'Tuyên Quang'}.
                  </p>

                  <p className="indent-8 text-justify">
                    Tại thời điểm quan sát, phỏng vấn: {currentPreviewRecord.gioiTinh === 'Nam' ? 'ông' : 'bà'} {currentPreviewRecord.hoTen}{' '}
                    <span className="text-red-700 font-semibold">{currentPreviewRecord.ghiChu || 'có tình trạng bệnh lý bất thường'}</span>. Hội đồng xác định mức độ khuyết tật xã {config.xaName || 'Hàm Yên'} xác định dạng tật <strong className="font-bold">{currentPreviewRecord.dangTat || 'khác'}</strong>, {
                      currentPreviewRecord.mucDo === 'Nhẹ' 
                        ? <span className="text-amber-800 font-semibold">xác định mức độ khuyết tật nhẹ</span>
                        : <span className="text-purple-900 font-semibold">tuy nhiên không xác định được mức độ khuyết tật do vượt quá khả năng chuyên môn</span>
                    }.
                  </p>

                  <p className="indent-8 text-justify">
                    Ủy ban nhân dân xã {config.xaName || 'Hàm Yên'}, tỉnh {config.tinhName || 'Tuyên Quang'} giới thiệu tới Hội đồng giám định Y khoa tỉnh {config.tinhName || 'Tuyên Quang'} để khám, xác định và đánh giá mức độ khuyết tật đối với {currentPreviewRecord.gioiTinh === 'Nam' ? 'ông' : 'bà'} {currentPreviewRecord.hoTen}.
                  </p>

                  <p className="indent-8 text-justify">
                    Đề nghị Hội đồng giám định Y khoa tỉnh {config.tinhName || 'Tuyên Quang'} hết sức giúp đỡ để {currentPreviewRecord.gioiTinh === 'Nam' ? 'ông' : 'bà'} {currentPreviewRecord.hoTen.split(' ').slice(-2).join(' ')} có kết luận chính xác về xác định mức độ khuyết tật./.
                  </p>
                </div>

                {/* Sign-off Block */}
                <div className="grid grid-cols-2 gap-4 font-sans pt-6">
                  <div></div>
                  <div className="text-center space-y-16">
                    <div>
                      <div className="font-bold text-xs uppercase">KT. CHỦ TỊCH</div>
                      <div className="font-bold text-xs uppercase">PHÓ CHỦ TỊCH</div>
                    </div>
                    <div className="font-bold text-sm text-slate-900">
                      {config.chuTich || 'Nguyễn Hữu Hồng'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
              Vui lòng chọn một đối tượng từ danh sách bên trái để xem trước Giấy giới thiệu.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

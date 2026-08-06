import React, { useState } from 'react';
import { SubjectRecord, AdminConfig } from '../types';
import { generateBienBanDocx, generateMergedBienBanDocx, downloadBatchZip, isRecordUndetermined } from '../utils/docxGenerator';
import saveAs from 'file-saver';
import { sanitizeFilename } from '../utils/dateUtils';
import { FileText, Package, CheckCircle2, AlertTriangle, Users, Layers } from 'lucide-react';

interface Tab3CouncilMinutesProps {
  records: SubjectRecord[];
  config: AdminConfig;
}

export const Tab3CouncilMinutes: React.FC<Tab3CouncilMinutesProps> = ({ records, config }) => {
  const [exportMode, setExportMode] = useState<'single' | 'multi' | 'all'>('all');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(records[0]?.id || '');
  const [selectedMultiIds, setSelectedMultiIds] = useState<string[]>(records.map(r => r.id));
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  if (records.length === 0) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center text-amber-900 space-y-3">
        <AlertTriangle className="w-10 h-10 text-amber-600 mx-auto" />
        <h3 className="text-base font-bold">Vui lòng tải danh sách đối tượng tại TAB 1 trước</h3>
        <p className="text-xs text-amber-700">Chưa có dữ liệu để lập Biên Bản Họp Hội Đồng.</p>
      </div>
    );
  }

  const handleDownloadSingle = async () => {
    const subject = records.find(r => r.id === selectedSubjectId);
    if (!subject) return;

    setIsGenerating(true);
    try {
      const blob = await generateBienBanDocx(subject, config);
      const fname = `Bien_Ban_Hop_Hoi_Dong_${sanitizeFilename(subject.hoTen)}.docx`;
      saveAs(blob, fname);
      setStatusMsg(`Đã tạo và tải về thành công Biên bản họp cho ${subject.hoTen}!`);
    } catch (err: any) {
      console.error(err);
      setStatusMsg(`Lỗi khi tạo Biên bản: ${err?.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadMerged = async (subjectsToExport: SubjectRecord[], labelName: string) => {
    if (subjectsToExport.length === 0) return;

    setIsGenerating(true);
    try {
      const blob = await generateMergedBienBanDocx(subjectsToExport, config);
      const fname = `Bien_Ban_Hop_Ghep_Chung_${subjectsToExport.length}_Doi_Tuong_${config.xaName || 'Xa'}.docx`;
      saveAs(blob, fname);
      setStatusMsg(`Đã tạo thành công 01 FILE WORD CHUNG chứa toàn bộ ${subjectsToExport.length} Biên bản họp (${labelName})!`);
    } catch (err: any) {
      console.error(err);
      setStatusMsg(`Lỗi khi tạo File Word ghép chung: ${err?.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadZip = async (subjectsToExport: SubjectRecord[], zipName: string) => {
    if (subjectsToExport.length === 0) return;

    setIsGenerating(true);
    try {
      await downloadBatchZip(
        'bienban',
        subjectsToExport,
        config,
        zipName
      );
      setStatusMsg(`Đã nén và tải về thành công ZIP Biên bản cho ${subjectsToExport.length} đối tượng!`);
    } catch (err: any) {
      console.error(err);
      setStatusMsg(`Lỗi khi tạo ZIP: ${err?.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-white border border-red-200 border-l-4 border-l-red-700 rounded-xl p-5 shadow-sm flex items-start gap-4">
        <div className="bg-gradient-to-br from-red-700 to-red-900 text-white font-black text-xs px-3 py-1.5 rounded-lg border border-amber-400/50 shadow-sm shrink-0">
          TAB 3
        </div>
        <div>
          <h2 className="text-base font-bold text-red-900 uppercase">
            BIÊN BẢN HỌP HỘI ĐỒNG KẾT LUẬN DẠNG KHUYẾT TẬT VÀ MỨC ĐỘ KHUYẾT TẬT
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Tự động xuất Biên bản họp Hội đồng cấp Xã (Biên bản 03 bản chính có đầy đủ thành phần: Chủ tịch, Y tế, MTTQ, Văn hóa - Xã hội).
          </p>
        </div>
      </div>

      {statusMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-4 flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span className="font-semibold">{statusMsg}</span>
          </div>
          <button onClick={() => setStatusMsg(null)} className="text-emerald-700 font-bold hover:underline">Đóng</button>
        </div>
      )}

      {/* Council Members Info Box */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
          <div className="font-bold text-slate-800 flex items-center gap-2 text-sm text-red-800">
            <Users className="w-4 h-4 text-red-700" />
            <span>Thành phần Hội đồng tham gia ký biên bản (Cấu hình tại Tab 5):</span>
          </div>
          <div className="text-slate-700 font-medium bg-white border border-slate-200 px-3 py-1 rounded-lg">
            📍 <span className="font-bold text-slate-900">Địa điểm họp:</span> {config.diaDiemHop || 'Phòng 110, tầng 1, trụ sở Ủy ban nhân dân xã Hàm Yên'}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 font-medium text-slate-700">
          <div className="bg-white p-2.5 rounded-lg border border-slate-200">
            <span className="text-[10px] uppercase text-slate-400 font-bold block">Chủ tịch hội đồng</span>
            <span className="font-bold text-slate-900">{config.chuTich}</span>
          </div>
          <div className="bg-white p-2.5 rounded-lg border border-slate-200">
            <span className="text-[10px] uppercase text-slate-400 font-bold block">Trưởng trạm Y tế</span>
            <span className="font-bold text-slate-900">{config.yTe}</span>
          </div>
          <div className="bg-white p-2.5 rounded-lg border border-slate-200">
            <span className="text-[10px] uppercase text-slate-400 font-bold block">Đại diện UB MTTQ</span>
            <span className="font-bold text-slate-900">{config.mttq}</span>
          </div>
          <div className="bg-white p-2.5 rounded-lg border border-slate-200">
            <span className="text-[10px] uppercase text-slate-400 font-bold block">Công chức VH-XH (Người ghi)</span>
            <span className="font-bold text-slate-900">{config.nguoiLap}</span>
          </div>
        </div>
      </div>

      {/* Mode Selection Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
          <FileText className="w-5 h-5 text-red-700" />
          <h3 className="font-bold text-slate-800 text-base">Tùy chọn xuất Biên Bản Họp (File Word .docx)</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <label className={`border-2 rounded-xl p-4 cursor-pointer transition-all flex flex-col justify-between ${
            exportMode === 'all' ? 'border-red-700 bg-red-50/40 text-red-950 shadow-xs' : 'border-slate-200 hover:border-slate-300 bg-slate-50'
          }`}>
            <div className="flex items-start gap-3">
              <input
                type="radio"
                name="exportModeBb"
                checked={exportMode === 'all'}
                onChange={() => setExportMode('all')}
                className="mt-1 text-red-700 focus:ring-red-500"
              />
              <div>
                <span className="font-bold text-sm block">1️⃣ Xuất TOÀN BỘ ({records.length} đối tượng)</span>
                <span className="text-xs text-slate-600 mt-1 block">Xuất tất cả biên bản họp trong 01 file Word duy nhất hoặc file ZIP.</span>
              </div>
            </div>
          </label>

          <label className={`border-2 rounded-xl p-4 cursor-pointer transition-all flex flex-col justify-between ${
            exportMode === 'multi' ? 'border-red-700 bg-red-50/40 text-red-950 shadow-xs' : 'border-slate-200 hover:border-slate-300 bg-slate-50'
          }`}>
            <div className="flex items-start gap-3">
              <input
                type="radio"
                name="exportModeBb"
                checked={exportMode === 'multi'}
                onChange={() => setExportMode('multi')}
                className="mt-1 text-red-700 focus:ring-red-500"
              />
              <div>
                <span className="font-bold text-sm block">2️⃣ Chọn Nhóm Đối Tượng Cụ Thể</span>
                <span className="text-xs text-slate-600 mt-1 block">Tự tích chọn danh sách biên bản muốn gom chung vào file Word.</span>
              </div>
            </div>
          </label>

          <label className={`border-2 rounded-xl p-4 cursor-pointer transition-all flex flex-col justify-between ${
            exportMode === 'single' ? 'border-red-700 bg-red-50/40 text-red-950 shadow-xs' : 'border-slate-200 hover:border-slate-300 bg-slate-50'
          }`}>
            <div className="flex items-start gap-3">
              <input
                type="radio"
                name="exportModeBb"
                checked={exportMode === 'single'}
                onChange={() => setExportMode('single')}
                className="mt-1 text-red-700 focus:ring-red-500"
              />
              <div>
                <span className="font-bold text-sm block">3️⃣ Tải 01 Biên Bản Của 01 Người</span>
                <span className="text-xs text-slate-600 mt-1 block">Xuất biên bản họp riêng lẻ cho 01 người cụ thể.</span>
              </div>
            </div>
          </label>
        </div>

        {/* Dynamic Action Buttons */}
        <div className="pt-4 border-t border-slate-100 max-w-2xl">
          {exportMode === 'all' && (
            <div className="space-y-4">
              <div className="bg-red-50/60 border border-red-200 rounded-xl p-4 text-xs text-red-900 leading-relaxed">
                <span className="font-bold block mb-1">✨ Xuất tất cả {records.length} biên bản họp vào 1 file Word duy nhất:</span>
                Tất cả {records.length} biên bản họp sẽ được gom thành 1 file Word duy nhất (mỗi đối tượng 1 biên bản riêng biệt theo đúng mẫu ký).
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => handleDownloadMerged(records, 'Tất cả đối tượng')}
                  disabled={isGenerating}
                  className="py-3 px-4 bg-gradient-to-r from-red-700 to-red-800 hover:from-red-800 hover:to-red-900 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <Layers className="w-4 h-4" />
                  <span>{isGenerating ? 'Đang tạo File...' : `📄 Tải 1 FILE WORD CHUNG (${records.length} người)`}</span>
                </button>

                <button
                  onClick={() => handleDownloadZip(records, `Toan_Bo_Bien_Ban_Hop_Xa_${config.xaName || 'Xa'}.zip`)}
                  disabled={isGenerating}
                  className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm rounded-xl border border-slate-300 transition-all flex items-center justify-center gap-2"
                >
                  <Package className="w-4 h-4 text-slate-600" />
                  <span>📦 Tải File ZIP Tách Biệt</span>
                </button>
              </div>
            </div>
          )}

          {exportMode === 'multi' && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold uppercase text-slate-700">
                    Chọn các đối tượng xuất Biên bản họp (Đã chọn: {selectedMultiIds.length}/{records.length}):
                  </label>
                  <div className="space-x-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setSelectedMultiIds(records.map(r => r.id))}
                      className="text-red-700 font-bold hover:underline"
                    >
                      Chọn tất cả
                    </button>
                    <span>|</span>
                    <button
                      type="button"
                      onClick={() => setSelectedMultiIds([])}
                      className="text-slate-500 hover:underline"
                    >
                      Bỏ chọn hết
                    </button>
                  </div>
                </div>

                <div className="border border-slate-300 rounded-xl p-3 max-h-56 overflow-y-auto space-y-1 bg-slate-50">
                  {records.map((r, idx) => {
                    const isChecked = selectedMultiIds.includes(r.id);
                    return (
                      <label key={r.id} className="flex items-center gap-2.5 p-1.5 hover:bg-white rounded-lg cursor-pointer text-xs">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedMultiIds([...selectedMultiIds, r.id]);
                            else setSelectedMultiIds(selectedMultiIds.filter(id => id !== r.id));
                          }}
                          className="rounded text-red-700 focus:ring-red-500"
                        />
                        <span className="font-bold text-slate-800">{idx + 1}. {r.hoTen}</span>
                        <span className="text-slate-500">• GT: <strong className={r.gioiTinh === 'Nữ' ? 'text-pink-700' : 'text-blue-700'}>{r.gioiTinh}</strong> • Thôn {r.thon} ({r.dangTat})</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    const selected = records.filter(r => selectedMultiIds.includes(r.id));
                    handleDownloadMerged(selected, `${selected.length} người được chọn`);
                  }}
                  disabled={isGenerating || selectedMultiIds.length === 0}
                  className="py-3 px-4 bg-gradient-to-r from-red-700 to-red-800 hover:from-red-800 hover:to-red-900 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <Layers className="w-4 h-4" />
                  <span>{isGenerating ? 'Đang xuất file...' : `📄 Tải 1 FILE WORD CHUNG (${selectedMultiIds.length} người)`}</span>
                </button>

                <button
                  onClick={() => {
                    const selected = records.filter(r => selectedMultiIds.includes(r.id));
                    handleDownloadZip(selected, `Bien_Ban_Hop_${selected.length}_Doi_Tuong.zip`);
                  }}
                  disabled={isGenerating || selectedMultiIds.length === 0}
                  className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm rounded-xl border border-slate-300 transition-all flex items-center justify-center gap-2"
                >
                  <Package className="w-4 h-4 text-slate-600" />
                  <span>📦 Tải File ZIP Tách Biệt</span>
                </button>
              </div>
            </div>
          )}

          {exportMode === 'single' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Chọn cá nhân cần xuất Biên Bản Họp:</label>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-red-500 focus:outline-none"
                >
                  {records.map((r, idx) => (
                    <option key={r.id} value={r.id}>
                      {idx + 1}. {r.hoTen} ({r.gioiTinh}) | Thôn {r.thon} ({r.dangTat} - {r.mucDo})
                    </option>
                  ))}
                </select>
              </div>

              {/* Section 4 & Section 5/6 Preview Box */}
              {(() => {
                const sub = records.find(r => r.id === selectedSubjectId);
                if (!sub) return null;
                const isUndet = isRecordUndetermined(sub);
                const noteContent = sub.ghiChu ? sub.ghiChu.trim() : '';
                let yKienText = 'Thống nhất hoàn toàn với kết quả thu thập thông tin Phiếu xác định và đánh giá thực tế đối tượng.';
                if (noteContent) {
                  const formattedNote = noteContent.endsWith('.') ? noteContent : `${noteContent}.`;
                  yKienText = `Thống nhất hoàn toàn với kết quả thu thập thông tin Phiếu xác định và đánh giá thực tế đối tượng: ${formattedNote}`;
                }

                return (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-red-900 uppercase">Xem trước Phần 4 (Ý kiến các thành viên) & Phần 6 (Kết luận)</span>
                      {isUndet ? (
                        <span className="bg-purple-100 text-purple-900 text-[10px] font-bold px-2 py-0.5 rounded-full border border-purple-300">
                          Đánh giá: Không xác định được
                        </span>
                      ) : noteContent ? (
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          Đã tự động lấy cột Ghi chú
                        </span>
                      ) : (
                        <span className="bg-slate-200 text-slate-600 text-[10px] font-medium px-2 py-0.5 rounded-full">
                          Mặc định (Không có ghi chú)
                        </span>
                      )}
                    </div>
                    <p className="text-slate-800 italic bg-white p-3 rounded-lg border border-slate-200 leading-relaxed">
                      "{yKienText}"
                    </p>
                    <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                      <p className="font-bold text-slate-900">Kết quả biểu quyết (Mục 5) & Kết luận (Mục 6):</p>
                      {isUndet ? (
                        <div className="text-purple-900 bg-purple-50 p-2 rounded border border-purple-200 space-y-0.5">
                          <p>☑ <strong>4. Không đưa ra được kết luận về dạng khuyết tật, mức độ khuyết tật:</strong> 4/4 ý kiến (100%)</p>
                          <p className="text-[11px] text-purple-700">Chi tiết: {sub.ghiChu || 'Chưa đủ điều kiện kết luận.'}</p>
                        </div>
                      ) : (
                        <div className="text-slate-700 space-y-0.5">
                          <p>☑ <strong>Dạng khuyết tật:</strong> {sub.dangTat} (4/4 ý kiến - 100%)</p>
                          <p>☑ <strong>Mức độ khuyết tật:</strong> {sub.mucDo} (4/4 ý kiến - 100%)</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              <button
                onClick={handleDownloadSingle}
                disabled={isGenerating}
                className="w-full py-3 bg-gradient-to-r from-red-700 to-red-800 hover:from-red-800 hover:to-red-900 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-md flex items-center justify-center gap-2"
              >
                <FileText className="w-4 h-4" />
                <span>{isGenerating ? 'Đang tạo Biên bản họp...' : '📄 Tải File Biên Bản Word 01 Cá Nhân (.docx)'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


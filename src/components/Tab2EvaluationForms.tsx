import React, { useState } from 'react';
import { SubjectRecord, AdminConfig } from '../types';
import { generatePhieuDocx, generateMergedPhieuDocx, downloadBatchZip, isRecordUndetermined, getSec4SubItemStt, getScoresFor10Activities } from '../utils/docxGenerator';
import saveAs from 'file-saver';
import { sanitizeFilename } from '../utils/dateUtils';
import { FileCheck2, Package, FileText, CheckCircle2, AlertTriangle, Layers } from 'lucide-react';

interface Tab2EvaluationFormsProps {
  records: SubjectRecord[];
  config: AdminConfig;
}

export const Tab2EvaluationForms: React.FC<Tab2EvaluationFormsProps> = ({ records, config }) => {
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
        <p className="text-xs text-amber-700">Chưa có dữ liệu để kết xuất Phiếu Đánh Giá Khuyết Tật.</p>
      </div>
    );
  }

  const handleDownloadSingle = async () => {
    const subject = records.find(r => r.id === selectedSubjectId);
    if (!subject) return;

    setIsGenerating(true);
    try {
      const blob = await generatePhieuDocx(subject, config);
      const isUnder6 = subject.nhomTuoi === 'Dưới 6 tuổi';
      const fname = `${isUnder6 ? 'Phieu_XDKT_Duoi_6_Tuoi' : 'Phieu_XDKT_Tu_6_Tuoi'}_${sanitizeFilename(subject.hoTen)}.docx`;
      saveAs(blob, fname);
      setStatusMsg(`Đã tạo và tải về thành công Phiếu đánh giá cho ${subject.hoTen}!`);
    } catch (err: any) {
      console.error(err);
      setStatusMsg(`Lỗi khi tạo file Word: ${err?.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadMerged = async (subjectsToExport: SubjectRecord[], labelName: string) => {
    if (subjectsToExport.length === 0) return;

    setIsGenerating(true);
    try {
      const blob = await generateMergedPhieuDocx(subjectsToExport, config);
      const fname = `Phieu_Danh_Gia_Ghep_Chung_${subjectsToExport.length}_Doi_Tuong_${config.xaName || 'Xa'}.docx`;
      saveAs(blob, fname);
      setStatusMsg(`Đã tạo thành công 01 FILE WORD CHUNG chứa toàn bộ ${subjectsToExport.length} Phiếu Đánh Giá (${labelName})!`);
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
        'phieu',
        subjectsToExport,
        config,
        zipName
      );
      setStatusMsg(`Đã đóng gói và tải về thành công file ZIP từng phiếu riêng lẻ cho ${subjectsToExport.length} đối tượng!`);
    } catch (err: any) {
      console.error(err);
      setStatusMsg(`Lỗi khi tạo file ZIP: ${err?.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-white border border-red-200 border-l-4 border-l-red-700 rounded-xl p-5 shadow-sm flex items-start gap-4">
        <div className="bg-gradient-to-br from-red-700 to-red-900 text-white font-black text-xs px-3 py-1.5 rounded-lg border border-amber-400/50 shadow-sm shrink-0">
          TAB 2
        </div>
        <div>
          <h2 className="text-base font-bold text-red-900 uppercase">
            PHIẾU XÁC ĐỊNH MỨC ĐỘ KHUYẾT TẬT ĐỐI VỚI TRẺ EM DƯỚI 6 TUỔI & NGƯỜI TỪ ĐỦ 6 TUỔI TRỞ LÊN
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Tự động kết xuất Phiếu Mẫu 02 (trẻ em dưới 6 tuổi) hoặc Phiếu Mẫu 01 (người từ đủ 6 tuổi trở lên) chuẩn Thông tư 01/2019/TT-BLĐTBXH.
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

      {/* Mode Selection Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
          <FileCheck2 className="w-5 h-5 text-red-700" />
          <h3 className="font-bold text-slate-800 text-base">Tùy chọn xuất Phiếu Đánh Giá Khuyết Tật (File Word .docx)</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <label className={`border-2 rounded-xl p-4 cursor-pointer transition-all flex flex-col justify-between ${
            exportMode === 'all' ? 'border-red-700 bg-red-50/40 text-red-950 shadow-xs' : 'border-slate-200 hover:border-slate-300 bg-slate-50'
          }`}>
            <div className="flex items-start gap-3">
              <input
                type="radio"
                name="exportMode"
                checked={exportMode === 'all'}
                onChange={() => setExportMode('all')}
                className="mt-1 text-red-700 focus:ring-red-500"
              />
              <div>
                <span className="font-bold text-sm block">1️⃣ Xuất TOÀN BỘ ({records.length} đối tượng)</span>
                <span className="text-xs text-slate-600 mt-1 block">Xuất tất cả phiếu đánh giá trong 01 file Word duy nhất hoặc file ZIP.</span>
              </div>
            </div>
          </label>

          <label className={`border-2 rounded-xl p-4 cursor-pointer transition-all flex flex-col justify-between ${
            exportMode === 'multi' ? 'border-red-700 bg-red-50/40 text-red-950 shadow-xs' : 'border-slate-200 hover:border-slate-300 bg-slate-50'
          }`}>
            <div className="flex items-start gap-3">
              <input
                type="radio"
                name="exportMode"
                checked={exportMode === 'multi'}
                onChange={() => setExportMode('multi')}
                className="mt-1 text-red-700 focus:ring-red-500"
              />
              <div>
                <span className="font-bold text-sm block">2️⃣ Chọn Nhóm Đối Tượng Cụ Thể</span>
                <span className="text-xs text-slate-600 mt-1 block">Tự tích chọn danh sách các đối tượng muốn gom chung vào file Word.</span>
              </div>
            </div>
          </label>

          <label className={`border-2 rounded-xl p-4 cursor-pointer transition-all flex flex-col justify-between ${
            exportMode === 'single' ? 'border-red-700 bg-red-50/40 text-red-950 shadow-xs' : 'border-slate-200 hover:border-slate-300 bg-slate-50'
          }`}>
            <div className="flex items-start gap-3">
              <input
                type="radio"
                name="exportMode"
                checked={exportMode === 'single'}
                onChange={() => setExportMode('single')}
                className="mt-1 text-red-700 focus:ring-red-500"
              />
              <div>
                <span className="font-bold text-sm block">3️⃣ Tải 01 File Word Của 01 Người</span>
                <span className="text-xs text-slate-600 mt-1 block">Tải file riêng lẻ cho 01 người cụ thể trong danh sách.</span>
              </div>
            </div>
          </label>
        </div>

        {/* Dynamic Controls based on exportMode */}
        <div className="pt-4 border-t border-slate-100 max-w-2xl">
          {exportMode === 'all' && (
            <div className="space-y-4">
              <div className="bg-red-50/60 border border-red-200 rounded-xl p-4 text-xs text-red-900 leading-relaxed">
                <span className="font-bold block mb-1">✨ Xuất tất cả {records.length} phiếu vào 1 file Word duy nhất:</span>
                Tất cả {records.length} phiếu đánh giá sẽ được gom thành 1 file Word duy nhất (mỗi đối tượng nằm riêng 1 trang theo đúng chuẩn Thông tư 01/2019/TT-BLĐTBXH).
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
                  onClick={() => handleDownloadZip(records, `Toan_Bo_Phieu_Danh_Gia_Khuyet_Tat_${config.xaName || 'Xa'}.zip`)}
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
                    Chọn danh sách các cá nhân (Đã chọn: {selectedMultiIds.length}/{records.length}):
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
                        <span className="text-slate-500">• GT: <strong className={r.gioiTinh === 'Nữ' ? 'text-pink-700' : 'text-blue-700'}>{r.gioiTinh}</strong> • Thôn {r.thon} ({r.nhomTuoi})</span>
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
                    handleDownloadZip(selected, `Phieu_Danh_Gia_${selected.length}_Doi_Tuong.zip`);
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
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Chọn đối tượng cần xuất Phiếu Word:</label>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-red-500 focus:outline-none"
                >
                  {records.map((r, idx) => (
                    <option key={r.id} value={r.id}>
                      {idx + 1}. {r.hoTen} ({r.gioiTinh}) | NS: {r.ngaySinhFormat || r.ngaySinh} | Thôn {r.thon} ({r.nhomTuoi})
                    </option>
                  ))}
                </select>
              </div>

              {/* Part 2 Preview Table */}
              {(() => {
                const sub = records.find(r => r.id === selectedSubjectId);
                if (!sub) return null;
                const isUnder6 = sub.nhomTuoi === 'Dưới 6 tuổi';
                const activities = [
                  '1. Đi lại',
                  '2. Ăn, uống',
                  '3. Tiểu tiện, đại tiện',
                  '4. Vệ sinh cá nhân như đánh răng, rửa mặt, tắm rửa...',
                  '5. Mặc, cởi quần áo, giày dép',
                  '6. Nghe và hiểu người khác nói gì',
                  '7. Diễn đạt được ý muốn và suy nghĩ của bản thân qua lời nói',
                  '8. Làm các việc gia đình như gấp quần áo, quét nhà, rửa bát, nấu cơm...',
                  '9. Giao tiếp xã hội, hòa nhập cộng đồng phù hợp với độ tuổi',
                  '10. Đọc, viết, tính toán và kỹ năng học tập khác'
                ];

                const sec4SelStt = getSec4SubItemStt(sub.mucDo, sub.dangTat, sub.ghiChu, isUnder6);
                const isByFrame = sub.danhGiaTheoKhung === true || (sub.danhGiaTheoKhung !== false && Boolean(sec4SelStt));
                const { scores, totalScore } = getScoresFor10Activities(sub);
                const isUndet = isRecordUndetermined(sub);
                const showScoresInTable = !isUndet && !isByFrame;

                return (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <h4 className="text-xs font-bold text-red-900 uppercase">
                        Xem trước Bảng Điểm Phần 2 ({isUnder6 ? 'Mẫu 02 - Trẻ dưới 6T' : 'Mẫu 01 - Người từ 6T trở lên'})
                      </h4>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        isUndet
                          ? 'bg-purple-100 text-purple-900 border border-purple-300'
                          : isByFrame
                            ? 'bg-blue-100 text-blue-900 border border-blue-300'
                            : 'bg-amber-100 text-amber-900 border border-amber-300'
                      }`}>
                        {isUndet 
                          ? 'Trường hợp: Không xác định được' 
                          : isByFrame 
                            ? 'Trường hợp: Đánh giá theo khung (Không chấm điểm)' 
                            : `Tổng điểm: ${totalScore} điểm (${sub.mucDo})`}
                      </span>
                    </div>

                    {!isUnder6 ? (
                      <div className="overflow-x-auto border border-slate-200 rounded-lg bg-white shadow-2xs">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200">
                            <tr>
                              <th className="p-2 border-r border-slate-200 w-1/2">Mức độ thực hiện / Các hoạt động</th>
                              <th className="p-2 border-r border-slate-200 text-center w-1/8">Thực hiện được (0 điểm)</th>
                              <th className="p-2 border-r border-slate-200 text-center w-1/8">Cần trợ giúp (1 điểm)</th>
                              <th className="p-2 border-r border-slate-200 text-center w-1/8">Không thực hiện được (2 điểm)</th>
                              <th className="p-2 text-center w-1/8">Không xác định</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                            {activities.map((act, i) => {
                              const s = scores[i];
                              return (
                                <tr key={i} className="hover:bg-slate-50">
                                  <td className="p-2 border-r border-slate-200 text-slate-800 font-medium">{act}</td>
                                  <td className="p-2 border-r border-slate-200 text-center font-bold text-emerald-700">{showScoresInTable && s === 0 ? '0' : ''}</td>
                                  <td className="p-2 border-r border-slate-200 text-center font-bold text-amber-600">{showScoresInTable && s === 1 ? '1' : ''}</td>
                                  <td className="p-2 border-r border-slate-200 text-center font-bold text-red-600">{showScoresInTable && s === 2 ? '2' : ''}</td>
                                  <td className="p-2 text-center font-bold text-purple-700">{isUndet ? 'X' : ''}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 italic">Trẻ em dưới 6 tuổi đánh giá theo Mẫu 02 (Dựa trên 6 nhóm tiêu chí phát triển của trẻ em).</p>
                    )}
                  </div>
                );
              })()}

              <button
                onClick={handleDownloadSingle}
                disabled={isGenerating}
                className="w-full py-3 bg-gradient-to-r from-red-700 to-red-800 hover:from-red-800 hover:to-red-900 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                <FileText className="w-4 h-4" />
                <span>{isGenerating ? 'Đang tạo File Word...' : '📄 Tải File Word 01 Cá Nhân (.docx)'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


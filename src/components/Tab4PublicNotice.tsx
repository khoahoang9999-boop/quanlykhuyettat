import React, { useState } from 'react';
import { SubjectRecord, AdminConfig } from '../types';
import { generateThongBaoNiemYetDocx } from '../utils/docxGenerator';
import saveAs from 'file-saver';
import { Megaphone, Download, CheckCircle2, AlertTriangle, Eye, Calendar, MapPin } from 'lucide-react';

interface Tab4PublicNoticeProps {
  records: SubjectRecord[];
  config: AdminConfig;
}

export const Tab4PublicNotice: React.FC<Tab4PublicNoticeProps> = ({ records, config }) => {
  const [selectedIds, setSelectedIds] = useState<string[]>(records.map(r => r.id));
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  if (records.length === 0) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center text-amber-900 space-y-3">
        <AlertTriangle className="w-10 h-10 text-amber-600 mx-auto" />
        <h3 className="text-base font-bold">Vui lòng tải danh sách đối tượng tại TAB 1 trước</h3>
        <p className="text-xs text-amber-700">Chưa có dữ liệu để tạo Thông Báo Niêm Yết Kết Quả 15 Ngày.</p>
      </div>
    );
  }

  const handleDownloadNotice = async () => {
    const listToInclude = records.filter(r => selectedIds.includes(r.id));
    if (listToInclude.length === 0) return;

    setIsGenerating(true);
    try {
      const blob = await generateThongBaoNiemYetDocx(listToInclude, config);
      const fname = `Thong_Bao_Niem_Yet_Ket_Qua_15_Ngay_Xa_${config.xaName || 'Ham_Yen'}.docx`;
      saveAs(blob, fname);
      setStatusMsg(`Đã tạo thành công Thông Báo Niêm Yết Công Khai kèm Danh sách ${listToInclude.length} đối tượng!`);
    } catch (err: any) {
      console.error(err);
      setStatusMsg(`Lỗi khi tạo Thông báo: ${err?.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const selectedRecords = records.filter(r => selectedIds.includes(r.id));

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-white border border-red-200 border-l-4 border-l-red-700 rounded-xl p-5 shadow-sm flex items-start gap-4">
        <div className="bg-gradient-to-br from-red-700 to-red-900 text-white font-black text-xs px-3 py-1.5 rounded-lg border border-amber-400/50 shadow-sm shrink-0">
          TAB 4
        </div>
        <div>
          <h2 className="text-base font-bold text-red-900 uppercase">
            THÔNG BÁO NIÊM YẾT CÔNG KHAI KẾT QUẢ XÁC ĐỊNH MỨC ĐỘ KHUYẾT TẬT (15 NGÀY)
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Tự động xuất văn bản Thông báo niêm yết công khai kèm theo Bảng tổng hợp danh sách đối tượng định dạng A4 xoay ngang chuẩn Thông tư 01/2019/TT-BLĐTBXH & NĐ 28/2012/NĐ-CP.
          </p>
        </div>
      </div>

      {statusMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-4 flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>{statusMsg}</span>
          </div>
          <button onClick={() => setStatusMsg(null)} className="text-emerald-700 font-bold hover:underline">Đóng</button>
        </div>
      )}

      {/* Main Container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Config & Details preview */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
            <Megaphone className="w-5 h-5 text-red-700" />
            <h3 className="font-bold text-slate-800 text-sm">Thông Tin Niêm Yết Công Khai</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Số hiệu thông báo</span>
              <span className="font-bold text-slate-900 text-sm">{config.soThongBao}</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 block flex items-center gap-1">
                <MapPin className="w-3 h-3 text-red-700" /> Địa điểm niêm yết
              </span>
              <span className="font-medium text-slate-800">{config.diaDiemNiemYet}</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 block flex items-center gap-1">
                <Calendar className="w-3 h-3 text-red-700" /> Thời gian niêm yết
              </span>
              <span className="font-medium text-slate-800">{config.thoiGianNiemYet}</span>
            </div>

            <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200 text-amber-900">
              <span className="font-bold block text-[11px] mb-1">Căn cứ pháp lý áp dụng:</span>
              <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                <li>Nghị định số 28/2012/NĐ-CP</li>
                <li>Thông tư số 01/2019/TT-BLĐTBXH</li>
                <li>Thông tư số 19/2026/TT-BYT</li>
              </ul>
            </div>
          </div>

          <button
            onClick={handleDownloadNotice}
            disabled={isGenerating || selectedRecords.length === 0}
            className="w-full py-3 bg-gradient-to-r from-red-700 to-red-800 hover:from-red-800 hover:to-red-900 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-md flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>{isGenerating ? 'Đang tạo văn bản...' : `📢 Tải Văn Bản Thông Báo (.docx)`}</span>
          </button>
        </div>

        {/* Right Col: Selection & List Preview */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-red-700" />
              <h3 className="font-bold text-slate-800 text-sm">
                Danh Sách Niêm Yết Đính Kèm ({selectedRecords.length} / {records.length} người)
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedIds(records.map(r => r.id))}
                className="text-xs text-red-700 font-bold hover:underline"
              >
                Chọn tất cả
              </button>
              <span className="text-slate-300">|</span>
              <button
                onClick={() => setSelectedIds([])}
                className="text-xs text-slate-500 hover:underline"
              >
                Bỏ chọn
              </button>
            </div>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden max-h-[360px] overflow-y-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 text-slate-700 border-b border-slate-200 sticky top-0 uppercase font-bold text-[10.5px]">
                <tr>
                  <th className="p-2.5 w-10 text-center">Chọn</th>
                  <th className="p-2.5 w-10 text-center">STT</th>
                  <th className="p-2.5">Họ và tên</th>
                  <th className="p-2.5">Thôn</th>
                  <th className="p-2.5">Dạng tật</th>
                  <th className="p-2.5 text-center">Mức độ khuyết tật</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {records.map((r, idx) => {
                  const isChecked = selectedIds.includes(r.id);
                  return (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="p-2.5 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedIds([...selectedIds, r.id]);
                            else setSelectedIds(selectedIds.filter(id => id !== r.id));
                          }}
                          className="rounded text-red-700 focus:ring-red-500"
                        />
                      </td>
                      <td className="p-2.5 text-center font-bold text-slate-600">{idx + 1}</td>
                      <td className="p-2.5 font-bold text-slate-900">{r.hoTen}</td>
                      <td className="p-2.5">{r.thon}</td>
                      <td className="p-2.5 font-semibold text-slate-700">{r.dangTat}</td>
                      <td className="p-2.5 text-center font-bold">{r.mucDo}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

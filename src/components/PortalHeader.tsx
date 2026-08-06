import React from 'react';
import { AdminConfig } from '../types';
import { Landmark, FileSpreadsheet, Sparkles } from 'lucide-react';

interface PortalHeaderProps {
  config: AdminConfig;
  totalRecords: number;
  under6Count: number;
  over6Count: number;
}

export const PortalHeader: React.FC<PortalHeaderProps> = ({
  config,
  totalRecords,
  under6Count,
  over6Count
}) => {
  const xaDisplay = (config.xaName || 'HÀM YÊN').toUpperCase();
  const tinhDisplay = (config.tinhName || 'TUYÊN QUANG').toUpperCase();

  return (
    <header className="fixed top-0 left-0 right-0 h-[76px] bg-gradient-to-r from-red-900 via-red-800 to-red-950 text-white border-b border-amber-400/30 px-6 z-[99999] flex items-center justify-between shadow-lg">
      <div className="flex items-center gap-4">
        <div className="relative w-13 h-13 rounded-full p-0.5 bg-gradient-to-tr from-amber-400 via-amber-200 to-amber-500 shadow-md flex-shrink-0">
          <img 
            src="/app-logo.svg" 
            alt="App Logo" 
            className="w-12 h-12 rounded-full object-cover shadow-inner bg-red-900"
            referrerPolicy="no-referrer"
          />
        </div>
        <div>
          <div className="text-[11px] font-bold text-amber-300 tracking-wider uppercase flex items-center gap-2">
            <span>🏛️ UBND XÃ {xaDisplay} • TỈNH {tinhDisplay}</span>
          </div>
          <h1 className="text-lg md:text-xl font-black text-white tracking-wide uppercase drop-shadow-sm">
            HỆ THỐNG QUẢN LÝ & XUẤT HỒ SƠ XÁC ĐỊNH MỨC ĐỘ KHUYẾT TẬT
          </h1>
        </div>
      </div>

      <div className="hidden lg:flex items-center gap-3">
        <div className="bg-amber-400/10 border border-amber-400/30 rounded-lg px-3.5 py-1.5 text-right">
          <div className="text-[10px] uppercase font-bold text-amber-300 tracking-wider">Tổng Hồ Sơ Phân Loại</div>
          <div className="text-sm font-bold text-white flex items-center gap-2 justify-end">
            <span>{totalRecords} đối tượng</span>
            <span className="text-xs font-normal text-amber-200/80">({under6Count} trẻ &lt;6t | {over6Count} người ≥6t)</span>
          </div>
        </div>
      </div>
    </header>
  );
};

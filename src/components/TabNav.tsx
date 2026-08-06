import React from 'react';
import { 
  FileSpreadsheet, 
  FileCheck2, 
  FileText, 
  Megaphone, 
  FileBadge,
  Settings
} from 'lucide-react';

export type TabKey = 'tab1' | 'tab2' | 'tab3' | 'tab4' | 'tab5' | 'tab6';

interface TabNavProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  recordCount: number;
}

export const TabNav: React.FC<TabNavProps> = ({ activeTab, onTabChange, recordCount }) => {
  const tabs = [
    {
      id: 'tab1' as TabKey,
      label: 'TAB 1: Biểu Xác Định & Danh Sách',
      icon: FileSpreadsheet,
      badge: recordCount > 0 ? recordCount : undefined
    },
    {
      id: 'tab2' as TabKey,
      label: 'TAB 2: Phiếu Đánh Giá Khuyết Tật',
      icon: FileCheck2
    },
    {
      id: 'tab3' as TabKey,
      label: 'TAB 3: Biên Bản Họp Hội Đồng',
      icon: FileText
    },
    {
      id: 'tab4' as TabKey,
      label: 'TAB 4: Thông Báo Niêm Yết Kết Quả',
      icon: Megaphone
    },
    {
      id: 'tab5' as TabKey,
      label: 'TAB 5: Giấy Giới Thiệu',
      icon: FileBadge
    },
    {
      id: 'tab6' as TabKey,
      label: 'TAB 6: Cấu Hình Hành Chính',
      icon: Settings
    }
  ];

  return (
    <div className="fixed top-[76px] left-0 right-0 h-[52px] bg-white border-b-2 border-slate-200 z-[99998] shadow-sm flex items-end px-4 md:px-8 gap-1.5 overflow-x-auto">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs md:text-sm rounded-t-lg transition-all whitespace-nowrap border-t border-x ${
              isActive
                ? 'bg-white border-slate-200 border-b-2 border-b-red-700 text-red-700 shadow-sm font-extrabold -mb-[2px]'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-red-50 hover:text-red-700'
            }`}
          >
            <Icon className={`w-4 h-4 ${isActive ? 'text-red-700' : 'text-slate-500'}`} />
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span className="ml-1 bg-red-100 text-red-800 text-[11px] font-bold px-1.5 py-0.5 rounded-full">
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

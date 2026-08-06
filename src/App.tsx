import React, { useState } from 'react';
import { SubjectRecord, AdminConfig } from './types';
import { initialSampleData, defaultAdminConfig } from './data/sampleData';
import { processSubjectAge } from './utils/dateUtils';
import { PortalHeader } from './components/PortalHeader';
import { TabNav, TabKey } from './components/TabNav';
import { Tab1ExcelList } from './components/Tab1ExcelList';
import { Tab2EvaluationForms } from './components/Tab2EvaluationForms';
import { Tab3CouncilMinutes } from './components/Tab3CouncilMinutes';
import { Tab4PublicNotice } from './components/Tab4PublicNotice';
import { Tab5GiayGioiThieu } from './components/Tab5GiayGioiThieu';
import { Tab5AdminConfig } from './components/Tab5AdminConfig';
import { SubjectModal } from './components/SubjectModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('tab1');
  const [config, setConfig] = useState<AdminConfig>(defaultAdminConfig);
  const [records, setRecords] = useState<SubjectRecord[]>(initialSampleData);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<SubjectRecord | null>(null);

  const handleOpenSubjectModal = (subject?: SubjectRecord) => {
    setEditingSubject(subject || null);
    setIsModalOpen(true);
  };

  const handleSaveSubject = (savedRecord: SubjectRecord) => {
    const processed = processSubjectAge(savedRecord, config.ngayHop);
    if (editingSubject) {
      setRecords(records.map(r => r.id === processed.id ? processed : r));
    } else {
      setRecords([...records, { ...processed, stt: records.length + 1 }]);
    }
  };

  const processedRecords = records.map(r => processSubjectAge(r, config.ngayHop));
  const under6Count = processedRecords.filter(r => r.nhomTuoi === 'Dưới 6 tuổi').length;
  const over6Count = processedRecords.filter(r => r.nhomTuoi === 'Từ 6 tuổi trở lên').length;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans selection:bg-red-200 selection:text-red-900">
      {/* Top Fixed Portal Header */}
      <PortalHeader
        config={config}
        totalRecords={processedRecords.length}
        under6Count={under6Count}
        over6Count={over6Count}
      />

      {/* Top Fixed Tab Navigation Bar */}
      <TabNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        recordCount={processedRecords.length}
      />

      {/* Main Content Area */}
      <main className="pt-[140px] pb-12 px-4 md:px-8 max-w-[1600px] mx-auto">
        {activeTab === 'tab1' && (
          <Tab1ExcelList
            records={processedRecords}
            onUpdateRecords={setRecords}
            config={config}
            onUpdateConfig={setConfig}
            onOpenSubjectModal={handleOpenSubjectModal}
          />
        )}

        {activeTab === 'tab2' && (
          <Tab2EvaluationForms
            records={processedRecords}
            config={config}
          />
        )}

        {activeTab === 'tab3' && (
          <Tab3CouncilMinutes
            records={processedRecords}
            config={config}
          />
        )}

        {activeTab === 'tab4' && (
          <Tab4PublicNotice
            records={processedRecords}
            config={config}
          />
        )}

        {activeTab === 'tab5' && (
          <Tab5GiayGioiThieu
            records={processedRecords}
            config={config}
            onUpdateConfig={setConfig}
          />
        )}

        {activeTab === 'tab6' && (
          <Tab5AdminConfig
            config={config}
            onUpdateConfig={setConfig}
          />
        )}
      </main>

      {/* Add / Edit Modal */}
      <SubjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveSubject}
        subject={editingSubject}
      />
    </div>
  );
}

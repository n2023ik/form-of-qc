import React, { useMemo, useState } from 'react';
import { 
  ShieldCheck, 
  Smartphone, 
  User, 
  Calendar, 
  Clock, 
  Bluetooth, 
  MapPin, 
  Lock, 
  Unlock, 
  Key, 
  Battery, 
  CheckCircle2, 
  XCircle,
  ClipboardCheck,
  Package,
  AlertTriangle,
  Activity,
  FileText,
  Zap,
  Scissors,
  ShieldAlert,
  Monitor,
  type LucideIcon
} from 'lucide-react';

type TabKey = 'pre' | 'post';
type CheckValue = boolean | null;
type CommonField = 'deviceId' | 'inspectorName' | 'version' | 'date' | 'time';

type InspectionTabState = {
  checks: Record<string, CheckValue>;
  remarks: string;
  rejectionReason: string;
};

type FormState = {
  common: Record<CommonField, string>;
  pre: InspectionTabState;
  post: InspectionTabState;
};

type CheckItemProps = {
  field: string;
  label?: string;
  icon: LucideIcon;
};

type SubmitState = 'idle' | 'saving' | 'submitted' | 'error';

const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3001';
const VERSION_OPTIONS = ['3XP', '5XP', 'PHYSICAL'] as const;

const App = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('pre');
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [submitMessage, setSubmitMessage] = useState('');
  const [formData, setFormData] = useState<FormState>({
    common: {
      deviceId: '',
      inspectorName: '',
      version: '',
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
    },
    pre: {
      checks: {
        bluetooth: null,
        gps: null,
        lock: null,
        unlock: null,
        passcode: null,
        battery: null,
        shackleCondition: null, // Mechanical Shackle
        shackleBand: null,
        shackleCut: null,
        glassBroken: null,
        tampered: null,
      },
      remarks: '',
      rejectionReason: '',
    },
    post: {
      checks: {
        bluetooth: null,
        gps: null,
        lock: null,
        unlock: null,
        passcode: null,
        battery: null,
        finalPackaging: null,
      },
      remarks: '',
      rejectionReason: '',
    }
  });

  const currentTabState = formData[activeTab];
  const tabs: TabKey[] = ['pre', 'post'];
  const commonFields: Array<{ label: string; icon: LucideIcon; field: CommonField }> = [
    { label: 'Device ID', icon: Smartphone, field: 'deviceId' },
    { label: 'Inspector', icon: User, field: 'inspectorName' },
    { label: 'Version', icon: Package, field: 'version' },
    { label: 'Date', icon: Calendar, field: 'date' },
    { label: 'Time', icon: Clock, field: 'time' },
  ];

  const progress = useMemo(() => {
    const checks = currentTabState.checks;
    const total = Object.keys(checks).length;
    const completed = Object.values(checks).filter(v => v !== null).length;
    return Math.round((completed / total) * 100);
  }, [currentTabState]);

  const isRejected = useMemo(() => {
    return Object.values(currentTabState.checks).some(v => v === false);
  }, [currentTabState]);

  const buildSheetPayload = () => {
    const checkEntries = Object.entries(currentTabState.checks).map(([field, value]) => [
      `${activeTab}_${field}`,
      value === null ? '' : value ? 'PASS' : 'FAIL',
    ]);

    return {
      submittedAt: new Date().toISOString(),
      inspectionType: activeTab.toUpperCase(),
      deviceId: formData.common.deviceId,
      inspectorName: formData.common.inspectorName,
      version: formData.common.version,
      date: formData.common.date,
      time: formData.common.time,
      remarks: currentTabState.remarks,
      rejectionReason: currentTabState.rejectionReason,
      progress: `${progress}%`,
      result: isRejected ? 'FAIL' : progress === 100 ? 'PASS' : 'PENDING',
      ...Object.fromEntries(checkEntries),
    };
  };

  const handleSubmit = async () => {
    if (!API_URL) {
      setSubmitState('error');
      setSubmitMessage('Set VITE_API_URL to connect this form to the Google Sheets API.');
      return;
    }

    setSubmitState('saving');
    setSubmitMessage('Sending row to Google Sheets...');

    try {
      const submitUrl = API_URL.replace(/\/$/, '');
      await fetch(submitUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(buildSheetPayload()),
      });

      setSubmitState('submitted');
      setSubmitMessage('Sent to Google Sheets.');
    } catch (error) {
      setSubmitState('error');
      setSubmitMessage(error instanceof Error ? error.message : 'Failed to send to Google Sheets.');
    }
  };

  const handleCheck = (field: string, value: CheckValue) => {
    setFormData(prev => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        checks: { ...prev[activeTab].checks, [field]: value }
      }
    }));
  };

  const CheckItem = ({ field, label, icon: Icon }: CheckItemProps) => {
    const value = currentTabState.checks[field];
    return (
      <div className={`group flex items-center justify-between p-4 rounded-2xl border-2 transition-all duration-300 ${
        value === true ? 'bg-emerald-50 border-emerald-500 shadow-sm' : 
        value === false ? 'bg-rose-50 border-rose-500 shadow-sm' : 
        'bg-white border-slate-100 hover:border-blue-200'
      }`}>
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-xl transition-all ${
            value === true ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' : 
            value === false ? 'bg-rose-500 text-white shadow-lg shadow-rose-200' : 
            'bg-slate-50 text-slate-400 group-hover:text-blue-500 group-hover:bg-blue-50'
          }`}>
            <Icon size={20} />
          </div>
          <span className={`font-bold tracking-tight text-sm md:text-base ${value !== null ? 'text-slate-800' : 'text-slate-500'}`}>
            {label || field.charAt(0).toUpperCase() + field.slice(1)}
          </span>
        </div>
        
        <div className="flex gap-1.5 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => handleCheck(field, true)}
            className={`px-5 py-2 rounded-lg text-[10px] font-black tracking-widest transition-all ${
              value === true ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            PASS
          </button>
          <button
            onClick={() => handleCheck(field, false)}
            className={`px-5 py-2 rounded-lg text-[10px] font-black tracking-widest transition-all ${
              value === false ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            FAIL
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-slate-900 font-sans p-4 md:p-10">
      <div className="max-w-5xl mx-auto">
        
        <header className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
          <div className="flex items-center gap-4">
            <div className="bg-slate-900 p-3 rounded-2xl shadow-xl shadow-slate-200">
              <ShieldCheck className="text-white" size={32} />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tighter text-slate-900 uppercase">Verification Hub</h1>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">QC Inspection Terminal</p>
              </div>
            </div>
          </div>

          <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-inner">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-10 py-3 rounded-xl text-xs font-black tracking-widest transition-all ${
                  activeTab === tab ? 'bg-white text-slate-900 shadow-lg' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {tab.toUpperCase()} QC
              </button>
            ))}
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Main Inspection Grid */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* Meta Data */}
            <section className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm grid grid-cols-2 md:grid-cols-4 gap-4">
               {commonFields.map((item) => (
                 <div key={item.field} className="space-y-1">
                   <p className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-1">
                     <item.icon size={10} /> {item.label}
                   </p>
                    {item.field === 'version' ? (
                      <select
                        className="w-full bg-transparent border-b border-slate-100 py-1 text-sm font-bold focus:outline-none focus:border-blue-500 transition-all"
                        value={formData.common.version}
                        onChange={(e) => setFormData(p => ({...p, common: {...p.common, version: e.target.value}}))}
                      >
                        <option value="" disabled>Select version</option>
                        {VERSION_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input 
                        className="w-full bg-transparent border-b border-slate-100 py-1 text-sm font-bold focus:outline-none focus:border-blue-500 transition-all"
                        value={formData.common[item.field]}
                        onChange={(e) => setFormData(p => ({...p, common: {...p.common, [item.field]: e.target.value}}))}
                      />
                    )}
                 </div>
               ))}
            </section>

            {/* Pass/Fail Matrix */}
            <section className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Activity size={14} /> Check Matrix
                </h2>
                <span className="text-xs font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                  {progress}% COMPLETE
                </span>
              </div>
              
              <div className="grid grid-cols-1 gap-3">
                <CheckItem field="bluetooth" icon={Bluetooth} />
                <CheckItem field="gps" label="GPS Connectivity" icon={MapPin} />
                <CheckItem field="lock" icon={Lock} />
                <CheckItem field="unlock" icon={Unlock} />
                <CheckItem field="passcode" label="Security Key" icon={Key} />
                <CheckItem field="battery" label="Battery Integrity" icon={Battery} />
                
                {activeTab === 'pre' ? (
                  <>
                    <CheckItem field="shackleCondition" label="Mechanical Shackle" icon={Zap} />
                    <CheckItem field="shackleBand" label="Shackle Band" icon={Activity} />
                    <CheckItem field="shackleCut" label="Shackle Cut" icon={Scissors} />
                    <CheckItem field="glassBroken" label="Glass Broken" icon={Monitor} />
                    <CheckItem field="tampered" label="Tampered" icon={ShieldAlert} />
                  </>
                ) : (
                  <CheckItem field="finalPackaging" label="Packaging QC" icon={Package} />
                )}
              </div>
            </section>
          </div>

          {/* Result Column */}
          <div className="lg:col-span-5">
            <div className="sticky top-10 space-y-6">
              
              <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-6">
                <div className="flex items-center gap-2 mb-2">
                   <FileText size={18} className="text-slate-400" />
                   <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider">Inspector Comments</h3>
                </div>
                
                <textarea 
                  rows={4}
                  placeholder="Notes on unit condition..."
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-semibold focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:outline-none transition-all"
                  value={formData[activeTab].remarks}
                  onChange={(e) => setFormData(p => ({...p, [activeTab]: {...p[activeTab], remarks: e.target.value}}))}
                />

                {isRejected && (
                  <div className="animate-in slide-in-from-top-2 duration-300">
                    <label className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em] mb-2 block ml-1 flex items-center gap-2">
                      <AlertTriangle size={12} /> Failure Report Required
                    </label>
                    <textarea 
                      rows={2}
                      placeholder="Why did this unit fail?"
                      className="w-full bg-rose-50 border-2 border-rose-100 rounded-2xl px-5 py-4 text-sm font-bold text-rose-900 placeholder-rose-200 focus:outline-none"
                      value={formData[activeTab].rejectionReason}
                      onChange={(e) => setFormData(p => ({...p, [activeTab]: {...p[activeTab], rejectionReason: e.target.value}}))}
                    />
                  </div>
                )}
              </div>

              {/* Status Display */}
              <div className={`rounded-[2.5rem] p-10 transition-all duration-700 relative overflow-hidden shadow-2xl ${
                isRejected ? 'bg-rose-600' : progress === 100 ? 'bg-emerald-600' : 'bg-slate-900'
              }`}>
                <div className="absolute -top-20 -right-20 w-60 h-60 bg-white/10 rounded-full blur-[80px]" />
                
                <div className="relative z-10 text-center space-y-8">
                  <div className="flex justify-center">
                    {isRejected ? (
                      <XCircle size={64} className="text-white" />
                    ) : progress === 100 ? (
                      <CheckCircle2 size={64} className="text-white" />
                    ) : (
                      <div className="w-16 h-16 rounded-full border-4 border-white/10 border-t-white animate-spin" />
                    )}
                  </div>

                  <div>
                    <h2 className="text-3xl font-black text-white tracking-tighter leading-none mb-2 uppercase">
                      {isRejected ? 'FAIL' : progress === 100 ? 'PASS' : 'Pending'}
                    </h2>
                    <p className="text-white/60 text-[10px] font-bold tracking-[0.3em] uppercase">
                      {isRejected ? 'Unit Rejected' : progress === 100 ? 'Unit Validated' : 'Inspection Incomplete'}
                    </p>
                  </div>

                  <button 
                    disabled={progress < 100}
                    className={`w-full py-5 rounded-2xl font-black text-xs tracking-[0.2em] transition-all transform active:scale-95 ${
                      progress < 100 
                      ? 'bg-white/10 text-white/30 cursor-not-allowed border border-white/10' 
                      : 'bg-white text-slate-900 shadow-xl hover:-translate-y-1'
                    }`}
                    onClick={handleSubmit}
                  >
                    {submitState === 'saving' ? 'SAVING REPORT...' : submitState === 'submitted' ? 'SUBMITTED ✓' : 'SUBMIT INSPECTION'}
                  </button>
                  {submitMessage && (
                    <p className={`text-[11px] font-bold tracking-wide ${submitState === 'error' ? 'text-rose-200' : 'text-white/70'}`}>
                      {submitMessage}
                    </p>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
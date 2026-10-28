import React, { useState } from 'react';
import { useQueue } from '../context/QueueContext';
import {
  Hospital as HospitalIcon,
  Smartphone,
  Printer,
  Stethoscope,
  Tv,
  Bell,
  Volume2,
  VolumeX,
  Languages,
  RotateCcw,
  Activity,
  CheckCircle2,
  MessageSquare,
} from 'lucide-react';
import { announcer } from '../utils/audioAnnouncer';

interface NavbarProps {
  currentTab: 'patient' | 'desk' | 'room' | 'display' | 'analytics';
  onSelectTab: (tab: 'patient' | 'desk' | 'room' | 'display' | 'analytics') => void;
  onOpenNotifications: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onSelectTab, onOpenNotifications }) => {
  const {
    hospitals,
    selectedHospitalId,
    setSelectedHospitalId,
    language,
    setLanguage,
    soundEnabled,
    setSoundEnabled,
    voiceEnabled,
    setVoiceEnabled,
    notifications,
    clearAllData,
  } = useQueue();

  const [testingChime, setTestingChime] = useState(false);
  const activeHospital = hospitals.find((h) => h.id === selectedHospitalId) || hospitals[0];

  const handleTestChime = async () => {
    setTestingChime(true);
    await announcer.playHospitalChime();
    setTimeout(() => setTestingChime(false), 800);
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs no-print">
      {/* Top Banner / Gov Bar */}
      <div className="bg-slate-900 text-slate-300 text-[11px] py-1 px-4 sm:px-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="font-medium text-white">Directorate of Health Services • Government of Jammu & Kashmir</span>
          <span className="hidden md:inline text-slate-400">| National Digital Health Mission (ABHA Compliant)</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-slate-300 font-mono hidden sm:inline">OPD Hours: {activeHospital.opdTimings}</span>
          <button
            onClick={() => setLanguage(language === 'EN' ? 'BILINGUAL' : 'EN')}
            className="flex items-center gap-1 text-slate-200 hover:text-white cursor-pointer transition-colors"
            title="Toggle Urdu/Kashmiri Transliteration"
          >
            <Languages className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-semibold">{language === 'BILINGUAL' ? 'اردو / English' : 'English Only'}</span>
          </button>
        </div>
      </div>

      {/* Main Nav Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Hospital Selector */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-linear-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-sm ring-2 ring-emerald-500/20">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-extrabold text-lg text-slate-900 tracking-tight leading-none">
                    Sehat<span className="text-emerald-600">Queue</span>
                  </h1>
                  {language === 'BILINGUAL' && (
                    <span className="text-xs text-slate-500 font-arabic font-semibold">صحت کیو</span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 font-medium leading-tight mt-0.5">
                  OPD Ticketing & Live Queue Management
                </p>
              </div>
            </div>

            {/* Hospital Picker */}
            <div className="hidden lg:flex items-center ml-4 pl-4 border-l border-slate-200">
              <HospitalIcon className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
              <select
                aria-label="Select Hospital"
                value={selectedHospitalId}
                onChange={(e) => setSelectedHospitalId(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg py-1 px-2.5 text-xs font-semibold text-slate-800 hover:border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                {hospitals.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name} ({h.district})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Navigation Views Tabs */}
          <nav className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto py-1">
            <button
              onClick={() => onSelectTab('patient')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                currentTab === 'patient'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Patient Booking</span>
            </button>

            <button
              onClick={() => onSelectTab('desk')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                currentTab === 'desk'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Walk-in Desk</span>
            </button>

            <button
              onClick={() => onSelectTab('room')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                currentTab === 'room'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Stethoscope className="w-3.5 h-3.5" />
              <span>Doctor Console</span>
            </button>

            <button
              onClick={() => onSelectTab('display')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                currentTab === 'display'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Tv className="w-3.5 h-3.5" />
              <span>Hall TV Display</span>
            </button>
          </nav>

          {/* Action Tools */}
          <div className="flex items-center gap-2">
            {/* Chime and Sound controls */}
            <div className="hidden sm:flex items-center gap-1 bg-slate-100 rounded-lg p-1 border border-slate-200">
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`p-1.5 rounded-md text-xs font-medium cursor-pointer transition-colors ${
                  soundEnabled ? 'text-emerald-700 bg-white shadow-xs' : 'text-slate-400'
                }`}
                title={soundEnabled ? 'Hospital Chime Enabled' : 'Chime Muted'}
              >
                {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={handleTestChime}
                disabled={testingChime || !soundEnabled}
                className="px-2 py-1 text-[11px] font-semibold text-slate-700 hover:text-emerald-700 hover:bg-white rounded-md cursor-pointer disabled:opacity-40 transition-colors"
                title="Preview Hospital Ding-Dong Chime"
              >
                {testingChime ? 'Chiming...' : 'Bell Test'}
              </button>
            </div>

            {/* Notification / SMS Log trigger */}
            <button
              onClick={onOpenNotifications}
              className="relative p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer border border-slate-200 bg-white"
              title="Low-Bandwidth SMS / WhatsApp Notification Simulator"
            >
              <MessageSquare className="w-4 h-4" />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {notifications.length > 9 ? '9+' : notifications.length}
                </span>
              )}
            </button>

            {/* Reset / Reseed Demo Data */}
            <button
              onClick={() => {
                if (window.confirm('Reset queue & load demo tokens for Kashmir hospitals?')) {
                  clearAllData();
                }
              }}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              title="Reset Demo Data"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

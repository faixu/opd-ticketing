/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { QueueProvider } from './context/QueueContext';
import { Navbar } from './components/Navbar';
import { PatientBookingView } from './components/PatientBookingView';
import { ReceptionDeskView } from './components/ReceptionDeskView';
import { DoctorConsoleView } from './components/DoctorConsoleView';
import { WaitingHallDisplayView } from './components/WaitingHallDisplayView';
import { AnalyticsView } from './components/AnalyticsView';
import { NotificationSimulatorModal } from './components/NotificationSimulatorModal';
import { ShieldCheck, PhoneCall, HeartHandshake } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'patient' | 'desk' | 'room' | 'display' | 'analytics'>('patient');
  const [isNotifOpen, setIsNotifOpen] = useState<boolean>(false);

  return (
    <QueueProvider>
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-emerald-100 selection:text-emerald-900">
        {/* Navigation Bar */}
        <Navbar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          onOpenNotifications={() => setIsNotifOpen(true)}
        />

        {/* Main View Body */}
        <main className="flex-1 pb-12">
          {currentTab === 'patient' && <PatientBookingView />}
          {currentTab === 'desk' && <ReceptionDeskView />}
          {currentTab === 'room' && <DoctorConsoleView />}
          {currentTab === 'display' && <WaitingHallDisplayView />}
          {currentTab === 'analytics' && <AnalyticsView />}
        </main>

        {/* Low-Bandwidth SMS / WhatsApp Notification Simulator Modal */}
        <NotificationSimulatorModal
          isOpen={isNotifOpen}
          onClose={() => setIsNotifOpen(false)}
        />

        {/* Footer (Hidden on print & Hall TV Display) */}
        {currentTab !== 'display' && (
          <footer className="bg-white border-t border-slate-200 py-6 text-xs text-slate-500 no-print">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 font-bold text-slate-800">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>SehatQueue J&K OPD Network</span>
                </div>
                <span>•</span>
                <span>ABHA & Ayushman Bharat Aligned</span>
              </div>

              <div className="flex items-center gap-4 text-[11px]">
                <div className="flex items-center gap-1.5 text-slate-600">
                  <PhoneCall className="w-3.5 h-3.5 text-red-500" />
                  <span>Emergency Ambulance: <strong>108 / 102</strong></span>
                </div>
                <button
                  onClick={() => setCurrentTab('analytics')}
                  className="hover:text-emerald-600 font-medium cursor-pointer"
                >
                  OPD Stats & Load
                </button>
              </div>
            </div>
          </footer>
        )}
      </div>
    </QueueProvider>
  );
}

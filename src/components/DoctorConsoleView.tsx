import React, { useState, useMemo } from 'react';
import { useQueue, getTodayDateString } from '../context/QueueContext';
import { Ticket } from '../types';
import { announcer } from '../utils/audioAnnouncer';
import {
  Stethoscope,
  Volume2,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  UserCheck,
  Clock,
  ArrowRight,
  Phone,
  Megaphone,
  UserX,
  History,
  Sparkles,
} from 'lucide-react';
import { formatTokenNumber } from '../utils/queueLogic';

export const DoctorConsoleView: React.FC = () => {
  const {
    hospitals,
    departments,
    doctors,
    selectedHospitalId,
    language,
    advanceDoctorQueue,
    getCounter,
    getTicketsForDepartment,
    soundEnabled,
  } = useQueue();

  const todayStr = getTodayDateString();

  // Filter depts for selected hospital
  const hospitalDepts = useMemo(
    () => departments.filter((d) => d.hospitalId === selectedHospitalId),
    [departments, selectedHospitalId]
  );

  const [activeDeptId, setActiveDeptId] = useState<string>(
    hospitalDepts[0]?.id || 'smhs-med'
  );

  const activeDept = useMemo(
    () => hospitalDepts.find((d) => d.id === activeDeptId) || hospitalDepts[0] || departments[0],
    [hospitalDepts, activeDeptId, departments]
  );

  const activeDoctor = useMemo(
    () => doctors.find((doc) => doc.departmentId === activeDept.id) || doctors[0],
    [doctors, activeDept]
  );

  // Counter and tickets for active department
  const counter = getCounter(selectedHospitalId, activeDept.id, todayStr);
  const deptTickets = getTicketsForDepartment(activeDept.id, todayStr);

  // Current patient inside room
  const currentServingTicket = useMemo(() => {
    return deptTickets.find(
      (t) => t.waitingNumber === counter.currentServing && t.status === 'IN_PROGRESS'
    ) || deptTickets.find((t) => t.waitingNumber === counter.currentServing);
  }, [deptTickets, counter.currentServing]);

  // Next waiting tickets (waitingNumber > currentServing and status is WAITING)
  const waitingTickets = useMemo(() => {
    return deptTickets
      .filter((t) => t.status === 'WAITING' && t.waitingNumber > (counter.currentServing || 0))
      .sort((a, b) => a.waitingNumber - b.waitingNumber);
  }, [deptTickets, counter.currentServing]);

  // Skipped / Hold tickets
  const skippedTickets = useMemo(() => {
    return deptTickets.filter(
      (t) => t.status === 'SKIPPED' || (counter.skippedTokens || []).includes(t.waitingNumber)
    );
  }, [deptTickets, counter.skippedTokens]);

  // Completed tickets
  const completedTickets = useMemo(() => {
    return deptTickets.filter((t) => t.status === 'COMPLETED');
  }, [deptTickets]);

  // Announce again button
  const handleAnnounceAgain = () => {
    if (counter.currentServing > 0) {
      const token = formatTokenNumber(activeDept.prefix, counter.currentServing);
      announcer.announceToken(token, activeDept.roomNumber);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Console Top Header & Room Selector */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md">
            <Stethoscope className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                Attendant & Doctor Room Screen
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
              {activeDept.roomNumber} Console • {activeDept.name}
            </h2>
            <p className="text-xs text-slate-500">
              Doctor: <strong className="text-slate-800">{activeDoctor.name}</strong> ({activeDoctor.specialization})
            </p>
          </div>
        </div>

        {/* Department Switcher */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-600">Switch Room:</label>
          <select
            value={activeDept.id}
            onChange={(e) => setActiveDeptId(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            {hospitalDepts.map((d) => (
              <option key={d.id} value={d.id}>
                {d.roomNumber} - {d.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Console Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Big Touch Controls & Current Serving Patient (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* NOW SERVING HERO CARD */}
          <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
            {/* Ambient Background glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>

            <div className="flex items-center justify-between pb-4 border-b border-slate-800 relative z-10">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-400">
                  CURRENTLY CALLING INSIDE ROOM
                </span>
              </div>
              <button
                onClick={handleAnnounceAgain}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors border border-slate-700"
                title="Play Audio Bell & Announcement Again"
              >
                <Megaphone className="w-3.5 h-3.5 text-emerald-400" />
                <span>Repeat Call Audio</span>
              </button>
            </div>

            {/* Giant Token Code */}
            <div className="text-center py-6 sm:py-8 relative z-10">
              <div className="text-6xl sm:text-7xl md:text-8xl font-black font-mono tracking-tight text-white mb-2">
                {counter.currentServing > 0
                  ? formatTokenNumber(activeDept.prefix, counter.currentServing)
                  : 'NONE'}
              </div>

              {currentServingTicket ? (
                <div className="space-y-1">
                  <div className="text-xl sm:text-2xl font-extrabold text-emerald-300">
                    {currentServingTicket.patientName}
                  </div>
                  <div className="text-xs text-slate-300">
                    {currentServingTicket.age} Yrs • {currentServingTicket.gender} • +91 {currentServingTicket.phone}
                  </div>
                  <div className="inline-block mt-2 px-3 py-1 bg-slate-800 text-slate-300 rounded-md text-[11px] font-mono">
                    {currentServingTicket.bookingType} • {currentServingTicket.address}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-400">
                  No patient currently in room. Click &quot;Next Patient&quot; below to call the first token.
                </p>
              )}
            </div>

            {/* BIG THREE ACTION BUTTONS */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-800 relative z-10">
              {/* GREEN: Next Patient */}
              <button
                onClick={() => advanceDoctorQueue(activeDept.id, 'NEXT', todayStr)}
                className="py-4 px-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-2xl text-sm font-black shadow-lg hover:shadow-emerald-600/30 transition-all cursor-pointer flex flex-col items-center justify-center gap-1 group"
              >
                <div className="flex items-center gap-1.5 text-base">
                  <CheckCircle2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span>Next Patient</span>
                </div>
                <span className="text-[10px] font-normal text-emerald-100 opacity-90">
                  Calls Next • Plays Audio
                </span>
              </button>

              {/* AMBER: Skip / Hold */}
              <button
                onClick={() => advanceDoctorQueue(activeDept.id, 'SKIP', todayStr)}
                disabled={counter.currentServing === 0}
                className="py-4 px-4 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 rounded-2xl text-sm font-black shadow-lg transition-all cursor-pointer flex flex-col items-center justify-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-1.5 text-base">
                  <UserX className="w-5 h-5" />
                  <span>Skip / Hold</span>
                </div>
                <span className="text-[10px] font-normal text-slate-900 opacity-90">
                  Patient Absent
                </span>
              </button>

              {/* BLUE: Recall Held */}
              <button
                onClick={() => advanceDoctorQueue(activeDept.id, 'RECALL', todayStr)}
                disabled={skippedTickets.length === 0}
                className="py-4 px-4 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-2xl text-sm font-black shadow-lg transition-all cursor-pointer flex flex-col items-center justify-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-1.5 text-base">
                  <RotateCcw className="w-5 h-5" />
                  <span>Recall Held ({skippedTickets.length})</span>
                </div>
                <span className="text-[10px] font-normal text-blue-100 opacity-90">
                  Re-insert to Room
                </span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Issued
              </span>
              <div className="text-2xl font-black text-slate-900 font-mono mt-0.5">
                {counter.seq}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-4 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Completed
              </span>
              <div className="text-2xl font-black text-emerald-600 font-mono mt-0.5">
                {completedTickets.length}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-4 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Waiting Now
              </span>
              <div className="text-2xl font-black text-blue-600 font-mono mt-0.5">
                {waitingTickets.length}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Next in Queue & Held Lists (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Next Up in Queue */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-600" />
                <h3 className="font-extrabold text-sm text-slate-900">
                  Next in Queue ({waitingTickets.length})
                </h3>
              </div>
              <span className="text-[11px] font-semibold text-slate-500">
                Avg ~{activeDept.avgConsultationTime}m/patient
              </span>
            </div>

            {waitingTickets.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">
                No more waiting patients in queue for today.
              </p>
            ) : (
              <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                {waitingTickets.slice(0, 8).map((ticket, idx) => (
                  <div
                    key={ticket.id}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-black">
                        {idx + 1}
                      </span>
                      <div>
                        <div className="font-mono font-black text-sm text-slate-900">
                          {ticket.ticketNumber}
                        </div>
                        <div className="text-xs font-semibold text-slate-600 truncate max-w-[150px]">
                          {ticket.patientName} ({ticket.age}y)
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                        Est. ~{(idx + 1) * activeDept.avgConsultationTime} mins
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-white font-mono text-slate-600">
                        {ticket.bookingType}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Skipped / On Hold Patients with Individual 1-Click Recall */}
          <div className="bg-white rounded-2xl border border-amber-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-amber-100">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <h3 className="font-extrabold text-sm text-amber-950">
                  On Hold / Skipped ({skippedTickets.length})
                </h3>
              </div>
              <span className="text-[10px] text-amber-800">Late arrivals</span>
            </div>

            {skippedTickets.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">
                No patients on hold right now.
              </p>
            ) : (
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {skippedTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="p-2.5 bg-amber-50/70 border border-amber-200 rounded-xl flex items-center justify-between"
                  >
                    <div>
                      <div className="font-mono font-bold text-xs text-amber-950">
                        {ticket.ticketNumber}
                      </div>
                      <div className="text-xs text-slate-700 font-medium">
                        {ticket.patientName} ({ticket.age}y)
                      </div>
                    </div>

                    <button
                      onClick={() =>
                        advanceDoctorQueue(
                          activeDept.id,
                          'RECALL',
                          todayStr,
                          ticket.waitingNumber
                        )
                      }
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors shadow-xs"
                    >
                      Call Back
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

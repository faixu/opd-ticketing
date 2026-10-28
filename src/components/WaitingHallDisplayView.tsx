import React, { useState, useEffect } from 'react';
import { useQueue, getTodayDateString } from '../context/QueueContext';
import { formatTokenNumber } from '../utils/queueLogic';
import {
  Tv,
  Maximize2,
  Minimize2,
  Volume2,
  Clock,
  Sparkles,
  ArrowRight,
  Activity,
  Megaphone,
} from 'lucide-react';

export const WaitingHallDisplayView: React.FC = () => {
  const {
    hospitals,
    departments,
    selectedHospitalId,
    language,
    getCounter,
    latestCalledTicket,
  } = useQueue();

  const todayStr = getTodayDateString();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const activeHospital = hospitals.find((h) => h.id === selectedHospitalId) || hospitals[0];
  const hospitalDepts = departments.filter((d) => d.hospitalId === selectedHospitalId);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-950 text-white p-4 sm:p-6 lg:p-8 flex flex-col justify-between">
      {/* Top Banner: Hospital Header & Live Clock */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
            <Activity className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
              <span className="text-xs font-bold text-emerald-400 tracking-widest uppercase">
                OPD LIVE QUEUE BOARD • او پی ڈی ڈسپلے
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {activeHospital.name}
            </h1>
            <p className="text-xs text-slate-400">{activeHospital.location}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-400">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
            <div className="text-xs text-slate-400 font-semibold">
              {currentTime.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
          </div>

          <button
            onClick={toggleFullscreen}
            className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 cursor-pointer"
            title="Toggle TV Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* FLASHING LATEST CALL BANNER */}
      {latestCalledTicket && (
        <div className="my-4 p-4 rounded-2xl bg-emerald-950/80 border-2 border-emerald-500 text-emerald-200 flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-emerald-500 text-slate-950 rounded-xl">
              <Megaphone className="w-5 h-5" />
            </span>
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-emerald-400 block">
                NOW CALLING / اب یہ نمبر تشریف لائیں
              </span>
              <div className="text-xl sm:text-2xl font-black text-white font-mono">
                TOKEN {latestCalledTicket.token} ➔ PLEASE PROCEED TO {latestCalledTicket.room}
              </div>
            </div>
          </div>
          <span className="font-mono text-xs text-emerald-400 bg-emerald-900/50 px-3 py-1.5 rounded-lg border border-emerald-700">
            {latestCalledTicket.time}
          </span>
        </div>
      )}

      {/* Multi-Department Waiting Hall Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 my-6 flex-1">
        {hospitalDepts.slice(0, 6).map((dept) => {
          const counter = getCounter(selectedHospitalId, dept.id, todayStr);
          const currentServingToken = counter.currentServing > 0
            ? formatTokenNumber(dept.prefix, counter.currentServing)
            : '---';

          const next1 = counter.currentServing + 1 <= counter.seq ? formatTokenNumber(dept.prefix, counter.currentServing + 1) : null;
          const next2 = counter.currentServing + 2 <= counter.seq ? formatTokenNumber(dept.prefix, counter.currentServing + 2) : null;
          const next3 = counter.currentServing + 3 <= counter.seq ? formatTokenNumber(dept.prefix, counter.currentServing + 3) : null;

          return (
            <div
              key={dept.id}
              className="bg-slate-900/90 rounded-3xl border-2 border-slate-800 p-6 flex flex-col justify-between shadow-lg relative overflow-hidden"
            >
              {/* Dept Header */}
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <h3 className="text-lg font-black text-white">{dept.name}</h3>
                    {language === 'BILINGUAL' && (
                      <p className="text-xs text-slate-400 font-arabic font-medium">{dept.urduName}</p>
                    )}
                  </div>
                  <span className="text-xs font-mono font-bold bg-slate-800 text-emerald-400 px-3 py-1 rounded-lg border border-slate-700">
                    {dept.roomNumber}
                  </span>
                </div>

                {/* Big Now Serving Box */}
                <div className="my-5 p-5 rounded-2xl bg-slate-950 border border-slate-800 text-center relative">
                  <span className="text-[10px] font-bold tracking-widest uppercase text-slate-400 block mb-1">
                    NOW SERVING / موجودہ نمبر
                  </span>
                  <div className="text-5xl sm:text-6xl font-black font-mono tracking-tight text-emerald-400 animate-pulse-ring rounded-xl py-1">
                    {currentServingToken}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2 font-medium">
                    Floor: {dept.floor}
                  </p>
                </div>
              </div>

              {/* Next In Line Tokens */}
              <div className="pt-3 border-t border-slate-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
                  Next in Line / اگلے نمبر
                </span>
                <div className="flex items-center gap-2">
                  {next1 || next2 || next3 ? (
                    <>
                      {next1 && (
                        <span className="px-3 py-1.5 rounded-lg bg-slate-800 text-white font-mono text-xs font-bold border border-slate-700">
                          {next1}
                        </span>
                      )}
                      {next2 && (
                        <span className="px-3 py-1.5 rounded-lg bg-slate-800/70 text-slate-300 font-mono text-xs font-bold border border-slate-700">
                          {next2}
                        </span>
                      )}
                      {next3 && (
                        <span className="px-3 py-1.5 rounded-lg bg-slate-800/40 text-slate-400 font-mono text-xs font-bold border border-slate-700">
                          {next3}
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-xs text-slate-500">Queue clear</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Live Ticker */}
      <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 font-bold text-[10px] uppercase">
            Notice
          </span>
          <p className="truncate max-w-2xl">
            Please keep your physical or digital OPD slip ready before entering the doctor&apos;s room. For wheelchair assistance, visit Counter 1.
          </p>
        </div>

        <div className="text-slate-500 text-[11px]">
          Directorate of Health Services Kashmir • SehatQueue
        </div>
      </div>
    </div>
  );
};

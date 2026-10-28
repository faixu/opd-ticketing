import React from 'react';
import { useQueue, getTodayDateString } from '../context/QueueContext';
import {
  TrendingUp,
  Users,
  Clock,
  Coins,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Activity,
  Layers,
} from 'lucide-react';
import { formatTokenNumber } from '../utils/queueLogic';

export const AnalyticsView: React.FC = () => {
  const {
    hospitals,
    departments,
    selectedHospitalId,
    tickets,
    getCounter,
  } = useQueue();

  const todayStr = getTodayDateString();
  const currentHospital = hospitals.find((h) => h.id === selectedHospitalId) || hospitals[0];
  const hospitalDepts = departments.filter((d) => d.hospitalId === selectedHospitalId);
  const todayTickets = tickets.filter((t) => t.hospitalId === selectedHospitalId && t.appointmentDate === todayStr);

  const totalWalkIns = todayTickets.filter((t) => t.bookingType === 'WALK_IN').length;
  const totalOnline = todayTickets.filter((t) => t.bookingType === 'ONLINE').length;
  const totalCompleted = todayTickets.filter((t) => t.status === 'COMPLETED').length;
  const totalRevenue = todayTickets.filter((t) => t.paymentStatus === 'PAID').length * currentHospital.feeAmount;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
              <TrendingUp className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Hospital OPD Analytics & Real-Time Load
              </h2>
              <p className="text-xs text-slate-500">
                Performance metrics for {currentHospital.name} • {todayStr}
              </p>
            </div>
          </div>
        </div>

        <div className="text-xs font-bold text-slate-600 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-xs">
          Live Tracking Active
        </div>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Patients</span>
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-black text-slate-900">{todayTickets.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">
            {totalOnline} Online • {totalWalkIns} Walk-in
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Consultations Done</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-black text-emerald-600">{totalCompleted}</div>
          <div className="text-[11px] text-slate-500 mt-1">
            {todayTickets.length > 0 ? Math.round((totalCompleted / todayTickets.length) * 100) : 0}% clearance rate
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Avg Consultation</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-3xl font-black text-blue-600">5.8 m</div>
          <div className="text-[11px] text-slate-500 mt-1">
            Target: &lt; 8 mins per patient
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">OPD Registration Fee</span>
            <Coins className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-3xl font-black text-slate-900">₹{totalRevenue}</div>
          <div className="text-[11px] text-slate-500 mt-1">
            Govt micro-fee collection
          </div>
        </div>
      </div>

      {/* Department Breakdown Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h3 className="font-extrabold text-base text-slate-900">
          Department-wise Queue Load & Capacity
        </h3>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Room</th>
                <th className="py-3 px-4">Issued Today</th>
                <th className="py-3 px-4">Now Serving</th>
                <th className="py-3 px-4">Daily Cap</th>
                <th className="py-3 px-4">Load Ratio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {hospitalDepts.map((dept) => {
                const counter = getCounter(selectedHospitalId, dept.id, todayStr);
                const percent = Math.min(100, Math.round((counter.seq / dept.dailyCapacity) * 100));

                return (
                  <tr key={dept.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{dept.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{dept.prefix}</div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-700">{dept.roomNumber}</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{counter.seq}</td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-700">
                      {counter.currentServing > 0 ? formatTokenNumber(dept.prefix, counter.currentServing) : 'Not Started'}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{dept.dailyCapacity}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              percent > 85 ? 'bg-red-500' : percent > 50 ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${percent}%` }}
                          ></div>
                        </div>
                        <span className="font-bold text-[11px] text-slate-700">{percent}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useQueue, getTodayDateString } from '../context/QueueContext';
import { Ticket, Department } from '../types';
import { ThermalReceipt } from './ThermalReceipt';
import {
  Printer,
  UserPlus,
  Search,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  Filter,
  RefreshCw,
  FileText,
  BadgeAlert,
  Coins,
} from 'lucide-react';
import { validatePhone } from '../utils/queueLogic';

export const ReceptionDeskView: React.FC = () => {
  const {
    hospitals,
    departments,
    doctors,
    selectedHospitalId,
    setSelectedHospitalId,
    language,
    bookTicket,
    getTicketsForDepartment,
    getCounter,
  } = useQueue();

  const todayStr = getTodayDateString();
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Active hospital & departments
  const currentHospital = useMemo(
    () => hospitals.find((h) => h.id === selectedHospitalId) || hospitals[0],
    [hospitals, selectedHospitalId]
  );

  const hospitalDepts = useMemo(
    () => departments.filter((d) => d.hospitalId === selectedHospitalId),
    [departments, selectedHospitalId]
  );

  const [selectedDeptId, setSelectedDeptId] = useState<string>(
    hospitalDepts[0]?.id || 'smhs-med'
  );

  // Active department
  const activeDept = useMemo(
    () => hospitalDepts.find((d) => d.id === selectedDeptId) || hospitalDepts[0] || departments[0],
    [hospitalDepts, selectedDeptId, departments]
  );

  const activeDoc = useMemo(
    () => doctors.find((doc) => doc.departmentId === activeDept.id) || doctors[0],
    [doctors, activeDept]
  );

  // Fast Walk-in Clerk Input Form State
  const [patientName, setPatientName] = useState<string>('');
  const [age, setAge] = useState<string>('');
  const [gender, setGender] = useState<'MALE' | 'FEMALE' | 'OTHER'>('MALE');
  const [phone, setPhone] = useState<string>('');
  const [address, setAddress] = useState<string>('Srinagar');
  const [abhaId, setAbhaId] = useState<string>('');
  const [cashCollected, setCashCollected] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Receipt Modal State
  const [latestIssuedTicket, setLatestIssuedTicket] = useState<Ticket | null>(null);
  const [autoPrintEnabled, setAutoPrintEnabled] = useState<boolean>(true);

  // Roster Filter / Search
  const [rosterSearch, setRosterSearch] = useState<string>('');
  const [filterType, setFilterType] = useState<'ALL' | 'WALK_IN' | 'ONLINE'>('ALL');

  // Load department tickets
  const deptTickets = getTicketsForDepartment(activeDept.id, todayStr);
  const counter = getCounter(selectedHospitalId, activeDept.id, todayStr);

  const filteredTickets = useMemo(() => {
    return deptTickets.filter((t) => {
      const matchType = filterType === 'ALL' || t.bookingType === filterType;
      const matchSearch =
        !rosterSearch.trim() ||
        t.ticketNumber.toLowerCase().includes(rosterSearch.toLowerCase()) ||
        t.patientName.toLowerCase().includes(rosterSearch.toLowerCase()) ||
        t.phone.includes(rosterSearch);
      return matchType && matchSearch;
    });
  }, [deptTickets, filterType, rosterSearch]);

  // Handle Quick Issue Walk-in Ticket (Keyboard Enter friendly)
  const handleIssueWalkIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim()) {
      setErrorMsg('Patient name is required');
      nameInputRef.current?.focus();
      return;
    }

    const numAge = parseInt(age, 10);
    if (!age || isNaN(numAge) || numAge < 1 || numAge > 120) {
      setErrorMsg('Valid age required (1-120)');
      return;
    }

    const phoneValidation = validatePhone(phone);
    if (!phoneValidation.isValid) {
      setErrorMsg(phoneValidation.error || 'Valid 10-digit phone required');
      return;
    }

    setErrorMsg('');

    const ticket = bookTicket({
      hospitalId: selectedHospitalId,
      departmentId: activeDept.id,
      doctorId: activeDoc.id,
      appointmentDate: todayStr,
      bookingType: 'WALK_IN',
      patientName: patientName.trim(),
      age: numAge,
      gender,
      phone: phone.trim(),
      address: address.trim() || 'Kashmir',
      abhaId: abhaId.trim() || undefined,
      paymentMethod: 'CASH_WINDOW',
      paymentStatus: cashCollected ? 'PAID' : 'PENDING',
    });

    setLatestIssuedTicket(ticket);

    // Reset inputs for next rapid walk-in patient
    setPatientName('');
    setAge('');
    setPhone('');
    setAbhaId('');
    nameInputRef.current?.focus();

    if (autoPrintEnabled) {
      setTimeout(() => {
        // Automatically open print dialog or modal
      }, 200);
    }
  };

  const handleQuickDemoClerk = () => {
    setPatientName('Abdul Gani Lone');
    setAge('55');
    setGender('MALE');
    setPhone('9419088776');
    setAddress('Old Town, Baramulla');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Reception Header */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Printer className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                OPD Registration & Thermal Desk
              </h2>
              {language === 'BILINGUAL' && (
                <p className="text-xs text-slate-400 font-arabic font-medium">
                  او پی ڈی کاؤنٹر اور تھرمل سلپ جنریٹر
                </p>
              )}
            </div>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            Walk-in registration counter sharing the unified sequential queue with online bookings.
          </p>
        </div>

        {/* Counter Info & Auto Print Toggle */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Counter Sequence Today
            </span>
            <div className="text-lg font-black font-mono text-emerald-400">
              {counter.seq} Issued • Serving #{counter.currentServing || 1}
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 bg-slate-800/80 px-3 py-2 rounded-xl border border-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={autoPrintEnabled}
              onChange={(e) => setAutoPrintEnabled(e.target.checked)}
              className="accent-emerald-500 rounded"
            />
            <span>Auto-Show Thermal Slip</span>
          </label>
        </div>
      </div>

      {/* Main Grid: Fast Registration Left, Live Department Roster Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: Rapid Walk-In Ticket Generator (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-emerald-600" />
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                New Walk-In Registration
              </h3>
            </div>
            <button
              type="button"
              onClick={handleQuickDemoClerk}
              className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded-md cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Fill Sample</span>
            </button>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-700 flex items-center gap-2">
              <BadgeAlert className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleIssueWalkIn} className="space-y-4">
            {/* Department Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Target Department / Room
              </label>
              <select
                value={selectedDeptId}
                onChange={(e) => setSelectedDeptId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                {hospitalDepts.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.prefix}) • {d.roomNumber}
                  </option>
                ))}
              </select>
              <div className="flex items-center justify-between mt-1 text-[11px] text-slate-500">
                <span>Doctor: {activeDoc.name}</span>
                <span className="font-semibold text-emerald-700">Room: {activeDept.roomNumber}</span>
              </div>
            </div>

            {/* Patient Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Patient Name <span className="text-red-500">*</span>
              </label>
              <input
                ref={nameInputRef}
                type="text"
                placeholder="Full name of patient"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Age & Gender */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Age (Years) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  placeholder="Age"
                  min="1"
                  max="120"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Gender
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as 'MALE' | 'FEMALE' | 'OTHER')}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value="MALE">Male (مرد)</option>
                  <option value="FEMALE">Female (عورت)</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>

            {/* Mobile Number & Address */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mobile (10 Digits) <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  placeholder="9419..."
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  District / Area
                </label>
                <input
                  type="text"
                  placeholder="e.g. Srinagar"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* ABHA Number */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ABHA ID (Ayushman Bharat - Optional)
              </label>
              <input
                type="text"
                placeholder="14-digit ABHA"
                value={abhaId}
                onChange={(e) => setAbhaId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-mono font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Fee Collection Checkbox */}
            <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={cashCollected}
                  onChange={(e) => setCashCollected(e.target.checked)}
                  className="accent-emerald-600 rounded w-4 h-4"
                />
                <span className="text-xs font-bold text-emerald-950">
                  Govt Registration Fee Collected: ₹{currentHospital.feeAmount} (Cash)
                </span>
              </label>
              <Coins className="w-4 h-4 text-emerald-700" />
            </div>

            {/* Submit Action */}
            <button
              type="submit"
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Printer className="w-4 h-4" />
              <span>Issue Token & Print 80mm Slip [Enter]</span>
            </button>
          </form>
        </div>

        {/* Right Area: Unified Queue Roster & Thermal Receipt Preview (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-slate-700" />
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                  {activeDept.name} Queue Roster
                </h3>
              </div>
              <p className="text-xs text-slate-500">
                {deptTickets.length} Patients registered for today ({activeDept.roomNumber})
              </p>
            </div>

            {/* Filter buttons */}
            <div className="flex items-center gap-2">
              <div className="inline-flex p-1 bg-slate-100 rounded-lg text-xs font-bold">
                <button
                  onClick={() => setFilterType('ALL')}
                  className={`px-2.5 py-1 rounded-md cursor-pointer ${
                    filterType === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  All ({deptTickets.length})
                </button>
                <button
                  onClick={() => setFilterType('WALK_IN')}
                  className={`px-2.5 py-1 rounded-md cursor-pointer ${
                    filterType === 'WALK_IN' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Walk-in
                </button>
                <button
                  onClick={() => setFilterType('ONLINE')}
                  className={`px-2.5 py-1 rounded-md cursor-pointer ${
                    filterType === 'ONLINE' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Online
                </button>
              </div>
            </div>
          </div>

          {/* Search Bar in Roster */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by Token (MED-002), Patient Name, or Mobile..."
              value={rosterSearch}
              onChange={(e) => setRosterSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Roster Table */}
          <div className="overflow-x-auto max-h-[460px] overflow-y-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Token #</th>
                  <th className="py-2.5 px-3">Patient Name</th>
                  <th className="py-2.5 px-3">Age/Sex</th>
                  <th className="py-2.5 px-3">Channel</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTickets.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      No tokens issued yet for this department today.
                    </td>
                  </tr>
                ) : (
                  filteredTickets.map((ticket) => (
                    <tr
                      key={ticket.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        ticket.status === 'IN_PROGRESS'
                          ? 'bg-emerald-50/70 font-semibold'
                          : ticket.status === 'SKIPPED'
                          ? 'bg-amber-50/40 text-amber-900'
                          : ''
                      }`}
                    >
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                        {ticket.ticketNumber}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-900">{ticket.patientName}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{ticket.phone}</div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        {ticket.age}y / {ticket.gender === 'MALE' ? 'M' : ticket.gender === 'FEMALE' ? 'F' : 'O'}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded-sm text-[10px] font-bold ${
                            ticket.bookingType === 'ONLINE'
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-emerald-50 text-emerald-800'
                          }`}
                        >
                          {ticket.bookingType}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            ticket.status === 'IN_PROGRESS'
                              ? 'bg-emerald-600 text-white animate-pulse'
                              : ticket.status === 'COMPLETED'
                              ? 'bg-slate-100 text-slate-600'
                              : ticket.status === 'SKIPPED'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-50 text-blue-700'
                          }`}
                        >
                          {ticket.status === 'IN_PROGRESS' && <span className="w-1.5 h-1.5 rounded-full bg-white"></span>}
                          {ticket.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => setLatestIssuedTicket(ticket)}
                          className="px-2 py-1 text-[11px] font-bold text-slate-700 hover:text-emerald-700 hover:bg-slate-100 rounded-md cursor-pointer"
                          title="Print 80mm Slip"
                        >
                          Print Slip
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal for 80mm Thermal Receipt */}
      {latestIssuedTicket && (
        <ThermalReceipt
          ticket={latestIssuedTicket}
          hospital={currentHospital}
          department={activeDept}
          onClose={() => setLatestIssuedTicket(null)}
        />
      )}
    </div>
  );
};

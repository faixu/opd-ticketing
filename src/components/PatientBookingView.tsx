import React, { useState, useMemo } from 'react';
import { useQueue, getTodayDateString } from '../context/QueueContext';
import { Department, Doctor, Ticket, PaymentMethod } from '../types';
import { validatePhone, validateAbhaId, calculateQueueEstimate } from '../utils/queueLogic';
import { TicketQRCode } from './TicketQRCode';
import { ThermalReceipt } from './ThermalReceipt';
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Phone,
  Shield,
  CreditCard,
  QrCode,
  CheckCircle2,
  AlertCircle,
  Stethoscope,
  Printer,
  Sparkles,
  Search,
  ArrowRight,
  TrendingUp,
  Layers,
  HeartPulse,
} from 'lucide-react';

export const PatientBookingView: React.FC = () => {
  const {
    hospitals,
    departments,
    doctors,
    selectedHospitalId,
    setSelectedHospitalId,
    language,
    bookTicket,
    getCounter,
    findTicketByNumberOrPhone,
  } = useQueue();

  const [activeSubTab, setActiveSubTab] = useState<'book' | 'track'>('book');

  // Form State
  const todayStr = getTodayDateString();
  const tomorrowStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const yr = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const da = String(d.getDate()).padStart(2, '0');
    return `${yr}-${mo}-${da}`;
  }, []);

  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>('smhs-med');
  
  // Patient details state
  const [patientName, setPatientName] = useState<string>('');
  const [age, setAge] = useState<string>('');
  const [gender, setGender] = useState<'MALE' | 'FEMALE' | 'OTHER'>('MALE');
  const [phone, setPhone] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [abhaId, setAbhaId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI_GPAY');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Issued ticket state (for showing the digital pass)
  const [issuedTicket, setIssuedTicket] = useState<Ticket | null>(null);
  const [showThermalModal, setShowThermalModal] = useState<boolean>(false);

  // Tracking tab state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [trackedTickets, setTrackedTickets] = useState<Ticket[]>([]);
  const [hasSearched, setHasSearched] = useState<boolean>(false);

  // Active hospital
  const currentHospital = useMemo(
    () => hospitals.find((h) => h.id === selectedHospitalId) || hospitals[0],
    [hospitals, selectedHospitalId]
  );

  // Filter departments for this hospital
  const hospitalDepartments = useMemo(
    () => departments.filter((d) => d.hospitalId === selectedHospitalId),
    [departments, selectedHospitalId]
  );

  // Active department
  const activeDepartment = useMemo(() => {
    return (
      hospitalDepartments.find((d) => d.id === selectedDepartmentId) ||
      hospitalDepartments[0] ||
      departments[0]
    );
  }, [hospitalDepartments, selectedDepartmentId, departments]);

  // Doctor assigned to this department
  const activeDoctor = useMemo(() => {
    return (
      doctors.find((doc) => doc.departmentId === activeDepartment.id) ||
      doctors.find((doc) => doc.hospitalId === selectedHospitalId) ||
      doctors[0]
    );
  }, [doctors, activeDepartment, selectedHospitalId]);

  // Live queue stats for selected department and date
  const counter = getCounter(selectedHospitalId, activeDepartment.id, selectedDate);
  const remainingCapacity = Math.max(0, activeDepartment.dailyCapacity - counter.seq);
  const currentServingNumber = counter.currentServing || 0;

  // Handle ABHA change with live formatting
  const handleAbhaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const clean = val.replace(/[^0-9]/g, '').slice(0, 14);
    if (clean.length > 10) {
      setAbhaId(`${clean.slice(0, 2)}-${clean.slice(2, 6)}-${clean.slice(6, 10)}-${clean.slice(10, 14)}`);
    } else if (clean.length > 6) {
      setAbhaId(`${clean.slice(0, 2)}-${clean.slice(2, 6)}-${clean.slice(6)}`);
    } else if (clean.length > 2) {
      setAbhaId(`${clean.slice(0, 2)}-${clean.slice(2)}`);
    } else {
      setAbhaId(clean);
    }
  };

  // Form Submission
  const handleBookTicket = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!patientName.trim()) {
      errors.patientName = 'Patient full name is required';
    }

    const numAge = parseInt(age, 10);
    if (!age || isNaN(numAge) || numAge < 1 || numAge > 120) {
      errors.age = 'Please enter a valid age (1-120)';
    }

    const phoneValidation = validatePhone(phone);
    if (!phoneValidation.isValid) {
      errors.phone = phoneValidation.error || 'Valid 10-digit mobile number required';
    }

    if (abhaId.trim()) {
      const abhaVal = validateAbhaId(abhaId);
      if (!abhaVal.isValid) {
        errors.abhaId = abhaVal.error || 'Invalid 14-digit ABHA ID';
      }
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    setIsSubmitting(true);

    // Simulate instant micro-checkout and atomic token generation
    setTimeout(() => {
      const newTicket = bookTicket({
        hospitalId: selectedHospitalId,
        departmentId: activeDepartment.id,
        doctorId: activeDoctor.id,
        appointmentDate: selectedDate,
        bookingType: 'ONLINE',
        patientName,
        age: numAge,
        gender,
        phone,
        address: address || 'Srinagar, J&K',
        abhaId: abhaId || undefined,
        paymentMethod,
        paymentStatus: 'PAID',
      });

      setIssuedTicket(newTicket);
      setIsSubmitting(false);
    }, 400);
  };

  // Search handler for tracking
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const results = findTicketByNumberOrPhone(searchQuery);
    setTrackedTickets(results);
    setHasSearched(true);
  };

  // Pre-fill demo patient for rapid testing
  const handleQuickFillDemo = () => {
    setPatientName('Aaqib Gulzar');
    setAge('34');
    setGender('MALE');
    setPhone('9419077889');
    setAddress('Karan Nagar, Srinagar');
    setAbhaId('14-4455-8899-1234');
    setPaymentMethod('UPI_GPAY');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      {/* Sub Tabs: Book New Pass vs Track Existing Token */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
              <HeartPulse className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                Online OPD Token Booking
              </h2>
              {language === 'BILINGUAL' && (
                <p className="text-xs text-slate-500 font-arabic font-medium">
                  آن لائن او پی ڈی ٹوکن بکنگ اور قطار کا نظام
                </p>
              )}
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Skip physical counter queues. Book digital OPD token, get estimated reporting time & gate QR pass.
          </p>
        </div>

        {/* View Toggle */}
        <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200 self-start sm:self-auto">
          <button
            onClick={() => {
              setActiveSubTab('book');
              setIssuedTicket(null);
            }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'book'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            New Token Booking
          </button>
          <button
            onClick={() => setActiveSubTab('track')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'track'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Track My Token
          </button>
        </div>
      </div>

      {/* TRACK EXISTING TOKEN VIEW */}
      {activeSubTab === 'track' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="max-w-xl">
            <h3 className="font-bold text-base text-slate-900">Track Your Real-Time Queue Position</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter your Token Number (e.g. <span className="font-mono font-semibold text-slate-700">MED-003</span>) or registered 10-digit mobile number.
            </p>

            <form onSubmit={handleSearch} className="flex gap-2 mt-4">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Enter Token (MED-003) or Phone (9419...)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <button
                type="submit"
                className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 cursor-pointer shadow-xs"
              >
                Find Token
              </button>
            </form>
          </div>

          {/* Search Results */}
          {hasSearched && (
            <div className="space-y-4 pt-4 border-t border-slate-100">
              {trackedTickets.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-700">No OPD tokens found</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Please verify the token code (e.g., MED-003) or mobile number.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {trackedTickets.map((t) => {
                    const dept = departments.find((d) => d.id === t.departmentId) || departments[0];
                    const hosp = hospitals.find((h) => h.id === t.hospitalId) || hospitals[0];
                    const currentCounter = getCounter(t.hospitalId, t.departmentId, t.appointmentDate);
                    const estimate = calculateQueueEstimate(t, currentCounter, dept.avgConsultationTime);

                    return (
                      <div
                        key={t.id}
                        className="bg-white border-2 border-emerald-500/30 rounded-xl p-5 shadow-sm space-y-4 relative overflow-hidden"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                              {dept.name}
                            </span>
                            <div className="text-2xl font-extrabold text-slate-900 mt-1 font-mono">
                              {t.ticketNumber}
                            </div>
                            <p className="text-xs font-medium text-slate-600">{t.patientName} ({t.age}y / {t.gender})</p>
                          </div>

                          <div className="text-right">
                            <span className={`inline-flex px-2 py-1 rounded-md text-[11px] font-bold ${
                              estimate.isNowServing
                                ? 'bg-emerald-600 text-white animate-pulse'
                                : estimate.status === 'COMPLETED'
                                ? 'bg-slate-100 text-slate-600'
                                : estimate.status === 'SKIPPED'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-blue-50 text-blue-700'
                            }`}>
                              {estimate.isNowServing
                                ? '🟢 CALLING NOW'
                                : estimate.status === 'COMPLETED'
                                ? '✓ Completed'
                                : estimate.status === 'SKIPPED'
                                ? '⚠️ Skipped / Hold'
                                : `⏳ In Queue (#${t.waitingNumber})`}
                            </span>
                            <p className="text-[10px] text-slate-500 mt-1">{t.roomNumber}</p>
                          </div>
                        </div>

                        {/* Status Message */}
                        <div className={`p-3 rounded-lg text-xs ${
                          estimate.isNowServing
                            ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                            : estimate.isUpcomingSoon
                            ? 'bg-amber-50 border border-amber-200 text-amber-900'
                            : 'bg-slate-50 border border-slate-200 text-slate-700'
                        }`}>
                          {estimate.isNowServing ? (
                            <p className="font-bold flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping"></span>
                              YOUR TURN! Please proceed inside {t.roomNumber} immediately.
                            </p>
                          ) : estimate.status === 'COMPLETED' ? (
                            <p>Consultation finished for today.</p>
                          ) : estimate.status === 'SKIPPED' ? (
                            <p className="font-medium text-amber-800">
                              You were called earlier. Please present your token slip to the room attendant to be recalled.
                            </p>
                          ) : (
                            <div className="space-y-1">
                              <p className="font-semibold">
                                Now Serving: <span className="font-mono text-emerald-700 font-bold">Token #{currentCounter.currentServing || 1}</span>
                              </p>
                              <p>
                                👥 <strong>{estimate.peopleAhead}</strong> patients ahead of you.
                              </p>
                              <p>
                                ⏱️ Estimated Call: <strong className="text-slate-900">{estimate.estimatedCallTime}</strong> (~{estimate.estimatedWaitMinutes} mins wait)
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                          <span>Doctor: {t.doctorName}</span>
                          <button
                            onClick={() => {
                              setIssuedTicket(t);
                            }}
                            className="text-emerald-700 font-bold hover:underline cursor-pointer"
                          >
                            View Slip & QR
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* DIGITAL TICKET ISSUED SUCCESS PASS */}
      {issuedTicket && (
        <div className="bg-white rounded-2xl border-2 border-emerald-600 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-linear-to-r from-emerald-600 to-teal-700 text-white p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-white text-xs font-bold backdrop-blur-xs mb-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                <span>OPD Appointment Confirmed • ₹{issuedTicket.fee} Paid</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Digital OPD Pass
              </h3>
              <p className="text-emerald-100 text-xs mt-1">
                {currentHospital.name} • {issuedTicket.roomNumber} ({activeDepartment.floor})
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                onClick={() => setShowThermalModal(true)}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-white text-emerald-800 rounded-xl text-xs font-bold hover:bg-emerald-50 cursor-pointer shadow-sm transition-all"
              >
                <Printer className="w-4 h-4" />
                <span>Thermal Slip Preview</span>
              </button>
            </div>
          </div>

          <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            {/* Left: Giant Token Display */}
            <div className="text-center md:text-left space-y-2 border-b md:border-b-0 md:border-r border-slate-100 pb-6 md:pb-0 md:pr-6">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                YOUR TOKEN NUMBER / ٹوکن نمبر
              </span>
              <div className="text-5xl sm:text-6xl font-black text-slate-900 tracking-tight font-mono text-emerald-700">
                {issuedTicket.ticketNumber}
              </div>
              <p className="text-xs font-semibold text-slate-700">
                Waiting Queue Position: <span className="font-bold text-emerald-700">#{issuedTicket.waitingNumber}</span>
              </p>
              <div className="inline-block bg-slate-100 px-2.5 py-1 rounded-md text-[11px] text-slate-600 font-mono">
                Booking ID: {issuedTicket.id}
              </div>
            </div>

            {/* Middle: Live Estimate & Doctor Details */}
            <div className="space-y-3">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                  <Clock className="w-4 h-4 shrink-0" />
                  <span>Reporting Guidance</span>
                </div>
                {(() => {
                  const est = calculateQueueEstimate(
                    issuedTicket,
                    counter,
                    activeDepartment.avgConsultationTime
                  );
                  return (
                    <div className="mt-2 text-xs text-emerald-950 space-y-1">
                      <p>
                        Currently inside room: <strong className="font-mono">#{counter.currentServing || 1}</strong>
                      </p>
                      <p>
                        Estimated Turn: <strong>{est.estimatedCallTime}</strong>
                      </p>
                      <p className="text-[11px] text-emerald-800">
                        Please arrive outside {issuedTicket.roomNumber} at least 15 minutes before your turn.
                      </p>
                    </div>
                  );
                })()}
              </div>

              <div className="text-xs text-slate-600 space-y-1">
                <p><strong>Patient:</strong> {issuedTicket.patientName} ({issuedTicket.age}y, {issuedTicket.gender})</p>
                <p><strong>Consultant:</strong> {issuedTicket.doctorName}</p>
                <p><strong>SMS Alert Sent To:</strong> +91 {issuedTicket.phone}</p>
                {issuedTicket.abhaId && <p><strong>ABHA:</strong> {issuedTicket.abhaId}</p>}
              </div>
            </div>

            {/* Right: Gate Pass QR Code */}
            <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
              <TicketQRCode
                value={`SEHATQUEUE:${issuedTicket.hospitalId}:${issuedTicket.ticketNumber}:${issuedTicket.appointmentDate}:${issuedTicket.id}`}
                size={110}
              />
              <p className="text-[10px] text-slate-500 mt-2">Show this QR to hospital gate guard & room attendant</p>
            </div>
          </div>
        </div>
      )}

      {/* 80mm Thermal Receipt Modal */}
      {showThermalModal && issuedTicket && (
        <ThermalReceipt
          ticket={issuedTicket}
          hospital={currentHospital}
          department={activeDepartment}
          onClose={() => setShowThermalModal(false)}
        />
      )}

      {/* MAIN BOOKING FORM */}
      {activeSubTab === 'book' && !issuedTicket && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Cascading Booking Form */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">
                  1
                </span>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                  Hospital & Department Selection
                </h3>
              </div>
              <button
                type="button"
                onClick={handleQuickFillDemo}
                className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-md cursor-pointer transition-colors"
                title="Quick fill with realistic Kashmir patient data"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Auto-Fill Demo</span>
              </button>
            </div>

            <form onSubmit={handleBookTicket} className="space-y-6">
              {/* Step 1: Hospital & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Select Hospital / ہسپتال منتخب کریں
                  </label>
                  <select
                    value={selectedHospitalId}
                    onChange={(e) => {
                      setSelectedHospitalId(e.target.value);
                      // Update active department to the first in selected hospital
                      const depts = departments.filter((d) => d.hospitalId === e.target.value);
                      if (depts.length > 0) setSelectedDepartmentId(depts[0].id);
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  >
                    {hospitals.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name} ({h.district})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Appointment Date / تاریخ
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedDate(todayStr)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        selectedDate === todayStr
                          ? 'bg-emerald-50 border-emerald-600 text-emerald-800 shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      Today ({todayStr.slice(5)})
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedDate(tomorrowStr)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        selectedDate === tomorrowStr
                          ? 'bg-emerald-50 border-emerald-600 text-emerald-800 shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      Tomorrow ({tomorrowStr.slice(5)})
                    </button>
                  </div>
                </div>
              </div>

              {/* Step 2: Department / Symptom Category with real-time room & doctor preview */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Select Department / شعبہ
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {hospitalDepartments.map((dept) => {
                    const isSelected = dept.id === activeDepartment.id;
                    return (
                      <button
                        key={dept.id}
                        type="button"
                        onClick={() => setSelectedDepartmentId(dept.id)}
                        className={`text-left p-3 rounded-xl border-2 transition-all cursor-pointer ${
                          isSelected
                            ? 'border-emerald-600 bg-emerald-50/60 shadow-xs'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-slate-900">{dept.name}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 font-bold">
                            {dept.prefix}
                          </span>
                        </div>
                        {language === 'BILINGUAL' && (
                          <p className="text-[11px] text-slate-500 font-arabic mt-0.5">{dept.urduName}</p>
                        )}
                        <p className="text-[10px] text-slate-500 mt-1 truncate">
                          Symptoms: {dept.symptoms.slice(0, 3).join(', ')}...
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 3: Patient Demographic Details */}
              <div className="pt-2 border-t border-slate-100 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">
                    2
                  </span>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                    Patient Details / مریض کی تفصیلات
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Full Name / پورا نام <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Ghulam Hassan Mir"
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      className={`w-full bg-slate-50 border rounded-xl py-2 px-3 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500 ${
                        formErrors.patientName ? 'border-red-500' : 'border-slate-200'
                      }`}
                    />
                    {formErrors.patientName && (
                      <p className="text-[11px] text-red-600 mt-1">{formErrors.patientName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Age / عمر <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      placeholder="Years"
                      min="1"
                      max="120"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      className={`w-full bg-slate-50 border rounded-xl py-2 px-3 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500 ${
                        formErrors.age ? 'border-red-500' : 'border-slate-200'
                      }`}
                    />
                    {formErrors.age && <p className="text-[11px] text-red-600 mt-1">{formErrors.age}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Gender / جنس
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

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Mobile Number (for SMS token alert) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">+91</span>
                      <input
                        type="tel"
                        placeholder="10-digit mobile (e.g. 9419012345)"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className={`w-full pl-11 pr-3 py-2 bg-slate-50 border rounded-xl text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500 ${
                          formErrors.phone ? 'border-red-500' : 'border-slate-200'
                        }`}
                      />
                    </div>
                    {formErrors.phone && <p className="text-[11px] text-red-600 mt-1">{formErrors.phone}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Address / علاقہ / ضلع
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Karan Nagar, Srinagar"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      ABHA ID (Ayushman Bharat - Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="XX-XXXX-XXXX-XXXX (14 Digits)"
                      value={abhaId}
                      onChange={handleAbhaChange}
                      className={`w-full bg-slate-50 border rounded-xl py-2 px-3 text-xs font-mono font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500 ${
                        formErrors.abhaId ? 'border-red-500' : 'border-slate-200'
                      }`}
                    />
                    {formErrors.abhaId && <p className="text-[11px] text-red-600 mt-1">{formErrors.abhaId}</p>}
                  </div>
                </div>
              </div>

              {/* Step 4: Government Micro-Fee & UPI Payment Simulation */}
              <div className="pt-2 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">
                      3
                    </span>
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                      Registration Fee / رجسٹریشن فیس
                    </h3>
                  </div>
                  <span className="font-extrabold text-sm sm:text-base text-emerald-800 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200">
                    Govt. Fee: ₹{currentHospital.feeAmount}
                  </span>
                </div>

                <p className="text-xs text-slate-500">
                  Select payment mode to confirm digital slot. Receipt is generated instantly.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('UPI_GPAY')}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                      paymentMethod === 'UPI_GPAY'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-xs'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <div className="font-bold text-xs">Google Pay / UPI</div>
                    <div className="text-[10px] text-slate-500">Fast UPI Intent</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('MPAY_DELIGHT')}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                      paymentMethod === 'MPAY_DELIGHT'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-xs'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <div className="font-bold text-xs">J&K Bank mPay</div>
                    <div className="text-[10px] text-slate-500">Kashmir local banking</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('CASH_WINDOW')}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all col-span-2 sm:col-span-1 ${
                      paymentMethod === 'CASH_WINDOW'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-xs'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <div className="font-bold text-xs">Pay at Window</div>
                    <div className="text-[10px] text-slate-500">Fast-track physical cash</div>
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting || remainingCapacity <= 0}
                  className="w-full py-3.5 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-extrabold shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>Allocating Sequential Token...</span>
                  ) : (
                    <>
                      <span>Generate OPD Token & Gate Pass (₹{currentHospital.feeAmount})</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Right Col: Real-Time Department & Doctor Duty Card */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <Stethoscope className="w-5 h-5 text-emerald-600" />
                <div>
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500">
                    Assigned OPD Unit
                  </h4>
                  <div className="font-extrabold text-slate-900 text-sm">
                    {activeDepartment.roomNumber}
                  </div>
                </div>
              </div>

              {/* Doctor on duty */}
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                  Doctor on Duty Today
                </span>
                <p className="font-bold text-sm text-slate-900">{activeDoctor.name}</p>
                {language === 'BILINGUAL' && (
                  <p className="text-xs text-slate-500 font-arabic">{activeDoctor.urduName}</p>
                )}
                <p className="text-xs text-slate-600 font-medium">{activeDoctor.specialization}</p>
                <p className="text-[11px] text-slate-500">{activeDoctor.qualification}</p>
              </div>

              {/* Live Queue Pulse */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 font-medium">Currently in Doctor Room:</span>
                  <span className="font-mono font-bold text-emerald-700">
                    Token #{currentServingNumber || 'Not Started'}
                  </span>
                </div>

                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 font-medium">Tokens Issued Today:</span>
                  <span className="font-mono font-bold text-slate-900">{counter.seq}</span>
                </div>

                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 font-medium">Available Slots Remaining:</span>
                  <span className="font-bold text-emerald-700">{remainingCapacity} of {activeDepartment.dailyCapacity}</span>
                </div>

                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 font-medium">Avg Consultation:</span>
                  <span className="font-semibold text-slate-700">~{activeDepartment.avgConsultationTime} minutes</span>
                </div>
              </div>

              {/* ABHA Badge Notice */}
              <div className="p-3 bg-blue-50/70 border border-blue-200/60 rounded-xl text-[11px] text-blue-900 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <Shield className="w-3.5 h-3.5 text-blue-700" />
                  <span>Ayushman Bharat (ABHA) Ready</span>
                </div>
                <p className="text-blue-800 leading-relaxed">
                  Your token syncs directly with J&K e-Hospital records. Present your digital slip or SMS at the OPD window.
                </p>
              </div>
            </div>

            {/* Emergency OPD notice */}
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 space-y-1">
              <p className="font-bold">🚨 Emergency & Trauma Patients</p>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Emergency patients do NOT need routine OPD tokens. Please report directly to Emergency Triage (Trauma Wing) for immediate care.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

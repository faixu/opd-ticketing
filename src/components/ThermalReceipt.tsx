import React from 'react';
import { Ticket, Hospital, Department } from '../types';
import { TicketQRCode } from './TicketQRCode';
import { Printer, X, Download, ShieldCheck } from 'lucide-react';

interface ThermalReceiptProps {
  ticket: Ticket;
  hospital: Hospital;
  department: Department;
  onClose?: () => void;
  showModalOverlay?: boolean;
}

export const ThermalReceipt: React.FC<ThermalReceiptProps> = ({
  ticket,
  hospital,
  department,
  onClose,
  showModalOverlay = true,
}) => {
  const handlePrint = () => {
    window.print();
  };

  const receiptContent = (
    <div
      id="thermal-print-area"
      className="bg-white text-slate-900 font-mono text-xs p-5 max-w-[340px] mx-auto border-2 border-dashed border-slate-300 shadow-lg rounded-sm"
    >
      {/* Header */}
      <div className="text-center border-b border-black pb-2 mb-2">
        <p className="text-[10px] tracking-wider uppercase font-sans text-slate-700 font-semibold">
          GOVT. OF JAMMU & KASHMIR
        </p>
        <p className="text-[9px] uppercase font-sans text-slate-600">
          Department of Health & Medical Education
        </p>
        <h2 className="text-sm font-bold uppercase mt-1 tracking-tight text-black">
          {hospital.name}
        </h2>
        <p className="text-[10px] text-slate-600">{hospital.location}</p>
        <div className="mt-1 inline-block border border-black px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest">
          OPD REGISTRATION SLIP
        </div>
      </div>

      {/* Main Token Highlight */}
      <div className="text-center my-3 py-2 bg-slate-50 border-y-2 border-black">
        <div className="text-[10px] text-slate-600 font-bold uppercase">TOKEN NUMBER / ٹوکن نمبر</div>
        <div className="text-3xl font-extrabold tracking-tight text-black my-0.5">
          {ticket.ticketNumber}
        </div>
        <div className="text-xs font-bold text-emerald-800 uppercase">
          {department.roomNumber} • {department.floor}
        </div>
      </div>

      {/* Details Grid */}
      <div className="space-y-1 text-[11px] border-b border-black pb-2 mb-2">
        <div className="flex justify-between">
          <span className="text-slate-600">Dept:</span>
          <span className="font-bold text-right">{department.name}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-600">Doctor:</span>
          <span className="font-bold text-right truncate max-w-[190px]">{ticket.doctorName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-600">Date:</span>
          <span className="font-semibold">{ticket.appointmentDate}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-600">Issue Time:</span>
          <span>{new Date(ticket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>

      {/* Patient Information */}
      <div className="space-y-1 text-[11px] border-b border-black pb-2 mb-2">
        <div className="flex justify-between">
          <span className="text-slate-600">Patient:</span>
          <span className="font-bold uppercase text-right truncate max-w-[180px]">{ticket.patientName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-600">Age / Sex:</span>
          <span>{ticket.age} Yrs / {ticket.gender}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-600">Mobile:</span>
          <span className="font-semibold">{ticket.phone}</span>
        </div>
        {ticket.address && (
          <div className="flex justify-between">
            <span className="text-slate-600">Address:</span>
            <span className="truncate max-w-[180px] text-right">{ticket.address}</span>
          </div>
        )}
        <div className="flex justify-between items-center text-[10px]">
          <span className="text-slate-600">ABHA ID:</span>
          <span className="font-mono">{ticket.abhaId || 'NOT LINKED'}</span>
        </div>
        <div className="flex justify-between items-center pt-1">
          <span className="text-slate-600">Reg. Fee:</span>
          <span className="font-bold text-xs">₹{ticket.fee} ({ticket.paymentStatus})</span>
        </div>
        <div className="flex justify-between text-[10px] text-slate-500">
          <span>Type:</span>
          <span className="uppercase font-semibold">{ticket.bookingType} • {ticket.paymentMethod?.replace('_', ' ') || 'COUNTER'}</span>
        </div>
      </div>

      {/* QR Code and Barcode */}
      <div className="flex flex-col items-center justify-center my-2 text-center">
        <TicketQRCode
          value={`SEHATQUEUE:${ticket.hospitalId}:${ticket.ticketNumber}:${ticket.appointmentDate}:${ticket.id}`}
          size={95}
        />
        <p className="text-[9px] text-slate-600 mt-1">Scan for gate security & pharmacy</p>
      </div>

      {/* Footer Instructions */}
      <div className="text-center text-[9px] text-slate-600 pt-2 border-t border-dashed border-slate-400 space-y-0.5">
        <p className="font-semibold text-slate-800">NOTICE TO PATIENTS</p>
        <p>1. Valid only on date of issue for single consultation.</p>
        <p>2. Watch queue screen outside {department.roomNumber}.</p>
        <p>3. If skipped, contact room compounder with this slip.</p>
        <p className="font-sans text-[8px] text-slate-400 pt-1">SEHATQUEUE J&K • DIGITAL HEALTH MISSION</p>
      </div>
    </div>
  );

  if (!showModalOverlay) {
    return (
      <div className="space-y-3">
        {receiptContent}
        <div className="flex justify-center gap-2 no-print">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-md text-xs font-semibold hover:bg-slate-800 cursor-pointer shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            Print 80mm Slip
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) onClose();
      }}
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-4 relative max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0 no-print">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-bold text-sm text-slate-900">Hospital Thermal Slip</h3>
              <p className="text-xs text-slate-500">Official OPD Registration Record</p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              aria-label="Close dialog"
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="py-4 flex justify-center bg-slate-100 rounded-lg my-2 overflow-y-auto flex-1">
          {receiptContent}
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 shrink-0 no-print">
          {onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              Close
            </button>
          )}
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 cursor-pointer shadow-xs"
          >
            <Printer className="w-4 h-4" />
            Print 80mm Slip
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { useQueue } from '../context/QueueContext';
import {
  MessageSquare,
  X,
  Phone,
  Clock,
  Send,
  Smartphone,
  ShieldCheck,
  Radio,
  Trash2,
} from 'lucide-react';

interface NotificationSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationSimulatorModal: React.FC<NotificationSimulatorModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { notifications } = useQueue();
  const [selectedNotifId, setSelectedNotifId] = useState<string | null>(null);

  if (!isOpen) return null;

  const activeNotif = notifications.find((n) => n.id === selectedNotifId) || notifications[0];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-6 relative flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <MessageSquare className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-slate-900">
                  Low-Bandwidth SMS / WhatsApp Notification Simulator
                </h3>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                  Fast2SMS / NIC Gateway
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Automated SMS alerts dispatched to patients when booked, 4 patients away, and called.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Split view with SMS logs on left, Feature Phone Preview on right */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 py-4 overflow-y-auto flex-1">
          {/* Left: Sent SMS Feed (7 cols) */}
          <div className="md:col-span-7 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Dispatched SMS Feed ({notifications.length})
              </span>
              <span className="text-[10px] text-slate-400">Low-latency queue trigger</span>
            </div>

            {notifications.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                No notification alerts dispatched yet. Book a ticket or advance doctor queue.
              </div>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                {notifications.map((notif) => {
                  const isSelected = activeNotif?.id === notif.id;
                  return (
                    <div
                      key={notif.id}
                      onClick={() => setSelectedNotifId(notif.id)}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-emerald-50/80 border-emerald-500 shadow-xs'
                          : 'bg-slate-50 border-slate-200 hover:bg-slate-100/70'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="font-mono font-bold text-slate-900">
                          To: +91 {notif.recipientPhone}
                        </span>
                        <span className="text-slate-400 font-mono text-[10px]">
                          {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div className="text-xs text-slate-700 line-clamp-2 font-medium">
                        {notif.message}
                      </div>

                      <div className="flex items-center gap-2 mt-2 text-[10px]">
                        <span className="font-bold text-emerald-800 bg-emerald-100/70 px-1.5 py-0.5 rounded-sm">
                          {notif.tokenNumber}
                        </span>
                        <span className="text-slate-500">{notif.patientName}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right: Phone Screen Mockup (5 cols) */}
          <div className="md:col-span-5 flex flex-col items-center justify-center bg-slate-100 rounded-2xl p-4 border border-slate-200">
            <div className="w-[230px] bg-slate-900 rounded-3xl p-3 shadow-xl border-4 border-slate-800 text-white">
              {/* Phone Speaker Notch */}
              <div className="w-16 h-2 bg-slate-800 rounded-full mx-auto mb-2"></div>

              {/* Phone Screen */}
              <div className="bg-slate-50 rounded-2xl p-3 text-slate-900 min-h-[300px] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 mb-2">
                    <span className="text-[9px] font-bold text-slate-600">SEHAT-JK (SMS)</span>
                    <span className="text-[9px] text-slate-400">Now</span>
                  </div>

                  {activeNotif ? (
                    <div className="bg-emerald-100/80 text-emerald-950 p-2.5 rounded-xl text-[11px] leading-relaxed font-sans shadow-2xs border border-emerald-200">
                      {activeNotif.message}
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-400 text-center py-8">
                      Select an alert to preview
                    </p>
                  )}
                </div>

                <div className="pt-2 text-center text-[8px] text-slate-400">
                  Delivered via SMS • No mobile internet needed inside hospital
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 cursor-pointer"
          >
            Close Simulator
          </button>
        </div>
      </div>
    </div>
  );
};

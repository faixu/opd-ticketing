import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Hospital, Department, Doctor, QueueCounter, Ticket, BookingType, PaymentMethod, PaymentStatus } from '../types';
import { INITIAL_HOSPITALS, INITIAL_DEPARTMENTS, INITIAL_DOCTORS } from '../data/mockData';
import { formatTokenNumber, getCounterId, advanceQueue, generateNotificationText } from '../utils/queueLogic';
import { announcer } from '../utils/audioAnnouncer';

interface BookingParams {
  hospitalId: string;
  departmentId: string;
  doctorId: string;
  appointmentDate: string;
  bookingType: BookingType;
  patientName: string;
  age: number;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  phone: string;
  address: string;
  abhaId?: string;
  paymentMethod?: PaymentMethod;
  paymentStatus?: PaymentStatus;
}

interface NotificationItem {
  id: string;
  timestamp: string;
  recipientPhone: string;
  patientName: string;
  tokenNumber: string;
  type: 'SMS' | 'WHATSAPP';
  message: string;
}

interface QueueContextType {
  hospitals: Hospital[];
  departments: Department[];
  doctors: Doctor[];
  counters: Record<string, QueueCounter>;
  tickets: Ticket[];
  notifications: NotificationItem[];
  selectedHospitalId: string;
  setSelectedHospitalId: (id: string) => void;
  language: 'EN' | 'BILINGUAL';
  setLanguage: (lang: 'EN' | 'BILINGUAL') => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  voiceEnabled: boolean;
  setVoiceEnabled: (enabled: boolean) => void;
  bookTicket: (params: BookingParams) => Ticket;
  advanceDoctorQueue: (departmentId: string, action: 'NEXT' | 'SKIP' | 'RECALL', date?: string, recalledToken?: number) => void;
  getCounter: (hospitalId: string, departmentId: string, date: string) => QueueCounter;
  getTicketsForDepartment: (departmentId: string, date: string) => Ticket[];
  getTicketById: (ticketId: string) => Ticket | undefined;
  findTicketByNumberOrPhone: (query: string) => Ticket[];
  latestCalledTicket: { token: string; room: string; time: string } | null;
  clearAllData: () => void;
}

const QueueContext = createContext<QueueContextType | undefined>(undefined);

const STORAGE_KEYS = {
  TICKETS: 'sehatqueue_tickets_v1',
  COUNTERS: 'sehatqueue_counters_v1',
  NOTIFICATIONS: 'sehatqueue_notifications_v1',
  SETTINGS: 'sehatqueue_settings_v1',
};

// Standard today's date formatted as YYYY-MM-DD
export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Initial seed tickets to make the system instantly feel live and active
function createSeedData(): { tickets: Ticket[]; counters: Record<string, QueueCounter> } {
  const today = getTodayDateString();
  const medCounterId = getCounterId('smhs-sgr', 'smhs-med', today);
  const ortCounterId = getCounterId('smhs-sgr', 'smhs-ort', today);

  const initialCounters: Record<string, QueueCounter> = {
    [medCounterId]: {
      id: medCounterId,
      hospitalId: 'smhs-sgr',
      departmentId: 'smhs-med',
      date: today,
      seq: 7,
      currentServing: 3,
      skippedTokens: [],
      completedCount: 2,
      lastUpdated: new Date().toISOString(),
    },
    [ortCounterId]: {
      id: ortCounterId,
      hospitalId: 'smhs-sgr',
      departmentId: 'smhs-ort',
      date: today,
      seq: 4,
      currentServing: 2,
      skippedTokens: [1],
      completedCount: 0,
      lastUpdated: new Date().toISOString(),
    },
  };

  const initialTickets: Ticket[] = [
    {
      id: 't-med-1',
      ticketNumber: 'MED-001',
      waitingNumber: 1,
      hospitalId: 'smhs-sgr',
      departmentId: 'smhs-med',
      doctorId: 'doc-1',
      doctorName: 'Dr. Tariq Ahmad Mir',
      roomNumber: 'Room 104',
      appointmentDate: today,
      bookingType: 'WALK_IN',
      patientName: 'Mohammad Subhan Dar',
      age: 62,
      gender: 'MALE',
      phone: '9419012345',
      address: 'Nowhatta, Srinagar',
      abhaId: '14-8821-4412-9011',
      paymentStatus: 'PAID',
      paymentMethod: 'CASH_WINDOW',
      fee: 10,
      status: 'COMPLETED',
      createdAt: new Date(Date.now() - 65 * 60000).toISOString(),
      calledAt: new Date(Date.now() - 55 * 60000).toISOString(),
      completedAt: new Date(Date.now() - 40 * 60000).toISOString(),
    },
    {
      id: 't-med-2',
      ticketNumber: 'MED-002',
      waitingNumber: 2,
      hospitalId: 'smhs-sgr',
      departmentId: 'smhs-med',
      doctorId: 'doc-1',
      doctorName: 'Dr. Tariq Ahmad Mir',
      roomNumber: 'Room 104',
      appointmentDate: today,
      bookingType: 'ONLINE',
      patientName: 'Fatima Zohra',
      age: 38,
      gender: 'FEMALE',
      phone: '9906512345',
      address: 'Rajbagh, Srinagar',
      abhaId: '14-3321-7712-4501',
      paymentStatus: 'PAID',
      paymentMethod: 'UPI_GPAY',
      fee: 10,
      status: 'COMPLETED',
      createdAt: new Date(Date.now() - 50 * 60000).toISOString(),
      calledAt: new Date(Date.now() - 35 * 60000).toISOString(),
      completedAt: new Date(Date.now() - 20 * 60000).toISOString(),
    },
    {
      id: 't-med-3',
      ticketNumber: 'MED-003',
      waitingNumber: 3,
      hospitalId: 'smhs-sgr',
      departmentId: 'smhs-med',
      doctorId: 'doc-1',
      doctorName: 'Dr. Tariq Ahmad Mir',
      roomNumber: 'Room 104',
      appointmentDate: today,
      bookingType: 'ONLINE',
      patientName: 'Bashir Ahmad Wani',
      age: 52,
      gender: 'MALE',
      phone: '7006123456',
      address: 'Soura, Srinagar',
      abhaId: '14-5511-9988-1234',
      paymentStatus: 'PAID',
      paymentMethod: 'MPAY_DELIGHT',
      fee: 10,
      status: 'IN_PROGRESS',
      createdAt: new Date(Date.now() - 40 * 60000).toISOString(),
      calledAt: new Date(Date.now() - 10 * 60000).toISOString(),
    },
    {
      id: 't-med-4',
      ticketNumber: 'MED-004',
      waitingNumber: 4,
      hospitalId: 'smhs-sgr',
      departmentId: 'smhs-med',
      doctorId: 'doc-1',
      doctorName: 'Dr. Tariq Ahmad Mir',
      roomNumber: 'Room 104',
      appointmentDate: today,
      bookingType: 'WALK_IN',
      patientName: 'Naseema Akhtar',
      age: 46,
      gender: 'FEMALE',
      phone: '9797812345',
      address: 'Habba Kadal, Srinagar',
      paymentStatus: 'PAID',
      paymentMethod: 'CASH_WINDOW',
      fee: 10,
      status: 'WAITING',
      createdAt: new Date(Date.now() - 30 * 60000).toISOString(),
    },
    {
      id: 't-med-5',
      ticketNumber: 'MED-005',
      waitingNumber: 5,
      hospitalId: 'smhs-sgr',
      departmentId: 'smhs-med',
      doctorId: 'doc-1',
      doctorName: 'Dr. Tariq Ahmad Mir',
      roomNumber: 'Room 104',
      appointmentDate: today,
      bookingType: 'ONLINE',
      patientName: 'Bilal Ahmad Bhat',
      age: 29,
      gender: 'MALE',
      phone: '9622912345',
      address: 'Lal Bazar, Srinagar',
      abhaId: '14-2200-8844-6721',
      paymentStatus: 'PAID',
      paymentMethod: 'UPI_PHONEPE',
      fee: 10,
      status: 'WAITING',
      createdAt: new Date(Date.now() - 25 * 60000).toISOString(),
    },
    {
      id: 't-med-6',
      ticketNumber: 'MED-006',
      waitingNumber: 6,
      hospitalId: 'smhs-sgr',
      departmentId: 'smhs-med',
      doctorId: 'doc-1',
      doctorName: 'Dr. Tariq Ahmad Mir',
      roomNumber: 'Room 104',
      appointmentDate: today,
      bookingType: 'WALK_IN',
      patientName: 'Parveena Bano',
      age: 50,
      gender: 'FEMALE',
      phone: '9596312345',
      address: 'Khanyar, Srinagar',
      paymentStatus: 'PAID',
      paymentMethod: 'CASH_WINDOW',
      fee: 10,
      status: 'WAITING',
      createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
    },
    {
      id: 't-med-7',
      ticketNumber: 'MED-007',
      waitingNumber: 7,
      hospitalId: 'smhs-sgr',
      departmentId: 'smhs-med',
      doctorId: 'doc-1',
      doctorName: 'Dr. Tariq Ahmad Mir',
      roomNumber: 'Room 104',
      appointmentDate: today,
      bookingType: 'ONLINE',
      patientName: 'Owais Rasool',
      age: 24,
      gender: 'MALE',
      phone: '9086112233',
      address: 'Batmaloo, Srinagar',
      paymentStatus: 'PAID',
      paymentMethod: 'UPI_GPAY',
      fee: 10,
      status: 'WAITING',
      createdAt: new Date(Date.now() - 5 * 60000).toISOString(),
    },
  ];

  return { tickets: initialTickets, counters: initialCounters };
}

export const QueueProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedHospitalId, setSelectedHospitalId] = useState<string>('smhs-sgr');
  const [language, setLanguage] = useState<'EN' | 'BILINGUAL'>('BILINGUAL');
  const [soundEnabled, setSoundEnabledState] = useState<boolean>(true);
  const [voiceEnabled, setVoiceEnabledState] = useState<boolean>(true);
  const [latestCalledTicket, setLatestCalledTicket] = useState<{ token: string; room: string; time: string } | null>(null);

  // Tickets, counters, and SMS/WhatsApp notifications state
  const [tickets, setTickets] = useState<Ticket[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TICKETS);
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    return createSeedData().tickets;
  });

  const [counters, setCounters] = useState<Record<string, QueueCounter>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.COUNTERS);
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    return createSeedData().counters;
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    const today = getTodayDateString();
    return [
      {
        id: 'notif-seed-1',
        timestamp: new Date(Date.now() - 40 * 60000).toISOString(),
        recipientPhone: '7006123456',
        patientName: 'Bashir Ahmad Wani',
        tokenNumber: 'MED-003',
        type: 'SMS',
        message: `[OPD Ticket Confirmed] Token MED-003 for Bashir Ahmad Wani. Room: Room 104. Date: ${today}. Arrive 15 mins prior.`,
      },
      {
        id: 'notif-seed-2',
        timestamp: new Date(Date.now() - 10 * 60000).toISOString(),
        recipientPhone: '7006123456',
        patientName: 'Bashir Ahmad Wani',
        tokenNumber: 'MED-003',
        type: 'SMS',
        message: `[NOW SERVING] Token MED-003 (Bashir Ahmad Wani): Please proceed inside Room 104 immediately for consultation.`,
      },
    ];
  });

  // Sync sound settings with audio announcer
  const setSoundEnabled = (enabled: boolean) => {
    setSoundEnabledState(enabled);
    announcer.soundEnabled = enabled;
  };

  const setVoiceEnabled = (enabled: boolean) => {
    setVoiceEnabledState(enabled);
    announcer.speechEnabled = enabled;
  };

  // Cross-tab broadcast channel for real-time synchronization
  useEffect(() => {
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel('sehatqueue_sync_channel');
      channel.onmessage = (event) => {
        if (event.data?.type === 'SYNC_ALL') {
          if (event.data.tickets) setTickets(event.data.tickets);
          if (event.data.counters) setCounters(event.data.counters);
          if (event.data.notifications) setNotifications(event.data.notifications);
          if (event.data.called) setLatestCalledTicket(event.data.called);
        }
      };
    } catch {
      // Ignore if BroadcastChannel not supported
    }

    return () => {
      channel?.close();
    };
  }, []);

  const broadcastState = useCallback((newTickets: Ticket[], newCounters: Record<string, QueueCounter>, newNotifs: NotificationItem[], called?: { token: string; room: string; time: string }) => {
    try {
      localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(newTickets));
      localStorage.setItem(STORAGE_KEYS.COUNTERS, JSON.stringify(newCounters));
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(newNotifs));

      const channel = new BroadcastChannel('sehatqueue_sync_channel');
      channel.postMessage({
        type: 'SYNC_ALL',
        tickets: newTickets,
        counters: newCounters,
        notifications: newNotifs,
        called,
      });
      channel.close();
    } catch {
      // Ignore local storage / broadcast errors
    }
  }, []);

  // Atomic counter getter or initializer
  const getCounter = useCallback((hospitalId: string, departmentId: string, date: string): QueueCounter => {
    const counterId = getCounterId(hospitalId, departmentId, date);
    if (counters[counterId]) {
      return counters[counterId];
    }
    return {
      id: counterId,
      hospitalId,
      departmentId,
      date,
      seq: 0,
      currentServing: 0,
      skippedTokens: [],
      completedCount: 0,
      lastUpdated: new Date().toISOString(),
    };
  }, [counters]);

  // Book a ticket atomically
  const bookTicket = useCallback((params: BookingParams): Ticket => {
    const hospital = INITIAL_HOSPITALS.find((h) => h.id === params.hospitalId) || INITIAL_HOSPITALS[0];
    const department = INITIAL_DEPARTMENTS.find((d) => d.id === params.departmentId) || INITIAL_DEPARTMENTS[0];
    const doctor = INITIAL_DOCTORS.find((doc) => doc.id === params.doctorId) || INITIAL_DOCTORS[0];

    const counterId = getCounterId(params.hospitalId, params.departmentId, params.appointmentDate);
    const currentCounter = counters[counterId] || {
      id: counterId,
      hospitalId: params.hospitalId,
      departmentId: params.departmentId,
      date: params.appointmentDate,
      seq: 0,
      currentServing: 0,
      skippedTokens: [],
      completedCount: 0,
      lastUpdated: new Date().toISOString(),
    };

    // 1. Atomically increment sequence for this department & date
    const nextSeq = currentCounter.seq + 1;
    const formattedToken = formatTokenNumber(department.prefix, nextSeq);

    const updatedCounter: QueueCounter = {
      ...currentCounter,
      seq: nextSeq,
      // If current serving is 0 (day hasn't started), keep at 0 until doctor hits Next
      currentServing: currentCounter.currentServing || 0,
      lastUpdated: new Date().toISOString(),
    };

    // 2. Create the Ticket
    const ticketId = `t-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newTicket: Ticket = {
      id: ticketId,
      ticketNumber: formattedToken,
      waitingNumber: nextSeq,
      hospitalId: params.hospitalId,
      departmentId: params.departmentId,
      doctorId: params.doctorId,
      doctorName: doctor.name,
      roomNumber: department.roomNumber,
      appointmentDate: params.appointmentDate,
      bookingType: params.bookingType,
      patientName: params.patientName.trim(),
      age: params.age,
      gender: params.gender,
      phone: params.phone.trim(),
      address: params.address.trim(),
      abhaId: params.abhaId?.trim() || undefined,
      paymentStatus: params.paymentStatus || (params.bookingType === 'ONLINE' ? 'PAID' : 'PAID'),
      paymentMethod: params.paymentMethod || (params.bookingType === 'ONLINE' ? 'UPI_GPAY' : 'CASH_WINDOW'),
      fee: hospital.feeAmount,
      status: 'WAITING',
      createdAt: new Date().toISOString(),
    };

    // 3. Generate SMS alert log
    const smsMessage = generateNotificationText(newTicket, 'BOOKED', department.roomNumber);
    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      timestamp: new Date().toISOString(),
      recipientPhone: newTicket.phone,
      patientName: newTicket.patientName,
      tokenNumber: newTicket.ticketNumber,
      type: 'SMS',
      message: smsMessage,
    };

    const nextTickets = [newTicket, ...tickets];
    const nextCounters = { ...counters, [counterId]: updatedCounter };
    const nextNotifs = [newNotif, ...notifications];

    setTickets(nextTickets);
    setCounters(nextCounters);
    setNotifications(nextNotifs);

    broadcastState(nextTickets, nextCounters, nextNotifs);

    return newTicket;
  }, [counters, tickets, notifications, broadcastState]);

  // Advance doctor queue (Next, Skip, Recall)
  const advanceDoctorQueue = useCallback((
    departmentId: string,
    action: 'NEXT' | 'SKIP' | 'RECALL',
    date: string = getTodayDateString(),
    recalledToken?: number
  ) => {
    const department = INITIAL_DEPARTMENTS.find((d) => d.id === departmentId);
    if (!department) return;

    const counterId = getCounterId(department.hospitalId, departmentId, date);
    const currentCounter = counters[counterId] || {
      id: counterId,
      hospitalId: department.hospitalId,
      departmentId,
      date,
      seq: 0,
      currentServing: 0,
      skippedTokens: [],
      completedCount: 0,
      lastUpdated: new Date().toISOString(),
    };

    const result = advanceQueue(currentCounter, action, recalledToken);
    const newServing = result.newServing;
    const prevServing = result.previousServing;

    // Update tickets status accordingly
    const updatedTickets = tickets.map((t) => {
      if (t.departmentId !== departmentId || t.appointmentDate !== date) {
        return t;
      }

      // If this was the previous serving ticket
      if (t.waitingNumber === prevServing) {
        if (action === 'SKIP') {
          return { ...t, status: 'SKIPPED' as const, skippedAt: new Date().toISOString() };
        } else if (action === 'NEXT') {
          return { ...t, status: 'COMPLETED' as const, completedAt: new Date().toISOString() };
        }
      }

      // If this is the newly called ticket
      if (t.waitingNumber === newServing) {
        return { ...t, status: 'IN_PROGRESS' as const, calledAt: new Date().toISOString() };
      }

      return t;
    });

    const nextCounters = { ...counters, [counterId]: result.nextCounter };

    // Format new token string
    const newServingToken = formatTokenNumber(department.prefix, newServing);

    // Audio chime & speech callout
    announcer.announceToken(newServingToken, department.roomNumber);

    const callInfo = {
      token: newServingToken,
      room: department.roomNumber,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setLatestCalledTicket(callInfo);

    // Check if any waiting tickets need low-bandwidth SMS alerts:
    // 1) Patient called right now
    // 2) Patient whose turn is within next 4 tokens
    const newNotifs = [...notifications];
    const calledTicket = updatedTickets.find((t) => t.departmentId === departmentId && t.waitingNumber === newServing);
    if (calledTicket) {
      newNotifs.unshift({
        id: `notif-called-${Date.now()}`,
        timestamp: new Date().toISOString(),
        recipientPhone: calledTicket.phone,
        patientName: calledTicket.patientName,
        tokenNumber: calledTicket.ticketNumber,
        type: 'SMS',
        message: generateNotificationText(calledTicket, 'CALLED_NOW', department.roomNumber),
      });
    }

    // Near turn alert for waiting number = newServing + 3
    const upcomingTicket = updatedTickets.find(
      (t) => t.departmentId === departmentId && t.waitingNumber === newServing + 3 && t.status === 'WAITING'
    );
    if (upcomingTicket) {
      newNotifs.unshift({
        id: `notif-near-${Date.now()}`,
        timestamp: new Date().toISOString(),
        recipientPhone: upcomingTicket.phone,
        patientName: upcomingTicket.patientName,
        tokenNumber: upcomingTicket.ticketNumber,
        type: 'SMS',
        message: generateNotificationText(upcomingTicket, 'NEAR_TURN', department.roomNumber),
      });
    }

    setTickets(updatedTickets);
    setCounters(nextCounters);
    setNotifications(newNotifs);

    broadcastState(updatedTickets, nextCounters, newNotifs, callInfo);
  }, [counters, tickets, notifications, broadcastState]);

  const getTicketsForDepartment = useCallback((departmentId: string, date: string): Ticket[] => {
    return tickets.filter((t) => t.departmentId === departmentId && t.appointmentDate === date);
  }, [tickets]);

  const getTicketById = useCallback((ticketId: string): Ticket | undefined => {
    return tickets.find((t) => t.id === ticketId);
  }, [tickets]);

  const findTicketByNumberOrPhone = useCallback((query: string): Ticket[] => {
    if (!query || query.trim() === '') return [];
    const clean = query.trim().toUpperCase();
    return tickets.filter(
      (t) =>
        t.ticketNumber.toUpperCase().includes(clean) ||
        t.phone.includes(clean) ||
        t.patientName.toUpperCase().includes(clean)
    );
  }, [tickets]);

  const clearAllData = useCallback(() => {
    const seed = createSeedData();
    setTickets(seed.tickets);
    setCounters(seed.counters);
    setNotifications([]);
    broadcastState(seed.tickets, seed.counters, []);
  }, [broadcastState]);

  return (
    <QueueContext.Provider
      value={{
        hospitals: INITIAL_HOSPITALS,
        departments: INITIAL_DEPARTMENTS,
        doctors: INITIAL_DOCTORS,
        counters,
        tickets,
        notifications,
        selectedHospitalId,
        setSelectedHospitalId,
        language,
        setLanguage,
        soundEnabled,
        setSoundEnabled,
        voiceEnabled,
        setVoiceEnabled,
        bookTicket,
        advanceDoctorQueue,
        getCounter,
        getTicketsForDepartment,
        getTicketById,
        findTicketByNumberOrPhone,
        latestCalledTicket,
        clearAllData,
      }}
    >
      {children}
    </QueueContext.Provider>
  );
};

export const useQueue = (): QueueContextType => {
  const context = useContext(QueueContext);
  if (!context) {
    throw new Error('useQueue must be used within a QueueProvider');
  }
  return context;
};

/**
 * Data structures for OPD Ticketing & Queue Management System
 */

export type BookingType = 'ONLINE' | 'WALK_IN';
export type PaymentStatus = 'PAID' | 'PENDING' | 'EXEMPT';
export type TicketStatus = 'WAITING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED';
export type PaymentMethod = 'UPI_GPAY' | 'UPI_PHONEPE' | 'MPAY_DELIGHT' | 'CASH_WINDOW';

export interface Hospital {
  id: string;
  name: string;
  urduName: string;
  location: string;
  district: string;
  opdTimings: string;
  type: string;
  phone: string;
  feeAmount: number;
}

export interface Department {
  id: string;
  hospitalId: string;
  name: string;
  urduName: string;
  prefix: string;
  roomNumber: string;
  floor: string;
  dailyCapacity: number;
  avgConsultationTime: number; // minutes per patient
  symptoms: string[];
}

export interface Doctor {
  id: string;
  name: string;
  urduName: string;
  departmentId: string;
  hospitalId: string;
  specialization: string;
  qualification: string;
  availableDays: string[]; // ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  assignedRoom: string;
}

export interface QueueCounter {
  id: string; // `${hospitalId}_${departmentId}_${date}`
  hospitalId: string;
  departmentId: string;
  date: string; // YYYY-MM-DD
  seq: number; // last issued token
  currentServing: number; // currently in room (0 if not started)
  skippedTokens: number[];
  completedCount: number;
  lastUpdated: string;
}

export interface Ticket {
  id: string;
  ticketNumber: string; // e.g., 'MED-042'
  waitingNumber: number; // 42
  hospitalId: string;
  departmentId: string;
  doctorId: string;
  doctorName: string;
  roomNumber: string;
  appointmentDate: string; // YYYY-MM-DD
  bookingType: BookingType;
  patientName: string;
  age: number;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  phone: string;
  address: string;
  abhaId?: string; // 14-digit Ayushman Bharat Health Account
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;
  fee: number;
  status: TicketStatus;
  createdAt: string;
  calledAt?: string;
  completedAt?: string;
  skippedAt?: string;
  notificationLog?: {
    timestamp: string;
    type: 'SMS' | 'WHATSAPP';
    message: string;
  }[];
}

export interface QueueEstimate {
  currentServing: number;
  waitingNumber: number;
  peopleAhead: number;
  estimatedWaitMinutes: number;
  estimatedCallTime: string;
  isNowServing: boolean;
  isUpcomingSoon: boolean; // within 3-5 patients
  status: TicketStatus;
}

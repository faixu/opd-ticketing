import { Ticket, QueueCounter, QueueEstimate } from '../types';

/**
 * Formats a sequential number into a standardized token code, e.g., "MED-001"
 */
export function formatTokenNumber(prefix: string, sequenceNumber: number): string {
  const cleanPrefix = (prefix || 'OPD').toUpperCase().trim();
  const padded = String(Math.max(1, Math.floor(sequenceNumber))).padStart(3, '0');
  return `${cleanPrefix}-${padded}`;
}

/**
 * Generates an atomic counter partition key for hospital, department, and appointment date
 */
export function getCounterId(hospitalId: string, departmentId: string, date: string): string {
  return `${hospitalId}_${departmentId}_${date}`;
}

/**
 * Validates and formats 14-digit Indian ABHA (Ayushman Bharat Health Account) ID
 * Accepted formats: 14 digits or 12-3456-7890-1234
 */
export function validateAbhaId(abhaInput?: string): { isValid: boolean; formatted: string; error?: string } {
  if (!abhaInput || abhaInput.trim() === '') {
    return { isValid: true, formatted: '' }; // Optional
  }

  const cleaned = abhaInput.replace(/[^0-9]/g, '');
  if (cleaned.length !== 14) {
    return {
      isValid: false,
      formatted: abhaInput,
      error: 'ABHA number must be exactly 14 digits (e.g. 14-1234-5678-9012)',
    };
  }

  // Format as XX-XXXX-XXXX-XXXX
  const formatted = `${cleaned.slice(0, 2)}-${cleaned.slice(2, 6)}-${cleaned.slice(6, 10)}-${cleaned.slice(10, 14)}`;
  return { isValid: true, formatted };
}

/**
 * Validates Indian 10-digit mobile number
 */
export function validatePhone(phone: string): { isValid: boolean; error?: string } {
  const cleaned = phone.replace(/[^0-9]/g, '');
  // Allows optional leading 91 or 0
  let digits = cleaned;
  if (digits.length === 12 && digits.startsWith('91')) {
    digits = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith('0')) {
    digits = digits.slice(1);
  }

  if (digits.length !== 10) {
    return { isValid: false, error: 'Please enter a valid 10-digit mobile number' };
  }

  // Must begin with 6, 7, 8, or 9
  if (!/^[6-9]/.test(digits)) {
    return { isValid: false, error: 'Mobile number must begin with 6, 7, 8, or 9' };
  }

  return { isValid: true };
}

/**
 * Calculates real-time queue estimate, wait time, and reporting guidance
 */
export function calculateQueueEstimate(
  ticket: Ticket,
  counter: QueueCounter,
  avgConsultationTimeMinutes: number,
  baseTime?: Date
): QueueEstimate {
  const currentServing = counter.currentServing || 0;
  const waitingNumber = ticket.waitingNumber;
  const isNowServing = ticket.status === 'IN_PROGRESS' || (currentServing === waitingNumber && ticket.status !== 'COMPLETED' && ticket.status !== 'SKIPPED');
  
  let peopleAhead = 0;
  if (ticket.status === 'COMPLETED') {
    peopleAhead = 0;
  } else if (isNowServing) {
    peopleAhead = 0;
  } else if (waitingNumber > currentServing) {
    // Subtract any skipped tokens that fall between currentServing and waitingNumber
    const skippedInRange = (counter.skippedTokens || []).filter(
      (num) => num > currentServing && num < waitingNumber
    ).length;
    peopleAhead = Math.max(0, waitingNumber - currentServing - 1 - skippedInRange);
  } else {
    peopleAhead = 0;
  }

  const estimatedWaitMinutes = isNowServing ? 0 : peopleAhead * Math.max(1, avgConsultationTimeMinutes);

  // Calculate estimated call time based on baseTime (or now)
  const now = baseTime ? new Date(baseTime) : new Date();
  const targetDate = new Date(now.getTime() + estimatedWaitMinutes * 60 * 1000);
  
  let hours = targetDate.getHours();
  const minutes = targetDate.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 should be 12
  const minutePadded = String(minutes).padStart(2, '0');
  const estimatedCallTime = `${hours}:${minutePadded} ${ampm}`;

  const isUpcomingSoon = !isNowServing && ticket.status === 'WAITING' && peopleAhead <= 4 && peopleAhead >= 0;

  return {
    currentServing,
    waitingNumber,
    peopleAhead,
    estimatedWaitMinutes,
    estimatedCallTime,
    isNowServing,
    isUpcomingSoon,
    status: ticket.status,
  };
}

/**
 * State machine transition for doctor room queue control
 */
export function advanceQueue(
  counter: QueueCounter,
  action: 'NEXT' | 'SKIP' | 'RECALL',
  recalledToken?: number
): {
  nextCounter: QueueCounter;
  previousServing: number;
  newServing: number;
  statusChange: string;
} {
  const previousServing = counter.currentServing || 0;
  const nextCounter: QueueCounter = {
    ...counter,
    skippedTokens: [...(counter.skippedTokens || [])],
    lastUpdated: new Date().toISOString(),
  };

  let newServing = previousServing;
  let statusChange = '';

  if (action === 'NEXT') {
    // If there are tokens left to serve up to counter.seq
    let candidate = previousServing + 1;
    // Skip candidate if it is in skippedTokens
    while (candidate <= counter.seq && nextCounter.skippedTokens.includes(candidate)) {
      candidate++;
    }

    if (candidate <= counter.seq) {
      newServing = candidate;
      nextCounter.currentServing = newServing;
      nextCounter.completedCount = (nextCounter.completedCount || 0) + (previousServing > 0 ? 1 : 0);
      statusChange = `Called next token: #${newServing}`;
    } else {
      // Reached the end of issued sequence
      statusChange = 'All issued tokens for today have been served';
    }
  } else if (action === 'SKIP') {
    if (previousServing > 0 && !nextCounter.skippedTokens.includes(previousServing)) {
      nextCounter.skippedTokens.push(previousServing);
      statusChange = `Skipped / placed on hold token: #${previousServing}`;
    }
    // Now advance to the next token
    let candidate = previousServing + 1;
    while (candidate <= counter.seq && nextCounter.skippedTokens.includes(candidate)) {
      candidate++;
    }
    newServing = candidate <= counter.seq ? candidate : previousServing;
    nextCounter.currentServing = newServing;
  } else if (action === 'RECALL') {
    if (recalledToken && nextCounter.skippedTokens.includes(recalledToken)) {
      // Remove from skipped list
      nextCounter.skippedTokens = nextCounter.skippedTokens.filter((t) => t !== recalledToken);
      newServing = recalledToken;
      nextCounter.currentServing = newServing;
      statusChange = `Recalled held token: #${recalledToken}`;
    } else if (nextCounter.skippedTokens.length > 0) {
      const recalled = nextCounter.skippedTokens.shift()!;
      newServing = recalled;
      nextCounter.currentServing = newServing;
      statusChange = `Recalled held token: #${recalled}`;
    } else {
      statusChange = 'No skipped tokens available to recall';
    }
  }

  return { nextCounter, previousServing, newServing, statusChange };
}

/**
 * Low-bandwidth SMS and WhatsApp notification message generator
 */
export function generateNotificationText(
  ticket: Ticket,
  eventType: 'BOOKED' | 'NEAR_TURN' | 'CALLED_NOW',
  roomNumber: string
): string {
  const token = ticket.ticketNumber;
  const patient = ticket.patientName;

  switch (eventType) {
    case 'BOOKED':
      return `[OPD Ticket Confirmed] Token ${token} for ${patient}. Room: ${roomNumber}. Date: ${ticket.appointmentDate}. Please arrive 15 mins prior. Track live: sehatqueue.jk.gov/t/${ticket.id}`;
    case 'NEAR_TURN':
      return `[OPD Alert] Token ${token} (${patient}): Your turn is in 3-4 patients at ${roomNumber}. Please be present outside the room now.`;
    case 'CALLED_NOW':
      return `[NOW SERVING] Token ${token} (${patient}): Please proceed inside ${roomNumber} immediately for consultation.`;
  }
}

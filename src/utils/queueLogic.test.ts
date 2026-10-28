import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatTokenNumber,
  getCounterId,
  validateAbhaId,
  validatePhone,
  calculateQueueEstimate,
  advanceQueue,
  generateNotificationText,
} from './queueLogic';
import { QueueCounter, Ticket } from '../types';

test('formatTokenNumber formats sequence correctly with zero-padding', () => {
  assert.equal(formatTokenNumber('MED', 1), 'MED-001');
  assert.equal(formatTokenNumber('ORT', 42), 'ORT-042');
  assert.equal(formatTokenNumber('ent', 105), 'ENT-105');
  assert.equal(formatTokenNumber('', 7), 'OPD-007');
});

test('getCounterId creates unique partition key for hospital, department and date', () => {
  assert.equal(getCounterId('smhs-sgr', 'smhs-med', '2026-10-28'), 'smhs-sgr_smhs-med_2026-10-28');
});

test('validateAbhaId validates 14-digit ABHA numbers and formats them', () => {
  // Empty input is optional and valid
  const emptyRes = validateAbhaId('');
  assert.equal(emptyRes.isValid, true);
  assert.equal(emptyRes.formatted, '');

  // 14 digits clean
  const validRes = validateAbhaId('14123456789012');
  assert.equal(validRes.isValid, true);
  assert.equal(validRes.formatted, '14-1234-5678-9012');

  // Input with dashes
  const formattedRes = validateAbhaId('98-7654-3210-9999');
  assert.equal(formattedRes.isValid, true);
  assert.equal(formattedRes.formatted, '98-7654-3210-9999');

  // Invalid length
  const invalidRes = validateAbhaId('12345');
  assert.equal(invalidRes.isValid, false);
  assert.ok(invalidRes.error);
});

test('validatePhone enforces Indian 10-digit mobile standards', () => {
  assert.equal(validatePhone('9876543210').isValid, true);
  assert.equal(validatePhone('+91 7006123456').isValid, true);
  assert.equal(validatePhone('06005123456').isValid, true);

  // Invalid start digit
  assert.equal(validatePhone('1234567890').isValid, false);
  // Invalid length
  assert.equal(validatePhone('98765').isValid, false);
});

test('calculateQueueEstimate accurately estimates wait times and ahead count', () => {
  const dummyTicket: Ticket = {
    id: 't-1',
    ticketNumber: 'MED-010',
    waitingNumber: 10,
    hospitalId: 'smhs-sgr',
    departmentId: 'smhs-med',
    doctorId: 'doc-1',
    doctorName: 'Dr. Tariq Ahmad Mir',
    roomNumber: 'Room 104',
    appointmentDate: '2026-10-28',
    bookingType: 'ONLINE',
    patientName: 'Ghulam Mohammad',
    age: 58,
    gender: 'MALE',
    phone: '9876543210',
    address: 'Srinagar',
    paymentStatus: 'PAID',
    fee: 10,
    status: 'WAITING',
    createdAt: new Date().toISOString(),
  };

  const counter: QueueCounter = {
    id: 'smhs-sgr_smhs-med_2026-10-28',
    hospitalId: 'smhs-sgr',
    departmentId: 'smhs-med',
    date: '2026-10-28',
    seq: 15,
    currentServing: 5, // Currently serving #5
    skippedTokens: [7], // #7 was skipped
    completedCount: 4,
    lastUpdated: new Date().toISOString(),
  };

  // 10 - 5 - 1 - (1 skipped in range) = 3 people ahead
  const estimate = calculateQueueEstimate(dummyTicket, counter, 5, new Date('2026-10-28T10:00:00Z'));
  assert.equal(estimate.peopleAhead, 3);
  assert.equal(estimate.estimatedWaitMinutes, 15); // 3 people * 5 mins = 15 mins
  assert.equal(estimate.isNowServing, false);
  assert.equal(estimate.isUpcomingSoon, true); // <= 4 people ahead
});

test('advanceQueue handles NEXT, SKIP, and RECALL actions atomically', () => {
  const initialCounter: QueueCounter = {
    id: 'smhs-sgr_smhs-med_2026-10-28',
    hospitalId: 'smhs-sgr',
    departmentId: 'smhs-med',
    date: '2026-10-28',
    seq: 5,
    currentServing: 1,
    skippedTokens: [],
    completedCount: 0,
    lastUpdated: new Date().toISOString(),
  };

  // Step 1: Advance NEXT -> Should serve token 2
  const step1 = advanceQueue(initialCounter, 'NEXT');
  assert.equal(step1.newServing, 2);
  assert.equal(step1.nextCounter.completedCount, 1);

  // Step 2: Skip token 2 -> Should push 2 to skipped and advance to 3
  const step2 = advanceQueue(step1.nextCounter, 'SKIP');
  assert.equal(step2.newServing, 3);
  assert.deepEqual(step2.nextCounter.skippedTokens, [2]);

  // Step 3: Recall token 2 -> Should remove 2 from skipped and make currentServing 2
  const step3 = advanceQueue(step2.nextCounter, 'RECALL', 2);
  assert.equal(step3.newServing, 2);
  assert.deepEqual(step3.nextCounter.skippedTokens, []);
});

test('generateNotificationText creates low-bandwidth SMS messages', () => {
  const ticket: Ticket = {
    id: 'tk-123',
    ticketNumber: 'MED-042',
    waitingNumber: 42,
    hospitalId: 'smhs-sgr',
    departmentId: 'smhs-med',
    doctorId: 'doc-1',
    doctorName: 'Dr. Tariq',
    roomNumber: 'Room 104',
    appointmentDate: '2026-10-28',
    bookingType: 'ONLINE',
    patientName: 'Amina Bano',
    age: 45,
    gender: 'FEMALE',
    phone: '9876543210',
    address: 'Rainawari, Srinagar',
    paymentStatus: 'PAID',
    fee: 10,
    status: 'WAITING',
    createdAt: new Date().toISOString(),
  };

  const bookedMsg = generateNotificationText(ticket, 'BOOKED', 'Room 104');
  assert.ok(bookedMsg.includes('MED-042'));
  assert.ok(bookedMsg.includes('Room 104'));
  assert.ok(bookedMsg.includes('Amina Bano'));

  const nearTurnMsg = generateNotificationText(ticket, 'NEAR_TURN', 'Room 104');
  assert.ok(nearTurnMsg.includes('Your turn is in 3-4 patients'));
});

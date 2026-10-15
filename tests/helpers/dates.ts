/**
 * Test-clock / date factory helper.
 *
 * Produces relative date ranges so tests never hard-code calendar dates.
 * §3 rule 9, §5.1 helpers/dates.ts — PLAYWRIGHT_TEST_STRATEGY.md
 */

export interface DateRange {
  start: string;  // ISO-8601
  end: string;
}

/** Return an ISO-8601 date string offset from now by `offsetDays` days. */
function daysFromNow(offsetDays: number, offsetHours = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  d.setHours(d.getHours() + offsetHours);
  return d.toISOString();
}

/** Helper: format for HTML datetime-local inputs (YYYY-MM-DDTHH:MM) */
export function toInputDatetime(iso: string): string {
  return iso.slice(0, 16); // "2024-09-10T14:30"
}

/** Helper: format only the date portion */
export function toInputDate(iso: string): string {
  return iso.slice(0, 10);
}

// ─── Named scenarios ──────────────────────────────────────────────────────────

/** An event that happens in the future, registration open now. */
export function openRegistrationEvent(): {
  eventStart: string;
  eventEnd: string;
  registrationStart: string;
  registrationEnd: string;
} {
  return {
    eventStart:         daysFromNow(14),
    eventEnd:           daysFromNow(15),
    registrationStart:  daysFromNow(-1),
    registrationEnd:    daysFromNow(13),
  };
}

/** Registration has not yet started. */
export function notYetOpenRegistration(): {
  eventStart: string;
  eventEnd: string;
  registrationStart: string;
  registrationEnd: string;
} {
  return {
    eventStart:         daysFromNow(20),
    eventEnd:           daysFromNow(21),
    registrationStart:  daysFromNow(5),   // opens in 5 days
    registrationEnd:    daysFromNow(19),
  };
}

/** Registration window has already closed. */
export function closedRegistration(): {
  eventStart: string;
  eventEnd: string;
  registrationStart: string;
  registrationEnd: string;
} {
  return {
    eventStart:         daysFromNow(30),
    eventEnd:           daysFromNow(31),
    registrationStart:  daysFromNow(-10),
    registrationEnd:    daysFromNow(-1),  // closed yesterday
  };
}

/** An event that is currently ongoing. */
export function ongoingEvent(): { start: string; end: string } {
  return {
    start: daysFromNow(-1),
    end:   daysFromNow(1),
  };
}

/** An event that has been completed. */
export function completedEvent(): { start: string; end: string } {
  return {
    start: daysFromNow(-30),
    end:   daysFromNow(-29),
  };
}

/** A future event window (for venue booking). */
export function futureEventWindow(startOffsetDays = 7): DateRange {
  return {
    start: daysFromNow(startOffsetDays),
    end:   daysFromNow(startOffsetDays + 1),
  };
}

/** Venue booking window that overlaps with a given start/end (for collision tests). */
export function collidingWindow(existingStart: string, bufferHours = 0): DateRange {
  const d = new Date(existingStart);
  d.setHours(d.getHours() - bufferHours); // Starts within the buffer
  const end = new Date(d);
  end.setHours(end.getHours() + 2);
  return { start: d.toISOString(), end: end.toISOString() };
}

/** Unique prefix for mutation test data. */
export function testPrefix(workerIndex = 0): string {
  return `PW-${workerIndex}-${Date.now()}`;
}

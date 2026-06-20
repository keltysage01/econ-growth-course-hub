const CONFIG = {
  TIME_ZONE: 'America/Denver',
  SLOT_MINUTES: 30,
  MAX_BOOKING_DAYS: 60,
  MIN_LEAD_HOURS: 4,
  WINDOWS: [
    { start: '09:00', end: '12:00' },
    { start: '14:00', end: '17:00' }
  ],
  TITLE_PREFIX: 'Growth Call',
  DEFAULT_SOURCE: 'econ-growth.com'
};

function doGet(e) {
  const params = (e && e.parameter) || {};
  const callback = params.callback;

  try {
    const action = String(params.action || 'ping').toLowerCase();
    let payload;

    if (action === 'availability') {
      payload = getAvailabilityResponse_(params);
    } else if (action === 'book') {
      payload = bookSlotResponse_(params);
    } else {
      payload = {
        ok: true,
        message: 'Booking service is online.',
        timeZone: CONFIG.TIME_ZONE,
        slotMinutes: CONFIG.SLOT_MINUTES
      };
    }

    return respond_(payload, callback);
  } catch (error) {
    return respond_({
      ok: false,
      message: error && error.message ? error.message : 'Unexpected booking service error.'
    }, callback);
  }
}

function respond_(payload, callback) {
  const safeCallback = callback && /^[A-Za-z0-9_$.]+$/.test(callback) ? callback : null;
  const body = safeCallback ? `${safeCallback}(${JSON.stringify(payload)});` : JSON.stringify(payload);
  return ContentService
    .createTextOutput(body)
    .setMimeType(safeCallback ? ContentService.MimeType.JAVASCRIPT : ContentService.MimeType.JSON);
}

function getAvailabilityResponse_(params) {
  const month = String(params.month || '');
  if (!/^\d{4}-\d{2}$/.test(month)) {
    throw new Error('A valid month parameter is required in YYYY-MM format.');
  }

  const year = Number(month.slice(0, 4));
  const monthIndex = Number(month.slice(5, 7)) - 1;
  const monthStart = new Date(year, monthIndex, 1, 0, 0, 0, 0);
  const monthEnd = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999);
  const calendar = getCalendar_();
  const availability = {};
  const today = startOfDay_(new Date());
  const bookingLimit = new Date(today);
  bookingLimit.setDate(bookingLimit.getDate() + CONFIG.MAX_BOOKING_DAYS);

  for (let day = new Date(monthStart); day <= monthEnd; day = addDays_(day, 1)) {
    const currentDay = startOfDay_(day);
    if (currentDay < today || currentDay > bookingLimit) continue;
    if (isWeekend_(currentDay)) continue;

    const slots = getAvailableSlotsForDay_(calendar, currentDay);
    if (slots.length) {
      availability[formatDateKey_(currentDay)] = slots;
    }
  }

  return {
    ok: true,
    month,
    timeZone: CONFIG.TIME_ZONE,
    slotMinutes: CONFIG.SLOT_MINUTES,
    availability
  };
}

function bookSlotResponse_(params) {
  const firstName = required_(params.firstName, 'First name is required.');
  const lastName = String(params.lastName || '').trim();
  const email = required_(params.email, 'Email is required.');
  const phone = String(params.phone || '').trim();
  const company = String(params.company || '').trim();
  const trucks = String(params.trucks || '').trim();
  const dateKey = required_(params.date, 'A date is required.');
  const timeKey = required_(params.time, 'A time is required.');
  const duration = Number(params.duration || CONFIG.SLOT_MINUTES);
  const source = String(params.source || CONFIG.DEFAULT_SOURCE).trim();

  validateDateKey_(dateKey);
  validateTimeKey_(timeKey);
  if (!duration || duration < 15 || duration > 180) {
    throw new Error('Invalid duration requested.');
  }

  const start = buildDateTime_(dateKey, timeKey);
  const end = new Date(start.getTime() + duration * 60000);
  const today = startOfDay_(new Date());
  const latestBookable = addDays_(today, CONFIG.MAX_BOOKING_DAYS);

  if (start < new Date()) {
    throw new Error('This time slot is no longer available.');
  }
  if (startOfDay_(start) > latestBookable) {
    throw new Error('That date is outside the current booking window.');
  }
  if (isWeekend_(start)) {
    throw new Error('Weekend bookings are not available.');
  }
  if (!isAllowedSlot_(timeKey)) {
    throw new Error('That time slot is not part of the booking schedule.');
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const calendar = getCalendar_();
    if (!isSlotAvailable_(calendar, start, end)) {
      return {
        ok: false,
        message: 'That slot was just taken. Please choose another available time.'
      };
    }

    const fullName = [firstName, lastName].filter(Boolean).join(' ');
    const title = `${CONFIG.TITLE_PREFIX} — ${fullName}${company ? ' (' + company + ')' : ''}`;
    const description = [
      'eCon Growth booking',
      '',
      `Name: ${fullName}`,
      `Email: ${email}`,
      phone ? `Phone: ${phone}` : null,
      company ? `Company: ${company}` : null,
      trucks ? `Trucks: ${trucks}` : null,
      `Source: ${source}`
    ].filter(Boolean).join('\n');

    const event = calendar.createEvent(title, start, end, {
      description,
      guests: email,
      sendInvites: true
    });

    return {
      ok: true,
      eventId: event.getId(),
      calendarNote: 'A calendar invite has been sent to your email.',
      start: formatIsoLocal_(start),
      end: formatIsoLocal_(end)
    };
  } finally {
    lock.releaseLock();
  }
}

function getAvailableSlotsForDay_(calendar, day) {
  const now = new Date();
  const slots = [];

  CONFIG.WINDOWS.forEach(function(window) {
    let cursor = buildDateTime_(formatDateKey_(day), window.start);
    const boundary = buildDateTime_(formatDateKey_(day), window.end);

    while (cursor < boundary) {
      const slotEnd = new Date(cursor.getTime() + CONFIG.SLOT_MINUTES * 60000);
      const leadCutoff = new Date(now.getTime() + CONFIG.MIN_LEAD_HOURS * 3600000);

      if (cursor >= leadCutoff && slotEnd <= boundary && isSlotAvailable_(calendar, cursor, slotEnd)) {
        slots.push(formatTimeKey_(cursor));
      }

      cursor = new Date(cursor.getTime() + CONFIG.SLOT_MINUTES * 60000);
    }
  });

  return slots;
}

function isSlotAvailable_(calendar, start, end) {
  return calendar.getEvents(start, end).length === 0;
}

function getCalendar_() {
  const properties = PropertiesService.getScriptProperties();
  const configuredId = String(properties.getProperty('CALENDAR_ID') || '').trim();
  if (configuredId) {
    const configuredCalendar = CalendarApp.getCalendarById(configuredId);
    if (configuredCalendar) return configuredCalendar;
  }
  return CalendarApp.getDefaultCalendar();
}

function required_(value, message) {
  const normalized = String(value || '').trim();
  if (!normalized) throw new Error(message);
  return normalized;
}

function validateDateKey_(dateKey) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
    throw new Error('Invalid date format.');
  }
}

function validateTimeKey_(timeKey) {
  if (!/^\d{2}:\d{2}$/.test(timeKey)) {
    throw new Error('Invalid time format.');
  }
}

function isAllowedSlot_(timeKey) {
  return getConfiguredSlotKeys_().indexOf(timeKey) !== -1;
}

function getConfiguredSlotKeys_() {
  const slots = [];
  CONFIG.WINDOWS.forEach(function(window) {
    let cursor = buildDateTime_('2000-01-01', window.start);
    const boundary = buildDateTime_('2000-01-01', window.end);
    while (cursor < boundary) {
      const slotEnd = new Date(cursor.getTime() + CONFIG.SLOT_MINUTES * 60000);
      if (slotEnd <= boundary) {
        slots.push(formatTimeKey_(cursor));
      }
      cursor = new Date(cursor.getTime() + CONFIG.SLOT_MINUTES * 60000);
    }
  });
  return slots;
}

function buildDateTime_(dateKey, timeKey) {
  const dateParts = dateKey.split('-').map(Number);
  const timeParts = timeKey.split(':').map(Number);
  return new Date(dateParts[0], dateParts[1] - 1, dateParts[2], timeParts[0], timeParts[1], 0, 0);
}

function startOfDay_(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

function addDays_(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function isWeekend_(date) {
  const day = date.getDay();
  return day === 0 || day === 6;
}

function formatDateKey_(date) {
  return Utilities.formatDate(date, CONFIG.TIME_ZONE, 'yyyy-MM-dd');
}

function formatTimeKey_(date) {
  return Utilities.formatDate(date, CONFIG.TIME_ZONE, 'HH:mm');
}

function formatIsoLocal_(date) {
  return Utilities.formatDate(date, CONFIG.TIME_ZONE, "yyyy-MM-dd'T'HH:mm:ssXXX");
}

/**
 * Time utility functions for salon hours and open/closed calculations.
 */

export const parseTimeToMinutes = (t: string | null | undefined): number | null => {
  if (!t || typeof t !== 'string') return null;
  const cleaned = t.trim().toUpperCase();
  
  // 1. Check if format is HH:MM:SS or HH:MM (24-hour style, e.g., "14:30:00" or "14:30")
  const match24 = cleaned.match(/^([0-9]{1,2}):([0-9]{2})(?::([0-9]{2}))?$/);
  if (match24) {
    const hours = Number(match24[1]);
    const minutes = Number(match24[2]);
    if (hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60) {
      return hours * 60 + minutes;
    }
  }

  // 2. Check if format is HH:MM:SS AM/PM or HH:MM AM/PM (12-hour style, e.g., "02:30 PM" or "2:30:00 PM")
  const match12 = cleaned.match(/^([0-9]{1,2}):([0-9]{2})(?::([0-9]{2}))?\s*(AM|PM)$/);
  if (match12) {
    let hours = Number(match12[1]);
    const minutes = Number(match12[2]);
    const ampm = match12[4];
    if (ampm === 'PM' && hours !== 12) hours += 12;
    if (ampm === 'AM' && hours === 12) hours = 0;
    if (hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60) {
      return hours * 60 + minutes;
    }
  }

  return null;
};

export const formatMinutesTo12Hour = (totalMinutes: number): string => {
  let hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  if (hours === 0) hours = 12;
  const minutesStr = minutes < 10 ? `0${minutes}` : `${minutes}`;
  return `${hours}:${minutesStr} ${ampm}`;
};

export interface ShopStatus {
  isOpen: boolean;
  statusText: string;
  opensInText?: string;
  reopeningTime?: string;
}

export const getShopStatus = (
  openingTime: string | null | undefined,
  closingTime: string | null | undefined
): ShopStatus => {
  const start = parseTimeToMinutes(openingTime);
  const end = parseTimeToMinutes(closingTime);

  if (start === null || end === null) {
    return { isOpen: true, statusText: "Open Now" };
  }

  const now = new Date();
  const current = now.getHours() * 60 + now.getMinutes();

  let isOpen = false;
  if (end < start) {
    // Overnight shift, e.g., 22:00 to 04:00
    isOpen = current >= start || current < end;
  } else {
    isOpen = current >= start && current < end;
  }

  if (isOpen) {
    return { isOpen: true, statusText: "Open Now" };
  }

  // It is closed. Let's calculate when it opens!
  let diffMinutes = 0;
  if (current < start) {
    // Opens later today
    diffMinutes = start - current;
  } else {
    // Opens tomorrow
    diffMinutes = (1440 - current) + start;
  }

  const hoursLeft = Math.floor(diffMinutes / 60);
  const minutesLeft = diffMinutes % 60;

  let opensInText = "";
  if (hoursLeft === 0) {
    opensInText = `Opens in ${minutesLeft} mins`;
  } else if (hoursLeft < 12) {
    opensInText = `Opens in ${hoursLeft} ${hoursLeft === 1 ? 'hour' : 'hours'}`;
  } else {
    const openingFormatted = formatMinutesTo12Hour(start);
    opensInText = `Opens tomorrow at ${openingFormatted}`;
  }

  return {
    isOpen: false,
    statusText: "Closed",
    opensInText,
    reopeningTime: formatMinutesTo12Hour(start)
  };
};

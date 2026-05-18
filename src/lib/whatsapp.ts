/**
 * Builds a WhatsApp deep link (replaces API GET /bookings/:id/whatsapp).
 */
export function buildWhatsAppUrl(phone: string, message: string): string | null {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 10) return null;
  const intl = digits.length === 10 ? `91${digits}` : digits;
  return `https://wa.me/${intl}?text=${encodeURIComponent(message)}`;
}

export function buildBookingWhatsAppUrl(params: {
  phone: string;
  salonName: string;
  reference?: string;
  bookingId?: string;
}): string | null {
  const ref = params.reference || params.bookingId || '';
  const message = ref
    ? `Hi, I have a booking (${ref}) at ${params.salonName}.`
    : `Hi, I have a booking at ${params.salonName}.`;
  return buildWhatsAppUrl(params.phone, message);
}

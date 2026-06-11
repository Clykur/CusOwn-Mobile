// src/types/notification.types.ts

export enum CustomerNotificationType {
  BOOKING_CONFIRMED = 'BOOKING_CONFIRMED',
  BOOKING_REJECTED = 'BOOKING_REJECTED',
  BOOKING_CANCELLED = 'BOOKING_CANCELLED',
  BOOKING_REMINDER = 'BOOKING_REMINDER',
  PAYMENT_SUCCESS = 'PAYMENT_SUCCESS',
}

export enum OwnerNotificationType {
  NEW_BOOKING_REQUEST = 'NEW_BOOKING_REQUEST',
  BOOKING_CANCELLED_BY_CUSTOMER = 'BOOKING_CANCELLED_BY_CUSTOMER',
  CUSTOMER_CHECKED_IN = 'CUSTOMER_CHECKED_IN',
  NO_SHOW_DETECTED = 'NO_SHOW_DETECTED',
}

export type NotificationType = CustomerNotificationType | OwnerNotificationType;

export interface NotificationPayload {
  event: NotificationType;
  bookingId?: string;
  url?: string;
  [key: string]: unknown;
}

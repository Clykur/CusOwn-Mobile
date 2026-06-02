// src/constants/notification-routes.ts
import {
  NotificationType,
  CustomerNotificationType,
  OwnerNotificationType,
} from '@/types/notification.types';

export type RouteResolver = (payload: any) => string;

const customerRoutes: Record<CustomerNotificationType, RouteResolver> = {
  [CustomerNotificationType.BOOKING_CONFIRMED]: (payload) => `/booking-detail/${payload.id}`,
  [CustomerNotificationType.BOOKING_REJECTED]: (payload) => `/booking-detail/${payload.id}`,
  [CustomerNotificationType.BOOKING_CANCELLED]: (payload) => `/booking-detail/${payload.id}`,
  [CustomerNotificationType.BOOKING_REMINDER]: (payload) => `/booking-detail/${payload.id}`,
  [CustomerNotificationType.PAYMENT_SUCCESS]: (payload) => `/booking-detail/${payload.id}`,
};

const ownerRoutes: Record<OwnerNotificationType, RouteResolver> = {
  [OwnerNotificationType.NEW_BOOKING_REQUEST]: (payload) => `/owner/bookings/${payload.id}`,
  [OwnerNotificationType.BOOKING_CANCELLED_BY_CUSTOMER]: (payload) =>
    `/owner/bookings/${payload.id}`,
  [OwnerNotificationType.CUSTOMER_CHECKED_IN]: (payload) => `/owner/bookings/${payload.id}`,
  [OwnerNotificationType.NO_SHOW_DETECTED]: (payload) => `/owner/bookings/${payload.id}`,
};

export const NotificationRouteRegistry: Record<NotificationType, RouteResolver> = {
  ...customerRoutes,
  ...ownerRoutes,
};

export function getRouteForNotification(event: NotificationType, payload: any): string | null {
  const resolver = NotificationRouteRegistry[event];
  if (resolver) {
    try {
      return resolver(payload);
    } catch (e) {
      console.warn(`Failed to resolve route for event ${event}`, e);
      return null;
    }
  }
  return null;
}

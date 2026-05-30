import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, View, Text, Pressable, ScrollView, Linking, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { CONFIG } from '@/constants/config';
import { useModal } from '@/hooks/useModal';
import { getBookingPrice } from '@/services/api.service';
import { THEME } from '@/theme/theme';
import { formatBookingDate, formatBookingTime } from '@/utils/time';

import type { Booking } from '@/types/booking.types';
import type { Service } from '@/types/business.types';

interface OwnerBookingDetailModalProps {
  visible: boolean;
  booking: Booking | null;
  onClose: () => void;
  onAccept?: (id: string) => void;
  onReject?: (id: string) => void;
  onUndoAccept?: (id: string) => void;
  onUndoReject?: (id: string) => void;
  onNoShow?: (id: string) => void;
}

export const OwnerBookingDetailModal: React.FC<OwnerBookingDetailModalProps> = ({
  visible,
  booking,
  onClose,
  onAccept,
  onReject,
  onUndoAccept,
  onUndoReject,
  onNoShow,
}) => {
  const insets = useSafeAreaInsets();
  const { showModal } = useModal();
  const price = booking ? getBookingPrice(booking) : 0;

  const isPast = React.useMemo(() => {
    if (!booking || !booking.date || !booking.time) return false;
    const slotDateTime = new Date(`${booking.date}T${booking.time}`);
    // eslint-disable-next-line react-hooks/purity
    return slotDateTime.getTime() < Date.now();
  }, [booking]);

  // Determine if confirmation can be undone based on updated_at
  const canUndo = React.useMemo(() => {
    if (!booking) return false;
    if (booking.status !== 'confirmed' && booking.status !== 'rejected') {
      return false;
    }
    if (booking.undo_used_at) {
      return false;
    }
    const windowMs = (CONFIG.UNDO_WINDOW_MINUTES || 15) * 60 * 1000;
    // eslint-disable-next-line react-hooks/purity
    const updatedAt = new Date(booking.updated_at || Date.now()).getTime();
    // eslint-disable-next-line react-hooks/purity
    return Date.now() - updatedAt < windowMs;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPast, booking]);

  const handleCall = () => {
    if (!booking) return;
    const phone = booking.customer_phone || booking.customer_profile?.phone;
    if (!phone) return;
    Linking.openURL(`tel:${phone}`).catch(() => {
      showModal({
        variant: 'error',
        title: 'Error',
        description: 'Unable to open phone dialer.',
      });
    });
  };

  const handleWhatsApp = () => {
    if (!booking) return;
    const phone = booking.customer_phone || booking.customer_profile?.phone;
    if (!phone) return;
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const formattedPhone =
      cleanPhone.startsWith('91') || cleanPhone.length > 10 ? cleanPhone : `91${cleanPhone}`;
    Linking.openURL(`https://wa.me/${formattedPhone}`).catch(() => {
      showModal({
        variant: 'error',
        title: 'Error',
        description: 'Unable to open WhatsApp.',
      });
    });
  };

  const serviceNames = React.useMemo(() => {
    if (!booking) return 'Standard Slot';
    if (booking.services && booking.services.length > 0) {
      return booking.services.map((s: Service) => s.name).join(', ');
    }
    return booking.service?.name || 'Standard Slot';
  }, [booking]);

  const serviceDuration = React.useMemo(() => {
    if (!booking) return 30;
    if (booking.services && booking.services.length > 0) {
      return booking.services.reduce((sum: number, s: Service) => sum + (s.duration || 30), 0);
    }
    return booking.service?.duration || booking.total_duration_minutes || 30;
  }, [booking]);

  if (!booking) return null;

  return (
    <Modal transparent animationType="slide" visible={visible} onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/40">
        <Pressable className="absolute inset-0" onPress={onClose} />

        <View
          className="w-full bg-background overflow-hidden rounded-t-3xl"
          style={{ flex: 1, marginTop: Math.max(insets.top + 20, 60) }}
        >
          {/* Top Grab Bar */}
          <View className="items-center py-3">
            <View className="w-12 h-1 bg-border rounded-full" />
          </View>

          {/* Header */}
          <View className="flex-row justify-between items-center px-luxury pb-4 border-b border-border">
            <View className="flex-row items-center gap-x-2">
              <Ionicons name="receipt-outline" size={20} color={THEME.colors.primary} />
              <Text className="text-text text-lg font-black tracking-tight">
                Reservation Details
              </Text>
            </View>

            <TouchableOpacity
              onPress={onClose}
              className="p-1.5 rounded-full bg-input border border-border"
            >
              <Ionicons name="close" size={18} color={THEME.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerClassName="px-luxury py-6 pb-12"
          >
            {/* Reference & Status Badges */}
            <View className="flex-row justify-between items-center bg-input border border-border rounded-2xl p-4 mb-6">
              <View>
                <Text className="text-textSecondary text-xs font-black uppercase tracking-wider">
                  Booking Reference
                </Text>
                <Text className="text-text font-extrabold text-sm mt-0.5">
                  {booking.reference || booking.booking_id || 'REF-N/A'}
                </Text>
              </View>
              <Badge status={booking.status} />
            </View>

            {/* Customer Information section */}
            <View className="bg-input border border-border rounded-2xl p-5 mb-5">
              <Text className="text-textSecondary text-xs font-black uppercase tracking-wider mb-4">
                Client Profile
              </Text>

              <View className="flex-row items-center gap-x-4">
                <Avatar
                  userId={booking.customer_user_id}
                  name={booking.customer_name || 'Client Direct'}
                  size={52}
                />

                <View className="flex-1">
                  <Text className="text-text font-extrabold text-base">
                    {booking.customer_name || 'Client Direct'}
                  </Text>

                  {(booking.customer_phone || booking.customer_profile?.phone) && (
                    <Text className="text-textSecondary text-xs mt-1">
                      Phone: {booking.customer_phone || booking.customer_profile?.phone}
                    </Text>
                  )}

                  {(booking.customer_email || booking.customer_profile?.email) && (
                    <Text className="text-textSecondary text-xs mt-0.5" numberOfLines={1}>
                      Email: {booking.customer_email || booking.customer_profile?.email}
                    </Text>
                  )}
                </View>
                <TouchableOpacity onPress={handleCall}>
                  <Ionicons name="call-outline" size={25} color={THEME.colors.primary} />
                </TouchableOpacity>

                <TouchableOpacity onPress={handleWhatsApp}>
                  <Ionicons name="logo-whatsapp" size={25} color={THEME.colors.success} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Service & Time details */}
            <View className="bg-input border border-border rounded-2xl p-5 mb-5">
              <Text className="text-textSecondary text-xs font-black uppercase tracking-wider mb-4">
                Service & Appointment Details
              </Text>

              {/* Service Details */}
              <View className="mb-4">
                <Text className="text-text font-extrabold text-base">{serviceNames}</Text>
                {booking.service?.description && (
                  <Text className="text-textSecondary text-xs mt-1 leading-relaxed">
                    {booking.service.description}
                  </Text>
                )}
              </View>

              <View className="h-px bg-border my-3" />

              {/* Schedule Info */}
              <View className="flex-row justify-between mb-4">
                <View className="flex-1">
                  <Text className="text-textSecondary text-xs font-bold uppercase tracking-wider mb-1.5">
                    Date
                  </Text>
                  <Text className="text-text font-bold text-sm">
                    {formatBookingDate(booking.date)}
                  </Text>
                </View>

                <View className="flex-1">
                  <Text className="text-textSecondary text-xs font-bold uppercase tracking-wider mb-1.5">
                    Arrival Slot
                  </Text>
                  <Text className="text-text font-bold text-sm">
                    {formatBookingTime(booking.time)}
                  </Text>
                </View>
              </View>

              {/* Duration & Assigned Specialist */}
              <View className="flex-row justify-between mb-2">
                <View className="flex-1">
                  <Text className="text-textSecondary text-xs font-bold uppercase tracking-wider mb-1.5">
                    Duration
                  </Text>
                  <Text className="text-text font-bold text-sm">{serviceDuration} Minutes</Text>
                </View>

                <View className="flex-1">
                  <Text className="text-textSecondary text-xs font-bold uppercase tracking-wider mb-1.5">
                    Assigned specialist
                  </Text>
                  <Text className="text-text font-bold text-sm">
                    {booking.business?.owner_name || booking.salon?.owner_name || 'Main Specialist'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Financial Details Card */}
            <View className="bg-input border border-border rounded-2xl p-5 mb-5">
              <Text className="text-textSecondary text-xs font-black uppercase tracking-wider mb-4">
                Financial Details
              </Text>

              <View className="flex-row justify-between items-center mb-3">
                <Text className="text-textSecondary font-semibold text-sm">Booking Subtotal</Text>
                <Text className="text-text font-extrabold text-sm">₹{price.toFixed(2)}</Text>
              </View>

              <View className="h-px bg-border my-2" />

              <View className="flex-row justify-between items-center mt-1">
                <View>
                  <Text className="text-text font-extrabold text-base">Total Amount</Text>
                  <Text className="text-textSecondary text-xs font-bold uppercase tracking-wider mt-0.5">
                    {booking.payment_status === 'paid' ? 'Paid via App' : 'Pay at Venue'}
                  </Text>
                </View>
                <Text className="text-primary font-black text-xl">₹{price.toFixed(0)}</Text>
              </View>
            </View>

            {/* Client Notes Section */}
            <View className="bg-input border border-border rounded-2xl p-5 mb-6">
              <Text className="text-textSecondary text-xs font-black uppercase tracking-wider mb-2">
                Special Instructions & Notes
              </Text>
              <Text className="text-textSecondary text-xs leading-relaxed font-medium">
                {booking.notes ||
                  booking.instructions ||
                  'No special requirements specified by client.'}
              </Text>
            </View>

            {/* Owner Actions */}
            <View className="pt-2">
              {/* Pending Actions */}
              {booking.status === 'pending' && onAccept && onReject && (
                <View className="flex-row gap-x-3">
                  <TouchableOpacity
                    onPress={() => {
                      onReject(booking.id);
                      onClose();
                    }}
                    className="flex-1 h-12 rounded-xl border border-error/40 bg-error/10 items-center justify-center active:bg-error/20"
                  >
                    <Text className="text-error font-black text-xs uppercase tracking-widest">
                      Decline
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      onAccept(booking.id);
                      onClose();
                    }}
                    className="flex-1 h-12 rounded-xl bg-primary items-center justify-center active:opacity-80"
                  >
                    <Text className="text-background font-black text-xs uppercase tracking-widest">
                      Approve
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Confirmed Actions */}
              {booking.status === 'confirmed' && (
                <View className="gap-y-3">
                  {onNoShow && !booking.no_show && (
                    <TouchableOpacity
                      onPress={() => {
                        onNoShow(booking.id);
                        onClose();
                      }}
                      disabled={isPast}
                      className={`w-full h-12 rounded-xl items-center justify-center flex-row gap-x-2 ${
                        isPast
                          ? 'bg-border/30 border border-border/50 opacity-50'
                          : 'bg-input border border-border active:bg-card'
                      }`}
                    >
                      <Text
                        className={`font-black text-xs uppercase tracking-widest ${
                          isPast ? 'text-textSecondary/50' : 'text-textSecondary'
                        }`}
                      >
                        Mark as No-Show
                      </Text>
                    </TouchableOpacity>
                  )}

                  {onUndoAccept && canUndo && (
                    <TouchableOpacity
                      onPress={() => {
                        onUndoAccept(booking.id);
                        onClose();
                      }}
                      disabled={isPast}
                      className={`w-full h-12 rounded-xl items-center justify-center flex-row gap-x-2 ${
                        isPast
                          ? 'bg-border/30 border border-border/50 opacity-50'
                          : 'border border-border bg-input active:bg-card'
                      }`}
                    >
                      <Ionicons
                        name="refresh-outline"
                        size={16}
                        color={
                          isPast ? THEME.colors.textSecondary + '80' : THEME.colors.textSecondary
                        }
                      />
                      <Text
                        className={`font-black text-xs uppercase tracking-widest ${
                          isPast ? 'text-textSecondary/50' : 'text-textSecondary'
                        }`}
                      >
                        Undo Confirmation
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {/* Rejected Actions */}
              {booking.status === 'rejected' && onUndoReject && canUndo && (
                <TouchableOpacity
                  onPress={() => {
                    onUndoReject(booking.id);
                    onClose();
                  }}
                  className="w-full h-12 rounded-xl border border-border bg-input items-center justify-center active:bg-card flex-row gap-x-2"
                >
                  <Ionicons name="refresh-outline" size={16} color={THEME.colors.textSecondary} />
                  <Text className="text-textSecondary font-black text-xs uppercase tracking-widest">
                    Undo Rejection
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

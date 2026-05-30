import { THEME } from '@/theme/theme';
import React from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  ScrollView,
  Linking,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Booking } from '@/types/booking.types';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { useModal } from '@/hooks/useModal';
import { getBookingPrice } from '@/services/api.service';
import { supabase } from '@/lib/supabase';
import { CONFIG } from '@/constants/config';
import { formatBookingDate, formatBookingTime } from '@/utils/time';

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
  const { showModal } = useModal();
  if (!booking) return null;

  // Cast to any for accessing dynamically populated backend fields safely
  const b = booking as any;

  const price = getBookingPrice(b);

  const isPast = React.useMemo(() => {
    if (!b.date || !b.time) return false;
    const slotDateTime = new Date(`${b.date}T${b.time}`);
    return slotDateTime.getTime() < Date.now();
  }, [b.date, b.time]);

  // Determine if confirmation can be undone based on updated_at
  const canUndo = React.useMemo(() => {
    if (b.status !== 'confirmed' && b.status !== 'rejected') {
      return false;
    }
    if (b.undo_used_at) {
      return false;
    }
    const windowMs = (CONFIG.UNDO_WINDOW_MINUTES || 15) * 60 * 1000;
    const updatedAt = new Date(b.updated_at || Date.now()).getTime();
    return Date.now() - updatedAt < windowMs;
  }, [isPast, b.status, b.updated_at, b.undo_used_at]);

  const handleCall = () => {
    const phone = b.customer_phone || b.customer_profile?.phone;
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
    const phone = b.customer_phone || b.customer_profile?.phone;
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
    if (b.services && b.services.length > 0) {
      return b.services.map((s: any) => s.name).join(', ');
    }
    return b.service?.name || 'Standard Slot';
  }, [b.services, b.service]);

  const serviceDuration = React.useMemo(() => {
    if (b.services && b.services.length > 0) {
      return b.services.reduce(
        (sum: number, s: any) => sum + (s.duration || s.duration_minutes || 30),
        0,
      );
    }
    return b.service?.duration || b.total_duration_minutes || 30;
  }, [b.services, b.service, b.total_duration_minutes]);

  return (
    <Modal transparent animationType="slide" visible={visible} onRequestClose={onClose}>
      <View className="flex-1 justify-end">
        <Pressable className="flex-1" onPress={onClose} />

        <View className="rounded-t-2xl max-h-full flex-1 w-full relative overflow-hidden bg-card">
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
                  {b.reference || b.booking_id || 'REF-N/A'}
                </Text>
              </View>
              <Badge status={b.status} />
            </View>

            {/* Customer Information section */}
            <View className="bg-input border border-border rounded-2xl p-5 mb-5">
              <Text className="text-textSecondary text-xs font-black uppercase tracking-wider mb-4">
                Client Profile
              </Text>

              <View className="flex-row items-center gap-x-4">
                <Avatar
                  userId={b.customer_user_id}
                  name={b.customer_name || 'Client Direct'}
                  size={52}
                />

                <View className="flex-1">
                  <Text className="text-text font-extrabold text-base">
                    {b.customer_name || 'Client Direct'}
                  </Text>

                  {(b.customer_phone || b.customer_profile?.phone) && (
                    <Text className="text-textSecondary text-xs mt-1">
                      Phone: {b.customer_phone || b.customer_profile?.phone}
                    </Text>
                  )}

                  {(b.customer_email || b.customer_profile?.email) && (
                    <Text className="text-textSecondary text-xs mt-0.5" numberOfLines={1}>
                      Email: {b.customer_email || b.customer_profile?.email}
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
                {b.service?.description && (
                  <Text className="text-textSecondary text-xs mt-1 leading-relaxed">
                    {b.service.description}
                  </Text>
                )}
              </View>

              <View className="h-[1px] bg-border my-3" />

              {/* Schedule Info */}
              <View className="flex-row justify-between mb-4">
                <View className="flex-1">
                  <Text className="text-textSecondary text-xs font-bold uppercase tracking-wider mb-1.5">
                    Date
                  </Text>
                  <Text className="text-text font-bold text-sm">{formatBookingDate(b.date)}</Text>
                </View>

                <View className="flex-1">
                  <Text className="text-textSecondary text-xs font-bold uppercase tracking-wider mb-1.5">
                    Arrival Slot
                  </Text>
                  <Text className="text-text font-bold text-sm">{formatBookingTime(b.time)}</Text>
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
                    {b.business?.owner_name || b.salon?.owner_name || 'Main Specialist'}
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

              <View className="h-[1px] bg-border my-2" />

              <View className="flex-row justify-between items-center mt-1">
                <View>
                  <Text className="text-text font-extrabold text-base">Total Amount</Text>
                  <Text className="text-textSecondary text-xs font-bold uppercase tracking-wider mt-0.5">
                    {b.payment_status === 'paid' ? 'Paid via App' : 'Pay at Venue'}
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
                {b.notes || b.instructions || 'No special requirements specified by client.'}
              </Text>
            </View>

            {/* Owner Actions */}
            <View className="pt-2">
              {/* Pending Actions */}
              {b.status === 'pending' && onAccept && onReject && (
                <View className="flex-row gap-x-3">
                  <TouchableOpacity
                    onPress={() => {
                      onReject(b.id);
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
                      onAccept(b.id);
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
              {b.status === 'confirmed' && (
                <View className="gap-y-3">
                  {onNoShow && !b.no_show && (
                    <TouchableOpacity
                      onPress={() => {
                        onNoShow(b.id);
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
                        onUndoAccept(b.id);
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
              {b.status === 'rejected' && onUndoReject && canUndo && (
                <TouchableOpacity
                  onPress={() => {
                    onUndoReject(b.id);
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

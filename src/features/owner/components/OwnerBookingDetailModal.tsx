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
import { getBookingPrice } from '@/services/api.service';
import { supabase } from '@/lib/supabase';
import { CONFIG } from '@/constants/config';

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
  if (!booking) return null;

  // Cast to any for accessing dynamically populated backend fields safely
  const b = booking as any;

  // Resolve customer avatar URL
  const avatarUrl = React.useMemo(() => {
    const media = b.customer_profile?.profile_media;
    if (!media?.bucket_name || !media?.storage_path) {
      return null;
    }
    return supabase.storage.from(media.bucket_name).getPublicUrl(media.storage_path).data.publicUrl;
  }, [b.customer_profile?.profile_media]);

  const price = getBookingPrice(b);

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
  }, [b.status, b.updated_at, b.undo_used_at]);

  const handleCall = () => {
    const phone = b.customer_phone || b.customer_profile?.phone;
    if (!phone) return;
    Linking.openURL(`tel:${phone}`).catch(() => {
      Alert.alert('Error', 'Unable to open phone dialer.');
    });
  };

  const handleWhatsApp = () => {
    const phone = b.customer_phone || b.customer_profile?.phone;
    if (!phone) return;
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const formattedPhone =
      cleanPhone.startsWith('91') || cleanPhone.length > 10 ? cleanPhone : `91${cleanPhone}`;
    Linking.openURL(`https://wa.me/${formattedPhone}`).catch(() => {
      Alert.alert('Error', 'Unable to open WhatsApp.');
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
      <View className="flex-1 justify-end bg-black/60">
        <Pressable className="flex-1" onPress={onClose} />

        <View className="bg-white rounded-t-[32px] max-h-[90%] w-full shadow-2xl relative overflow-hidden">
          {/* Top Grab Bar */}
          <View className="items-center py-3">
            <View className="w-12 h-1 bg-slate-200 rounded-full" />
          </View>

          {/* Header */}
          <View className="flex-row justify-between items-center px-luxury pb-4 border-b border-slate-100">
            <View className="flex-row items-center gap-x-2">
              <Ionicons name="receipt-outline" size={20} color="#0F172A" />
              <Text className="text-slate-900 text-lg font-black tracking-tight">
                Reservation Details
              </Text>
            </View>

            <TouchableOpacity
              onPress={onClose}
              className="p-1.5 rounded-full bg-slate-100 border border-slate-200/50"
            >
              <Ionicons name="close" size={18} color="#475569" />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerClassName="px-luxury py-6 pb-12"
          >
            {/* Reference & Status Badges */}
            <View className="flex-row justify-between items-center bg-slate-50 border border-slate-100 rounded-2xl p-4 mb-6">
              <View>
                <Text className="text-slate-400 text-[10px] font-black uppercase tracking-wider">
                  Booking Reference
                </Text>
                <Text className="text-slate-800 font-extrabold text-sm mt-0.5">
                  {b.reference || b.booking_id || 'REF-N/A'}
                </Text>
              </View>
              <Badge status={b.status} />
            </View>

            {/* Customer Information section */}
            <View className="bg-white border border-slate-200/80 rounded-2xl p-5 mb-5 shadow-sm">
              <Text className="text-slate-400 text-[10px] font-black uppercase tracking-wider mb-4">
                Client Profile
              </Text>

              <View className="flex-row items-center gap-x-4">
                <Avatar
                  url={avatarUrl}
                  name={b.customer_name || 'Client Direct'}
                  size={52}
                  className="border border-slate-100"
                />

                <View className="flex-1">
                  <Text className="text-slate-900 font-extrabold text-base">
                    {b.customer_name || 'Client Direct'}
                  </Text>

                  {(b.customer_phone || b.customer_profile?.phone) && (
                    <Text className="text-slate-500 text-xs mt-1">
                      Phone: {b.customer_phone || b.customer_profile?.phone}
                    </Text>
                  )}

                  {(b.customer_email || b.customer_profile?.email) && (
                    <Text className="text-slate-500 text-xs mt-0.5" numberOfLines={1}>
                      Email: {b.customer_email || b.customer_profile?.email}
                    </Text>
                  )}
                </View>
              </View>

              {/* Direct Quick Actions */}
              {(b.customer_phone || b.customer_profile?.phone) && (
                <View className="flex-row gap-x-3 mt-5 pt-4 border-t border-slate-50">
                  <TouchableOpacity
                    onPress={handleCall}
                    className="flex-1 flex-row h-11 items-center justify-center bg-slate-50 border border-slate-200/80 rounded-xl gap-x-2 active:bg-slate-100"
                  >
                    <Ionicons name="call-outline" size={16} color="#0F172A" />
                    <Text className="text-slate-800 font-bold text-xs uppercase tracking-wider">
                      Call Client
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleWhatsApp}
                    className="flex-1 flex-row h-11 items-center justify-center bg-emerald-50 border border-emerald-100 rounded-xl gap-x-2 active:bg-emerald-100"
                  >
                    <Ionicons name="logo-whatsapp" size={16} color="#059669" />
                    <Text className="text-emerald-800 font-bold text-xs uppercase tracking-wider">
                      WhatsApp
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Service & Time details */}
            <View className="bg-white border border-slate-200/80 rounded-2xl p-5 mb-5 shadow-sm">
              <Text className="text-slate-400 text-[10px] font-black uppercase tracking-wider mb-4">
                Service & Appointment Details
              </Text>

              {/* Service Details */}
              <View className="mb-4">
                <Text className="text-slate-900 font-extrabold text-base">{serviceNames}</Text>
                {b.service?.description && (
                  <Text className="text-slate-500 text-xs mt-1 leading-relaxed">
                    {b.service.description}
                  </Text>
                )}
              </View>

              <View className="h-[1px] bg-slate-100 my-3" />

              {/* Schedule Info */}
              <View className="flex-row justify-between mb-4">
                <View className="flex-1">
                  <Text className="text-slate-400 text-[9px] font-bold uppercase tracking-wider mb-1.5">
                    Date
                  </Text>
                  <Text className="text-slate-800 font-bold text-sm">{b.date}</Text>
                </View>

                <View className="flex-1">
                  <Text className="text-slate-400 text-[9px] font-bold uppercase tracking-wider mb-1.5">
                    Arrival Slot
                  </Text>
                  <Text className="text-slate-800 font-bold text-sm">{b.time}</Text>
                </View>
              </View>

              {/* Duration & Assigned Specialist */}
              <View className="flex-row justify-between mb-2">
                <View className="flex-1">
                  <Text className="text-slate-400 text-[9px] font-bold uppercase tracking-wider mb-1.5">
                    Duration
                  </Text>
                  <Text className="text-slate-800 font-bold text-sm">
                    {serviceDuration} Minutes
                  </Text>
                </View>

                <View className="flex-1">
                  <Text className="text-slate-400 text-[9px] font-bold uppercase tracking-wider mb-1.5">
                    Assigned specialist
                  </Text>
                  <Text className="text-slate-800 font-bold text-sm">
                    {b.business?.owner_name || b.salon?.owner_name || 'Main Specialist'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Financial Details Card */}
            <View className="bg-white border border-slate-200/80 rounded-2xl p-5 mb-5 shadow-sm">
              <Text className="text-slate-400 text-[10px] font-black uppercase tracking-wider mb-4">
                Financial Details
              </Text>

              <View className="flex-row justify-between items-center mb-3">
                <Text className="text-slate-500 font-semibold text-sm">Booking Subtotal</Text>
                <Text className="text-slate-900 font-extrabold text-sm">₹{price.toFixed(2)}</Text>
              </View>

              <View className="h-[1px] bg-slate-100 my-2" />

              <View className="flex-row justify-between items-center mt-1">
                <View>
                  <Text className="text-slate-900 font-extrabold text-base">Total Amount</Text>
                  <Text className="text-slate-400 text-[9px] font-bold uppercase tracking-wider mt-0.5">
                    {b.payment_status === 'paid' ? 'Paid via App' : 'Pay at Venue'}
                  </Text>
                </View>
                <Text className="text-slate-900 font-black text-xl">₹{price.toFixed(0)}</Text>
              </View>
            </View>

            {/* Client Notes Section */}
            <View className="bg-white border border-slate-200/80 rounded-2xl p-5 mb-6 shadow-sm">
              <Text className="text-slate-400 text-[10px] font-black uppercase tracking-wider mb-2">
                Special Instructions & Notes
              </Text>
              <Text className="text-slate-600 text-xs leading-relaxed font-medium">
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
                    className="flex-1 h-12 rounded-xl border border-red-200 bg-red-50/50 items-center justify-center active:bg-red-50"
                  >
                    <Text className="text-red-700 font-black text-xs uppercase tracking-widest">
                      Decline
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      onAccept(b.id);
                      onClose();
                    }}
                    className="flex-1 h-12 rounded-xl bg-black items-center justify-center active:bg-slate-900"
                  >
                    <Text className="text-white font-black text-xs uppercase tracking-widest">
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
                      className="w-full h-12 rounded-xl bg-slate-800 items-center justify-center active:bg-slate-900"
                    >
                      <Text className="text-white font-black text-xs uppercase tracking-widest">
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
                      className="w-full h-12 rounded-xl border border-slate-200 bg-white items-center justify-center active:bg-slate-50 flex-row gap-x-2"
                    >
                      <Ionicons name="refresh-outline" size={16} color="#0F172A" />
                      <Text className="text-slate-800 font-black text-xs uppercase tracking-widest">
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
                  className="w-full h-12 rounded-xl border border-slate-200 bg-white items-center justify-center active:bg-slate-50 flex-row gap-x-2"
                >
                  <Ionicons name="refresh-outline" size={16} color="#0F172A" />
                  <Text className="text-slate-800 font-black text-xs uppercase tracking-widest">
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

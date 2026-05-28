import { THEME } from '@/theme/theme';
import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { useModal } from '@/hooks/useModal';
import { apiService } from '@/services/api.service';
import { useSlots } from '@/hooks/useSlots';
import dayjs from 'dayjs';

interface CurrentSlot {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  status?: string;
}

interface Props {
  bookingId: string;
  currentSlot?: CurrentSlot | null;
  businessId: string;
  /** @deprecated — slots are now fetched internally */
  availableSlots?: unknown[];
  onRescheduled?: () => void;
  rescheduledBy: 'customer' | 'owner';
  disabled?: boolean;
}

export default function RescheduleButton({
  bookingId,
  currentSlot,
  businessId,
  onRescheduled,
  rescheduledBy,
  disabled = false,
}: Props) {
  const [showModal, setShowModal] = useState(false);
  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [selectedDate, setSelectedDate] = useState(
    currentSlot?.date ?? dayjs().format('YYYY-MM-DD'),
  );
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const { showModal: showGlobalModal } = useModal();

  // 14-day rolling date list
  const datesList = useMemo(() => {
    const today = dayjs().format('YYYY-MM-DD');
    return Array.from({ length: 14 }, (_, i) => {
      const d = dayjs(today).add(i, 'day');
      return { iso: d.format('YYYY-MM-DD'), label: d.format('ddd, MMM D') };
    });
  }, []);

  // Fetch live slots for the selected date — only when modal is open
  const { data: rawSlots, isLoading: slotsLoading } = useSlots(
    showModal ? businessId : null,
    selectedDate,
  );

  // Normalize and filter: exclude current slot, show only available
  const filteredSlots = useMemo(() => {
    if (!rawSlots) return [];
    return rawSlots
      .filter(
        (s: any) =>
          s.id !== currentSlot?.id && (s.is_available === true || s.status === 'available'),
      )
      .map((s: any) => ({
        id: s.id,
        date: s.date,
        start_time: s.start_time || s.time,
        end_time: s.end_time,
        label: (() => {
          const t = s.start_time || s.time || '';
          const [h, m] = t.split(':').map(Number);
          if (isNaN(h)) return t;
          const ampm = h >= 12 ? 'PM' : 'AM';
          const disp = h % 12 === 0 ? 12 : h % 12;
          return `${disp}:${String(m ?? 0).padStart(2, '0')} ${ampm}`;
        })(),
      }));
  }, [rawSlots, currentSlot]);

  const handleReschedule = async () => {
    if (!selectedSlotId) return;

    try {
      setLoading(true);

      await apiService.rescheduleBooking(bookingId, {
        new_slot_id: selectedSlotId,
        reason,
        rescheduled_by: rescheduledBy,
      });

      setShowModal(false);
      showGlobalModal({
        variant: 'success',
        title: 'Success',
        description: 'Booking rescheduled successfully',
      });
      onRescheduled?.();
    } catch (error: any) {
      showGlobalModal({
        variant: 'error',
        title: 'Reschedule Failed',
        description: error?.message || 'Failed to reschedule booking',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = () => {
    setSelectedSlotId('');
    setSelectedDate(currentSlot?.date ?? dayjs().format('YYYY-MM-DD'));
    setReason('');
    setShowModal(true);
  };

  if (!currentSlot) return null;

  return (
    <>
      {/* Trigger Button */}
      <Pressable
        onPress={handleOpenModal}
        disabled={disabled}
        className={`w-full rounded-2xl py-4 flex-row items-center justify-center border ${
          disabled
            ? 'bg-border/20 border-border opacity-50'
            : 'bg-primary/10 border-primary/30 active:bg-primary/20'
        }`}
      >
        <Ionicons
          name="calendar-outline"
          size={18}
          color={disabled ? THEME.colors.textSecondary : THEME.colors.primary}
        />
        <Text className={`ml-2 font-bold ${disabled ? 'text-textSecondary' : 'text-primary'}`}>
          Reschedule Booking
        </Text>
      </Pressable>

      {/* Bottom Sheet Modal */}
      <Modal visible={showModal} transparent animationType="slide">
        <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
          <View
            className="rounded-t-[32px] p-5"
            style={{ backgroundColor: THEME.colors.card, maxHeight: '90%' }}
          >
            {/* Handle bar */}
            <View className="w-12 h-1 rounded-full bg-border self-center mb-5" />

            {/* Header */}
            <View className="flex-row items-center justify-between mb-5">
              <Text className="text-text text-xl font-black">Reschedule</Text>
              <Pressable
                onPress={() => setShowModal(false)}
                disabled={loading}
                className="w-9 h-9 rounded-full bg-border/30 items-center justify-center"
              >
                <Ionicons name="close" size={20} color={THEME.colors.text} />
              </Pressable>
            </View>

            {/* Date Strip */}
            <Text className="text-textSecondary text-xs font-black uppercase tracking-widest mb-3">
              Select Date
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="mb-5"
              contentContainerStyle={{ gap: 8, paddingBottom: 4 }}
            >
              {datesList.map((d) => {
                const isSelected = d.iso === selectedDate;
                return (
                  <Pressable
                    key={d.iso}
                    onPress={() => {
                      setSelectedDate(d.iso);
                      setSelectedSlotId('');
                    }}
                    className={`px-4 py-2.5 rounded-2xl border ${
                      isSelected ? 'bg-primary border-primary' : 'bg-input border-border'
                    }`}
                  >
                    <Text
                      className={`text-sm font-bold ${
                        isSelected ? 'text-background' : 'text-text'
                      }`}
                    >
                      {d.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Slot List */}
            <Text className="text-textSecondary text-xs font-black uppercase tracking-widest mb-3">
              Available Slots
            </Text>
            <ScrollView style={{ maxHeight: 220 }} showsVerticalScrollIndicator={false}>
              {slotsLoading ? (
                <View className="items-center py-8">
                  <ActivityIndicator color={THEME.colors.primary} />
                  <Text className="text-textSecondary text-sm mt-2">Loading slots…</Text>
                </View>
              ) : filteredSlots.length === 0 ? (
                <View className="items-center py-8">
                  <Ionicons name="calendar-outline" size={28} color={THEME.colors.textSecondary} />
                  <Text className="text-textSecondary mt-2 text-center text-sm">
                    No available slots on this date.
                  </Text>
                </View>
              ) : (
                filteredSlots.map((slot) => {
                  const isSelected = selectedSlotId === slot.id;
                  return (
                    <Pressable
                      key={slot.id}
                      onPress={() => setSelectedSlotId(slot.id)}
                      className={`border rounded-2xl p-4 mb-3 ${
                        isSelected ? 'border-primary bg-primary/10' : 'border-border bg-input/50'
                      }`}
                    >
                      <Text className={`font-bold ${isSelected ? 'text-primary' : 'text-text'}`}>
                        {slot.label}
                      </Text>
                      {slot.end_time && (
                        <Text className="text-textSecondary mt-0.5 text-sm">
                          {slot.start_time} – {slot.end_time}
                        </Text>
                      )}
                    </Pressable>
                  );
                })
              )}
            </ScrollView>

            {/* Reason Input */}
            <TextInput
              value={reason}
              onChangeText={setReason}
              placeholder="Reason for rescheduling (optional)"
              placeholderTextColor={THEME.colors.textSecondary}
              multiline
              className="border border-border rounded-2xl px-4 py-3 mt-4 text-text bg-input"
              style={{ minHeight: 72, textAlignVertical: 'top', color: THEME.colors.text }}
            />

            {/* Action Buttons */}
            <View className="flex-row mt-5">
              <Pressable
                onPress={() => setShowModal(false)}
                disabled={loading}
                className="flex-1 bg-border/30 rounded-2xl py-4 mr-2 items-center active:bg-border/50"
              >
                <Text className="font-bold text-text">Cancel</Text>
              </Pressable>

              <Pressable
                onPress={handleReschedule}
                disabled={loading || !selectedSlotId}
                className={`flex-1 rounded-2xl py-4 ml-2 items-center justify-center ${
                  !selectedSlotId || loading
                    ? 'bg-disabled opacity-60'
                    : 'bg-primary active:opacity-90'
                }`}
              >
                {loading ? (
                  <ActivityIndicator color={THEME.colors.background} />
                ) : (
                  <Text
                    className={`font-bold ${
                      !selectedSlotId ? 'text-textSecondary' : 'text-background'
                    }`}
                  >
                    Confirm
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

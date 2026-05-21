import { THEME } from '@/theme/theme';
import React, { useMemo, useState } from 'react';

import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
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

  // Build a rolling 14-day date list starting from today
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

  // Normalize and filter: exclude current slot, only show available
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
      Alert.alert('Success', 'Booking rescheduled successfully');
    } catch (error: any) {
      Alert.alert('Reschedule Failed', error?.message || 'Failed to reschedule booking');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = () => {
    // Reset state each time modal opens
    setSelectedSlotId('');
    setSelectedDate(currentSlot?.date ?? dayjs().format('YYYY-MM-DD'));
    setReason('');
    setShowModal(true);
  };

  if (!currentSlot) return null;

  return (
    <>
      <TouchableOpacity
        onPress={handleOpenModal}
        className="w-full bg-slate-200 rounded-2xl py-4 flex-row items-center justify-center"
        disabled={disabled}
        activeOpacity={0.7}
      >
        <Ionicons name="calendar-outline" size={18} color={THEME.colors.background} />
        <Text className="ml-2 text-slate-900 font-bold">Reschedule Booking</Text>
      </TouchableOpacity>

      <Modal visible={showModal} transparent animationType="slide">
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-5" style={{ maxHeight: '90%' }}>
            {/* Header */}
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xl font-black text-slate-900">Reschedule</Text>
              <TouchableOpacity onPress={() => setShowModal(false)} disabled={loading}>
                <Ionicons name="close" size={22} color={THEME.colors.background} />
              </TouchableOpacity>
            </View>

            {/* Date strip */}
            <Text className="text-xs font-black uppercase text-slate-400 tracking-widest mb-3">
              Select Date
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="mb-4"
              contentContainerStyle={{ gap: 8, paddingBottom: 4 }}
            >
              {datesList.map((d) => {
                const isSelected = d.iso === selectedDate;
                return (
                  <TouchableOpacity
                    key={d.iso}
                    onPress={() => {
                      setSelectedDate(d.iso);
                      setSelectedSlotId('');
                    }}
                    className={`px-4 py-2 rounded-2xl border ${
                      isSelected ? 'bg-black border-black' : 'bg-white border-slate-200'
                    }`}
                  >
                    <Text
                      className={`text-sm font-bold ${
                        isSelected ? 'text-white' : 'text-slate-700'
                      }`}
                    >
                      {d.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Slot list */}
            <Text className="text-xs font-black uppercase text-slate-400 tracking-widest mb-3">
              Available Slots
            </Text>
            <ScrollView className="max-h-56" showsVerticalScrollIndicator={false}>
              {slotsLoading ? (
                <View className="items-center py-8">
                  <ActivityIndicator color={THEME.colors.background} />
                  <Text className="text-slate-400 text-sm mt-2">Loading slots…</Text>
                </View>
              ) : filteredSlots.length === 0 ? (
                <View className="items-center py-8">
                  <Ionicons name="calendar-outline" size={28} color={THEME.colors.textSecondary} />
                  <Text className="text-slate-500 mt-2 text-center">
                    No available slots on this date.
                  </Text>
                </View>
              ) : (
                filteredSlots.map((slot) => {
                  const isSelected = selectedSlotId === slot.id;
                  return (
                    <TouchableOpacity
                      key={slot.id}
                      onPress={() => setSelectedSlotId(slot.id)}
                      className={`border rounded-2xl p-4 mb-3 ${
                        isSelected ? 'border-black bg-slate-100' : 'border-slate-200'
                      }`}
                    >
                      <Text className="font-bold text-slate-900">{slot.label}</Text>
                      {slot.end_time && (
                        <Text className="text-slate-500 mt-0.5 text-sm">
                          {slot.start_time} – {slot.end_time}
                        </Text>
                      )}
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>

            {/* Reason */}
            <TextInput
              value={reason}
              onChangeText={setReason}
              placeholder="Reason (optional)"
              multiline
              className="border border-slate-200 rounded-2xl px-4 py-3 mt-4 text-slate-900"
              style={{ minHeight: 72, textAlignVertical: 'top' }}
            />

            {/* Action buttons */}
            <View className="flex-row mt-5">
              <TouchableOpacity
                onPress={() => setShowModal(false)}
                disabled={loading}
                className="flex-1 bg-slate-200 rounded-2xl py-4 mr-2 items-center"
              >
                <Text className="font-bold text-slate-900">Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleReschedule}
                disabled={loading || !selectedSlotId}
                className={`flex-1 rounded-2xl py-4 ml-2 items-center justify-center ${
                  !selectedSlotId ? 'bg-slate-300' : 'bg-black'
                }`}
              >
                {loading ? (
                  <ActivityIndicator color={THEME.colors.text} />
                ) : (
                  <Text
                    className={`font-bold ${!selectedSlotId ? 'text-slate-400' : 'text-white'}`}
                  >
                    Confirm
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

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

interface Slot {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  status?: string;
}

interface Props {
  bookingId: string;

  currentSlot?: Slot | null;

  businessId: string;

  availableSlots: Slot[];

  onRescheduled?: () => void;

  rescheduledBy: 'customer' | 'owner';
  disabled?: boolean;
}

export default function RescheduleButton({
  bookingId,
  currentSlot,
  availableSlots,
  onRescheduled,
  rescheduledBy,
  disabled = false,
}: Props) {
  const [showModal, setShowModal] = useState(false);

  const [selectedSlotId, setSelectedSlotId] = useState('');

  const [reason, setReason] = useState('');

  const [loading, setLoading] = useState(false);

  const filteredSlots = useMemo(() => {
    return availableSlots.filter(
      (slot) => slot.id !== currentSlot?.id && slot.status === 'available',
    );
  }, [availableSlots, currentSlot]);

  const handleReschedule = async () => {
    if (!selectedSlotId) return;

    try {
      setLoading(true);

      await apiService.rescheduleBooking(bookingId, {
        new_slot_id: selectedSlotId,
        reason,
        rescheduled_by: rescheduledBy,
      });

      Alert.alert('Success', 'Booking rescheduled successfully');

      setShowModal(false);

      if (onRescheduled) {
        onRescheduled();
      }
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to reschedule booking');
    } finally {
      setLoading(false);
    }
  };

  if (!currentSlot) {
    return null;
  }

  return (
    <>
      <TouchableOpacity
        onPress={() => setShowModal(true)}
        className="w-full bg-slate-200 rounded-2xl py-4 flex-row items-center justify-center"
        disabled={disabled}
      >
        <Ionicons name="calendar-outline" size={18} color="#0F172A" />

        <Text className="ml-2 text-slate-900 font-bold">Reschedule Booking</Text>
      </TouchableOpacity>

      <Modal visible={showModal} transparent animationType="slide">
        <View className="flex-1 bg-black/50 justify-center px-5">
          <View className="bg-white rounded-3xl p-5 max-h-[80%]">
            <Text className="text-xl font-black text-slate-900 mb-1">Reschedule Booking</Text>

            <Text className="text-slate-500 text-sm mb-5">Select a new slot</Text>

            <ScrollView className="max-h-72" showsVerticalScrollIndicator={false}>
              {filteredSlots.length === 0 ? (
                <Text className="text-slate-500">No available slots</Text>
              ) : (
                filteredSlots.map((slot) => {
                  const selected = selectedSlotId === slot.id;

                  return (
                    <TouchableOpacity
                      key={slot.id}
                      onPress={() => setSelectedSlotId(slot.id)}
                      className={`border rounded-2xl p-4 mb-3 ${
                        selected ? 'border-black bg-slate-100' : 'border-slate-200'
                      }`}
                    >
                      <Text className="font-bold text-slate-900">{slot.date}</Text>

                      <Text className="text-slate-500 mt-1">
                        {slot.start_time} - {slot.end_time}
                      </Text>
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>

            <TextInput
              value={reason}
              onChangeText={setReason}
              placeholder="Reason (optional)"
              multiline
              className="border border-slate-200 rounded-2xl px-4 py-3 mt-4 text-slate-900"
              style={{
                minHeight: 90,
                textAlignVertical: 'top',
              }}
            />

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
                className="flex-1 bg-black rounded-2xl py-4 ml-2 items-center justify-center"
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text className="font-bold text-white">Confirm</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

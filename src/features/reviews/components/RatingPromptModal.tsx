import React, { useState } from 'react';
import { Modal, View, Text, Pressable, ActivityIndicator, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiService } from '@/services/api.service';
import { logger, LogTag } from '@/utils/logger';

interface RatingPromptModalProps {
  visible: boolean;
  booking: {
    id: string;
    salon_name?: string;
    business_name?: string;
    service_name?: string | string[];
    service_date?: string;
    service_time?: string;
  };
  onClose: () => void;
  onSuccess: () => void;
}

export const RatingPromptModal: React.FC<RatingPromptModalProps> = ({
  visible,
  booking,
  onClose,
  onSuccess,
}) => {
  const [rating, setRating] = useState<number | null>(null);

  const [comment, setComment] = useState('');

  const [isLoading, setIsLoading] = useState(false);

  const [actionType, setActionType] = useState<'submit' | 'ignore' | null>(null);

  const [error, setError] = useState<string | null>(null);

  const salonName = booking.salon_name || booking.business_name || 'Signature Salon';

  const serviceName = Array.isArray(booking.service_name)
    ? booking.service_name.join(', ')
    : typeof booking.service_name === 'string'
      ? booking.service_name
      : 'Premium Service';

  const handleSubmit = async () => {
    if (!rating) {
      setError('Please select a rating');
      return;
    }

    setIsLoading(true);
    setActionType('submit');
    setError(null);

    try {
      await apiService.submitRating(booking.id, rating, comment.trim() || undefined);

      logger.info(LogTag.API, `Successfully submitted review for booking: ${booking.id}`);

      onSuccess();
    } catch (err: any) {
      setError(err?.message || 'Failed to submit review');
    } finally {
      setIsLoading(false);
      setActionType(null);
    }
  };

  const handleIgnore = async () => {
    setIsLoading(true);
    setActionType('ignore');
    setError(null);

    try {
      await apiService.ignoreRating(booking.id);

      logger.info(LogTag.API, `Successfully ignored review for booking: ${booking.id}`);

      onSuccess();
    } catch (err: any) {
      setError(err?.message || 'Failed to skip review');
    } finally {
      setIsLoading(false);
      setActionType(null);
    }
  };

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <View className="flex-1 justify-center items-center bg-black/80 px-6">
        <View className="w-full max-w-[340px] bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
          <View className="absolute top-0 left-0 right-0 h-[3px] bg-amber-500" />

          <View className="flex-row justify-between items-start mb-4">
            <View className="flex-1 pr-3">
              <Text className="text-[20px] font-black text-white tracking-tight">
                Rate Experience
              </Text>

              <Text className="text-amber-400 text-xs font-bold uppercase tracking-widest mt-1">
                {salonName}
              </Text>
            </View>

            <Pressable
              onPress={onClose}
              disabled={isLoading}
              className="p-1 rounded-full bg-slate-800 border border-slate-700"
            >
              <Ionicons name="close" size={16} color="#94A3B8" />
            </Pressable>
          </View>

          <View className="bg-slate-950 border border-slate-800/80 rounded-2xl p-3 mb-5">
            <Text className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              Booking Details
            </Text>

            <Text className="text-white text-sm font-semibold mt-1" numberOfLines={1}>
              {serviceName}
            </Text>

            {booking.service_date && (
              <View className="flex-row items-center mt-2">
                <Ionicons name="calendar-outline" size={12} color="#D4AF37" />

                <Text className="text-slate-400 text-xs font-medium ml-1">
                  {booking.service_date} • {booking.service_time || ''}
                </Text>
              </View>
            )}
          </View>

          <View className="items-center py-2 mb-4">
            <Text className="text-slate-400 text-xs font-medium mb-3">
              How would you rate this reservation?
            </Text>

            <View className="flex-row justify-center">
              {[1, 2, 3, 4, 5].map((star) => {
                const active = rating !== null && star <= rating;

                return (
                  <Pressable
                    key={star}
                    onPress={() => {
                      setRating(star);
                      setError(null);
                    }}
                    disabled={isLoading}
                    className="p-1.5 active:scale-95"
                  >
                    <Ionicons
                      name={active ? 'star' : 'star-outline'}
                      size={32}
                      color={active ? '#F59E0B' : '#475569'}
                    />
                  </Pressable>
                );
              })}
            </View>

            {rating !== null && (
              <Text className="text-amber-400 font-bold text-xs tracking-wider mt-3">
                {rating === 5
                  ? 'EXCELLENT'
                  : rating === 4
                    ? 'VERY GOOD'
                    : rating === 3
                      ? 'GOOD'
                      : rating === 2
                        ? 'FAIR'
                        : 'POOR'}
              </Text>
            )}
          </View>

          {/* Optional Review Comment */}
          <View className="mb-4">
            <Text className="text-slate-400 text-xs font-medium mb-2">
              Write a review (optional)
            </Text>

            <TextInput
              value={comment}
              onChangeText={setComment}
              placeholder="Share your experience..."
              placeholderTextColor="#64748B"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              editable={!isLoading}
              className="bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-white min-h-[100px]"
            />
          </View>

          {error && (
            <Text className="text-rose-500 text-center text-xs font-semibold mb-4 bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20">
              {error}
            </Text>
          )}

          <View className="space-y-2.5">
            <Pressable
              onPress={handleSubmit}
              disabled={isLoading || !rating}
              className={`h-12 w-full rounded-2xl items-center justify-center flex-row ${
                rating ? 'bg-amber-500' : 'bg-slate-800'
              }`}
            >
              {isLoading && actionType === 'submit' ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text
                  className={`font-black text-sm tracking-wider uppercase ${
                    rating ? 'text-black' : 'text-slate-500'
                  }`}
                >
                  Submit Review
                </Text>
              )}
            </Pressable>

            <Pressable
              onPress={handleIgnore}
              disabled={isLoading}
              className="h-12 w-full rounded-2xl items-center justify-center border border-slate-800 bg-transparent"
            >
              {isLoading && actionType === 'ignore' ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text className="text-slate-400 font-black text-sm tracking-wider uppercase">
                  Ignore
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

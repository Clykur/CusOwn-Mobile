import { THEME } from '@/theme/theme';
import React, { useState } from 'react';
import { Modal, View, Text, Pressable, ActivityIndicator, TextInput } from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { apiService } from '@/services/api.service';
import { logger, LogTag } from '@/utils/logger';

interface RatingPromptModalProps {
  visible: boolean;
  booking: {
    id: string;
    booking_id?: string;
    salon_name?: string;
    business_name?: string;
    service_name?: string | string[];
    service_date?: string;
    service_time?: string;
    services?: any[];
    service?: any;
    [key: string]: any;
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

  const [fullBooking, setFullBooking] = useState<any>(booking);

  React.useEffect(() => {
    let isMounted = true;
    if (booking) {
      setFullBooking(booking); // Set immediately

      // If the booking is missing service details, fetch the full booking
      if (!booking.service_name && !booking.services && !booking.service) {
        const fetchId = booking.id; // Use UUID for supabase queries
        if (fetchId) {
          apiService
            .getBookingById(fetchId)
            .then((b) => {
              if (isMounted) {
                setFullBooking({ ...booking, ...b });
              }
            })
            .catch((e) => {
              logger.warn(LogTag.API, 'Failed to fetch full booking for rating', e);
            });
        }
      }
    }
    return () => {
      isMounted = false;
    };
  }, [booking]);

  const salonName =
    fullBooking.salon_name ||
    fullBooking.business_name ||
    fullBooking.business?.salon_name ||
    'Premium Studio';

  const getServiceName = (b: any): string => {
    const fallback =
      b?.service_date && b?.service_time
        ? `Booking on ${b.service_date} at ${b.service_time.substring(0, 5)}`
        : 'Service Experience';

    if (!b) return fallback;
    if (typeof b.service_name === 'string') return b.service_name;
    if (Array.isArray(b.service_name) && b.service_name.length > 0) {
      if (typeof b.service_name[0] === 'string') return b.service_name.join(', ');
      return (
        b.service_name
          .map((s: any) => s?.name || s?.service_name || '')
          .filter(Boolean)
          .join(', ') || fallback
      );
    }
    if (b.service_name && typeof b.service_name === 'object') {
      return b.service_name.name || b.service_name.service_name || fallback;
    }
    if (Array.isArray(b.services) && b.services.length > 0) {
      return (
        b.services
          .map((s: any) => s?.name || s?.service_name || '')
          .filter(Boolean)
          .join(', ') || fallback
      );
    }
    if (b.service && typeof b.service === 'object') {
      return b.service.name || b.service.service_name || fallback;
    }
    return fallback;
  };

  const serviceName = getServiceName(fullBooking);

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
        <View
          className="w-full rounded-full bg-gray-500 p-6"
          style={[
            {
              maxWidth: 340,
              overflow: 'hidden',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.05)',
            },
          ]}
        >
          {/* Header */}
          <View className="flex-row justify-between items-start mb-8">
            <View className="flex-1 pr-3">
              <Text className="text-3xl font-black text-primary tracking-tighter mb-1.5">
                Rate Experience
              </Text>

              <Text
                className="text-textSecondary text-sm tracking-wide"
                style={[
                  {
                    textTransform: 'uppercase',
                  },
                ]}
              >
                {salonName}
              </Text>
            </View>

            <Pressable
              className="w-8 h-8 rounded-full justify-center items-center"
              onPress={onClose}
              disabled={isLoading}
              style={[
                {
                  backgroundColor: 'rgba(255,255,255,0.04)',
                },
              ]}
            >
              <Ionicons name="close" size={18} color={THEME.colors.textSecondary} />
            </Pressable>
          </View>

          {/* Service Name */}
          <View className="mb-8">
            <Text className="text-3xl font-black text-text leading-9 tracking-tighter">
              {serviceName}
            </Text>

            {booking.service_date && (
              <View className="flex-row items-center mt-4">
                <Ionicons name="calendar-outline" size={14} color={THEME.colors.primary} />

                <Text className="text-textSecondary ml-2 text-sm font-semibold">
                  {booking.service_date} • {booking.service_time || ''}
                </Text>
              </View>
            )}
          </View>

          {/* Rating */}
          <View className="items-center mb-8">
            <Text className="text-textSecondary text-sm mb-4.5">How was your experience?</Text>

            <View className="flex-row">
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
                    className="mx-1"
                  >
                    <Ionicons
                      name={active ? 'star' : 'star-outline'}
                      size={34}
                      color={active ? THEME.colors.primary : 'rgba(255,255,255,0.18)'}
                    />
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Review */}
          <View className="mb-6">
            <TextInput
              className="min-h-28 rounded-3xl px-4.5 py-4 text-text"
              value={comment}
              onChangeText={setComment}
              placeholder="Share your feedback..."
              placeholderTextColor={THEME.colors.textSecondary}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              editable={!isLoading}
              style={[
                {
                  backgroundColor: 'rgba(255,255,255,0.03)',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.05)',
                },
              ]}
            />
          </View>

          {/* Error */}
          {error && (
            <Text
              className="mb-4.5 text-center text-sm"
              style={[
                {
                  color: '#ff6b6b',
                },
              ]}
            >
              {error}
            </Text>
          )}

          {/* Actions */}
          <View>
            <Pressable
              className="h-14 rounded-full justify-center items-center"
              onPress={handleSubmit}
              disabled={isLoading || !rating}
              style={[
                {
                  backgroundColor: rating ? THEME.colors.primary : 'rgba(255,255,255,0.08)',
                },
              ]}
            >
              {isLoading && actionType === 'submit' ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <Text
                  className="font-black tracking-wide text-sm"
                  style={[
                    {
                      color: rating ? '#000' : THEME.colors.textSecondary,
                    },
                  ]}
                >
                  SUBMIT REVIEW
                </Text>
              )}
            </Pressable>

            <Pressable onPress={handleIgnore} disabled={isLoading} className="items-center mt-5">
              {isLoading && actionType === 'ignore' ? (
                <ActivityIndicator size="small" color={THEME.colors.textSecondary} />
              ) : (
                <Text className="text-textSecondary font-bold tracking-wide text-sm">
                  MAYBE LATER
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

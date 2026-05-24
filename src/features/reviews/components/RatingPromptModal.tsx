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
          style={{
            width: '100%',
            maxWidth: 340,
            borderRadius: 34,
            overflow: 'hidden',
            backgroundColor: '#0B0B0B',
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.05)',
            padding: 24,
          }}
        >
          {/* Header */}
          <View className="flex-row justify-between items-start mb-8">
            <View className="flex-1 pr-3">
              <Text
                style={{
                  fontSize: 26,
                  fontWeight: '900',
                  color: THEME.colors.primary,
                  letterSpacing: -1,
                  marginBottom: 6,
                }}
              >
                Rate Experience
              </Text>

              <Text
                style={{
                  color: THEME.colors.textSecondary,
                  fontSize: 13,
                  letterSpacing: 2,
                  textTransform: 'uppercase',
                }}
              >
                {salonName}
              </Text>
            </View>

            <Pressable
              onPress={onClose}
              disabled={isLoading}
              style={{
                width: 34,
                height: 34,
                borderRadius: 999,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: 'rgba(255,255,255,0.04)',
              }}
            >
              <Ionicons name="close" size={18} color={THEME.colors.textSecondary} />
            </Pressable>
          </View>

          {/* Service Name */}
          <View className="mb-8">
            <Text
              style={{
                fontSize: 30,
                fontWeight: '900',
                color: THEME.colors.text,
                lineHeight: 36,
                letterSpacing: -1.2,
              }}
            >
              {serviceName}
            </Text>

            {booking.service_date && (
              <View className="flex-row items-center mt-4">
                <Ionicons name="calendar-outline" size={14} color={THEME.colors.primary} />

                <Text
                  style={{
                    color: THEME.colors.textSecondary,
                    marginLeft: 8,
                    fontSize: 13,
                    fontWeight: '600',
                  }}
                >
                  {booking.service_date} • {booking.service_time || ''}
                </Text>
              </View>
            )}
          </View>

          {/* Rating */}
          <View className="items-center mb-8">
            <Text
              style={{
                color: THEME.colors.textSecondary,
                fontSize: 13,
                marginBottom: 18,
              }}
            >
              How was your experience?
            </Text>

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
              value={comment}
              onChangeText={setComment}
              placeholder="Share your feedback..."
              placeholderTextColor={THEME.colors.textSecondary}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              editable={!isLoading}
              style={{
                minHeight: 110,
                borderRadius: 24,
                paddingHorizontal: 18,
                paddingVertical: 16,
                backgroundColor: 'rgba(255,255,255,0.03)',
                color: THEME.colors.text,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.05)',
              }}
            />
          </View>

          {/* Error */}
          {error && (
            <Text
              style={{
                color: '#ff6b6b',
                marginBottom: 18,
                textAlign: 'center',
                fontSize: 13,
              }}
            >
              {error}
            </Text>
          )}

          {/* Actions */}
          <View>
            <Pressable
              onPress={handleSubmit}
              disabled={isLoading || !rating}
              style={{
                height: 54,
                borderRadius: 999,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: rating ? THEME.colors.primary : 'rgba(255,255,255,0.08)',
              }}
            >
              {isLoading && actionType === 'submit' ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <Text
                  style={{
                    color: rating ? '#000' : THEME.colors.textSecondary,
                    fontWeight: '900',
                    letterSpacing: 1,
                    fontSize: 14,
                  }}
                >
                  SUBMIT REVIEW
                </Text>
              )}
            </Pressable>

            <Pressable onPress={handleIgnore} disabled={isLoading} className="items-center mt-5">
              {isLoading && actionType === 'ignore' ? (
                <ActivityIndicator size="small" color={THEME.colors.textSecondary} />
              ) : (
                <Text
                  style={{
                    color: THEME.colors.textSecondary,
                    fontWeight: '700',
                    letterSpacing: 1,
                    fontSize: 13,
                  }}
                >
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

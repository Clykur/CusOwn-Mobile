import { THEME } from '@/theme/theme';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/auth.store';
import { apiService } from '@/services/api.service';
import { Ionicons } from '@expo/vector-icons';
import { useProfileImage } from '@/features/shared/hooks/useProfileImage';
import { useProfileMedia } from '@/hooks/useProfileMedia';
import { isValidImageUrl } from '@/utils/image';
import { useModal } from '@/hooks/useModal';
// New UI Components
import { PremiumBackground } from '@/components/ui/PremiumBackground';
import { GlassCard } from '@/components/ui/GlassCard';
import { AnimatedSection } from '@/components/animations/AnimatedSection';
import { PremiumButton } from '@/components/ui/PremiumButton';
import { Avatar } from '@/components/ui/Avatar';

export default function OwnerProfileScreen() {
  const { signOut } = useAuth();
  const { user, profile, profileImageUrl } = useAuthStore();
  const { pickAndUpload, uploading } = useProfileImage();
  const { data: mediaUrl } = useProfileMedia(user?.id);
  const { showModal } = useModal();

  const [loading, setLoading] = useState(!profile);
  const [updating, setUpdating] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const [profileData, setProfileData] = useState<any>(profile ? { profile } : null);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    phone_number: profile?.phone_number || '',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    if (!profile) setLoading(true);

    try {
      const data = await apiService.getProfile();

      setProfileData(data);

      if (data?.profile) {
        setFormData({
          full_name: data.profile.full_name || '',
          phone_number: data.profile.phone_number || '',
        });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!formData.full_name.trim()) {
      showModal({
        variant: 'error',
        title: 'Error',
        description: 'Full name is required',
      });
      return;
    }

    setUpdating(true);

    try {
      await apiService.updateProfile({
        full_name: formData.full_name,
        phone_number: formData.phone_number,
      });

      showModal({
        variant: 'success',
        title: 'Success',
        description: 'Profile updated successfully',
      });
      setEditMode(false);
      fetchProfile();
    } catch (err: any) {
      showModal({
        variant: 'error',
        title: 'Update Failed',
        description: err.message || 'Could not update profile',
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleCancel = () => {
    setEditMode(false);
    setFormData({
      full_name: profileData?.profile?.full_name || '',
      phone_number: profileData?.profile?.phone_number || '',
    });
  };

  const handleDeleteAccount = () => {
    showModal({
      variant: 'delete',
      title: 'Delete Account',
      description:
        'This action is permanent and will remove all your data after 30 days. Are you absolutely sure?',
      dismissible: true,
      actions: [
        {
          label: 'Delete Permanently',
          variant: 'danger',
          onPress: async () => {
            try {
              await apiService.deleteAccount('User requested deletion via mobile app');
              signOut();
            } catch (err: any) {
              showModal({
                variant: 'error',
                title: 'Error',
                description: 'Failed to delete account. Please try again.',
              });
            }
          },
        },
      ],
    });
  };

  const handleSignOut = () => {
    showModal({
      variant: 'signout',
      title: 'Sign Out',
      description: 'Are you sure you want to exit?',
      dismissible: true,
      actions: [
        {
          label: 'Sign Out',
          variant: 'primary',
          onPress: () => signOut(),
        },
      ],
    });
  };

  const formatDate = (date: string) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <PremiumBackground>
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={THEME.colors.primary} />
        </View>
      </PremiumBackground>
    );
  }

  return (
    <PremiumBackground>
      <SafeAreaView className="flex-1" edges={['left', 'right']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1"
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingBottom: 40,
            }}
          >
            <View className="h-96 w-full relative">
              {isValidImageUrl(mediaUrl || profileImageUrl) ? (
                <Image
                  source={{
                    uri: mediaUrl || profileImageUrl || undefined,
                  }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              ) : (
                <Avatar
                  userId={user?.id}
                  name={
                    profileData?.profile?.full_name ||
                    profile?.full_name ||
                    user?.user_metadata?.full_name ||
                    'User'
                  }
                  size={400}
                  type="customer"
                  className="w-full h-full"
                />
              )}

              {/* Edit Image */}
              {editMode && (
                <Pressable
                  disabled={uploading}
                  onPress={async () => {
                    await pickAndUpload();
                  }}
                  className="absolute top-16 right-6 items-center justify-center shadow-lg"
                >
                  <Ionicons
                    name={uploading ? 'hourglass-outline' : 'camera-outline'}
                    size={24}
                    color={THEME.colors.primary}
                  />
                </Pressable>
              )}
            </View>

            {/* Profile Info Overlapping Card */}
            <View className="px-luxury -mt-10 mb-6">
              <AnimatedSection direction="up">
                <GlassCard className="p-2 border border-border bg-card shadow-sm rounded-3xl">
                  <View className="flex-row items-center justify-between mb-1">
                    <Text className="text-textSecondary text-xs font-black uppercase tracking-1">
                      Manage your account
                    </Text>

                    <View className="flex-row items-center">
                      <View className="w-2 h-2 rounded-full bg-success mr-2" />

                      <Text className="text-success text-xs font-black uppercase tracking-0.5">
                        Verified
                      </Text>
                    </View>
                  </View>
                  <Text className="text-text text-3xl font-extrabold tracking-tight mb-2">
                    {profileData?.profile?.full_name || 'User'}
                  </Text>
                  <Text className="text-sm text-textSecondary font-medium">
                    Manage your profile, security, and personal preferences
                  </Text>
                </GlassCard>
              </AnimatedSection>
            </View>

            <View className="px-luxury">
              {/* Contact Card */}
              <AnimatedSection direction="up" delay={200}>
                <GlassCard className="p-2 border border-border bg-card shadow-sm rounded-3xl mb-6">
                  <View className="flex-row items-center justify-between mb-6">
                    <Text className="text-text text-xl font-bold tracking-tight uppercase">
                      Contact
                    </Text>

                    {!editMode && (
                      <Pressable
                        onPress={() => setEditMode(true)}
                        className="px-4 py-2 active:bg-input flex-row items-center"
                      >
                        <Ionicons
                          name="create-outline"
                          size={14}
                          color={THEME.colors.primary}
                          className="mr-1"
                        />
                        <Text className="text-sm uppercase tracking-wider text-primary font-bold ml-1">
                          Edit
                        </Text>
                      </Pressable>
                    )}
                  </View>

                  <View>
                    {/* Full Name */}
                    <View className="flex-row items-center justify-between py-5 border-b border-border">
                      <Text className="text-textSecondary text-xs uppercase tracking-0.5 font-black w-24">
                        Name
                      </Text>

                      <View className="flex-1 items-end">
                        {editMode ? (
                          <TextInput
                            value={formData.full_name}
                            onChangeText={(text) =>
                              setFormData((prev) => ({
                                ...prev,
                                full_name: text,
                              }))
                            }
                            placeholder="Enter full name"
                            placeholderTextColor={THEME.colors.textSecondary}
                            className="w-full border border-border bg-input rounded-2xl px-4 py-3 text-right text-base text-text font-semibold"
                          />
                        ) : (
                          <Text className="text-base text-text font-bold text-right">
                            {profileData?.profile?.full_name || 'Not set'}
                          </Text>
                        )}
                      </View>
                    </View>

                    {/* Email */}
                    <View className="flex-row items-center justify-between py-5 border-b border-border">
                      <Text className="text-textSecondary text-xs uppercase tracking-0.5 font-black w-24">
                        Email
                      </Text>

                      <Text
                        className="text-base text-text font-bold text-right flex-1"
                        numberOfLines={1}
                      >
                        {profileData?.user?.email || user?.email || 'N/A'}
                      </Text>
                    </View>

                    {/* Phone */}
                    <View className="flex-row items-center justify-between py-5">
                      <Text className="text-textSecondary text-xs uppercase tracking-0.5 font-black w-24">
                        Phone
                      </Text>

                      <View className="flex-1 items-end">
                        {editMode ? (
                          <TextInput
                            value={formData.phone_number}
                            onChangeText={(text) =>
                              setFormData((prev) => ({
                                ...prev,
                                phone_number: text,
                              }))
                            }
                            placeholder="Enter phone number"
                            placeholderTextColor={THEME.colors.textSecondary}
                            keyboardType="phone-pad"
                            className="w-full border border-border bg-input rounded-2xl px-4 py-3 text-right text-base text-text font-semibold"
                          />
                        ) : (
                          <Text className="text-base text-text font-bold text-right">
                            {profileData?.profile?.phone_number || 'Not set'}
                          </Text>
                        )}
                      </View>
                    </View>
                  </View>
                </GlassCard>
              </AnimatedSection>

              {/* Edit Actions */}
              {editMode && (
                <AnimatedSection direction="up" delay={250}>
                  <View className="flex-row gap-4 mb-6">
                    <View className="flex-1">
                      <PremiumButton
                        title={updating ? 'Saving...' : 'Save Changes'}
                        onPress={handleUpdateProfile}
                        disabled={updating}
                        className="h-12 bg-primary rounded-2xl"
                      />
                    </View>

                    <PremiumButton
                      title="Cancel"
                      variant="secondary"
                      onPress={handleCancel}
                      className="flex-1 h-12 rounded-2xl border border-border bg-input"
                      textClassName="text-textSecondary text-sm uppercase tracking-widest"
                    />
                  </View>
                </AnimatedSection>
              )}

              {/* Account Card */}
              <AnimatedSection direction="up" delay={300}>
                <GlassCard className="p-2 border border-border bg-card shadow-sm rounded-3xl mb-6">
                  <Text className="text-text text-xl font-bold tracking-tight uppercase mb-6">
                    Account
                  </Text>

                  <View>
                    <View className="flex-row items-center justify-between py-5 border-b border-border">
                      <Text className="text-textSecondary text-xs uppercase tracking-0.5 font-black w-32">
                        Type
                      </Text>
                      <View className="flex-1 items-end">
                        <Text className="text-base text-primary font-black text-right uppercase tracking-wide">
                          {profileData?.profile?.user_type === 'owner'
                            ? 'Business Owner'
                            : profileData?.profile?.user_type === 'both'
                              ? 'Customer & Owner'
                              : profileData?.profile?.user_type === 'admin'
                                ? 'Admin'
                                : 'Business Owner'}
                        </Text>
                      </View>
                    </View>

                    <View className="flex-row items-center justify-between py-5 border-b border-border">
                      <Text className="text-textSecondary text-xs uppercase tracking-0.5 font-black w-32">
                        Created
                      </Text>
                      <View className="flex-1 items-end">
                        <Text className="text-base text-text font-bold text-right">
                          {new Date(
                            profileData?.profile?.created_at ||
                              profileData?.created_at ||
                              user?.created_at,
                          ).toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </Text>
                      </View>
                    </View>

                    <View className="flex-row items-center justify-between py-5">
                      <Text className="text-textSecondary text-xs uppercase tracking-0.5 font-black w-32">
                        Last Login
                      </Text>
                      <View className="flex-1 items-end">
                        <Text className="text-base text-text font-bold text-right">
                          {(() => {
                            const date = new Date(
                              user?.last_sign_in_at || new Date().toISOString(),
                            );
                            const today = new Date();
                            const yesterday = new Date();
                            yesterday.setDate(today.getDate() - 1);

                            if (date.toDateString() === today.toDateString()) return 'Today';
                            if (date.toDateString() === yesterday.toDateString())
                              return 'Yesterday';

                            return date.toLocaleDateString('en-US', {
                              month: 'long',
                              day: 'numeric',
                              year: 'numeric',
                            });
                          })()}
                        </Text>
                      </View>
                    </View>
                  </View>
                </GlassCard>
              </AnimatedSection>

              {/* Danger Zone */}
              <AnimatedSection direction="up" delay={500}>
                <GlassCard className="p-2 border border-error/30 bg-error/5 rounded-3xl mb-6">
                  <View className="flex-row items-center mb-3">
                    <Text className="text-error text-xl font-black uppercase tracking-0.5">
                      Danger Zone
                    </Text>
                  </View>

                  <Text className="text-sm leading-6 text-textSecondary font-medium mb-5">
                    Permanently remove your account and all associated data. This action cannot be
                    undone after 30 days.
                  </Text>

                  <Pressable
                    onPress={handleDeleteAccount}
                    className="flex-row items-center justify-center border border-error/40 bg-error/10 rounded-2xl h-14 active:bg-error/20"
                  >
                    <Text className="text-error font-black text-sm uppercase tracking-0.5">
                      Delete Account
                    </Text>
                  </Pressable>
                </GlassCard>
              </AnimatedSection>

              {/* Sign Out */}
              <AnimatedSection direction="up" delay={600}>
                <Pressable
                  onPress={handleSignOut}
                  className="bg-input border border-border rounded-2xl h-14 items-center justify-center active:bg-card mb-10"
                >
                  <Text className="text-text font-bold text-sm uppercase tracking-widest">
                    Sign Out
                  </Text>
                </Pressable>
              </AnimatedSection>

              {error && <Text className="text-error text-center mb-6 font-bold">{error}</Text>}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </PremiumBackground>
  );
}

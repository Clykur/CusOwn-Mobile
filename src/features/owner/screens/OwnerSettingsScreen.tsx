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
      Alert.alert('Error', 'Full name is required');
      return;
    }

    setUpdating(true);

    try {
      await apiService.updateProfile({
        full_name: formData.full_name,
        phone_number: formData.phone_number,
      });

      Alert.alert('Success', 'Profile updated successfully');
      setEditMode(false);
      fetchProfile();
    } catch (err: any) {
      Alert.alert('Update Failed', err.message || 'Could not update profile');
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
    Alert.alert(
      'Delete Account',
      'This action is permanent and will remove all your data after 30 days. Are you absolutely sure?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete Permanently',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.deleteAccount('User requested deletion via mobile app');
              signOut();
            } catch (err: any) {
              Alert.alert('Error', 'Failed to delete account. Please try again.');
            }
          },
        },
      ],
    );
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to exit?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: signOut,
      },
    ]);
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
          <ActivityIndicator size="large" color={THEME.colors.background} />
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
            {/* Hero Profile Image */}
            <View className="h-[360px] w-full relative">
              {isValidImageUrl(mediaUrl || profileImageUrl) ? (
                <Image
                  source={{ uri: (mediaUrl || profileImageUrl) as string }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              ) : (
                <View className="w-full h-full bg-slate-200 items-center justify-center">
                  <Avatar
                    name={profileData?.profile?.full_name || 'User'}
                    size={400}
                    className="w-full h-full"
                  />
                </View>
              )}
              <View className="absolute inset-0 bg-black/20" />

              {/* Edit Image Button */}
              {editMode && (
                <Pressable
                  disabled={uploading}
                  onPress={async () => {
                    await pickAndUpload();
                  }}
                  className="absolute bottom-16 right-6 w-14 h-14 rounded-full items-center justify-center shadow-lg border-2 border-white/50"
                  style={{ backgroundColor: THEME.colors.background }}
                >
                  <Ionicons
                    name={uploading ? 'hourglass-outline' : 'camera-outline'}
                    size={24}
                    color={THEME.colors.text}
                  />
                </Pressable>
              )}
            </View>

            {/* Profile Info Overlapping Card */}
            <View className="px-luxury -mt-10 mb-6">
              <AnimatedSection direction="up">
                <GlassCard className="p-2 border border-slate-200 bg-white/95 shadow-sm rounded-3xl">
                  <Text className="text-slate-400 text-xs font-black uppercase tracking-[3px] mb-1">
                    Manage your account
                  </Text>
                  <Text className="text-slate-900 text-3xl font-extrabold tracking-tight mb-2">
                    {profileData?.profile?.full_name || 'User'}
                  </Text>
                  <Text className="text-sm text-slate-500 font-medium">
                    Manage your profile, security, and personal preferences
                  </Text>
                </GlassCard>
              </AnimatedSection>
            </View>

            <View className="px-luxury">
              {/* Contact Card */}
              <AnimatedSection direction="up" delay={200}>
                <GlassCard className="p-2 border border-slate-200 bg-white/95 shadow-sm rounded-3xl mb-6">
                  <View className="flex-row items-center justify-between mb-6">
                    <Text className="text-slate-900 text-xl font-bold tracking-tight uppercase">
                      Contact
                    </Text>

                    {!editMode && (
                      <Pressable
                        onPress={() => setEditMode(true)}
                        className="border border-slate-200 rounded-full px-4 py-2 active:bg-slate-100 flex-row items-center"
                      >
                        <Ionicons
                          name="create-outline"
                          size={14}
                          color={THEME.colors.textSecondary}
                          className="mr-1"
                        />
                        <Text className="text-sm uppercase tracking-wider text-slate-500 font-bold ml-1">
                          Edit
                        </Text>
                      </Pressable>
                    )}
                  </View>

                  <View className="space-y-6">
                    {/* Full Name */}
                    <View>
                      <Text className="text-xs uppercase tracking-wider text-slate-400 mb-2 font-bold">
                        Full Name
                      </Text>
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
                          className="border border-slate-200 bg-slate-50 rounded-2xl px-4 py-4 text-base text-slate-900 font-medium"
                        />
                      ) : (
                        <Text className="text-lg text-slate-900 font-bold">
                          {profileData?.profile?.full_name || 'Not set'}
                        </Text>
                      )}
                    </View>

                    {/* Email */}
                    <View className="border-t border-slate-100 pt-5">
                      <View className="flex-row items-center justify-between mb-1">
                        <Text className="text-xs uppercase tracking-wider text-slate-400 font-bold">
                          Email
                        </Text>
                        <View className="flex-row items-center">
                          <View className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2" />

                          <Text className="text-emerald-600 text-[10px] font-black uppercase tracking-[2px]">
                            Verified
                          </Text>
                        </View>
                      </View>
                      <Text className="text-lg text-slate-900 font-bold mt-1">
                        {profileData?.user?.email || user?.email || 'N/A'}
                      </Text>
                    </View>

                    {/* Phone */}
                    <View className="border-t border-slate-100 pt-5">
                      <Text className="text-xs uppercase tracking-wider text-slate-400 mb-2 font-bold">
                        Phone
                      </Text>
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
                          keyboardType="phone-pad"
                          className="border border-slate-200 bg-slate-50 rounded-2xl px-4 py-4 text-base text-slate-900 font-medium"
                        />
                      ) : (
                        <Text className="text-lg text-slate-900 font-bold">
                          {profileData?.profile?.phone_number || 'Not set'}
                        </Text>
                      )}
                    </View>
                  </View>
                </GlassCard>
              </AnimatedSection>

              {/* Edit Actions */}
              {editMode && (
                <AnimatedSection direction="up" delay={250}>
                  <View className="flex-row gap-4 mb-6">
                    <PremiumButton
                      title={updating ? 'Saving...' : 'Save Changes'}
                      onPress={handleUpdateProfile}
                      disabled={updating}
                      className="flex-1 h-14 bg-black rounded-2xl"
                    />
                    <Pressable
                      onPress={handleCancel}
                      className="flex-1 border border-slate-200 bg-white rounded-2xl h-14 items-center justify-center active:bg-slate-50"
                    >
                      <Text className="text-slate-700 font-bold text-sm uppercase tracking-widest">
                        Cancel
                      </Text>
                    </Pressable>
                  </View>
                </AnimatedSection>
              )}

              {/* Account Card */}
              <AnimatedSection direction="up" delay={300}>
                <GlassCard className="p-2 border border-slate-200 bg-white/95 shadow-sm rounded-3xl mb-6">
                  <Text className="text-slate-900 text-xl font-bold tracking-tight uppercase mb-6">
                    Account
                  </Text>

                  <View className="space-y-5">
                    <View className="flex-row items-center justify-between pb-5 border-b border-slate-100">
                      <Text className="text-xs uppercase tracking-wider text-slate-400 font-bold">
                        Account Type
                      </Text>
                      <View className="bg-slate-100 px-4 py-1.5 rounded-full">
                        <Text className="text-slate-700 font-bold text-xs">
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

                    <View className="pb-5 border-b border-slate-100">
                      <Text className="text-xs uppercase tracking-wider text-slate-400 mb-1 font-bold">
                        Account Created
                      </Text>
                      <Text className="text-base text-slate-900 font-bold">
                        {formatDate(
                          profileData?.profile?.created_at ||
                            profileData?.created_at ||
                            user?.created_at,
                        )}
                      </Text>
                    </View>

                    <View>
                      <Text className="text-xs uppercase tracking-wider text-slate-400 mb-1 font-bold">
                        Last Sign-In
                      </Text>
                      <Text className="text-base text-slate-900 font-bold">
                        {formatDate(user?.last_sign_in_at || new Date().toISOString())}
                      </Text>
                    </View>
                  </View>
                </GlassCard>
              </AnimatedSection>

              {/* Danger Zone */}
              <AnimatedSection direction="up" delay={500}>
                <GlassCard className="p-2 border border-red-200 bg-red-50 rounded-3xl mb-6">
                  <View className="flex-row items-center mb-3">
                    <Text className="text-red-600 text-xl font-black uppercase tracking-[2px]">
                      Danger Zone
                    </Text>
                  </View>

                  <Text className="text-sm leading-6 text-slate-600 font-medium mb-5">
                    Permanently remove your account and all associated data. This action cannot be
                    undone after 30 days.
                  </Text>

                  <Pressable
                    onPress={handleDeleteAccount}
                    className="flex-row items-center justify-center border border-red-200 bg-white rounded-2xl h-14 active:bg-red-50"
                  >
                    <Text className="text-red-600 font-black text-sm uppercase tracking-[2px]">
                      Delete Account
                    </Text>
                  </Pressable>
                </GlassCard>
              </AnimatedSection>

              {/* Sign Out */}
              <AnimatedSection direction="up" delay={600}>
                <Pressable
                  onPress={handleSignOut}
                  className="bg-white border border-slate-200 rounded-2xl h-14 items-center justify-center shadow-sm active:bg-slate-50 mb-10"
                >
                  <Text className="text-slate-900 font-bold text-sm uppercase tracking-widest">
                    Sign Out
                  </Text>
                </Pressable>
              </AnimatedSection>

              {error && <Text className="text-rose-500 text-center mb-6 font-bold">{error}</Text>}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </PremiumBackground>
  );
}

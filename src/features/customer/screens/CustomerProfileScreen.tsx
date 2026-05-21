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
  Switch,
  Image,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/auth.store';

import { apiService } from '@/services/api.service';

import { Ionicons } from '@expo/vector-icons';

import { useProfileImage } from '@/hooks/useProfileImage';
import { useProfileMedia } from '@/hooks/useProfileMedia';

import { isValidImageUrl } from '@/utils/image';

import { PremiumBackground } from '@/components/ui/PremiumBackground';
import { GlassCard } from '@/components/ui/GlassCard';
import { AnimatedSection } from '@/components/animations/AnimatedSection';
import { PremiumButton } from '@/components/ui/PremiumButton';
import { Avatar } from '@/components/ui/Avatar';

export default function CustomerProfileScreen() {
  const { user, profile, profileImageUrl } = useAuthStore();

  const { signOut } = useAuth();

  const { pickAndUpload, uploading } = useProfileImage();

  const { data: mediaUrl } = useProfileMedia(user?.id);

  const [loading, setLoading] = useState(!profile);

  const [updating, setUpdating] = useState(false);

  const [editMode, setEditMode] = useState(false);

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

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
            {/* Hero */}
            <View className="h-[360px] w-full relative">
              {isValidImageUrl(mediaUrl || profileImageUrl) ? (
                <Image
                  source={{
                    uri: (mediaUrl || profileImageUrl) as string,
                  }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              ) : (
                <View className="w-full h-full bg-secondary items-center justify-center">
                  <Avatar
                    name={profileData?.profile?.full_name || 'User'}
                    size={400}
                    className="w-full h-full"
                  />
                </View>
              )}

              <View className="absolute inset-0 bg-background/40" />

              {/* Edit Image */}
              {editMode && (
                <Pressable
                  disabled={uploading}
                  onPress={async () => {
                    await pickAndUpload();
                  }}
                  className="absolute bottom-16 right-6 w-14 h-14 rounded-full items-center justify-center shadow-lg border-2 border-primary/30"
                  style={{
                    backgroundColor: THEME.colors.primary,
                  }}
                >
                  <Ionicons
                    name={uploading ? 'hourglass-outline' : 'camera-outline'}
                    size={24}
                    color={THEME.colors.background}
                  />
                </Pressable>
              )}
            </View>

            {/* Header Card */}
            <View className="px-luxury -mt-10 mb-6">
              <AnimatedSection direction="up">
                <GlassCard className="p-2 border border-border bg-card shadow-sm rounded-3xl">
                  <Text className="text-textSecondary text-xs font-black uppercase tracking-[3px] mb-1">
                    Manage your account
                  </Text>

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
              {/* Contact */}
              <AnimatedSection direction="up" delay={200}>
                <GlassCard className="p-2 border border-border bg-card shadow-sm rounded-3xl mb-6">
                  <View className="flex-row items-center justify-between mb-6">
                    <Text className="text-text text-xl font-bold tracking-tight uppercase">
                      Contact
                    </Text>

                    {!editMode && (
                      <Pressable
                        onPress={() => setEditMode(true)}
                        className="border border-border rounded-full px-4 py-2 active:bg-input flex-row items-center"
                      >
                        <Ionicons name="create-outline" size={14} color={THEME.colors.primary} />

                        <Text className="text-sm uppercase tracking-wider text-primary font-bold ml-1">
                          Edit
                        </Text>
                      </Pressable>
                    )}
                  </View>

                  <View className="space-y-6">
                    {/* Name */}
                    <View>
                      <Text className="text-xs uppercase tracking-wider text-textSecondary mb-2 font-bold">
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
                          placeholderTextColor={THEME.colors.textSecondary}
                          className="border border-border bg-input rounded-2xl px-4 py-4 text-base text-text font-medium"
                        />
                      ) : (
                        <Text className="text-lg text-text font-bold">
                          {profileData?.profile?.full_name || 'Not set'}
                        </Text>
                      )}
                    </View>

                    {/* Email */}
                    <View className="border-t border-border pt-5">
                      <View className="flex-row items-center justify-between mb-1">
                        <Text className="text-xs uppercase tracking-wider text-textSecondary font-bold">
                          Email
                        </Text>

                        <View className="flex-row items-center">
                          <View className="w-1.5 h-1.5 rounded-full bg-success mr-2" />

                          <Text className="text-success text-[10px] font-black uppercase tracking-[2px]">
                            Verified
                          </Text>
                        </View>
                      </View>

                      <Text className="text-lg text-text font-bold mt-1">
                        {profileData?.user?.email || user?.email || 'N/A'}
                      </Text>
                    </View>

                    {/* Phone */}
                    <View className="border-t border-border pt-5">
                      <Text className="text-xs uppercase tracking-wider text-textSecondary mb-2 font-bold">
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
                          placeholderTextColor={THEME.colors.textSecondary}
                          keyboardType="phone-pad"
                          className="border border-border bg-input rounded-2xl px-4 py-4 text-base text-text font-medium"
                        />
                      ) : (
                        <Text className="text-lg text-text font-bold">
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
                      className="flex-1 h-14 bg-primary rounded-2xl"
                    />

                    <Pressable
                      onPress={handleCancel}
                      className="flex-1 border border-border bg-input rounded-2xl h-14 items-center justify-center active:bg-card"
                    >
                      <Text className="text-textSecondary font-bold text-sm uppercase tracking-widest">
                        Cancel
                      </Text>
                    </Pressable>
                  </View>
                </AnimatedSection>
              )}

              {/* Account */}
              <AnimatedSection direction="up" delay={300}>
                <GlassCard className="p-2 border border-border bg-card shadow-sm rounded-3xl mb-6">
                  <Text className="text-text text-xl font-bold tracking-tight uppercase mb-6">
                    Account
                  </Text>

                  <View className="space-y-5">
                    <View className="flex-row items-center justify-between pb-5 border-b border-border">
                      <Text className="text-xs uppercase tracking-wider text-textSecondary font-bold">
                        Account Type
                      </Text>

                      <View className="bg-secondary/50 border border-primary/20 px-4 py-1.5 rounded-full">
                        <Text className="text-primary font-bold text-xs">
                          {profileData?.profile?.user_type === 'owner'
                            ? 'Business Owner'
                            : profileData?.profile?.user_type === 'both'
                              ? 'Customer & Owner'
                              : profileData?.profile?.user_type === 'admin'
                                ? 'Admin'
                                : 'Customer'}
                        </Text>
                      </View>
                    </View>

                    <View className="pb-5 border-b border-border">
                      <Text className="text-xs uppercase tracking-wider text-textSecondary mb-1 font-bold">
                        Account Created
                      </Text>

                      <Text className="text-base text-text font-bold">
                        {formatDate(
                          profileData?.profile?.created_at ||
                            profileData?.created_at ||
                            user?.created_at,
                        )}
                      </Text>
                    </View>

                    <View>
                      <Text className="text-xs uppercase tracking-wider text-textSecondary mb-1 font-bold">
                        Last Sign-In
                      </Text>

                      <Text className="text-base text-text font-bold">
                        {formatDate(user?.last_sign_in_at || new Date().toISOString())}
                      </Text>
                    </View>
                  </View>
                </GlassCard>
              </AnimatedSection>

              {/* Preferences */}
              <AnimatedSection direction="up" delay={400}>
                <GlassCard className="p-2 border border-border bg-card shadow-sm rounded-3xl mb-6">
                  <Text className="text-text text-xl font-bold tracking-tight uppercase mb-6">
                    Preferences
                  </Text>

                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center flex-1 mr-4">
                      <View className="w-12 h-12 rounded-full items-center justify-center mr-4">
                        <Ionicons
                          name="notifications-outline"
                          size={22}
                          color={THEME.colors.textSecondary}
                        />
                      </View>

                      <Text className="text-text text-base font-bold">Notifications</Text>
                    </View>

                    <Switch
                      value={notificationsEnabled}
                      onValueChange={setNotificationsEnabled}
                      trackColor={{
                        false: THEME.colors.border,
                        true: THEME.colors.primary,
                      }}
                      thumbColor={THEME.colors.text}
                    />
                  </View>
                </GlassCard>
              </AnimatedSection>

              {/* Danger */}
              <AnimatedSection direction="up" delay={500}>
                <GlassCard className="p-2 border border-error/30 bg-error/5 rounded-3xl mb-6">
                  <Text className="text-error text-xl font-black uppercase tracking-[2px] mb-3">
                    Danger Zone
                  </Text>

                  <Text className="text-sm leading-6 text-textSecondary font-medium mb-5">
                    Permanently remove your account and all associated data. This action cannot be
                    undone after 30 days.
                  </Text>

                  <Pressable
                    onPress={handleDeleteAccount}
                    className="flex-row items-center justify-center border border-error/40 bg-error/5 rounded-2xl h-14 active:bg-error/20"
                  >
                    <Text className="text-error font-black text-sm uppercase tracking-[2px]">
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

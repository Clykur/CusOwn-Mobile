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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { apiService } from '@/services/api.service';
import { Avatar } from '@/components/ui/Avatar';
import { Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useProfileImage } from '@/hooks/useProfileImage';
import { useAuthStore } from '@/store/auth.store';

import { PremiumBackground } from '@/components/ui/PremiumBackground';
import { GlassCard } from '@/components/ui/GlassCard';

export default function OwnerProfileScreen() {
  const { signOut } = useAuth();
  const { profileImageUrl } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const [profileData, setProfileData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    full_name: '',
    phone_number: '',
  });
  const { pickAndUpload, uploading } = useProfileImage();

  const [profileImage, setProfileImage] = useState<string | null>(null);
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);

    try {
      const data = await apiService.getProfile();

      setProfileData(data);

      if (data?.profile) {
        setFormData({
          full_name: data.profile.full_name || '',
          phone_number: data.profile.phone_number || '',
        });
      }
      /**
       * Existing uploaded profile image
       */

      if (data?.profile?.profile_media_id) {
        try {
          const signed = await apiService.getSignedUrl(data.profile.profile_media_id);

          if (signed?.url) {
            setProfileImage(signed.url);
          }
        } catch (e) {}
      } else {
        const media = data?.profile?.media;
        const mediaItem = Array.isArray(media) ? media[0] : media;
        const fromMedia = mediaItem?.signed_url || mediaItem?.url;
        if (fromMedia) {
          setProfileImage(fromMedia);
        } else if (data?.profile_image_url) {
          setProfileImage(data.profile_image_url);
        }
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
        { text: 'Cancel', style: 'cancel' },
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
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
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
          <ActivityIndicator size="large" color="#000000" />
        </View>
      </PremiumBackground>
    );
  }

  return (
    <PremiumBackground>
      <SafeAreaView className="flex-1" edges={['top']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1"
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              padding: 20,
              paddingBottom: 40,
            }}
          >
            {/* Header */}
            <View className="mb-8">
              <Text className="text-slate-400 text-[10px] font-black uppercase tracking-[3px] mb-1">
                Manage your account
              </Text>
              <Text className="text-slate-900 text-3xl font-black tracking-tight">My Profile</Text>
            </View>

            {/* Profile Overview */}
            <View className="flex-row items-start justify-between mb-6">
              <View className="flex-row flex-1">
                <Pressable
                  disabled={!editMode || uploading}
                  onPress={async () => {
                    const uploadedUrl = await pickAndUpload();

                    if (uploadedUrl) {
                      setProfileImage(uploadedUrl);
                    }
                  }}
                >
                  <View className="relative">
                    {profileImage || profileImageUrl ? (
                      <Image
                        source={{ uri: (profileImage || profileImageUrl) as string }}
                        style={{
                          width: 88,
                          height: 88,
                          borderRadius: 44,
                        }}
                      />
                    ) : (
                      <Avatar name={profileData?.profile?.full_name || 'User'} size={88} />
                    )}

                    {editMode && (
                      <View className="absolute bottom-0 right-0 bg-[#0F172A] w-8 h-8 rounded-full items-center justify-center border-2 border-white">
                        <Ionicons
                          name={uploading ? 'hourglass-outline' : 'camera-outline'}
                          size={16}
                          color="#FFFFFF"
                        />
                      </View>
                    )}
                  </View>
                </Pressable>

                <View className="ml-4 flex-1 justify-center">
                  <Text className="text-xl font-bold text-slate-900">Account Settings</Text>

                  <Text className="text-xs text-slate-500 mt-1 leading-5">
                    Manage your profile, security, and personal preferences
                  </Text>
                </View>
              </View>

              {!editMode && (
                <Pressable
                  onPress={() => setEditMode(true)}
                  className="border border-slate-200/80 rounded-xl px-5 py-3 bg-white active:bg-slate-50"
                >
                  <Text className="text-xs font-black uppercase tracking-wider text-slate-700">
                    Edit
                  </Text>
                </Pressable>
              )}
            </View>

            {/* Contact Card */}
            <GlassCard className="mb-6 p-0 border-slate-200/80 rounded-luxury shadow-sm overflow-hidden">
              <View className="border-b border-slate-200 px-5 py-4 bg-slate-50/50">
                <Text className="text-[10px] tracking-[2px] uppercase text-slate-500 font-black">
                  Contact
                </Text>
              </View>

              {/* Full Name */}
              <View className="px-5 py-5 border-b border-slate-100/50">
                <Text className="text-[10px] uppercase tracking-[2px] text-slate-400 mb-2 font-black">
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
                    className="bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-3.5 text-sm text-slate-900 font-semibold"
                  />
                ) : (
                  <Text className="text-base text-slate-900 font-semibold">
                    {profileData?.profile?.full_name || 'Not set'}
                  </Text>
                )}
              </View>

              {/* Email */}
              <View className="px-5 py-5 border-b border-slate-100/50">
                <Text className="text-[10px] uppercase tracking-[2px] text-slate-400 mb-2 font-black">
                  Email
                </Text>

                <View className="flex-row items-center flex-wrap">
                  <Text className="text-base text-slate-900 font-semibold mr-3">
                    {profileData?.email || 'N/A'}
                  </Text>

                  <View className="bg-neutral-100 px-3 py-1 rounded-full border border-neutral-200">
                    <Text className="text-slate-950 text-[10px] font-black uppercase tracking-widest">
                      Verified
                    </Text>
                  </View>
                </View>
              </View>

              {/* Phone */}
              <View className="px-5 py-5">
                <Text className="text-[10px] uppercase tracking-[2px] text-slate-400 mb-2 font-black">
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
                    className="bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-3.5 text-sm text-slate-900 font-semibold"
                  />
                ) : (
                  <Text className="text-base text-slate-900 font-semibold">
                    {profileData?.profile?.phone_number || 'Not set'}
                  </Text>
                )}
              </View>
            </GlassCard>

            {/* Account Card */}
            <GlassCard className="mb-6 p-0 border-slate-200/80 rounded-luxury shadow-sm overflow-hidden">
              <View className="border-b border-slate-200 px-5 py-4 bg-slate-50/50">
                <Text className="text-[10px] tracking-[2px] uppercase text-slate-500 font-black">
                  Account
                </Text>
              </View>

              {/* Account Type */}
              <View className="px-5 py-5 border-b border-slate-100/50">
                <Text className="text-[10px] uppercase tracking-[2px] text-slate-400 mb-2 font-black">
                  Account Type
                </Text>

                <View className="self-start bg-neutral-100 px-3 py-1 rounded-full border border-neutral-200">
                  <Text className="text-slate-900 text-[10px] font-black uppercase tracking-widest">
                    Business Owner
                  </Text>
                </View>
              </View>

              {/* Account Created */}
              <View className="px-5 py-5 border-b border-slate-100/50">
                <Text className="text-[10px] uppercase tracking-[2px] text-slate-400 mb-2 font-black">
                  Account Created
                </Text>

                <Text className="text-base text-slate-900 font-semibold">
                  {formatDate(profileData?.created_at)}
                </Text>
              </View>

              {/* Last Sign In */}
              <View className="px-5 py-5">
                <Text className="text-[10px] uppercase tracking-[2px] text-slate-400 mb-2 font-black">
                  Last Sign-In
                </Text>

                <Text className="text-base text-slate-900 font-semibold">
                  {formatDate(new Date().toISOString())}
                </Text>
              </View>
            </GlassCard>

            {/* Edit Actions */}
            {editMode && (
              <View className="flex-row gap-3 mb-6">
                <Pressable
                  onPress={handleUpdateProfile}
                  disabled={updating}
                  className="flex-1 bg-black rounded-xl py-4 items-center active:bg-slate-950"
                >
                  <Text className="text-white font-black text-xs uppercase tracking-wider">
                    {updating ? 'Saving...' : 'Save Changes'}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={handleCancel}
                  className="flex-1 border border-slate-200/80 bg-white rounded-xl py-4 items-center active:bg-slate-50"
                >
                  <Text className="text-slate-700 font-black text-xs uppercase tracking-wider">
                    Cancel
                  </Text>
                </Pressable>
              </View>
            )}

            {/* Delete Account Section */}
            <GlassCard className="mb-6 p-0 border-slate-200/80 rounded-luxury shadow-sm overflow-hidden">
              <View className="border-b border-slate-200 px-5 py-4 bg-slate-50/50">
                <Text className="text-[10px] tracking-[2px] uppercase text-slate-500 font-black">
                  Danger Zone
                </Text>
              </View>

              <View className="p-5">
                <Text className="text-base font-bold text-slate-900 mb-2">Delete Account</Text>

                <Text className="text-xs leading-5 text-slate-500 mb-5">
                  Permanently remove your account and all associated data. This action cannot be
                  undone after 30 days.
                </Text>

                <Pressable
                  onPress={handleDeleteAccount}
                  className="border border-slate-200/80 bg-white rounded-xl py-4 items-center active:bg-slate-50"
                >
                  <Text className="text-slate-900 font-black text-xs uppercase tracking-wider">
                    Delete Account
                  </Text>
                </Pressable>
              </View>
            </GlassCard>

            {/* Sign Out */}
            <Pressable
              onPress={handleSignOut}
              className="border border-slate-200/80 bg-white rounded-xl py-4 items-center active:bg-slate-50"
            >
              <Text className="text-slate-900 font-black text-xs uppercase tracking-wider">
                Sign Out
              </Text>
            </Pressable>

            {error && <Text className="text-neutral-800 text-center mt-4">{error}</Text>}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </PremiumBackground>
  );
}

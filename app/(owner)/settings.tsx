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
import { Avatar } from '@/components/Avatar';
import { Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useProfileImage } from '@/hooks/useProfileImage';

export default function OwnerProfileScreen() {
  const { signOut } = useAuth();

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
          const signed = await apiService.getSignedUrl(
            data.profile.profile_media_id
          );

          if (signed?.url) {
            setProfileImage(signed.url);
          }
        } catch (e) {
          console.log('Failed to fetch signed image URL');
        }
      } else if (data?.profile?.media?.signed_url) {
        setProfileImage(data.profile.media.signed_url);
      } else if (data?.profile?.media?.url) {
        setProfileImage(data.profile.media.url);
      } else if (data?.profile_image_url) {
        setProfileImage(data.profile_image_url);
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
      Alert.alert(
        'Update Failed',
        err.message || 'Could not update profile'
      );
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
              await apiService.deleteAccount(
                'User requested deletion via mobile app'
              );

              signOut();
            } catch (err: any) {
              Alert.alert(
                'Error',
                'Failed to delete account. Please try again.'
              );
            }
          },
        },
      ]
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
      <View className="flex-1 justify-center items-center bg-[#F8FAFC]">
        <ActivityIndicator size="large" color="#111827" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F8FAFC]">
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
            <Text className="text-slate-400 text-[10px] font-black uppercase tracking-[3px] mb-1">Manage your account</Text>
            <Text className="text-slate-900 text-3xl font-bold tracking-tight">My Profile</Text>
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
                  {profileImage ? (
                    <Image
                      source={{ uri: profileImage }}
                      style={{
                        width: 88,
                        height: 88,
                        borderRadius: 44,
                      }}
                    />
                  ) : (
                    <Avatar
                      name={profileData?.profile?.full_name || 'User'}
                      size={88}
                    />
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
                <Text className="text-[24px] font-semibold text-[#0F172A]">
                  Account Settings
                </Text>

                <Text className="text-[15px] text-slate-500 mt-1 leading-6">
                  Manage your profile, security, and personal preferences
                </Text>
              </View>
            </View>

            {!editMode && (
              <Pressable
                onPress={() => setEditMode(true)}
                className="border border-slate-300 rounded-xl px-5 py-3 bg-white active:bg-slate-50"
              >
                <Text className="text-[15px] font-semibold text-slate-700">
                  Edit
                </Text>
              </Pressable>
            )}
          </View>

          {/* Contact Card */}
          <View className="bg-white rounded-2xl border border-slate-200 overflow-hidden mb-6">
            <View className="border-b border-slate-200 px-5 py-4">
              <Text className="text-[13px] tracking-[1px] uppercase text-slate-500 font-semibold">
                Contact
              </Text>
            </View>

            {/* Full Name */}
            <View className="px-5 py-5 border-b border-slate-100">
              <Text className="text-[12px] uppercase tracking-[1px] text-slate-500 mb-2 font-medium">
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
                  className="border border-slate-300 rounded-xl px-4 py-3 text-[16px] text-slate-900"
                />
              ) : (
                <Text className="text-[18px] text-slate-900">
                  {profileData?.profile?.full_name || 'Not set'}
                </Text>
              )}
            </View>

            {/* Email */}
            <View className="px-5 py-5 border-b border-slate-100">
              <Text className="text-[12px] uppercase tracking-[1px] text-slate-500 mb-2 font-medium">
                Email
              </Text>

              <View className="flex-row items-center flex-wrap">
                <Text className="text-[18px] text-slate-900 mr-3">
                  {profileData?.email || 'N/A'}
                </Text>

                <View className="bg-neutral-100 px-3 py-1 rounded-full border border-neutral-200">
                  <Text className="text-neutral-800 text-[12px] font-semibold">
                    Verified
                  </Text>
                </View>
              </View>
            </View>

            {/* Phone */}
            <View className="px-5 py-5">
              <Text className="text-[12px] uppercase tracking-[1px] text-slate-500 mb-2 font-medium">
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
                  className="border border-slate-300 rounded-xl px-4 py-3 text-[16px] text-slate-900"
                />
              ) : (
                <Text className="text-[18px] text-slate-900">
                  {profileData?.profile?.phone_number || 'Not set'}
                </Text>
              )}
            </View>
          </View>

          {/* Account Card */}
          <View className="bg-white rounded-2xl border border-slate-200 overflow-hidden mb-6">
            <View className="border-b border-slate-200 px-5 py-4">
              <Text className="text-[13px] tracking-[1px] uppercase text-slate-500 font-semibold">
                Account
              </Text>
            </View>

            {/* Account Type */}
            <View className="px-5 py-5 border-b border-slate-100">
              <Text className="text-[12px] uppercase tracking-[1px] text-slate-500 mb-2 font-medium">
                Account Type
              </Text>

              <View className="self-start bg-slate-100 px-4 py-2 rounded-full">
                <Text className="text-slate-700 font-medium">
                  Business Owner
                </Text>
              </View>
            </View>

            {/* Account Created */}
            <View className="px-5 py-5 border-b border-slate-100">
              <Text className="text-[12px] uppercase tracking-[1px] text-slate-500 mb-2 font-medium">
                Account Created
              </Text>

              <Text className="text-[18px] text-slate-900">
                {formatDate(profileData?.created_at)}
              </Text>
            </View>

            {/* Last Sign In */}
            <View className="px-5 py-5">
              <Text className="text-[12px] uppercase tracking-[1px] text-slate-500 mb-2 font-medium">
                Last Sign-In
              </Text>

              <Text className="text-[18px] text-slate-900">
                {formatDate(new Date().toISOString())}
              </Text>
            </View>
          </View>

          {/* Edit Actions */}
          {editMode && (
            <View className="flex-row gap-3 mb-6">
              <Pressable
                onPress={handleUpdateProfile}
                disabled={updating}
                className="flex-1 bg-[#0F172A] rounded-xl py-4 items-center"
              >
                <Text className="text-white font-semibold text-[16px]">
                  {updating ? 'Saving...' : 'Save Changes'}
                </Text>
              </Pressable>

              <Pressable
                onPress={handleCancel}
                className="flex-1 border border-slate-300 bg-white rounded-xl py-4 items-center"
              >
                <Text className="text-slate-700 font-semibold text-[16px]">
                  Cancel
                </Text>
              </Pressable>
            </View>
          )}
          {/* Delete Account Section */}
          <View className="bg-white rounded-2xl border border-neutral-200 overflow-hidden mb-6">
            <View className="border-b border-neutral-200 px-5 py-4 bg-neutral-50">
              <Text className="text-[13px] tracking-[1px] uppercase text-neutral-800 font-semibold">
                Danger Zone
              </Text>
            </View>

            <View className="p-5">
              <Text className="text-[18px] font-semibold text-slate-900 mb-2">
                Delete Account
              </Text>

              <Text className="text-[15px] leading-6 text-slate-500 mb-5">
                Permanently remove your account and all associated data. This action
                cannot be undone after 30 days.
              </Text>

              <Pressable
                onPress={handleDeleteAccount}
                className="border border-neutral-300 bg-neutral-50 rounded-xl py-4 items-center"
              >
                <Text className="text-neutral-900 font-semibold text-[16px]">
                  Delete Account
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Sign Out */}
          <Pressable
            onPress={handleSignOut}
            className="border border-neutral-300 bg-neutral-50 rounded-xl py-4 items-center"
          >
            <Text className="text-neutral-900 font-semibold text-[16px]">
              Sign Out
            </Text>
          </Pressable>

          {error && (
            <Text className="text-neutral-800 text-center mt-4">
              {error}
            </Text>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
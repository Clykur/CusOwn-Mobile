import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  useColorScheme,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { registerSchema, RegisterFormValues } from '@/schemas/auth.schema';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { STRINGS } from '@/constants/strings';
import { ROUTES } from '@/constants/routes';
import { useAuth } from '@/hooks/useAuth';
import { THEME } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function RegisterScreen() {
  const { signUpWithEmail, loading, error } = useAuth();
  const colorScheme = useColorScheme() || 'light';
  const isDark = colorScheme === 'dark';
  const theme = isDark ? THEME.dark : THEME.light;

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      role: 'Customer',
    },
  });

  const selectedRole = watch('role');

  const onSubmit = async (values: RegisterFormValues) => {
    try {
      await signUpWithEmail(values);
    } catch (err) {
      // handled via useAuth error reporting state
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <TouchableOpacity
            style={[styles.backBtn, { backgroundColor: theme.card }]}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={22} color={theme.text} />
          </TouchableOpacity>

          <View style={styles.headerContainer}>
            <Text style={[styles.title, { color: theme.text }]}>Create Account</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              Join CusOwn as a custom user or business hub
            </Text>
          </View>

          {error ? (
            <View style={[styles.errorBox, { backgroundColor: '#FEE2E2' }]}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.formContainer}>
            <Controller
              control={control}
              name="fullName"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Full Name"
                  placeholder={STRINGS.NAME_PLACEHOLDER}
                  autoCapitalize="words"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  error={errors.fullName?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Email Address"
                  placeholder={STRINGS.EMAIL_PLACEHOLDER}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  error={errors.email?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Password"
                  placeholder={STRINGS.PASSWORD_PLACEHOLDER}
                  secureTextEntry
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  error={errors.password?.message}
                />
              )}
            />

            <Text style={[styles.roleSectionLabel, { color: theme.textSecondary }]}>
              {STRINGS.ROLE_LABEL}
            </Text>
            <View style={styles.roleCardsContainer}>
              <TouchableOpacity
                style={[
                  styles.roleCard,
                  { backgroundColor: theme.card, borderColor: theme.border },
                  selectedRole === 'Customer' && {
                    borderColor: theme.secondary,
                    backgroundColor: isDark ? '#1E293B' : '#EFF6FF',
                  },
                ]}
                onPress={() => setValue('role', 'Customer', { shouldValidate: true })}
                activeOpacity={0.8}
              >
                <View style={styles.roleCardHeader}>
                  <Ionicons
                    name="person"
                    size={20}
                    color={selectedRole === 'Customer' ? theme.secondary : theme.gray}
                  />
                  <Text
                    style={[
                      styles.roleTitle,
                      { color: theme.text },
                      selectedRole === 'Customer' && { color: theme.secondary },
                    ]}
                  >
                    Customer
                  </Text>
                </View>
                <Text style={[styles.roleDesc, { color: theme.textSecondary }]}>
                  {STRINGS.ROLE_CUSTOMER_DESC}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.roleCard,
                  { backgroundColor: theme.card, borderColor: theme.border },
                  selectedRole === 'Owner' && {
                    borderColor: theme.accent,
                    backgroundColor: isDark ? '#1E293B' : '#F5F3FF',
                  },
                ]}
                onPress={() => setValue('role', 'Owner', { shouldValidate: true })}
                activeOpacity={0.8}
              >
                <View style={styles.roleCardHeader}>
                  <Ionicons
                    name="business"
                    size={20}
                    color={selectedRole === 'Owner' ? theme.accent : theme.gray}
                  />
                  <Text
                    style={[
                      styles.roleTitle,
                      { color: theme.text },
                      selectedRole === 'Owner' && { color: theme.accent },
                    ]}
                  >
                    Salon Owner
                  </Text>
                </View>
                <Text style={[styles.roleDesc, { color: theme.textSecondary }]}>
                  {STRINGS.ROLE_OWNER_DESC}
                </Text>
              </TouchableOpacity>
            </View>

            <Button
              variant="primary"
              loading={loading}
              onPress={handleSubmit(onSubmit)}
              style={styles.submitBtn}
            >
              Sign Up
            </Button>
          </View>

          <TouchableOpacity
            style={styles.footerLink}
            onPress={() => router.replace(ROUTES.LOGIN as any)}
            disabled={loading}
          >
            <Text style={[styles.footerText, { color: theme.secondary }]}>
              {STRINGS.ALREADY_HAVE_ACCOUNT}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
  },
  errorBox: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  errorText: {
    color: '#991B1B',
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  formContainer: {
    marginBottom: 24,
  },
  roleSectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 12,
  },
  roleCardsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  roleCard: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 14,
  },
  roleCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 6,
  },
  roleTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  roleDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  submitBtn: {
    marginTop: 8,
  },
  footerLink: {
    alignItems: 'center',
    marginTop: 'auto',
    paddingVertical: 12,
  },
  footerText: {
    fontSize: 15,
    fontWeight: '600',
  },
});

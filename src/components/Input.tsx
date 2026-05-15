import React, { forwardRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextInputProps,
  useColorScheme,
} from 'react-native';
import { THEME } from '@/constants/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export const Input = forwardRef<TextInput, InputProps>(
  ({ label, error, secureTextEntry, ...props }, ref) => {
    const colorScheme = useColorScheme() || 'light';
    const isDark = colorScheme === 'dark';
    const theme = isDark ? THEME.dark : THEME.light;

    return (
      <View style={styles.container}>
        {label ? (
          <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text>
        ) : null}
        <TextInput
          ref={ref}
          style={[
            styles.input,
            {
              backgroundColor: theme.card,
              color: theme.text,
              borderColor: error ? theme.error : theme.border,
            },
          ]}
          placeholderTextColor={theme.gray}
          secureTextEntry={secureTextEntry}
          {...props}
        />
        {error ? <Text style={[styles.errorText, { color: theme.error }]}>{error}</Text> : null}
      </View>
    );
  }
);

Input.displayName = 'Input';

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 48,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
});

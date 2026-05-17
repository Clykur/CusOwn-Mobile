import React, { forwardRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TextInputProps,
} from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export const Input = forwardRef<TextInput, InputProps>(
  ({ label, error, secureTextEntry, ...props }, ref) => {
    return (
      <View className="mb-5 w-full">
        {label && (
          <Text className="text-textLight text-sm font-semibold mb-2 ml-1 tracking-wide uppercase opacity-70">
            {label}
          </Text>
        )}
        <TextInput
          ref={ref}
          className={`bg-white/5 border rounded-premium px-5 py-4 text-white text-lg ${
            error ? 'border-error/50' : 'border-white/10'
          } focus:border-accent-premium/50`}
          placeholderTextColor="rgba(255,255,255,0.3)"
          secureTextEntry={secureTextEntry}
          {...props}
        />
        {error && (
          <Text className="text-error text-xs mt-2 ml-1 font-medium italic">
            {error}
          </Text>
        )}
      </View>
    );
  }
);

Input.displayName = 'Input';

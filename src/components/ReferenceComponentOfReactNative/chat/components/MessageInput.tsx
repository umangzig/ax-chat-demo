"use client";

import React, { useState, useRef } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Platform,
  Animated,
} from "react-native";

type Props = {
  onSend: (text: string) => void;
  disabled?: boolean;
  onFocus?: () => void;
};

export function MessageInput({ onSend, disabled, onFocus }: Props) {
  const [value, setValue] = useState("");
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const textInputRef = useRef<TextInput>(null);

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
    setTimeout(() => textInputRef.current?.focus(), 10);
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        <TextInput
          ref={textInputRef}
          style={styles.input}
          value={value}
          onChangeText={setValue}
          placeholder="Type your message..."
          placeholderTextColor="#A1A1A1"
          returnKeyType="send"
          onSubmitEditing={handleSend}
          onFocus={onFocus}
          multiline
          blurOnSubmit={false}
          autoCapitalize="sentences"
          autoCorrect
          scrollEnabled={false}
        />

        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <TouchableOpacity
            onPress={handleSend}
            disabled={disabled || value.trim().length === 0}
            style={[
              styles.button,
              (disabled || value.trim().length === 0) && styles.buttonDisabled,
            ]}>
            <Text style={styles.buttonText}>➤</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#D1D1D6",
    backgroundColor: "#FFFFFF",
  },
  container: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: "flex-end",
    gap: 8,
  },
  input: {
    flex: 1,
    minHeight: 42,
    maxHeight: 140,
    paddingHorizontal: 14,
    paddingVertical: Platform.select({ ios: 10, android: 8 }),
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E5E5EA",
    backgroundColor: "#F8F8F8",
    color: "#11181C",
    fontSize: 16,
  },
  button: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: "#007AFF",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 18,
  },
});

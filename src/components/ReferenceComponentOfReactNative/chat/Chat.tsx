"use client";

import { useMemo, useEffect, useRef, useState } from "react";
import {
  View,
  FlatList,
  Platform,
  StatusBar,
  StyleSheet,
  Animated,
  Easing,
  TouchableOpacity,
  Keyboard,
  KeyboardAvoidingView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useChatActions, useChatState } from "./recoil/atom";
import { MessageBubble } from "./components/MessageBubble";
import { TypingIndicator } from "./components/TypingIndicator";
import { MessageInput } from "./components/MessageInput";
import { MaterialIcons } from "@expo/vector-icons";

export default function Chat() {
  const insets = useSafeAreaInsets();
  const { messages, isTyping } = useChatState();
  const { sendMessage, initiateChat } = useChatActions();
  const flatListRef = useRef<FlatList>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);

  // Initiate chat on mount
  useEffect(() => {
    initiateChat();
  }, []);

  // Manual keyboard animation for iOS
  const keyboardPadding = useRef(new Animated.Value(0)).current;

  // Track safe area updates for iOS default state
  useEffect(() => {
    if (Platform.OS === "ios") {
      // If keyboard is NOT showing (we don't track state, but we can assume
      // this effect runs on mount/layout changes), ensure base value is correct.
      // However, to avoid conflict with active animation, we usually strictly
      // drive this via listeners. We'll set the initial value in useRef.
      // If insets change dynamically (orientation), we might need to adjust,
      // but for portrait lock this is fine.
    }
  }, [insets.bottom]);

  // Tracks if auto-scrolling is happening (new messages or keyboard)
  const isAutoScrolling = useRef(false);

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;

  const isAndroidDevice = Platform.OS === "android";

  // Scroll button animations
  const showButton = () => {
    setShowScrollButton(true);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.spring(bounceAnim, {
        toValue: 1,
        friction: 6,
        tension: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const hideButton = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(bounceAnim, {
        toValue: 0,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start(() => setShowScrollButton(false));
  };

  // Keyboard listeners
  useEffect(() => {
    if (Platform.OS === "ios") {
      const showListener = Keyboard.addListener("keyboardWillShow", (e) => {
        // Animate to strict keyboard height (which includes safe area underneath)
        Animated.timing(keyboardPadding, {
          toValue: e.endCoordinates.height,
          duration: e.duration,
          easing: Easing.out(Easing.ease),
          useNativeDriver: false,
        }).start();

        // Scroll to bottom
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      });

      const hideListener = Keyboard.addListener("keyboardWillHide", (e) => {
        // Animate back to 0 (Tab bar handles safe area)
        Animated.timing(keyboardPadding, {
          toValue: 0,
          duration: e.duration,
          easing: Easing.out(Easing.ease),
          useNativeDriver: false,
        }).start();
      });

      return () => {
        showListener.remove();
        hideListener.remove();
      };
      return () => {
        showListener.remove();
        hideListener.remove();
      };
    } else {
      // Android Hybrid Logic:
      // < Android 15 (API 35): Native 'adjustResize' works perfectly. Manual padding causes double spacing.
      // >= Android 15 (API 35): Native resize might fail or behave differently with edge-to-edge. Manual padding required.
      const showListener = Keyboard.addListener("keyboardDidShow", (e) => {
        const androidVersion =
          typeof Platform.Version === "number"
            ? Platform.Version
            : parseInt(Platform.Version.toString(), 10);

        // API 35 = Android 15
        if (androidVersion < 35) {
          // Rely on native behavior -> Padding 0
          Animated.timing(keyboardPadding, {
            toValue: 0,
            duration: 100,
            easing: Easing.out(Easing.ease),
            useNativeDriver: false,
          }).start();
        } else {
          // Manual padding for Android 15+
          // Add insets.bottom to account for edge-to-edge nav bar
          const extraPadding = insets.bottom > 0 ? insets.bottom : 0;
          Animated.timing(keyboardPadding, {
            toValue: e.endCoordinates.height + extraPadding,
            duration: 100,
            easing: Easing.out(Easing.ease),
            useNativeDriver: false,
          }).start();
        }

        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      });

      const hideListener = Keyboard.addListener("keyboardDidHide", () => {
        Animated.timing(keyboardPadding, {
          toValue: 0,
          duration: 100,
          easing: Easing.out(Easing.ease),
          useNativeDriver: false,
        }).start();
      });

      return () => {
        showListener.remove();
        hideListener.remove();
      };
    }
  }, [insets.bottom]);

  // Messages sorted
  const data = useMemo(
    () => [...messages].sort((a, b) => a.createdAt - b.createdAt),
    [messages]
  );

  const dataWithSessionMarkers = useMemo(() => {
    return data.map((msg, idx) => {
      const isSessionDivider =
        msg.role === "system" && msg.text === "SESSION_DIVIDER";
      const isNewSession =
        isSessionDivider ||
        (idx > 0 &&
          data[idx - 1].role === "system" &&
          data[idx - 1].text === "SESSION_DIVIDER");
      return { ...msg, isNewSession: isNewSession && msg.role !== "system" };
    });
  }, [data]);

  // Auto-scroll when new messages arrive
  useEffect(() => {
    if (flatListRef.current && messages.length > 0) {
      isAutoScrolling.current = true;
      flatListRef.current?.scrollToEnd({ animated: true });
      hideButton();
      setTimeout(() => {
        isAutoScrolling.current = false;
      }, 300);
    }
  }, [messages]);

  // Handle scroll to show/hide scroll button
  const handleScroll = (e: any) => {
    if (isAutoScrolling.current) return;

    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    const distanceFromBottom =
      contentSize.height - (contentOffset.y + layoutMeasurement.height);

    if (distanceFromBottom > 150 && !showScrollButton) {
      showButton();
    } else if (distanceFromBottom <= 150 && showScrollButton) {
      hideButton();
    }
  };

  // Scroll to bottom manually
  const scrollToBottom = () => {
    isAutoScrolling.current = true;
    flatListRef.current?.scrollToEnd({ animated: true });
    hideButton();
    setTimeout(() => {
      isAutoScrolling.current = false;
    }, 300);
  };

  return (
    <>
      <StatusBar barStyle="dark-content" />
      <View style={{ flex: 1, backgroundColor: "white" }}>
        {/* We use Animated.View as the main container that shrinks/grows padding */}
        <Animated.View
          style={{
            flex: 1,
            // Universal manual padding
            paddingBottom: keyboardPadding,
          }}>
          <View style={{ flex: 1, paddingTop: insets.top }}>
            <FlatList
              ref={flatListRef}
              data={dataWithSessionMarkers}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => {
                if (item.role === "system" && item.text === "SESSION_DIVIDER")
                  return null;
                return (
                  <MessageBubble
                    message={item}
                    isNewSession={item.isNewSession}
                    rawData={item.rawData}
                  />
                );
              }}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
              showsVerticalScrollIndicator={false}
              onScroll={handleScroll}
              scrollEventThrottle={16}
            />

            {/* Scroll-to-bottom button */}
            {showScrollButton && (
              <Animated.View
                style={[
                  styles.scrollButtonContainer,
                  {
                    bottom: 20,
                    opacity: fadeAnim,
                    transform: [
                      {
                        scale: bounceAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.8, 1],
                        }),
                      },
                    ],
                  },
                ]}>
                <TouchableOpacity
                  onPress={scrollToBottom}
                  style={styles.scrollButton}>
                  <MaterialIcons
                    name="keyboard-arrow-down"
                    size={28}
                    color="#fff"
                  />
                </TouchableOpacity>
              </Animated.View>
            )}

            {isTyping && (
              <View style={styles.typingContainer}>
                <TypingIndicator />
              </View>
            )}
          </View>

          {/* Message input */}
          <View>
            <MessageInput onSend={sendMessage} />
          </View>
        </Animated.View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    flexGrow: 1,
  },
  typingContainer: {
    paddingHorizontal: 10,
    paddingBottom: 8,
  },
  scrollButtonContainer: {
    position: "absolute",
    right: 16,
    zIndex: 100,
    elevation: 10,
  },
  scrollButton: {
    backgroundColor: "#00000088",
    borderRadius: 30,
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
});

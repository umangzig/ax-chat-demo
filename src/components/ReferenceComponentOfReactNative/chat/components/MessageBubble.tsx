import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  Animated,
  Easing,
  Platform,
} from "react-native";
import {
  Message,
  MessageBubbleProps,
  RawDataWithComponents,
} from "../types/chat";
import { UnifiedFixture } from "../recoil/atom";
import { UnifiedFixtureTable } from "./FixtureTable";
import { MarketTemplate, MarketTemplateData } from "./BetPill";

function extractComponents(
  messageText: string,
  rawData?: RawDataWithComponents
): {
  displayText: string;
  marketTemplates: MarketTemplateData[];
  unifiedFixtures: UnifiedFixture[];
} {
  const marketTemplates: MarketTemplateData[] = [];
  const unifiedFixtures: UnifiedFixture[] = [];

  // Extract components from rawData (received from socket)
  if (rawData?.components && Array.isArray(rawData.components)) {
    rawData.components.forEach((c) => {
      if (c.component === "market_template") {
        marketTemplates.push(c as MarketTemplateData);
      } else if (
        c.component === "fixture" ||
        c.component === "fixture_card" ||
        c.component === "fixture_table"
      ) {
        unifiedFixtures.push(c as UnifiedFixture);
      }
    });
  }

  // Remove placeholder text
  const cleanText = messageText
    .replace(/\{market_template\}/g, "")
    .replace(/\{unified_fixture_table\}/g, "")
    .trim();

  return {
    displayText: cleanText || "",
    marketTemplates,
    unifiedFixtures,
  };
}

function parseFormattedText(text: string) {
  const parts: Array<{ text: string; bold: boolean }> = [];
  let remaining = text;

  while (remaining.length > 0) {
    const boldMatch = remaining.match(/\*\*([^*]+)\*\*/);
    if (boldMatch && boldMatch.index !== undefined) {
      if (boldMatch.index > 0) {
        parts.push({ text: remaining.slice(0, boldMatch.index), bold: false });
      }
      parts.push({ text: boldMatch[1], bold: true });
      remaining = remaining.slice(boldMatch.index + boldMatch[0].length);
    } else {
      parts.push({ text: remaining, bold: false });
      break;
    }
  }
  return parts;
}

function FormattedText({ text, style }: { text: string; style: any }) {
  const parts = parseFormattedText(text);
  return (
    <Text style={style}>
      {parts.map((part, i) => (
        <Text key={i} style={part.bold ? styles.boldText : {}}>
          {part.text.split("\n").map((line, j) => (
            <React.Fragment key={j}>
              {line}
              {j < part.text.split("\n").length - 1 && "\n"}
            </React.Fragment>
          ))}
        </Text>
      ))}
    </Text>
  );
}

export function MessageBubble({
  message,
  isNewSession,
  rawData,
}: MessageBubbleProps) {
  const isUser = message.role === "user";
  const { displayText, marketTemplates, unifiedFixtures } = extractComponents(
    message.text,
    rawData
  );

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(isUser ? 40 : -40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        speed: 15,
        bounciness: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const hasComponents =
    marketTemplates.length > 0 || unifiedFixtures.length > 0;

  return (
    <>
      {isNewSession && (
        <View style={styles.dividerContainer}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>New Session</Text>
          <View style={styles.dividerLine} />
        </View>
      )}
      <Animated.View
        style={[
          styles.messageContainer,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}>
        {/* Display Text */}
        {displayText && unifiedFixtures.length === 0 && (
          <View
            style={[
              styles.textMessageWrapper,
              isUser ? styles.userAlign : styles.assistantAlign,
            ]}>
            <View
              style={[
                styles.bubble,
                isUser ? styles.userBubble : styles.assistantBubble,
              ]}>
              <FormattedText
                text={displayText}
                style={[
                  styles.messageText,
                  isUser ? styles.userText : styles.assistantText,
                ]}
              />
              <Text
                style={[
                  styles.timestamp,
                  isUser ? styles.userTimestamp : styles.assistantTimestamp,
                ]}>
                {new Date(message.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </View>
            {!isUser && (
              <Image
                source={require("../../../components/images/chat-logo.png")}
                style={styles.assistantLogo}
              />
            )}
          </View>
        )}

        {/* Unified Fixture Table - Renders when fixtures come from socket */}
        {unifiedFixtures.length > 0 && (
          <View
            style={[
              styles.componentContainer,
              isUser
                ? styles.userComponentAlign
                : styles.assistantComponentAlign,
            ]}>
            <UnifiedFixtureTable data={unifiedFixtures} />
          </View>
        )}

        {/* Market Templates - Renders when templates come from socket */}
        {marketTemplates.length > 0 && (
          <View
            style={[
              styles.cardsContainer,
              isUser ? styles.userCardsAlign : styles.assistantCardsAlign,
            ]}>
            {marketTemplates.map((template, i) => (
              <MarketTemplate key={i} data={template} />
            ))}
          </View>
        )}

        {/* Timestamp for component-only messages */}
        {hasComponents && !displayText && (
          <View
            style={[
              styles.componentTimestampContainer,
              isUser ? styles.userAlign : styles.assistantAlign,
            ]}>
            <Text style={styles.componentTimestamp}>
              {new Date(message.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          </View>
        )}
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  messageContainer: { paddingVertical: 4, paddingHorizontal: 8 },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 16,
    paddingHorizontal: 16,
    gap: 8,
  },
  dividerLine: { flex: 1, height: 0.5, backgroundColor: "#E5E5EA" },
  dividerText: { fontSize: 12, color: "#8E8E93", fontWeight: "600" },
  textMessageWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginVertical: 4,
    gap: 6,
  },
  userAlign: { justifyContent: "flex-end" },
  assistantAlign: { justifyContent: "flex-start" },
  bubble: {
    maxWidth: "75%",
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
    ...Platform.select({
      ios: {
        shadowColor: "rgba(0,0,0,0.1)",
        shadowOpacity: 1,
        shadowRadius: 2,
        shadowOffset: { width: 0, height: 1 },
      },
      android: { elevation: 1 },
    }),
  },
  userBubble: { backgroundColor: "#007AFF" },
  assistantBubble: { backgroundColor: "#F2F2F7" },
  messageText: { fontSize: 15, lineHeight: 20, marginBottom: 4 },
  userText: { color: "#FFFFFF" },
  assistantText: { color: "#1C1C1E" },
  timestamp: { fontSize: 11, opacity: 0.7, textAlign: "right" },
  userTimestamp: { color: "#FFFFFF" },
  assistantTimestamp: { color: "#8E8E93" },
  boldText: { fontWeight: "700" },
  assistantLogo: { width: 28, height: 28, borderRadius: 6, marginBottom: 4 },
  componentContainer: { width: "100%", marginVertical: 8 },
  userComponentAlign: { alignItems: "flex-end" },
  assistantComponentAlign: { alignItems: "flex-start" },
  cardsContainer: { marginVertical: 6, gap: 6, width: "100%" },
  userCardsAlign: { alignItems: "flex-end" },
  assistantCardsAlign: { alignItems: "flex-start" },
  componentTimestampContainer: { paddingHorizontal: 12, paddingVertical: 4 },
  componentTimestamp: { fontSize: 11, color: "#A0A0A0", fontWeight: "400" },
});

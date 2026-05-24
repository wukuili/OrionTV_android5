import React, { useCallback } from "react";
import { View, Switch, StyleSheet, Pressable, Animated, Platform, TouchableOpacity, TextInput } from "react-native";
import { useTVEventHandler } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { SettingsSection } from "./SettingsSection";
import { useSettingsStore } from "@/stores/settingsStore";
import { useButtonAnimation } from "@/hooks/useAnimation";
import { Colors } from "@/constants/Colors";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";

interface AdBlockSectionProps {
  onChanged: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
}

export const AdBlockSection: React.FC<AdBlockSectionProps> = ({ onChanged, onFocus, onBlur }) => {
  const { blockAdsEnabled, setBlockAdsEnabled, proxyM3U8Token, setProxyM3U8Token } = useSettingsStore();
  const [isFocused, setIsFocused] = React.useState(false);
  const animationStyle = useButtonAnimation(isFocused, 1.2);
  const deviceType = useResponsiveLayout().deviceType;

  const handleToggle = useCallback(
    (enabled: boolean) => {
      setBlockAdsEnabled(enabled);
      onChanged();
    },
    [setBlockAdsEnabled, onChanged]
  );

  const handleSectionFocus = () => {
    setIsFocused(true);
    onFocus?.();
  };

  const handleSectionBlur = () => {
    setIsFocused(false);
    onBlur?.();
  };

  const handlePress = () => {
    handleToggle(!blockAdsEnabled);
  };

  const handleTVEvent = React.useCallback(
    (event: any) => {
      if (isFocused && event.eventType === "select") {
        handleToggle(!blockAdsEnabled);
      }
    },
    [isFocused, blockAdsEnabled, handleToggle]
  );

  useTVEventHandler(handleTVEvent);

  return (
    <SettingsSection focusable onFocus={handleSectionFocus} onBlur={handleSectionBlur}
      {...Platform.isTV || deviceType !== 'tv' ? undefined : { onPress: handlePress }}
    >
      <Pressable style={styles.settingItem} onFocus={handleSectionFocus} onBlur={handleSectionBlur}>
        <View style={styles.settingInfo}>
          <ThemedText style={styles.settingName}>智能去广告</ThemedText>
          <ThemedText style={styles.settingDescription}>
            自动过滤M3U8视频流中的切片广告
          </ThemedText>
        </View>
        <Animated.View style={animationStyle}>
          {Platform.OS === 'ios' && Platform.isTV ? (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => handlePress()}
              style={styles.statusLabel}
            >
              <ThemedText style={styles.statusValue}>{blockAdsEnabled ? '已启用' : '已禁用'}</ThemedText>
            </TouchableOpacity>
          ) : (
            <Switch
              value={blockAdsEnabled}
              onValueChange={() => {}}
              trackColor={{ false: "#767577", true: Colors.dark.primary }}
              thumbColor={blockAdsEnabled ? "#ffffff" : "#f4f3f4"}
              pointerEvents="none"
            />
          )}
        </Animated.View>
      </Pressable>

      {blockAdsEnabled && (
        <View style={styles.statusContainer}>
          <View style={styles.statusItem}>
            <ThemedText style={styles.statusLabel}>状态：</ThemedText>
            <ThemedText style={[styles.statusValue, { color: Colors.dark.primary }]}>
              已启用 - 将自动过滤视频中的广告片段
            </ThemedText>
          </View>
          <View style={styles.statusItem}>
            <ThemedText style={styles.statusLabel}>代理令牌：</ThemedText>
            <ThemedText style={styles.statusDescription}>
              如果后端需要认证令牌，在此填写
            </ThemedText>
          </View>
          <TextInput
            style={styles.tokenInput}
            value={proxyM3U8Token}
            onChangeText={(text) => {
              setProxyM3U8Token(text);
              onChanged();
            }}
            placeholder="可选，留空则不发送令牌"
            placeholderTextColor="#666"
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry={false}
          />
        </View>
      )}
    </SettingsSection>
  );
};

const styles = StyleSheet.create({
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  settingInfo: {
    flex: 1,
  },
  settingName: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: "#888",
  },
  statusContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: "#2a2a2c",
    borderRadius: 8,
  },
  statusItem: {
    flexDirection: "row",
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 14,
    color: "#ccc",
    minWidth: 80,
  },
  statusValue: {
    fontSize: 14,
    flex: 1,
  },
  statusDescription: {
    fontSize: 12,
    color: "#888",
    flex: 1,
  },
  tokenInput: {
    height: 44,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 12,
    fontSize: 14,
    backgroundColor: "#1a1a1c",
    color: "white",
    borderColor: "#444",
    marginTop: 4,
  },
});
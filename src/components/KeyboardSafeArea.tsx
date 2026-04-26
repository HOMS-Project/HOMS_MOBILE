/**
 * KeyboardSafeArea
 *
 * Reusable wrapper that pushes content up when the software keyboard appears.
 * Works on both iOS (behavior="padding") and Android (behavior="height").
 *
 * Usage:
 *   <KeyboardSafeArea>
 *     <ScrollView ...> ... </ScrollView>
 *   </KeyboardSafeArea>
 *
 * Or with a ScrollView built in (scrollable=true, the default):
 *   <KeyboardSafeArea scrollable contentContainerStyle={...}>
 *     ...children...
 *   </KeyboardSafeArea>
 */

import React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  type ScrollViewProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
//ok
interface Props {
  /** Extra offset for iOS — use when a custom header is outside the KAV */
  keyboardOffset?: number;
  /** When true, wraps children in a ScrollView automatically */
  scrollable?: boolean;
  /** Passed to the inner ScrollView when scrollable=true */
  contentContainerStyle?: StyleProp<ViewStyle>;
  /** Passed to the inner ScrollView when scrollable=true */
  scrollViewProps?: ScrollViewProps;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

const KeyboardSafeArea: React.FC<Props> = ({
  keyboardOffset = 0,
  scrollable = false,
  contentContainerStyle,
  scrollViewProps,
  style,
  children,
}) => {
  return (
    <KeyboardAvoidingView
      style={[styles.flex, style]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? keyboardOffset : 0}
    >
      {scrollable ? (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          {...scrollViewProps}
        >
          {children}
        </ScrollView>
      ) : (
        children
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: 40 },
});

export default KeyboardSafeArea;

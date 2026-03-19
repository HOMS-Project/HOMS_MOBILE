import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, spacing } from "../theme";

const MapPlaceholderScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Map (coming soon)</Text>
      <Text style={styles.sub}>We are building this screen.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.text,
  },
  sub: {
    marginTop: spacing.sm,
    color: colors.muted,
  },
});

export default MapPlaceholderScreen;

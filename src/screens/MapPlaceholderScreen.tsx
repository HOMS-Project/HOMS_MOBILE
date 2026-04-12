import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, spacing } from "../theme";

const MapPlaceholderScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#e7f4ea", "#f5faf6", "#ffffff"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      />
      <View style={styles.card}>
        <Text style={styles.title}>Bản đồ (sắp ra mắt)</Text>
        <Text style={styles.sub}>Màn hình này đang được phát triển.</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#edf4ef",
    paddingHorizontal: spacing.xl,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  card: {
    width: "100%",
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    paddingVertical: 22,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.text,
  },
  sub: {
    marginTop: spacing.sm,
    color: colors.muted,
  },
});

export default MapPlaceholderScreen;

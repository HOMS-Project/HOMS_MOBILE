import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { colors, spacing, radius } from "../theme";
import type { RootStackParamList } from "../../App";

type Nav = NativeStackNavigationProp<RootStackParamList>;

type Job = {
  id: string;
  date: string;
  invoice: string;
  status: "Approve" | "Pending";
  pickup: { title: string; address: string };
  dropoff: { title: string; address: string };
};

const upcoming: Job[] = [
  {
    id: "u1",
    date: "15/03/2026",
    invoice: "INV-2026-00009",
    status: "Approve",
    pickup: { title: "05 Hà Huy Tập", address: "Thanh Khê, Đà Nẵng" },
    dropoff: { title: "16 Lê Độ", address: "Thanh Khê, Đà Nẵng" },
  },
];

const future: Job[] = [
  {
    id: "f1",
    date: "25/03/2026",
    invoice: "INV-2026-00010",
    status: "Pending",
    pickup: { title: "15 Trường Chinh", address: "Cẩm Lệ, Đà Nẵng" },
    dropoff: { title: "25 Mai Đăng Chơn", address: "Ngũ Hành Sơn, Đà Nẵng" },
  },
];

const badgeColor: Record<Job["status"], string> = {
  Approve: "#22C55E",
  Pending: "#93C5FD",
};

const MyScheduleScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();

  const renderCard = (item: Job) => (
    <View key={item.id} style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.dateRow}>
          <Text style={styles.orderIcon}>📦</Text>
          <Text style={styles.cardDate}>{item.date}</Text>
          <Text style={styles.cardInvoice}>{item.invoice}</Text>
        </View>
        <View
          style={[styles.badge, { backgroundColor: badgeColor[item.status] }]}
        >
          <Text style={styles.badgeText}>{item.status}</Text>
        </View>
      </View>

      <View style={styles.stepRow}>
        <View style={styles.stepDotBlue} />
        <View style={styles.stepLine} />
        <View style={styles.stepDotRed} />
      </View>

      <View style={styles.addressBlock}>
        <Text style={styles.addrTitle}>{item.pickup.title}</Text>
        <Text style={styles.addrDesc}>{item.pickup.address}</Text>
      </View>

      <View style={styles.addressBlock}>
        <Text style={styles.addrTitle}>{item.dropoff.title}</Text>
        <Text style={styles.addrDesc}>{item.dropoff.address}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.navigate("MainTabs")}
            style={styles.backBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={styles.backText}>{"<"}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My schedule</Text>
        </View>

        <Text style={styles.sectionTitle}>Upcoming</Text>
        <View style={styles.list}>{upcoming.map(renderCard)}</View>

        <Text style={styles.sectionTitle}>Future</Text>
        <View style={styles.list}>{future.map(renderCard)}</View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    gap: spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  backBtn: {
    position: "absolute",
    left: 0,
    padding: spacing.xs,
  },
  backText: {
    fontSize: 32,
    color: colors.text,
    fontWeight: "700",
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: colors.text,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.text,
    marginTop: spacing.sm,
  },
  list: {
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    gap: spacing.sm,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  orderIcon: {
    fontSize: 28,
  },
  cardDate: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.text,
  },
  cardInvoice: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.muted,
  },
  badge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  badgeText: {
    color: colors.buttonText,
    fontWeight: "700",
    fontSize: 16,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  stepDotBlue: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#2563EB",
  },
  stepDotRed: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#EF4444",
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: colors.border,
  },
  addressBlock: {
    gap: 2,
  },
  addrTitle: {
    fontWeight: "800",
    fontSize: 18,
    color: colors.text,
  },
  addrDesc: {
    color: colors.muted,
    fontSize: 16,
  },
});

export default MyScheduleScreen;

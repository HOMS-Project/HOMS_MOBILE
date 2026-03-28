import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { colors, spacing, radius } from "../theme";
import type { RootStackParamList } from "../../App";
import { apiRequest, endpoints } from "../api";

type Nav = NativeStackNavigationProp<RootStackParamList>;

type Job = {
  id: string;
  invoiceId: string;
  date: string;
  invoice: string;
  status: string;
  pickup: { title: string; address: string };
  dropoff: { title: string; address: string };
};

const MyScheduleScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<Job[]>([]);

  const fetchJobs = async () => {
    try {
      const result = await apiRequest(endpoints.staff.getOrders);
      if (result.success) {
        const formattedJobs = result.data.map((o: any) => ({
          id: o.assignmentId || o.invoiceId,
          invoiceId: o.invoiceId,
          date: new Date(o.scheduledTime).toLocaleDateString(),
          invoice: o.orderCode,
          status: o.status,
          pickup: { title: o.pickup.address.split(',')[0], address: o.pickup.address },
          dropoff: { title: o.delivery.address.split(',')[0], address: o.delivery.address },
        }));
        setJobs(formattedJobs);
      }
    } catch (error) {
       console.error("Fetch jobs failed:", error);
    } finally {
       setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const upcoming = jobs.filter(j => j.status !== "COMPLETED");
  const completed = jobs.filter(j => j.status === "COMPLETED");

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED": return "#22C55E";
      case "IN_PROGRESS": return "#1D9BF0";
      case "PENDING": return "#F59E0B";
      default: return colors.muted;
    }
  };

  const renderCard = (item: Job) => (
    <TouchableOpacity 
      key={item.id} 
      style={styles.card}
      onPress={() => navigation.navigate("OrderDetails", { invoiceId: item.invoiceId })}
    >
      <View style={styles.cardHeader}>
        <View style={styles.dateRow}>
          <Text style={styles.orderIcon}>📦</Text>
          <Text style={styles.cardDate}>{item.date}</Text>
          <Text style={styles.cardInvoice}>{item.invoice}</Text>
        </View>
        <View
          style={[styles.badge, { backgroundColor: getStatusColor(item.status) }]}
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
        <Text style={styles.addrDesc} numberOfLines={1}>{item.pickup.address}</Text>
      </View>

      <View style={styles.addressBlock}>
        <Text style={styles.addrTitle}>{item.dropoff.title}</Text>
        <Text style={styles.addrDesc} numberOfLines={1}>{item.dropoff.address}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
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

          <Text style={styles.sectionTitle}>Active & Upcoming</Text>
          <View style={styles.list}>
            {upcoming.length > 0 ? (
              upcoming.map(renderCard)
            ) : (
              <Text style={styles.emptyText}>No upcoming jobs</Text>
            )}
          </View>

          {completed.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Recently Completed</Text>
              <View style={styles.list}>{completed.map(renderCard)}</View>
            </>
          )}
        </ScrollView>
      )}
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
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    textAlign: "center",
    color: colors.muted,
    padding: spacing.xl,
    fontSize: 16,
    fontWeight: "600",
  },
});

export default MyScheduleScreen;

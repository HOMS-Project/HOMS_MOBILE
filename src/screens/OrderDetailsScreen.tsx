import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  TextInput,
} from "react-native";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { colors, spacing, radius } from "../theme";
import type { RootStackParamList } from "../../App";
import { staffApi } from "../api";
import PrimaryButton from "../components/PrimaryButton";
import ImagePickerField, { PickedImage } from "../components/ImagePickerField";
import { showToast } from "../utils/toast";

type OrderDetailsRouteProp = RouteProp<RootStackParamList, "OrderDetails">;
type Nav = NativeStackNavigationProp<RootStackParamList>;

type OrderDetail = {
  id: string;
  assignmentId: string;
  orderCode: string;
  status: string;
  pickup: { address: string; district: string };
  delivery: { address: string; district: string };
  items: {
    name: string;
    quantity?: number;
    actualWeight?: number;
    notes?: string;
  }[];
  scheduledTime: string;
  customer: {
    name: string;
    phone: string;
    email: string;
  };
  survey?: {
    distanceKm?: number;
    floors?: number;
    hasElevator?: boolean;
    carryMeter?: number;
    needsPacking?: boolean;
    needsAssembling?: boolean;
    insuranceRequired?: boolean;
    suggestedVehicle?: string;
    suggestedStaffCount?: number;
    items?: {
      name?: string;
      quantity?: number;
      actualWeight?: number;
      notes?: string;
    }[];
  };
};

const OrderDetailsScreen: React.FC = () => {
  const route = useRoute<OrderDetailsRouteProp>();
  const navigation = useNavigation<Nav>();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [preTripImages, setPreTripImages] = useState<PickedImage[]>([]);
  const [arrivalImages, setArrivalImages] = useState<PickedImage[]>([]);
  const [preTripNote, setPreTripNote] = useState("");
  const [arrivalNote, setArrivalNote] = useState("");

  const fetchOrderDetails = useCallback(
    async (withSpinner = false) => {
      if (withSpinner) setLoading(true);
      try {
        const result = await staffApi.getOrderDetails(route.params.invoiceId);
        const payload = (result as any)?.data ?? result;
        setOrder(payload);
      } catch (error: any) {
        console.error("Fetch order details failed:", error);
      } finally {
        setLoading(false);
      }
    },
    [route.params.invoiceId],
  );

  useEffect(() => {
    fetchOrderDetails(true);
  }, [fetchOrderDetails]);

  const buildFormData = (images: PickedImage[], note: string) => {
    const formData = new FormData();
    images.forEach((img, idx) => {
      formData.append("images", {
        uri: img.uri,
        name: img.name || `photo-${idx}.jpg`,
        type: img.type || "image/jpeg",
      } as any);
    });
    formData.append("note", note || "");
    return formData;
  };

  const handleStartJob = async () => {
    if (!order) return;
    if (preTripImages.length === 0 && !preTripNote.trim()) {
      showToast("Add pre-trip photos or note");
      return;
    }

    setActionLoading("start");
    try {
      // Send pre-trip proof then mark job as started
      const formData = buildFormData(preTripImages, preTripNote);
      await staffApi.submitPickup(route.params.invoiceId, formData);
      await staffApi.startOrder(route.params.invoiceId);
      showToast("Job started");
      setPreTripImages([]);
      setPreTripNote("");
      await fetchOrderDetails();
    } catch (error: any) {
      console.error("Start job failed:", error);
      showToast(error?.message || "Could not start job");
    } finally {
      setActionLoading(null);
    }
  };

  const handleSubmitArrival = async () => {
    setActionLoading("arrival");
    try {
      if (arrivalImages.length === 0 && !arrivalNote.trim()) {
        showToast("Add arrival photos or note");
        return;
      }
      const formData = buildFormData(arrivalImages, arrivalNote);
      await staffApi.submitDropoff(route.params.invoiceId, formData);
      showToast("Arrival submitted");
      setArrivalImages([]);
      setArrivalNote("");
      await fetchOrderDetails();
    } catch (error: any) {
      console.error("Arrival submit failed:", error);
      showToast(error?.message || "Could not submit arrival");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCompleteOrder = async () => {
    if (arrivalImages.length === 0 && !arrivalNote.trim()) {
      showToast("Add arrival proof before completing");
      return;
    }

    setActionLoading("complete");
    try {
      const formData = buildFormData(arrivalImages, arrivalNote);
      await staffApi.submitDropoff(route.params.invoiceId, formData);
      await staffApi.completeOrder(route.params.invoiceId);
      showToast("Order completed");
      await fetchOrderDetails();
      navigation.navigate("OrderList");
    } catch (error: any) {
      console.error("Complete order failed:", error);
      showToast(error?.message || "Could not complete order");
    } finally {
      setActionLoading(null);
    }
  };

  const handleContact = () => {
    if (order?.customer.phone) {
      Linking.openURL(`tel:${order.customer.phone}`);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!order) return null;

  const status = (order.status || "").toUpperCase();

  const survey = order.survey;

  const renderSurveyInfo = () => {
    if (!survey) return null;
    const rows = [
      {
        label: "Quãng đường",
        value: survey.distanceKm != null ? `${survey.distanceKm} km` : "--",
      },
      {
        label: "Tầng lầu",
        value: survey.floors != null ? survey.floors : "--",
      },
      { label: "Thang máy", value: survey.hasElevator ? "Có" : "Không" },
      {
        label: "Khênh vác",
        value: survey.carryMeter != null ? `${survey.carryMeter} m` : "--",
      },
      { label: "Đóng gói", value: survey.needsPacking ? "Có" : "Không" },
      { label: "Tháo lắp", value: survey.needsAssembling ? "Có" : "Không" },
      { label: "Bảo hiểm", value: survey.insuranceRequired ? "Có" : "Không" },
      { label: "Gợi ý xe", value: survey.suggestedVehicle || "--" },
      {
        label: "Nhân viên",
        value:
          survey.suggestedStaffCount != null
            ? survey.suggestedStaffCount
            : "--",
      },
    ];

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Thông tin khảo sát</Text>
        <View style={styles.infoGrid}>
          {rows.map((row) => (
            <View key={row.label} style={styles.infoRow}>
              <Text style={styles.infoLabel}>{row.label}</Text>
              <Text style={styles.infoValue}>{row.value}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const stripSecondaryPrefix = (name?: string) =>
    (name || "").replace(/^\[SEC:[^\]]+\]\s*/, "");

  const renderPreTripForm = () => (
    <View style={styles.formCard}>
      <Text style={styles.formTitle}>Pre-trip Proof</Text>
      <ImagePickerField
        label="Upload photos"
        images={preTripImages}
        onChange={setPreTripImages}
      />
      <TextInput
        style={styles.noteInput}
        placeholder="Pre-trip note"
        placeholderTextColor={colors.muted}
        multiline
        value={preTripNote}
        onChangeText={setPreTripNote}
      />
    </View>
  );

  const renderArrivalForm = () => (
    <View style={styles.formCard}>
      <Text style={styles.formTitle}>Arrival Proof</Text>
      <ImagePickerField
        label="Upload photos"
        images={arrivalImages}
        onChange={setArrivalImages}
      />
      <TextInput
        style={styles.noteInput}
        placeholder="Arrival note"
        placeholderTextColor={colors.muted}
        multiline
        value={arrivalNote}
        onChangeText={setArrivalNote}
      />
      <PrimaryButton
        title="Submit Arrival"
        onPress={handleSubmitArrival}
        loading={actionLoading === "arrival"}
      />
    </View>
  );

  const renderActions = () => {
    switch (status) {
      case "ACCEPTED":
        return (
          <View style={styles.actionCard}>
            {renderPreTripForm()}
            <PrimaryButton
              title="Start Job"
              onPress={handleStartJob}
              loading={actionLoading === "start"}
              disabled={preTripImages.length === 0 && !preTripNote.trim()}
            />
          </View>
        );
      case "IN_PROGRESS":
        return (
          <View style={styles.actionCard}>
            {renderArrivalForm()}
            <PrimaryButton
              title="Complete Order"
              onPress={handleCompleteOrder}
              loading={actionLoading === "complete"}
              disabled={arrivalImages.length === 0 && !arrivalNote.trim()}
            />
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Text style={styles.backIcon}>{"<"}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Details</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.mainInfo}>
          <Text style={styles.orderCode}>{order.orderCode}</Text>
          <Text style={styles.orderTime}>
            Scheduled: {new Date(order.scheduledTime).toLocaleString()}
          </Text>
          <View style={styles.statusPill}>
            <Text style={styles.statusPillText}>{status}</Text>
          </View>
        </View>

        <View style={[styles.section, styles.actionSection]}>
          <Text style={styles.sectionTitle}>Actions</Text>
          {renderActions() || (
            <Text style={styles.noActionText}>No actions available</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Locations</Text>
          <View style={styles.locationCard}>
            <View style={styles.locRow}>
              <View style={[styles.dot, { backgroundColor: "#1D9BF0" }]} />
              <View>
                <Text style={styles.locLabel}>Pickup</Text>
                <Text style={styles.locValue}>{order.pickup.address}</Text>
              </View>
            </View>
            <View style={styles.connector} />
            <View style={styles.locRow}>
              <View style={[styles.dot, { backgroundColor: "#EF4444" }]} />
              <View>
                <Text style={styles.locLabel}>Drop-off</Text>
                <Text style={styles.locValue}>{order.delivery.address}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.customerHeader}>
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>{order.customer.name[0]}</Text>
              </View>
              <View>
                <Text style={styles.customerName}>{order.customer.name}</Text>
                <Text style={styles.customerPhone}>{order.customer.phone}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.contactBtn} onPress={handleContact}>
              <Text style={styles.contactBtnText}>Contact Customer 📞</Text>
            </TouchableOpacity>
          </View>
        </View>

        {renderSurveyInfo()}

        {(() => {
          const items = (survey?.items || order.items) as Array<{
            name?: string;
            notes?: string;
            quantity?: number;
            actualWeight?: number;
          }>;

          return (
            <View style={styles.itemsSection}>
              <Text style={styles.sectionTitle}>
                Items List ({items.length})
              </Text>
              {items.map((item, index) => (
                <View key={index} style={styles.itemRow}>
                  <View style={styles.itemMain}>
                    <Text style={styles.itemName}>
                      {stripSecondaryPrefix(item.name)}
                    </Text>
                    {item.notes && (
                      <Text style={styles.itemNotes}>{item.notes}</Text>
                    )}
                  </View>
                  {item?.quantity != null ? (
                    <Text style={styles.itemQty}>x{item.quantity}</Text>
                  ) : item?.actualWeight != null ? (
                    <Text style={styles.itemQty}>{item.actualWeight} kg</Text>
                  ) : null}
                </View>
              ))}
            </View>
          );
        })()}

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.mapBtn}
          onPress={() =>
            navigation.navigate("OrderMap", {
              assignmentId: order.assignmentId,
              invoiceId: order.id,
            })
          }
        >
          <Text style={styles.mapBtnText}>Go to Map & Update Status</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: spacing.xl,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    padding: spacing.xs,
  },
  backIcon: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.text,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.text,
    marginLeft: spacing.lg,
  },
  content: {
    padding: spacing.xl,
    gap: spacing.xl,
  },
  mainInfo: {
    alignItems: "center",
    gap: 4,
  },
  orderCode: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.primary,
  },
  orderTime: {
    fontSize: 16,
    color: colors.muted,
    fontWeight: "600",
  },
  statusPill: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusPillText: {
    fontWeight: "800",
    color: colors.text,
    letterSpacing: 0.5,
  },
  section: {
    gap: spacing.md,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.text,
  },
  locationCard: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radius.lg,
    gap: spacing.sm,
  },
  locRow: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "center",
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  locLabel: {
    fontSize: 14,
    color: colors.muted,
    fontWeight: "700",
  },
  locValue: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
  },
  connector: {
    width: 2,
    height: 20,
    backgroundColor: colors.border,
    marginLeft: 5,
  },
  infoCard: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radius.lg,
    gap: spacing.lg,
  },
  infoGrid: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  infoLabel: {
    color: colors.muted,
    fontWeight: "700",
  },
  infoValue: {
    color: colors.text,
    fontWeight: "800",
  },
  customerHeader: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "center",
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: colors.buttonText,
    fontSize: 24,
    fontWeight: "800",
  },
  customerName: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.text,
  },
  customerPhone: {
    fontSize: 16,
    color: colors.muted,
    fontWeight: "600",
  },
  contactBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: radius.md,
    alignItems: "center",
  },
  contactBtnText: {
    color: colors.buttonText,
    fontWeight: "800",
    fontSize: 16,
  },
  itemsSection: {
    gap: spacing.md,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  itemMain: {
    flex: 1,
  },
  itemName: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
  },
  itemNotes: {
    fontSize: 14,
    color: colors.muted,
    fontStyle: "italic",
  },
  itemQty: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.primary,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.xl,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  mapBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 18,
    borderRadius: radius.lg,
    alignItems: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  mapBtnText: {
    color: colors.buttonText,
    fontWeight: "800",
    fontSize: 18,
  },
  actionCard: {
    gap: spacing.md,
  },
  actionSection: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  formCard: {
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  formTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.text,
  },
  noteInput: {
    minHeight: 96,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    backgroundColor: colors.background,
    color: colors.text,
    textAlignVertical: "top",
  },
  noActionText: {
    color: colors.muted,
    fontWeight: "600",
  },
});

export default OrderDetailsScreen;

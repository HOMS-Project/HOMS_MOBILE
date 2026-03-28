import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
} from "react-native";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { colors, spacing, radius } from "../theme";
import type { RootStackParamList } from "../../App";
import { apiRequest, endpoints } from "../api";

type OrderMapRouteProp = RouteProp<RootStackParamList, "OrderMap">;
type Nav = NativeStackNavigationProp<RootStackParamList>;

const OrderMapScreen: React.FC = () => {
  const route = useRoute<OrderMapRouteProp>();
  const navigation = useNavigation<Nav>();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("PENDING");
  const [routeDetails, setRouteDetails] = useState<any>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [deviationReason, setDeviationReason] = useState("");
  const assignmentId = route.params.assignmentId;

  const fetchStatus = async () => {
    try {
      const result = await apiRequest(
        endpoints.staff.getOrderDetails(route.params.invoiceId),
      );
      if (result.success) {
        setStatus(result.data.status);
        setRouteDetails(result.data.route);
      }
    } catch (error) {
      console.error("Fetch status failed:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const updateStatus = async (newStatus: string) => {
    try {
      const result = await apiRequest(
        endpoints.staff.updateAssignmentStatus(assignmentId),
        {
          method: "PATCH",
          body: JSON.stringify({ status: newStatus }),
        },
      );
      if (result.success) {
        setStatus(newStatus);
        Alert.alert("Success", `Status updated to ${newStatus}`);
      }
    } catch (error) {
      console.error("Update status failed:", error);
      Alert.alert("Error", "Failed to update status");
    }
  };

  const submitDeviation = async () => {
    if (!deviationReason.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập lý do (VD: Tắc đường, Ngập nước)");
      return;
    }
    try {
      const result = await apiRequest(
        endpoints.staff.updateAssignmentRoute(assignmentId),
        {
          method: "PATCH",
          body: JSON.stringify({ reason: deviationReason }),
        },
      );
      if (result.success) {
        Alert.alert(
          "Thành công",
          "Đã báo cáo chuyển hướng/tắc đường về hệ thống",
        );
        setIsModalVisible(false);
        setDeviationReason("");
      }
    } catch (error) {
      Alert.alert("Lỗi", "Không thể báo cáo tại thời điểm này");
    }
  };

  const renderActionButton = () => {
    switch (status) {
      case "PENDING":
        return (
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => updateStatus("IN_PROGRESS")}
          >
            <Text style={styles.actionBtnText}>ARRIVED AT PICKUP</Text>
          </TouchableOpacity>
        );
      case "IN_PROGRESS":
        return (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: "#22C55E" }]}
            onPress={() => updateStatus("COMPLETED")}
          >
            <Text style={styles.actionBtnText}>FINISH DELIVERY</Text>
          </TouchableOpacity>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Real Map would go here. Using a placeholder for now */}
      <View style={styles.mapPlaceholder}>
        {/* Since I cannot embed the generated image directly into code yet, I'll use a stylized View */}
        <View style={styles.mapOverlay}>
          <Text style={styles.mapText}>Optimal Route Active 📍</Text>
          {routeDetails && (
            <Text style={styles.routeCodeText}>Tuyến: {routeDetails.code}</Text>
          )}
          <View style={styles.pathGraphic}>
            <View style={styles.dotStart} />
            <View style={styles.pathLine} />
            <View style={styles.dotEnd} />
          </View>
        </View>
        <View style={styles.mockMapBackground} />
      </View>

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Text style={styles.backIcon}>{"<"}</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Delivery Route</Text>
          <Text style={styles.headerSubtitle}>
            Assign ID: {assignmentId.substring(0, 8)}...
          </Text>
        </View>
      </View>

      <View style={styles.bottomSheet}>
        <View style={styles.sheetHandle} />

        <View style={styles.infoRow}>
          <View style={styles.infoBlock}>
            <Text style={styles.infoLabel}>TIME</Text>
            <Text style={styles.infoValue}>
              {routeDetails?.estimatedDurationMin || 25} min
            </Text>
          </View>
          <View style={styles.vDivider} />
          <View style={styles.infoBlock}>
            <Text style={styles.infoLabel}>DISTANCE</Text>
            <Text style={styles.infoValue}>
              {routeDetails?.estimatedDistanceKm || 5.2} km
            </Text>
          </View>
        </View>

        <View style={styles.addressSection}>
          <Text style={styles.addrHeading}>
            To: {routeDetails?.toDistrict || "Cẩm Lệ"},{" "}
            {routeDetails?.area || "Đà Nẵng"}
          </Text>
          <Text style={styles.addrSub}>
            From: {routeDetails?.fromDistrict || "Hải Châu"}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.deviateBtn}
          onPress={() => setIsModalVisible(true)}
        >
          <Text style={styles.deviateBtnText}>
            ⚠️ Báo Tắc Đường / Đổi Lộ Trình
          </Text>
        </TouchableOpacity>

        {renderActionButton()}
      </View>

      <Modal visible={isModalVisible} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Báo Cáo Sự Cố Tuyến Đường</Text>
            <Text style={styles.modalSub}>
              Vui lòng nhập lý do cần thay đổi lộ trình (Vd: Tắc đường, Cây đổ,
              Ngập nước...)
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Nhập lý do thay đổi lộ trình..."
              value={deviationReason}
              onChangeText={setDeviationReason}
              multiline
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setIsModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={submitDeviation}
              >
                <Text style={styles.modalSubmitText}>Gửi Báo Cáo</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F0F0F0",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    position: "absolute",
    top: 50,
    left: 20,
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.9)",
    padding: 15,
    borderRadius: radius.lg,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 20,
  },
  backIcon: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.text,
  },
  headerInfo: {
    marginLeft: 15,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.muted,
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
  },
  mockMapBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#D1D5DB",
    // In real app, this would be the MapView
  },
  mapOverlay: {
    zIndex: 1,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.7)",
    padding: 20,
    borderRadius: radius.lg,
  },
  mapText: {
    fontWeight: "800",
    color: colors.primary,
    marginBottom: 10,
  },
  pathGraphic: {
    flexDirection: "row",
    alignItems: "center",
    width: 150,
  },
  dotStart: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#1D9BF0",
  },
  pathLine: {
    flex: 1,
    height: 3,
    backgroundColor: "#1D9BF0",
    borderStyle: "dashed",
    borderRadius: 1,
  },
  dotEnd: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#EF4444",
  },
  bottomSheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: spacing.xl,
    paddingTop: 12,
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 20,
  },
  sheetHandle: {
    width: 40,
    height: 5,
    backgroundColor: colors.border,
    borderRadius: 3,
    alignSelf: "center",
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 25,
  },
  infoBlock: {
    alignItems: "center",
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.muted,
    letterSpacing: 1,
  },
  infoValue: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.text,
  },
  vDivider: {
    width: 1,
    height: "100%",
    backgroundColor: colors.border,
  },
  addressSection: {
    marginBottom: 30,
  },
  addrHeading: {
    fontSize: 19,
    fontWeight: "800",
    color: colors.text,
  },
  addrSub: {
    fontSize: 14,
    color: colors.muted,
    marginTop: 4,
  },
  actionBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 20,
    borderRadius: radius.lg,
    alignItems: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  actionBtnText: {
    color: colors.buttonText,
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 1,
  },
  routeCodeText: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 8,
  },
  deviateBtn: {
    backgroundColor: "#FEE2E2",
    paddingVertical: 12,
    borderRadius: radius.md,
    alignItems: "center",
    marginBottom: 15,
  },
  deviateBtnText: {
    color: "#DC2626",
    fontWeight: "800",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#FFF",
    padding: 24,
    borderRadius: radius.lg,
    width: "85%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 8,
    color: colors.text,
  },
  modalSub: {
    fontSize: 14,
    color: colors.muted,
    marginBottom: 16,
  },
  modalInput: {
    backgroundColor: "#F3F4F6",
    padding: 12,
    borderRadius: 8,
    minHeight: 100,
    textAlignVertical: "top",
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
  modalCancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
  },
  modalCancelText: {
    fontWeight: "700",
    color: colors.text,
  },
  modalSubmitBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#EF4444",
  },
  modalSubmitText: {
    fontWeight: "700",
    color: "#FFF",
  },
});

export default OrderMapScreen;

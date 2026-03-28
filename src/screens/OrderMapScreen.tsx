import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  ScrollView,
  Linking,
  Platform,
} from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, PROVIDER_DEFAULT } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { colors, spacing, radius } from "../theme";
import type { RootStackParamList } from "../../App";
import { staffApi, endpoints, apiRequest } from "../api";

type OrderMapRouteProp = RouteProp<RootStackParamList, "OrderMap">;
type Nav = NativeStackNavigationProp<RootStackParamList>;

const OrderMapScreen: React.FC = () => {
  const route = useRoute<OrderMapRouteProp>();
  const navigation = useNavigation<Nav>();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("PENDING");
  const [orderData, setOrderData] = useState<any>(null);
  const [routes, setRoutes] = useState<any[]>([]);
  const [selectedRouteIdx, setSelectedRouteIdx] = useState(0);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [deviationReason, setDeviationReason] = useState("");
  const [mapCoords, setMapCoords] = useState<{ pickup: any; delivery: any } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const mapRef = useRef<MapView>(null);
  const assignmentId = route.params.assignmentId;

  const fetchRoutes = async (p: any, d: any) => {
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${p.lng},${p.lat};${d.lng},${d.lat}?overview=full&geometries=geojson&alternatives=true`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.code === 'Ok') {
        setRoutes(data.routes);
      }
    } catch (err) {
      console.warn("OSRM fetch error:", err);
    }
  };

  const fetchStatus = async () => {
    try {
      const result = await staffApi.getOrderDetails(route.params.invoiceId);
      // Axios response returns the data directly based on staffApi definition
      const data = result.data || result; 
      
      setStatus(data.status?.toUpperCase() || "PENDING");
      setOrderData(data);

      const p = data.pickup?.coordinates;
      const d = data.delivery?.coordinates;
      if (p && d) {
        setMapCoords({ pickup: p, delivery: d });
        fetchRoutes(p, d);
      }
    } catch (error) {
      console.error("Lỗi khi lấy thông tin đơn hàng:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  useEffect(() => {
    if (mapCoords && mapRef.current) {
      const coords = [
        { latitude: mapCoords.pickup.lat, longitude: mapCoords.pickup.lng },
        { latitude: mapCoords.delivery.lat, longitude: mapCoords.delivery.lng }
      ];

      if (routes.length > 0 && routes[selectedRouteIdx]?.geometry?.coordinates) {
        routes[selectedRouteIdx].geometry.coordinates.forEach((c: any) => {
          coords.push({ latitude: c[1], longitude: c[0] });
        });
      }

      const timer = setTimeout(() => {
        mapRef.current?.fitToCoordinates(coords, {
          edgePadding: { top: 80, right: 50, bottom: 450, left: 50 },
          animated: true,
        });
      }, 800);

      return () => clearTimeout(timer);
    }
  }, [mapCoords, routes, selectedRouteIdx]);

  const openExternalMap = () => {
    if (!orderData?.delivery?.coordinates) return;
    const { lat, lng } = orderData.delivery.coordinates;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
    Linking.openURL(url).catch(() => Alert.alert("Lỗi", "Không thể mở ứng dụng bản đồ"));
  };

  const handleStatusUpdate = async (action: 'ACCEPT' | 'START' | 'COMPLETE') => {
    setActionLoading(true);
    try {
      let result;
      const invoiceId = route.params.invoiceId;

      if (action === 'ACCEPT') {
        result = await staffApi.acceptOrder(invoiceId);
      } else if (action === 'START') {
        result = await staffApi.startOrder(invoiceId);
      } else if (action === 'COMPLETE') {
        result = await staffApi.completeOrder(invoiceId);
      }

      if (result) {
        Alert.alert("Thành công", "Đã cập nhật trạng thái đơn hàng");
        fetchStatus(); // Refresh data
        if (action === 'COMPLETE') navigation.navigate("OrderList");
      }
    } catch (error: any) {
      Alert.alert("Lỗi", error.message || "Không thể cập nhật trạng thái");
    } finally {
      setActionLoading(false);
    }
  };

  const submitDeviation = async () => {
    if (!deviationReason.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập lý do");
      return;
    }
    try {
      // For deviation, we can still use apiRequest or specific staffApi if added
      const result = await apiRequest(endpoints.staff.updateAssignmentRoute(assignmentId), {
        method: 'PATCH',
        body: JSON.stringify({ reason: deviationReason })
      });
      if (result.success) {
        Alert.alert("Thành công", "Đã báo cáo chuyển hướng về hệ thống");
        setIsModalVisible(false);
        setDeviationReason("");
      }
    } catch (error) {
      Alert.alert("Lỗi", "Không thể gửi báo cáo");
    }
  };

  const renderActionButton = () => {
    if (actionLoading) return <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 10 }} />;

    switch (status) {
      case "ASSIGNED":
        return (
          <TouchableOpacity style={styles.actionBtn} onPress={() => handleStatusUpdate('ACCEPT')}>
            <Text style={styles.actionBtnText}>NHẬN ĐƠN HÀNG</Text>
          </TouchableOpacity>
        );
      case "ACCEPTED":
        return (
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: "#F59E0B" }]} onPress={() => handleStatusUpdate('START')}>
            <Text style={styles.actionBtnText}>BẮT ĐẦU DI CHUYỂN</Text>
          </TouchableOpacity>
        );
      case "IN_PROGRESS":
        return (
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: "#22C55E" }]} onPress={() => handleStatusUpdate('COMPLETE')}>
            <Text style={styles.actionBtnText}>HOÀN TẤT GIAO HÀNG</Text>
          </TouchableOpacity>
        );
      default:
        return (
          <View style={{ alignItems: 'center', padding: 10 }}>
            <Text style={{ color: colors.muted, fontStyle: 'italic' }}>Trạng thái: {status}</Text>
          </View>
        );
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
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : PROVIDER_DEFAULT}
          style={styles.map}
          initialRegion={{
            latitude: orderData?.pickup?.coordinates?.lat || 16.047079,
            longitude: orderData?.pickup?.coordinates?.lng || 108.20623,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
        >
          {mapCoords?.pickup && (
            <Marker
              coordinate={{ latitude: mapCoords.pickup.lat, longitude: mapCoords.pickup.lng }}
              title="Điểm lấy hàng"
              pinColor="#1D9BF0"
            />
          )}
          {mapCoords?.delivery && (
            <Marker
              coordinate={{ latitude: mapCoords.delivery.lat, longitude: mapCoords.delivery.lng }}
              title="Điểm giao hàng"
              pinColor="#EF4444"
            />
          )}
          {routes.map((r, idx) => (
            <Polyline
              key={`route-${idx}`}
              coordinates={r.geometry.coordinates.map((c: any) => ({ latitude: c[1], longitude: c[0] }))}
              strokeColor={idx === selectedRouteIdx ? "#1D9BF0" : "rgba(0,0,0,0.15)"}
              strokeWidth={idx === selectedRouteIdx ? 6 : 4}
              zIndex={idx === selectedRouteIdx ? 2 : 1}
            />
          ))}
          {routes.length === 0 && orderData?.polyline?.length > 0 && (
            <Polyline
              coordinates={orderData.polyline.map((p: any) => ({ latitude: p[1], longitude: p[0] }))}
              strokeColor="#1D9BF0"
              strokeWidth={4}
            />
          )}
          {orderData?.routeValidation?.restrictedSegments?.map((seg: any, idx: number) => (
            seg.geometry?.coordinates?.length > 0 && (
              <Polyline
                key={`rest-seg-${idx}`}
                coordinates={seg.geometry.coordinates.map((p: any) => ({ latitude: p[1], longitude: p[0] }))}
                strokeColor="#DC2626"
                strokeWidth={8}
                zIndex={5}
              />
            )
          ))}
        </MapView>
      </View>

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>{"<"}</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Lộ Trình Vận Chuyển</Text>
          <Text style={styles.headerSubtitle}>Đơn: {orderData?.orderCode || assignmentId.substring(0, 8)}</Text>
        </View>
      </View>

      {routes.length > 0 && (
        <View style={styles.routeSelector}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 15 }}>
            {routes.map((r, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => setSelectedRouteIdx(idx)}
                style={[styles.routeTab, selectedRouteIdx === idx && styles.activeRouteTab]}
              >
                <Text style={[styles.routeTabText, selectedRouteIdx === idx && styles.activeRouteTabText]}>Tuyến {idx + 1}</Text>
                <Text style={[styles.routeTabSub, selectedRouteIdx === idx && styles.activeRouteTabSub]}>{(r.distance / 1000).toFixed(1)}km</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <View style={styles.bottomSheet}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
          <View style={styles.sheetHandle} />
          <View style={styles.infoRow}>
            <View style={styles.infoBlock}>
              <Text style={styles.infoLabel}>THỜI GIAN</Text>
              <Text style={styles.infoValue}>{routes.length > 0 ? Math.round(routes[selectedRouteIdx].duration / 60) : 25} phút</Text>
            </View>
            <View style={styles.vDivider} />
            <View style={styles.infoBlock}>
              <Text style={styles.infoLabel}>KHOẢNG CÁCH</Text>
              <Text style={styles.infoValue}>{routes.length > 0 ? (routes[selectedRouteIdx].distance / 1000).toFixed(1) : 5.0} km</Text>
            </View>
          </View>
          <View style={styles.addressSection}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <Ionicons name="location" size={16} color="#EF4444" />
              <Text style={[styles.addrHeading, { marginLeft: 6 }]}>Giao: {orderData?.delivery?.address.split(',')[0]}</Text>
            </View>
            <Text style={styles.addrSub}>Từ: {orderData?.pickup?.address.split(',')[0]}</Text>
          </View>
          <TouchableOpacity style={styles.googleMapsBtn} onPress={openExternalMap}>
            <Ionicons name="navigate" size={18} color="#FFF" />
            <Text style={styles.googleMapsBtnText}>Mở bằng Google Maps</Text>
          </TouchableOpacity>
          {orderData?.routeValidation?.violations?.length > 0 && (
            <View style={styles.violationContainer}>
              <Text style={styles.violationTitle}>⚠️ Cảnh báo cấm đường:</Text>
              {orderData.routeValidation.violations.map((v: string, idx: number) => (
                <Text key={idx} style={styles.violationText}>• {v}</Text>
              ))}
            </View>
          )}
          <TouchableOpacity style={styles.deviateBtn} onPress={() => setIsModalVisible(true)}>
            <Text style={styles.deviateBtnText}>⚠️ Báo Tắc Đường / Đổi Lộ Trình</Text>
          </TouchableOpacity>
          {renderActionButton()}
        </ScrollView>
      </View>

      <Modal visible={isModalVisible} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Báo Cáo Sự Cố</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Lý do thay đổi lộ trình..."
              value={deviationReason}
              onChangeText={setDeviationReason}
              multiline
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setIsModalVisible(false)}>
                <Text style={styles.modalCancelText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSubmitBtn} onPress={submitDeviation}>
                <Text style={styles.modalSubmitText}>Gửi</Text>
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
  mapContainer: {
    flex: 1,
    ...StyleSheet.absoluteFillObject,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
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
    backgroundColor: "rgba(255,255,255,0.95)",
    padding: 15,
    borderRadius: radius.lg,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    zIndex: 1000,
  },
  routeSelector: {
    position: 'absolute',
    top: 135,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  routeTab: {
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    alignItems: 'center',
    minWidth: 90,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  activeRouteTab: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  routeTabText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
  },
  activeRouteTabText: {
    color: '#FFF',
  },
  routeTabSub: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
  },
  activeRouteTabSub: {
    color: 'rgba(255,255,255,0.8)',
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
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    maxHeight: '60%',
    backgroundColor: "#FFF",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: spacing.xl,
    paddingTop: 12,
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.2,
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
    marginBottom: 20,
  },
  addrHeading: {
    fontSize: 19,
    fontWeight: "800",
    color: colors.text,
  },
  addrSub: {
    fontSize: 14,
    color: colors.muted,
    marginTop: 2,
  },
  actionBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 18,
    borderRadius: radius.lg,
    alignItems: "center",
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  actionBtnText: {
    color: "#FFF",
    fontSize: 17,
    fontWeight: "900",
    letterSpacing: 1,
  },
  googleMapsBtn: {
    flexDirection: 'row',
    backgroundColor: '#4285F4',
    paddingVertical: 14,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: 'center',
    marginBottom: 15,
    gap: 10,
  },
  googleMapsBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: "800",
  },
  deviateBtn: {
    backgroundColor: "#FEF2F2",
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
    alignItems: "center"
  },
  modalContent: {
    backgroundColor: "#FFF",
    padding: 24,
    borderRadius: radius.lg,
    width: "85%"
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 16,
    color: colors.text
  },
  modalInput: {
    backgroundColor: "#F3F4F6",
    padding: 12,
    borderRadius: 8,
    minHeight: 100,
    textAlignVertical: "top",
    marginBottom: 20
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12
  },
  modalCancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#F3F4F6"
  },
  modalCancelText: {
    fontWeight: "700",
    color: colors.text
  },
  modalSubmitBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#EF4444"
  },
  modalSubmitText: {
    fontWeight: "700",
    color: "#FFF"
  },
  violationContainer: {
    backgroundColor: "#FEF2F2",
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: "#EF4444"
  },
  violationTitle: {
    color: "#991B1B",
    fontWeight: "800",
    fontSize: 14,
    marginBottom: 4
  },
  violationText: {
    color: "#B91C1C",
    fontSize: 13,
    fontWeight: "600"
  },
  warningTitle: {
    color: "#1E40AF",
    fontWeight: "800",
    fontSize: 14,
    marginBottom: 4
  },
  warningText: {
    color: "#1D4ED8",
    fontSize: 13,
    fontWeight: "600"
  }
});

export default OrderMapScreen;
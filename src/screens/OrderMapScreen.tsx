import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
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
  Image,
  Platform,
  Dimensions,
  Easing,
  PanResponder,
  BackHandler,
} from "react-native";
import { WebView } from "react-native-webview";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import Constants from "expo-constants";
import { Ionicons } from "@expo/vector-icons";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import axios from "axios";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { colors, spacing, radius } from "../theme";
import type { RootStackParamList } from "../../App";
import { staffApi, endpoints, apiRequest } from "../api";
import { showToast } from "../utils/toast";

type OrderMapRouteProp = RouteProp<RootStackParamList, "OrderMap">;
type Nav = NativeStackNavigationProp<RootStackParamList>;

type EvidenceGroup = {
  beforeImages?: string[];
  afterImages?: string[];
  beforeNote?: string;
  afterNote?: string;
};

// Reserved imports for upcoming GPS tracking integration.
const __trackingReserved = {
  httpClient: axios,
  platform: Platform.OS,
  appOwnership: Constants.appOwnership,
};
void __trackingReserved;

// Decode encoded polyline (Google/Goong format) to lat/lng coordinates.
const decodePolyline = (encoded: string) => {
  if (!encoded) return [] as Array<{ latitude: number; longitude: number }>;

  const poly: Array<{ latitude: number; longitude: number }> = [];
  let index = 0;
  const len = encoded.length;
  let lat = 0;
  let lng = 0;

  while (index < len) {
    let b;
    let shift = 0;
    let result = 0;

    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const dLat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dLat;

    shift = 0;
    result = 0;

    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const dLng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dLng;

    poly.push({
      latitude: lat / 1e5,
      longitude: lng / 1e5,
    });
  }

  return poly;
};

const normalizeLatLng = (coord: any) => {
  if (!coord) return null;
  let lat = coord.lat ?? coord.latitude ?? coord[1] ?? 0;
  let lng = coord.lng ?? coord.longitude ?? coord[0] ?? 0;

  if (lat > lng) {
    [lat, lng] = [lng, lat];
  }

  return { latitude: lat, longitude: lng };
};

const getMimeType = (uri: string) => {
  const lowerUri = uri.toLowerCase();
  if (lowerUri.endsWith(".png")) return "image/png";
  if (lowerUri.endsWith(".webp")) return "image/webp";
  if (lowerUri.endsWith(".heic")) return "image/heic";
  return "image/jpeg";
};

const getFileName = (uri: string, prefix: string, idx: number) => {
  const uriParts = uri.split("/");
  const rawName = uriParts[uriParts.length - 1];
  if (rawName && rawName.includes(".")) return rawName;

  const extFromUri = uri.split(".").pop();
  const ext = extFromUri && extFromUri.length <= 5 ? extFromUri : "jpg";
  return `${prefix}-${Date.now()}-${idx}.${ext}`;
};

const OrderMapScreen: React.FC = () => {
  // Navigation params
  const route = useRoute<OrderMapRouteProp>();
  const navigation = useNavigation<Nav>();

  const assignmentId = route.params?.assignmentId;
  const invoiceId = route.params?.invoiceId;

  // Screen state
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("PENDING");
  const [orderData, setOrderData] = useState<any>(null);
  const [routes, setRoutes] = useState<any[]>([]);
  const [selectedRouteIdx, setSelectedRouteIdx] = useState(0);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [deviationReason, setDeviationReason] = useState("");
  const [mapCoords, setMapCoords] = useState<{
    pickup: any;
    delivery: any;
  } | null>(null);

  const [currentLocation, setCurrentLocation] = useState<{ latitude: number, longitude: number } | null>(null);
  const [liveRoute, setLiveRoute] = useState<{ coordinates: number[][]; distance: number; duration: number } | null>(null);

  const [pickupImages, setPickupImages] = useState<string[]>([]);
  const [dropoffImages, setDropoffImages] = useState<string[]>([]);
  const [pickupNote, setPickupNote] = useState("");
  const [dropoffNote, setDropoffNote] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const sheetMaxHeight = Math.round(Dimensions.get("window").height * 0.65);
  const sheetPeekHeight = 52;
  const collapsedTranslateY = Math.max(0, sheetMaxHeight - sheetPeekHeight);
  const sheetTranslateY = useRef(new Animated.Value(0)).current;
  const [isSheetCollapsed, setIsSheetCollapsed] = useState(false);
  const dragStartY = useRef(0);
  const currentTranslateY = useRef(0);

  // Bottom sheet animation lifecycle
  useEffect(() => {
    const id = sheetTranslateY.addListener(({ value }) => {
      currentTranslateY.current = value;
    });

    return () => {
      sheetTranslateY.removeListener(id);
    };
  }, [sheetTranslateY]);

  // Bottom sheet controls
  const toggleSheet = (collapsed: boolean) => {
    setIsSheetCollapsed(collapsed);
    Animated.timing(sheetTranslateY, {
      toValue: collapsed ? collapsedTranslateY : 0,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  // Drag gesture for bottom sheet
  const sheetPanResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_evt, gestureState) =>
          Math.abs(gestureState.dy) > 8 &&
          Math.abs(gestureState.dy) > Math.abs(gestureState.dx),
        onPanResponderGrant: () => {
          sheetTranslateY.stopAnimation((value) => {
            dragStartY.current = value;
          });
        },
        onPanResponderMove: (_evt, gestureState) => {
          const next = dragStartY.current + gestureState.dy;
          const clamped = Math.max(0, Math.min(collapsedTranslateY, next));
          sheetTranslateY.setValue(clamped);
        },
        onPanResponderRelease: (_evt, gestureState) => {
          const shouldCollapse =
            gestureState.vy > 0.25 ||
            (gestureState.vy >= -0.1 &&
              currentTranslateY.current > collapsedTranslateY * 0.45);
          toggleSheet(shouldCollapse);
        },
        onPanResponderTerminate: () => {
          toggleSheet(currentTranslateY.current > collapsedTranslateY * 0.45);
        },
      }),
    [collapsedTranslateY],
  );

  // Derived state from assignment status
  const canUploadPickupEvidence =
    status === "ACCEPTED" || status === "CONFIRMED";
  const canUploadDropoffEvidence = status === "IN_PROGRESS";
  const canEditPickupNote = canUploadPickupEvidence;
  const canEditDropoffNote = canUploadDropoffEvidence;

  const evidenceStageMessage =
    status === "PENDING" || status === "ASSIGNED"
      ? "Bạn cần nhận đơn hàng để thêm ảnh trước khi vận chuyển"
      : status === "ACCEPTED" || status === "CONFIRMED"
        ? "Ảnh sau khi giao chỉ mở khi đơn chuyển sang ĐANG THỰC HIỆN"
        : status === "COMPLETED"
          ? "Đơn đã hoàn tất"
          : "";

  const completionEvidence: EvidenceGroup = orderData?.completionEvidence || {
    beforeImages: [],
    afterImages: [],
  };

  const existingBeforeImages = Array.isArray(completionEvidence.beforeImages)
    ? completionEvidence.beforeImages
    : [];
  const existingAfterImages = Array.isArray(completionEvidence.afterImages)
    ? completionEvidence.afterImages
    : [];

  // Data fetching
  const fetchRoutes = async (p: any, d: any) => {
    try {
      const pLng = Number(p.longitude);
      const pLat = Number(p.latitude);
      const dLng = Number(d.longitude);
      const dLat = Number(d.latitude);

      if (
        Number.isNaN(pLng) ||
        Number.isNaN(pLat) ||
        Number.isNaN(dLng) ||
        Number.isNaN(dLat)
      ) {
        console.warn("Invalid coordinates for routing");
        return;
      }

      const data = await staffApi.getProxyRoute(
        `${pLng},${pLat}`,
        `${dLng},${dLat}`,
      );

      if (data.code === "Ok" && data.routes?.length > 0) {
        const mappedRoutes = data.routes.map((r: any) => ({
          distance: r.distance,
          duration: r.duration,
          coordinates: Array.isArray(r.geometry?.coordinates)
            ? r.geometry.coordinates.map((c: any) => ({
              latitude: c[1],
              longitude: c[0],
            }))
            : [],
        }));

        setRoutes(mappedRoutes);
      } else {
        console.warn("OSRM Proxy error:", data.code);
      }
    } catch (err: any) {
      console.warn("OSRM Routing Proxy error:", err?.message || err);
    }
  };

  useEffect(() => {
    const backAction = () => {
      navigation.reset({
        index: 1,
        routes: [{ name: "MainTabs" }, { name: "OrderList" }],
      });
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction,
    );

    return () => backHandler.remove();
  }, [navigation]);

  const fetchStatus = async () => {
    if (!invoiceId || invoiceId === "undefined") {
      console.error("Invalid invoiceId provided to OrderMapScreen");
      setLoading(false);
      return;
    }

    try {
      const result = await staffApi.getOrderDetails(invoiceId);
      const data = result?.data || result;

      const currentStatus = data?.assignmentStatus || data?.status || "PENDING";
      setStatus(String(currentStatus).toUpperCase());
      setOrderData(data);
      setPickupNote(
        typeof data?.completionEvidence?.beforeNote === "string"
          ? data.completionEvidence.beforeNote
          : "",
      );
      setDropoffNote(
        typeof data?.completionEvidence?.afterNote === "string"
          ? data.completionEvidence.afterNote
          : "",
      );

      const p = normalizeLatLng(data?.pickup?.coordinates);
      const d = normalizeLatLng(data?.delivery?.coordinates);

      if (p && d) {
        setMapCoords({ pickup: p, delivery: d });
        await fetchRoutes(p, d);
      }
    } catch (error) {
      console.error("Lỗi khi lấy thông tin đơn hàng:", error);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchStatus();
  }, []);

  // Fetch Live Tracking Route
  useEffect(() => {
    if (!mapCoords?.pickup || !mapCoords?.delivery) return;

    let isMounted = true;
    const fetchLiveStats = async () => {
      try {
        const { status: permStatus } = await Location.requestForegroundPermissionsAsync();
        if (permStatus !== "granted") return;

        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        if (!isMounted) return;

        const pLng = loc.coords.longitude;
        const pLat = loc.coords.latitude;
        setCurrentLocation({ latitude: pLat, longitude: pLng });

        const destination = status === "IN_PROGRESS" ? mapCoords.delivery : mapCoords.pickup;

        if (!destination) return;
        const data = await staffApi.getProxyRoute(
          `${pLng},${pLat}`,
          `${destination.longitude},${destination.latitude}`
        );

        if (data && data.code === "Ok" && data.routes?.length > 0) {
          const bestRoute = data.routes[0];
          if (isMounted) {
            setLiveRoute({
              distance: bestRoute.distance,
              duration: bestRoute.duration,
              coordinates: bestRoute.geometry.coordinates.map((c: any) => [c[1], c[0]])
            });
          }
        }
      } catch (err) {
        console.log("Error fetching live route", err);
      }
    };

    fetchLiveStats();
    return () => { isMounted = false; };
  }, [mapCoords, status]);

  // Map actions
  const openExternalMap = () => {
    const destination = normalizeLatLng(orderData?.delivery?.coordinates);
    if (!destination) return;

    const url = `https://www.google.com/maps/dir/?api=1&destination=${destination.latitude},${destination.longitude}&travelmode=driving`;
    Linking.openURL(url).catch(() =>
      Alert.alert("Lỗi", "Không thể mở ứng dụng bản đồ"),
    );
  };

  // Evidence selection helpers
  const pickImages = async (target: "pickup" | "dropoff") => {
    try {
      const mediaImages = (ImagePicker as any).MediaType?.Images;
      const baseOptions: any = { quality: 0.8 };
      if (mediaImages) {
        baseOptions.mediaTypes = [mediaImages];
      }

      const addImages = (uris: string[]) => {
        if (target === "pickup") {
          setPickupImages((prev) =>
            Array.from(new Set([...prev, ...uris])).slice(0, 10),
          );
        } else {
          setDropoffImages((prev) =>
            Array.from(new Set([...prev, ...uris])).slice(0, 10),
          );
        }
      };

      Alert.alert(
        "Thêm ảnh bằng chứng",
        "Bạn muốn chụp ảnh mới hay chọn từ thư viện?",
        [
          {
            text: "Chụp ảnh",
            onPress: async () => {
              const { status } =
                await ImagePicker.requestCameraPermissionsAsync();
              if (status !== "granted") {
                Alert.alert(
                  "Cần quyền truy cập",
                  "Vui lòng cho phép truy cập Camera để chụp bằng chứng.",
                );
                return;
              }
              const result = await ImagePicker.launchCameraAsync({
                ...baseOptions,
                allowsEditing: false,
              });
              if (result.canceled) return;
              const uris = (result.assets || []).map((a) => a.uri).filter(Boolean);
              addImages(uris);
            },
          },
          {
            text: "Chọn từ thư viện",
            onPress: async () => {
              const { status } =
                await ImagePicker.requestMediaLibraryPermissionsAsync();
              if (status !== "granted") {
                Alert.alert(
                  "Cần quyền truy cập",
                  "Vui lòng cho phép truy cập thư viện ảnh để tải bằng chứng.",
                );
                return;
              }
              const result = await ImagePicker.launchImageLibraryAsync({
                ...baseOptions,
                allowsMultipleSelection: true,
                selectionLimit: 10,
              });
              if (result.canceled) return;
              const uris = (result.assets || []).map((a) => a.uri).filter(Boolean);
              addImages(uris);
            },
          },
          { text: "Hủy", style: "cancel" },
        ],
      );
    } catch (error) {
      console.error("Pick images failed:", error);
      Alert.alert("Lỗi", "Không thể mở chức năng ảnh lúc này");
    }
  };

  const removeImage = (target: "pickup" | "dropoff", uri: string) => {
    if (target === "pickup") {
      setPickupImages((prev) => prev.filter((img) => img !== uri));
      return;
    }

    setDropoffImages((prev) => prev.filter((img) => img !== uri));
  };

  // Evidence upload payload builder
  const buildEvidenceFormData = (
    images: string[],
    type: "pickup" | "dropoff",
    noteText: string,
  ) => {
    const formData = new FormData();

    images.forEach((uri, idx) => {
      formData.append("images", {
        uri,
        type: getMimeType(uri),
        name: getFileName(uri, type, idx),
      } as any);
    });

    if (noteText.trim()) {
      formData.append("note", noteText.trim());
    }

    return formData;
  };

  // API actions
  const updateAssignmentStatus = async (
    newStatus: "ACCEPTED",
  ) => {
    if (!assignmentId) {
      throw new Error("Không tìm thấy ID phân công công việc.");
    }

    await staffApi.updateAssignmentStatus(assignmentId, newStatus);
  };

  const startOrder = async () => {
    if (!invoiceId) {
      throw new Error("Không tìm thấy mã đơn hàng.");
    }

    await staffApi.startOrder(invoiceId);
  };

  const completeOrder = async () => {
    if (!invoiceId) {
      throw new Error("Không tìm thấy mã đơn hàng.");
    }

    await staffApi.completeOrder(invoiceId);
  };

  const uploadPickupEvidence = async () => {
    if (!invoiceId) {
      throw new Error("Không tìm thấy mã đơn hàng.");
    }

    const formData = buildEvidenceFormData(pickupImages, "pickup", pickupNote);
    await staffApi.submitPickup(invoiceId, formData);
  };

  const uploadDropoffEvidence = async () => {
    if (!invoiceId) {
      throw new Error("Không tìm thấy mã đơn hàng.");
    }

    const formData = buildEvidenceFormData(
      dropoffImages,
      "dropoff",
      dropoffNote,
    );
    await staffApi.submitDropoff(invoiceId, formData);
  };

  // Assignment status transitions
  const handleAccept = async () => {
    setActionLoading(true);
    try {
      await updateAssignmentStatus("ACCEPTED");
      Alert.alert("Thành công", "Đã cập nhật trạng thái đơn hàng");
      await fetchStatus();
    } catch (error: any) {
      Alert.alert("Lỗi", error?.message || "Không thể cập nhật trạng thái");
    } finally {
      setActionLoading(false);
    }
  };

  const handleStart = async () => {
    const isTruckRental = orderData?.moveType === "TRUCK_RENTAL";
    if (!isTruckRental && pickupImages.length === 0 && existingBeforeImages.length === 0) {
      Alert.alert(
        "Thiếu bằng chứng",
        "Bạn cần chụp ảnh bằng chứng trước khi di chuyển",
      );
      return;
    }

    setActionLoading(true);
    try {
      if (pickupImages.length > 0) {
        await uploadPickupEvidence();
      }

      await startOrder();
      showToast("Đã bắt đầu đơn hàng. Email đã được gửi tới khách hàng.");

      setPickupImages([]);
      setPickupNote("");
      await fetchStatus();
    } catch (error: any) {
      showToast(error?.message || "Không thể bắt đầu di chuyển");
    } finally {
      setActionLoading(false);
    }
  };

  const handleComplete = async () => {
    if (dropoffImages.length === 0 && existingAfterImages.length === 0) {
      Alert.alert("Thiếu bằng chứng", "Bạn cần cung cấp ảnh sau khi giao hàng");
      return;
    }

    setActionLoading(true);
    try {
      if (dropoffImages.length > 0) {
        await uploadDropoffEvidence();
      }

      await completeOrder();
      showToast("Đã hoàn tất đơn hàng. Email đã được gửi tới khách hàng.");

      setDropoffImages([]);
      setDropoffNote("");
      await fetchStatus();
      navigation.reset({
        index: 1,
        routes: [{ name: "MainTabs" }, { name: "OrderList" }],
      });
    } catch (error: any) {
      showToast(error?.message || "Không thể hoàn tất giao hàng");
    } finally {
      setActionLoading(false);
    }
  };

  // Deviation reporting
  const submitDeviation = async () => {
    if (!assignmentId) {
      Alert.alert("Lỗi", "Không tìm thấy thông tin phân công");
      return;
    }

    if (!deviationReason.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập lý do");
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

      if (result?.success) {
        Alert.alert("Thành công", "Đã báo cáo chuyển hướng về hệ thống");
        setIsModalVisible(false);
        setDeviationReason("");
      }
    } catch (error) {
      Alert.alert("Lỗi", "Không thể gửi báo cáo");
    }
  };

  // UI render helpers
  const renderSelectedImageList = (
    target: "pickup" | "dropoff",
    images: string[],
    disabled = false,
  ) => {
    if (!images.length) {
      return <Text style={styles.emptyEvidenceText}>Chưa chọn ảnh mới</Text>;
    }

    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.imageList}
      >
        {images.map((uri) => (
          <View key={`${target}-${uri}`} style={styles.imagePreviewWrap}>
            <Image source={{ uri }} style={styles.imagePreview} />
            <TouchableOpacity
              style={styles.imageRemoveBtn}
              onPress={() => removeImage(target, uri)}
              disabled={actionLoading || disabled}
            >
              <Ionicons name="close" size={14} color="#FFF" />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    );
  };

  const renderServerEvidenceList = (images: string[]) => {
    if (!images.length) {
      return (
        <Text style={styles.emptyEvidenceText}>Chưa có ảnh đã tải lên</Text>
      );
    }

    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.imageList}
      >
        {images.map((uri, idx) => (
          <Image
            key={`${uri}-${idx}`}
            source={{ uri }}
            style={styles.imagePreview}
          />
        ))}
      </ScrollView>
    );
  };

  const getActionConfig = () => {
    if (status === "PENDING" || status === "ASSIGNED") {
      return {
        title: "NHẬN ĐƠN HÀNG",
        color: colors.primary,
        onPress: handleAccept,
      };
    }

    if (status === "ACCEPTED" || status === "CONFIRMED") {
      return {
        title: "BẮT ĐẦU DI CHUYỂN",
        color: "#F59E0B",
        onPress: handleStart,
      };
    }

    if (status === "IN_PROGRESS") {
      return {
        title: "HOÀN TẤT GIAO HÀNG",
        color: "#22C55E",
        onPress: handleComplete,
      };
    }

    return null;
  };

  const renderActionButton = () => {
    const action = getActionConfig();

    if (!action) {
      const displayStatus =
        status === "COMPLETED"
          ? "ĐÃ HOÀN TẤT"
          : status === "IN_PROGRESS"
            ? "ĐANG THỰC HIỆN"
            : status === "ACCEPTED"
              ? "ĐÃ NHẬN ĐƠN"
              : status;

      return (
        <View style={{ alignItems: "center", padding: 10 }}>
          <Text style={{ color: colors.muted, fontStyle: "italic" }}>
            Trạng thái: {displayStatus}
          </Text>
        </View>
      );
    }

    return (
      <TouchableOpacity
        style={[
          styles.actionBtn,
          { backgroundColor: action.color },
          actionLoading && styles.actionBtnDisabled,
        ]}
        onPress={action.onPress}
        disabled={actionLoading}
      >
        {actionLoading ? (
          <ActivityIndicator size="small" color="#FFF" />
        ) : (
          <Text style={styles.actionBtnText}>{action.title}</Text>
        )}
      </TouchableOpacity>
    );
  };

  // Map html generation
  const generateMapHtml = () => {
    const defaultCenter = [16.047079, 108.20623];
    const pickup = mapCoords?.pickup
      ? [mapCoords.pickup.latitude, mapCoords.pickup.longitude]
      : null;
    const delivery = mapCoords?.delivery
      ? [mapCoords.delivery.latitude, mapCoords.delivery.longitude]
      : null;

    const activeRouteCoordinates =
      routes[selectedRouteIdx]?.coordinates?.map((c: any) => [
        c.latitude,
        c.longitude,
      ]) || [];

    let backupPolyline: number[][] = [];
    if (routes.length === 0) {
      const encodedPolyline =
        typeof orderData?.polyline === "string"
          ? orderData.polyline
          : typeof orderData?.polyline?.points === "string"
            ? orderData.polyline.points
            : "";

      if (encodedPolyline) {
        backupPolyline = decodePolyline(encodedPolyline).map((p) => [
          p.latitude,
          p.longitude,
        ]);
      } else if (
        Array.isArray(orderData?.polyline) &&
        orderData.polyline.length > 0
      ) {
        backupPolyline = orderData.polyline.map((p: any) => {
          const normalized = normalizeLatLng(p);
          return normalized
            ? [normalized.latitude, normalized.longitude]
            : [0, 0];
        });
      }
    }

    const restrictedPaths: number[][][] = [];
    if (orderData?.restrictions?.length > 0) {
      restrictedPaths.push(
        orderData.restrictions.map((p: any) => {
          const normalized = normalizeLatLng(p);
          return normalized
            ? [normalized.latitude, normalized.longitude]
            : [0, 0];
        }),
      );
    }

    return `
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <style>
        body { padding: 0; margin: 0; overflow: hidden; background: #e5e5e5; }
        #map { width: 100vw; height: 100vh; }
        .pickup-icon { background: #1D9BF0; border-radius: 50%; border: 2px solid white; width: 14px; height: 14px; box-shadow: 0 0 5px rgba(0,0,0,0.5); }
        .delivery-icon { background: #EF4444; border-radius: 50%; border: 2px solid white; width: 14px; height: 14px; box-shadow: 0 0 5px rgba(0,0,0,0.5); }
    </style>
</head>
<body>
    <div id="map"></div>
    <script>
        var center = ${pickup ? JSON.stringify(pickup) : JSON.stringify(defaultCenter)};
        var map = L.map('map', { zoomControl: false, attributionControl: false }).setView(center, 13);

        L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
            maxZoom: 20
        }).addTo(map);

        var bounds = L.latLngBounds();

        var pickupCoord = ${JSON.stringify(pickup)};
        if (pickupCoord) {
            var iconP = L.divIcon({ className: 'pickup-icon', iconSize: [14, 14], iconAnchor: [7, 7] });
            L.marker(pickupCoord, { icon: iconP }).addTo(map).bindPopup("Điểm lấy hàng");
            bounds.extend(pickupCoord);
        }

        var deliveryCoord = ${JSON.stringify(delivery)};
        if (deliveryCoord) {
            var iconD = L.divIcon({ className: 'delivery-icon', iconSize: [14, 14], iconAnchor: [7, 7] });
            L.marker(deliveryCoord, { icon: iconD }).addTo(map).bindPopup("Điểm giao hàng");
            bounds.extend(deliveryCoord);
        }

        var activeRoute = ${JSON.stringify(activeRouteCoordinates)};
        if (activeRoute && activeRoute.length > 0) {
            L.polyline(activeRoute, {color: '#1D9BF0', weight: 5 }).addTo(map);
            bounds.extend(L.polyline(activeRoute).getBounds());
        }

        var backupRoute = ${JSON.stringify(backupPolyline)};
        if (backupRoute && backupRoute.length > 0 && activeRoute.length === 0) {
            L.polyline(backupRoute, {color: '#1D9BF0', weight: 4 }).addTo(map);
            bounds.extend(L.polyline(backupRoute).getBounds());
        }

        var restricted = ${JSON.stringify(restrictedPaths)};
        if (restricted && restricted.length > 0) {
            restricted.forEach(function(path) {
                L.polyline(path, {color: '#DC2626', weight: 8 }).addTo(map);
                bounds.extend(L.polyline(path).getBounds());
            });
        }

        var myLocation = ${JSON.stringify(currentLocation ? [currentLocation.latitude, currentLocation.longitude] : null)};
        if (myLocation) {
            var iconMe = L.divIcon({ className: 'pickup-icon', iconSize: [16, 16], iconAnchor: [8, 8], html: '<div style="background:#22C55E;width:100%;height:100%;border-radius:50%;border:2px solid white;box-shadow:0 0 8px rgba(34,197,94,0.8);"></div>' });
            L.marker(myLocation, { icon: iconMe }).addTo(map).bindPopup("Bạn đang ở đây");
            bounds.extend(myLocation);
        }

        var livePath = ${JSON.stringify(liveRoute?.coordinates || null)};
        if (livePath && livePath.length > 0) {
            L.polyline(livePath, {color: '#10B981', weight: 6, dashArray: '8, 8' }).addTo(map);
            bounds.extend(L.polyline(livePath).getBounds());
        }

        if (bounds.isValid()) {
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
        }
    </script>
</body>
</html>
    `;
  };

  // Render constants
  const deliveryAddress = orderData?.delivery?.address || "";
  const pickupAddress = orderData?.pickup?.address || "";

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
        <WebView
          originWhitelist={["*"]}
          source={{ html: generateMapHtml() }}
          style={{ flex: 1 }}
          scrollEnabled={false}
          bounces={false}
        />

        {liveRoute && status !== "COMPLETED" && status !== "CANCELLED" && (
          <View className="absolute z-50 left-5 right-5 top-[140px] bg-slate-900/90 py-3.5 px-4 rounded-3xl flex-row items-center justify-between border border-emerald-500/40 shadow-2xl">
            <View className="flex-row items-center">
              <View className="w-11 h-11 rounded-full bg-emerald-500 items-center justify-center mr-3">
                <Ionicons name="navigate" size={24} color="#FFF" />
              </View>
              <View>
                <Text className="text-white/70 text-[11px] font-bold mb-1 uppercase tracking-widest">Tiếp theo: {status === 'IN_PROGRESS' ? 'ĐI ĐẾN ĐIỂM GIAO' : 'ĐI ĐẾN ĐIỂM LẤY'}</Text>
                <Text className="text-white text-xl font-extrabold tracking-tight shadow-sm">
                  {(liveRoute.distance / 1000).toFixed(1)} km <Text className="font-normal opacity-50">|</Text> {Math.round((liveRoute.distance / 1000) * 2.5 + 5)} phút
                </Text>
              </View>
            </View>
            <View className="bg-emerald-400 w-2 h-2 rounded-full absolute top-3 right-4 shadow-md" style={{ shadowColor: '#4ade80', shadowRadius: 6, shadowOpacity: 1 }} />
          </View>
        )}
      </View>

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() =>
            navigation.reset({
              index: 1,
              routes: [{ name: "MainTabs" }, { name: "OrderList" }],
            })
          }
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Lộ Trình Vận Chuyển</Text>
          <Text style={styles.headerSubtitle}>
            Đơn:{" "}
            {orderData?.orderCode ||
              (assignmentId ? assignmentId.substring(0, 8) : "N/A")}
          </Text>
        </View>
      </View>

      <Animated.View
        style={[
          styles.bottomSheet,
          {
            height: sheetMaxHeight,
            transform: [{ translateY: sheetTranslateY }],
          },
        ]}
      >
        <View style={styles.sheetGrabArea} {...sheetPanResponder.panHandlers}>
          <View style={styles.sheetHandle} />
        </View>

        <ScrollView
          scrollEnabled={!isSheetCollapsed}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          <View style={styles.infoRow}>
            <View style={styles.infoBlock}>
              <Text style={styles.infoLabel}>THỜI GIAN</Text>
              <Text style={styles.infoValue}>
                {routes.length > 0
                  ? Math.round((routes[selectedRouteIdx].distance / 1000) * 2.5 + 5)
                  : 25}{" "}
                phút
              </Text>
            </View>
            <View style={styles.vDivider} />
            <View style={styles.infoBlock}>
              <Text style={styles.infoLabel}>KHOẢNG CÁCH</Text>
              <Text style={styles.infoValue}>
                {routes.length > 0
                  ? (routes[selectedRouteIdx].distance / 1000).toFixed(1)
                  : 5.0}{" "}
                km
              </Text>
            </View>
          </View>

          <View style={styles.addressSection}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 4,
              }}
            >
              <Ionicons name="location" size={16} color="#EF4444" />
              <Text style={[styles.addrHeading, { marginLeft: 6 }]}>
                Giao: {deliveryAddress.split(",")[0] || "Chưa có"}
              </Text>
            </View>
            <Text style={styles.addrSub}>
              Từ: {pickupAddress.split(",")[0] || "Chưa có"}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.googleMapsBtn}
            onPress={openExternalMap}
            disabled={actionLoading}
          >
            <Ionicons name="navigate" size={18} color="#FFF" />
            <Text style={styles.googleMapsBtnText}>Mở bằng Google Maps</Text>
          </TouchableOpacity>

          {orderData?.routeValidation?.violations?.length > 0 && (
            <View style={styles.violationContainer}>
              <Text style={styles.violationTitle}>⚠️ Cảnh báo cấm đường:</Text>
              {orderData.routeValidation.violations.map(
                (v: string, idx: number) => (
                  <Text key={idx} style={styles.violationText}>
                    • {v}
                  </Text>
                ),
              )}
            </View>
          )}

          <View style={styles.evidenceCard}>
            <Text style={styles.evidenceTitle}>Bằng chứng hoàn thành</Text>

            {!!evidenceStageMessage && (
              <View style={styles.evidenceLockBadge}>
                <Ionicons name="lock-closed" size={14} color="#64748B" />
                <Text style={styles.evidenceLockText}>
                  {evidenceStageMessage}
                </Text>
              </View>
            )}

            <View style={styles.evidenceContentWrap}>
              <View style={styles.evidenceGroup}>
                <Text style={styles.evidenceGroupTitle}>
                  Trước khi vận chuyển
                </Text>
                <TouchableOpacity
                  style={[
                    styles.pickBtn,
                    (actionLoading || !canUploadPickupEvidence) &&
                    styles.pickBtnDisabled,
                  ]}
                  onPress={() => pickImages("pickup")}
                  disabled={actionLoading || !canUploadPickupEvidence}
                >
                  <Ionicons
                    name="images-outline"
                    size={20}
                    color={colors.primary}
                  />
                  <Text style={styles.pickBtnText}>
                    Chọn ảnh trước khi vận chuyển
                  </Text>
                </TouchableOpacity>
                {renderSelectedImageList(
                  "pickup",
                  pickupImages,
                  !canUploadPickupEvidence,
                )}
                <TextInput
                  style={[
                    styles.noteInput,
                    !canEditPickupNote && styles.noteInputDisabled,
                  ]}
                  placeholder="Ghi chú ảnh trước khi vận chuyển"
                  value={pickupNote}
                  onChangeText={setPickupNote}
                  editable={!actionLoading && canEditPickupNote}
                  multiline
                />
                <Text style={styles.uploadedTitle}>Ảnh đã tải lên</Text>
                {renderServerEvidenceList(existingBeforeImages)}
              </View>

              <View style={styles.evidenceGroup}>
                <Text style={styles.evidenceGroupTitle}>Sau khi giao</Text>
                <TouchableOpacity
                  style={[
                    styles.pickBtn,
                    (actionLoading || !canUploadDropoffEvidence) &&
                    styles.pickBtnDisabled,
                  ]}
                  onPress={() => pickImages("dropoff")}
                  disabled={actionLoading || !canUploadDropoffEvidence}
                >
                  <Ionicons
                    name="images-outline"
                    size={20}
                    color={colors.primary}
                  />
                  <Text style={styles.pickBtnText}>Chọn ảnh sau khi giao</Text>
                </TouchableOpacity>
                {renderSelectedImageList(
                  "dropoff",
                  dropoffImages,
                  !canUploadDropoffEvidence,
                )}
                <TextInput
                  style={[
                    styles.noteInput,
                    !canEditDropoffNote && styles.noteInputDisabled,
                  ]}
                  placeholder="Ghi chú ảnh sau khi giao"
                  value={dropoffNote}
                  onChangeText={setDropoffNote}
                  editable={!actionLoading && canEditDropoffNote}
                  multiline
                />
                <Text style={styles.uploadedTitle}>Ảnh đã tải lên</Text>
                {renderServerEvidenceList(existingAfterImages)}
              </View>
            </View>
          </View> 

          {renderActionButton()}
        </ScrollView>
      </Animated.View>

      <Modal visible={isModalVisible} transparent animationType="slide">
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
    backgroundColor: "#ffffff",
  },
  mapContainer: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    position: "absolute",
    top: 40,
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.92)",
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    zIndex: 1000,
  },
  routeSelector: {
    position: "absolute",
    top: 115,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  routeTab: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    marginRight: 8,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 5,
    alignItems: "center",
    minWidth: 80,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  activeRouteTab: {
    backgroundColor: "#16a34a",
    borderColor: "#16a34a",
  },
  routeTabText: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.text,
  },
  activeRouteTabText: {
    color: "#FFF",
  },
  routeTabSub: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
  },
  activeRouteTabSub: {
    color: "rgba(255,255,255,0.8)",
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  headerInfo: {
    marginLeft: 15,
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 11,
    color: colors.muted,
  },
  bottomSheet: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    backgroundColor: "#ffffff",
    overflow: "hidden",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingHorizontal: 16,
    paddingTop: 8,
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 20,
  },
  sheetGrabArea: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
  },
  sheetHandle: {
    width: 40,
    height: 5,
    backgroundColor: "#cbd5e1",
    borderRadius: 3,
    alignSelf: "center",
    marginBottom: 0,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 16,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 18,
    paddingVertical: 10,
  },
  infoBlock: {
    alignItems: "center",
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.muted,
    letterSpacing: 1,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.text,
  },
  vDivider: {
    width: 1,
    height: "100%",
    backgroundColor: colors.border,
  },
  addressSection: {
    marginBottom: 12,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  addrHeading: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.text,
  },
  addrSub: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
  },
  evidenceCard: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: radius.lg,
    padding: 10,
    marginBottom: 12,
    backgroundColor: "#ffffff",
    gap: 8,
  },
  evidenceTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.text,
  },
  evidenceGroup: {
    gap: 8,
  },
  evidenceContentWrap: {
    gap: 10,
  },
  evidenceContentWrapLocked: {
    opacity: 0.55,
  },
  evidenceLockBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    alignSelf: "flex-start",
  },
  evidenceLockText: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "600",
  },
  evidenceGroupTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#334155",
  },
  pickBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: radius.md,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  pickBtnText: {
    color: colors.primary,
    fontWeight: "700",
    fontSize: 13,
  },
  pickBtnDisabled: {
    opacity: 0.6,
  },
  uploadedTitle: {
    fontSize: 16,
    color: colors.muted,
    fontWeight: "700",
  },
  imageList: {
    gap: 10,
    paddingRight: 8,
  },
  imagePreviewWrap: {
    width: 64,
    height: 64,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#E2E8F0",
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },
  imagePreview: {
    width: 64,
    height: 64,
    borderRadius: 8,
    marginRight: 8,
    backgroundColor: "#E2E8F0",
  },
  imageRemoveBtn: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(15,23,42,0.7)",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyEvidenceText: {
    fontSize: 16,
    color: colors.muted,
    fontStyle: "italic",
  },
  noteInput: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: radius.md,
    minHeight: 52,
    textAlignVertical: "top",
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: colors.text,
  },
  noteInputDisabled: {
    opacity: 0.6,
    backgroundColor: "#F8FAFC",
  },
  actionBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: radius.lg,
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  actionBtnDisabled: {
    opacity: 0.7,
  },
  actionBtnText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 1,
  },
  googleMapsBtn: {
    flexDirection: "row",
    backgroundColor: "#4285F4",
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
    gap: 10,
    shadowColor: "#2563eb",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  googleMapsBtnText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "800",
  },
  deviateBtn: {
    backgroundColor: "#fff1f1",
    borderWidth: 1,
    borderColor: "#fecaca",
    paddingVertical: 10,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 15,
  },
  deviateBtnText: {
    color: "#DC2626",
    fontWeight: "800",
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 24,
    borderRadius: radius.lg,
    width: "85%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 16,
    color: colors.text,
  },
  modalInput: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#E2E8F0",
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
  violationContainer: {
    backgroundColor: "#fff5f5",
    padding: 12,
    borderRadius: 12,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: "#EF4444",
  },
  violationTitle: {
    color: "#991B1B",
    fontWeight: "800",
    fontSize: 14,
    marginBottom: 4,
  },
  violationText: {
    color: "#B91C1C",
    fontSize: 13,
    fontWeight: "600",
  },
});

export default OrderMapScreen;

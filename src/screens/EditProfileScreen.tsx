import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import LabeledTextInput from "../components/LabeledTextInput";
import PrimaryButton from "../components/PrimaryButton";
import { colors, spacing, radius } from "../theme";
import type { RootStackParamList } from "../../App";
import { apiRequest, endpoints } from "../api";

const CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME || "";
const UPLOAD_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "";

type Nav = NativeStackNavigationProp<RootStackParamList>;

const fallbackAvatar =
  "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80";

const EditProfileScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const pickAvatar = async () => {
    if (!CLOUD_NAME || !UPLOAD_PRESET) {
      Alert.alert(
        "Thiếu cấu hình",
        "Chưa có CLOUDINARY env. Vui lòng đặt EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME và EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET.",
      );
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Quyền truy cập bị từ chối",
        "Cần quyền truy cập thư viện ảnh",
      );
      return;
    }

    const mediaImages = (ImagePicker as any).MediaType?.Images;

    const pickerOptions: any = {
      quality: 0.8,
      allowsEditing: false,
    };

    if (mediaImages) {
      pickerOptions.mediaTypes = [mediaImages];
    }

    const result = await ImagePicker.launchImageLibraryAsync(pickerOptions);

    if (result.canceled || !result.assets?.length) return;

    const asset = result.assets[0];
    if (!asset.uri) return;

    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("file", {
        uri: asset.uri,
        name: "avatar.jpg",
        type: asset.mimeType || "image/jpeg",
      } as any);
      formData.append("upload_preset", UPLOAD_PRESET);

      const cloudUrl = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;
      const res = await fetch(cloudUrl, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        const msg =
          data?.error?.message || data?.message || "Tải ảnh lên thất bại";
        Alert.alert("Lỗi", msg);
        return;
      }
      if (data?.secure_url) {
        setAvatar(data.secure_url);
      } else {
        Alert.alert("Lỗi", "Tải ảnh lên thất bại");
      }
    } catch (err: any) {
      Alert.alert("Lỗi", err?.message || "Không thể tải ảnh");
    } finally {
      setUploadingAvatar(false);
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const result = await apiRequest(endpoints.user.getProfile);
        if (result.success) {
          const u = result.data;
          setName(u.fullName || u.username || "");
          setEmail(u.email || "");
          setPhone(u.phoneNumber || (u as any).phone || "");
          setAvatar(u.avatar || null);
        }
      } catch (error) {
        console.error("Fetch profile failed:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await apiRequest(endpoints.user.updateProfile, {
        method: "PUT",
        body: JSON.stringify({
          fullName: name,
          email,
          phoneNumber: phone,
          avatar,
        }),
      });
      if (result.success) {
        Alert.alert("Thành công", "Cập nhật hồ sơ thành công");
        navigation.goBack();
      }
    } catch (error) {
      console.error("Update profile failed:", error);
      Alert.alert("Lỗi", "Cập nhật hồ sơ thất bại");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={styles.backText}>{"<"}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chỉnh sửa hồ sơ</Text>
        </View>

        <View style={styles.avatarWrap}>
          <Image
            source={{ uri: avatar || fallbackAvatar }}
            style={styles.avatar}
          />
          <TouchableOpacity
            style={[styles.cameraBadge, uploadingAvatar && { opacity: 0.6 }]}
            onPress={pickAvatar}
            disabled={uploadingAvatar}
          >
            {uploadingAvatar ? (
              <ActivityIndicator size="small" color={colors.text} />
            ) : (
              <Text style={styles.cameraIcon}>📷</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          <LabeledTextInput
            label="Họ và tên"
            placeholder="Tên của bạn"
            value={name}
            onChangeText={setName}
          />

          <LabeledTextInput
            label="Email"
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <LabeledTextInput
            label="Số điện thoại"
            placeholder="Số điện thoại"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />

          <View style={{ marginTop: spacing.md, alignItems: "center" }}>
            <PrimaryButton
              title={saving ? "Đang lưu..." : "Lưu thay đổi"}
              onPress={handleSave}
              fullWidth={false}
              style={{ width: 280 }}
              loading={saving}
              disabled={saving}
            />
          </View>
        </View>
      </ScrollView>

      {loading && (
        <View style={[StyleSheet.absoluteFill, styles.loadingOverlay]}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
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
    paddingVertical: spacing.xxl,
    gap: spacing.xl,
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    paddingTop: spacing.sm,
  },
  backBtn: {
    position: "absolute",
    left: -spacing.md,
    top: 0,
    padding: spacing.sm,
  },
  backText: {
    fontSize: 32,
    color: colors.text,
    fontWeight: "700",
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: "800",
    color: colors.text,
  },
  avatarWrap: {
    alignSelf: "center",
    marginTop: spacing.xxl,
    marginBottom: spacing.md,
  },
  avatar: {
    width: 190,
    height: 190,
    borderRadius: 95,
    borderWidth: 2,
    borderColor: colors.border,
  },
  cameraBadge: {
    position: "absolute",
    bottom: 8,
    right: 8,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  cameraIcon: {
    fontSize: 16,
  },
  form: {
    gap: spacing.xl,
    width: "100%",
    maxWidth: 420,
    marginTop: spacing.xl,
  },
  loadingOverlay: {
    backgroundColor: "rgba(255,255,255,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
});

export default EditProfileScreen;
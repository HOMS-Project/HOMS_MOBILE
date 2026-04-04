import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
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
    <View className="flex-1 bg-slate-100">
      <View className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-emerald-300/35" />
      <View className="absolute -left-16 bottom-14 h-56 w-56 rounded-full bg-sky-200/40" />

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View className="px-6 pb-8 pt-12">
            <View className="flex-row items-center justify-between">
              <Pressable
                className="h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-sm"
                onPress={() => navigation.goBack()}
              >
                <Ionicons name="chevron-back" size={22} color="#0f172a" />
              </Pressable>
              <Text className="text-2xl font-extrabold text-slate-900">
                Chỉnh sửa hồ sơ
              </Text>
              <View className="h-11 w-11" />
            </View>

            <View className="mt-7 items-center">
              <View className="relative">
                <Image
                  source={{ uri: avatar || fallbackAvatar }}
                  className="h-44 w-44 rounded-full border-4 border-white"
                />

                <Pressable
                  className={`absolute bottom-2 right-2 h-11 w-11 items-center justify-center rounded-full bg-white shadow-md ${uploadingAvatar ? "opacity-60" : ""}`}
                  onPress={pickAvatar}
                  disabled={uploadingAvatar}
                >
                  {uploadingAvatar ? (
                    <ActivityIndicator size="small" color="#0f172a" />
                  ) : (
                    <Ionicons name="camera-outline" size={18} color="#0f172a" />
                  )}
                </Pressable>
              </View>

              <Text className="mt-3 text-sm font-medium text-slate-500">
                Nhấn biểu tượng camera để cập nhật ảnh đại diện
              </Text>
            </View>

            <Card className="mt-7 rounded-[30px] p-6">
              <Text className="text-xl font-extrabold text-slate-900">
                Thông tin cá nhân
              </Text>
              <Text className="mt-1 text-sm text-slate-500">
                Luôn cập nhật thông tin để được hỗ trợ tốt hơn.
              </Text>

              <View className="mt-5 gap-4">
                <Input
                  label="Họ và tên"
                  placeholder="Tên của bạn"
                  value={name}
                  onChangeText={setName}
                />

                <Input
                  label="Email"
                  placeholder="Email"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />

                <Input
                  label="Số điện thoại"
                  placeholder="Số điện thoại"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />

                <Button
                  title={saving ? "Đang lưu..." : "Lưu thay đổi"}
                  onPress={handleSave}
                  loading={saving}
                  disabled={saving || uploadingAvatar}
                  className="mt-2 h-14"
                />
              </View>
            </Card>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {loading ? (
        <View className="absolute inset-0 items-center justify-center bg-white/70">
          <ActivityIndicator size="large" color="#10b981" />
        </View>
      ) : null}
    </View>
  );
};

export default EditProfileScreen;

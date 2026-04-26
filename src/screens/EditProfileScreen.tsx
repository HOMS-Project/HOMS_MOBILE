import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Alert,
  Easing,
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import KeyboardSafeArea from "../components/KeyboardSafeArea";
import * as ImagePicker from "expo-image-picker";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../App";
import { apiRequest, endpoints } from "../api";

const CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME || "";
const UPLOAD_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "";

type Nav = NativeStackNavigationProp<RootStackParamList>;

const fallbackAvatar =
  "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80";

type ProfileFieldProps = {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  icon: keyof typeof Ionicons.glyphMap;
  keyboardType?: React.ComponentProps<typeof TextInput>["keyboardType"];
};

const ProfileField: React.FC<ProfileFieldProps> = ({
  label,
  placeholder,
  value,
  onChangeText,
  icon,
  keyboardType,
}) => {
  return (
    <View className="gap-2.5">
      <Text className="text-base font-bold text-slate-700">{label}</Text>
      <View className="h-[68px] flex-row items-center rounded-xl border border-emerald-100 bg-white/95 px-5">
        <Ionicons name={icon} size={22} color="#4b5563" />
        <TextInput
          className="ml-3.5 flex-1 text-lg text-slate-900"
          placeholder={placeholder}
          placeholderTextColor="#94a3b8"
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
        />
      </View>
    </View>
  );
};

const EditProfileScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const screenOpacity = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.96)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(screenOpacity, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(cardScale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 12,
        bounciness: 4,
      }),
    ]).start();
  }, [cardScale, screenOpacity]);

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
      formData.append("folder", "avatars");

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
          setPhone((u as any).phone || u.phoneNumber || "");
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
      const payload = {
        fullName: name,
        phone: phone,
        avatar: avatar,
      };

      const result = await apiRequest(endpoints.user.updateProfile, {
        method: "PUT",
        body: JSON.stringify(payload),
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

  const animateButton = (toValue: number) => {
    Animated.spring(buttonScale, {
      toValue,
      useNativeDriver: true,
      speed: 20,
      bounciness: 4,
    }).start();
  };

  return (
    <View className="flex-1 bg-[#edf4ef]">
      <LinearGradient
        colors={["#e7f4ea", "#f5faf6", "#ffffff"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="absolute inset-0"
      />
      <View className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-emerald-300/30" />
      <View className="absolute left-[-80px] top-[36%] h-64 w-64 rounded-full bg-cyan-100/35" />
      <View className="absolute -bottom-24 -left-14 h-72 w-72 rounded-full bg-emerald-100/45" />

      <KeyboardSafeArea>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 52 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View
            className="px-5 pb-8 pt-24"
            style={{ opacity: screenOpacity }}
          >
            <View className="flex-row items-center justify-between">
              <Pressable
                className="h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm"
                onPress={() => navigation.goBack()}
              >
                <Ionicons name="arrow-back" size={24} color="#0f172a" />
              </Pressable>
              <Text className="text-3xl font-extrabold text-slate-900">
                Chỉnh sửa hồ sơ
              </Text>
              <View className="h-10 w-10" />
            </View>

            <View className="mt-12 items-center">
              <View className="relative">
                <Image
                  source={{ uri: avatar || fallbackAvatar }}
                  className="h-52 w-52 rounded-full border-4 border-emerald-200"
                  style={{
                    shadowColor: "#16A34A",
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: 0.25,
                    shadowRadius: 12,
                    elevation: 6,
                  } as any}
                />

                <Pressable
                  className={`absolute bottom-3 right-3 h-12 w-12 items-center justify-center rounded-full bg-white shadow-md ${uploadingAvatar ? "opacity-60" : ""}`}
                  onPress={pickAvatar}
                  disabled={uploadingAvatar}
                >
                  {uploadingAvatar ? (
                    <ActivityIndicator size="small" color="#16A34A" />
                  ) : (
                    <Ionicons name="camera-outline" size={20} color="#16A34A" />
                  )}
                </Pressable>
              </View>

              <Text className="mt-4 text-base font-medium text-slate-400">
                Nhấn biểu tượng camera để cập nhật ảnh đại diện
              </Text>
            </View>

            <Animated.View
              className="mx-6 mt-10 overflow-hidden rounded-[34px] border border-white/70 bg-white/30 shadow-xl"
              style={{ transform: [{ scale: cardScale }] }}
            >
              <BlurView
                intensity={26}
                tint="light"
                className="absolute inset-0"
              />
              <View className="p-6">
                <Text className="text-[32px] font-black tracking-tight text-slate-900">
                  Thông tin cá nhân
                </Text>
                <Text className="mt-1 text-sm leading-6 text-slate-500">
                  Luôn cập nhật thông tin để được hỗ trợ tốt hơn.
                </Text>

                <View className="mt-6 gap-5">
                  <ProfileField
                    label="Họ và tên"
                    placeholder="Tên của bạn"
                    value={name}
                    onChangeText={setName}
                    icon="person-outline"
                  />

                  <ProfileField
                    label="Số điện thoại"
                    placeholder="Số điện thoại"
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                    icon="call-outline"
                  />

                  <Animated.View
                    className="mt-2"
                    style={{ transform: [{ scale: buttonScale }] }}
                  >
                    <Pressable
                      className={`h-[64px] items-center justify-center rounded-full bg-[#16A34A] ${saving || uploadingAvatar ? "opacity-70" : ""}`}
                      style={{
                        shadowColor: "#16A34A",
                        shadowOffset: { width: 0, height: 6 },
                        shadowOpacity: 0.35,
                        shadowRadius: 8,
                        elevation: 6,
                      }}
                      onPress={handleSave}
                      disabled={saving || uploadingAvatar}
                      onPressIn={() => animateButton(0.97)}
                      onPressOut={() => animateButton(1)}
                    >
                      {saving ? (
                        <ActivityIndicator color="#ffffff" />
                      ) : (
                        <Text className="text-xl font-bold text-white">
                          Lưu thay đổi
                        </Text>
                      )}
                    </Pressable>
                  </Animated.View>
                </View>
              </View>
            </Animated.View>
          </Animated.View>
        </ScrollView>
      </KeyboardSafeArea>

      {loading ? (
        <View className="absolute inset-0 items-center justify-center bg-white/60">
          <ActivityIndicator size="large" color="#10b981" />
        </View>
      ) : null}
    </View>
  );
};

export default EditProfileScreen;

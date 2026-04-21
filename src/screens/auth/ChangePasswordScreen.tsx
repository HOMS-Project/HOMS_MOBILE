import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  View,
  Text,
  TextInput,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import AuthHeader from "../../components/AuthHeader";
import { apiRequest, endpoints } from "../../api";
import type { RootStackParamList } from "../../../App";

interface Props {
  onSubmit?: (payload: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) => void;
}

type FormFieldProps = {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  icon: keyof typeof Ionicons.glyphMap;
  secureTextEntry?: boolean;
};

const FormField: React.FC<FormFieldProps> = ({
  label,
  placeholder,
  value,
  onChangeText,
  icon,
  secureTextEntry = false,
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
          secureTextEntry={secureTextEntry}
        />
      </View>
    </View>
  );
};

const ChangePasswordScreen: React.FC<Props> = ({ onSubmit }) => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

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

  const animateButton = (toValue: number) => {
    Animated.spring(buttonScale, {
      toValue,
      useNativeDriver: true,
      speed: 20,
      bounciness: 4,
    }).start();
  };

  const handleSubmit = async () => {
    if (onSubmit) {
      onSubmit({ currentPassword, newPassword, confirmPassword });
      return;
    }

    if (!currentPassword || !newPassword) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập đầy đủ mật khẩu");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Không khớp", "Mật khẩu xác nhận không trùng");
      return;
    }

    setLoading(true);
    try {
      const res = await apiRequest(endpoints.user.changePassword, {
        method: "PUT",
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (res?.success !== false) {
        Alert.alert("Thành công", "Đổi mật khẩu thành công", [
          {
            text: "OK",
            onPress: () => navigation.goBack(),
          },
        ]);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        Alert.alert("Lỗi", res?.message || "Không đổi được mật khẩu");
      }
    } catch (err: any) {
      Alert.alert("Lỗi", err?.message || "Không thể kết nối máy chủ");
    } finally {
      setLoading(false);
    }
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

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View
            className="px-5 pb-8 pt-10"
            style={{ opacity: screenOpacity }}
          >
            <View className="items-center">
              <AuthHeader size={370} />
            </View>

            <Animated.View
              className="overflow-hidden rounded-[34px] border border-white/70 bg-white/30 shadow-xl"
              style={{ transform: [{ scale: cardScale }] }}
            >
              <BlurView
                intensity={26}
                tint="light"
                className="absolute inset-0"
              />
              <View className="p-6">
                <Text className="text-[36px] font-black tracking-tight text-slate-900">
                  Đổi mật khẩu
                </Text>

                <Text className="mt-2 text-base leading-6 text-slate-500">
                  Tạo mật khẩu mới và đảm bảo khác với mật khẩu cũ.
                </Text>

                <View className="mt-7 gap-5">
                  <FormField
                    label="Nhập mật khẩu hiện tại"
                    placeholder="@#%"
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    secureTextEntry
                    icon="lock-closed-outline"
                  />

                  <FormField
                    label="Nhập mật khẩu mới"
                    placeholder="@#%"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry
                    icon="key-outline"
                  />

                  <FormField
                    label="Xác nhận mật khẩu mới"
                    placeholder="@#%"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                    icon="shield-checkmark-outline"
                  />

                  <Animated.View
                    className="mt-2"
                    style={{ transform: [{ scale: buttonScale }] }}
                  >
                    <Pressable
                      className={`h-[75px] items-center justify-center rounded-full bg-[#16A34A] ${loading ? "opacity-70" : ""}`}
                      style={{
                        shadowColor: "#16A34A",
                        shadowOffset: { width: 0, height: 6 },
                        shadowOpacity: 0.35,
                        shadowRadius: 8,
                        elevation: 6,
                      }}
                      onPress={handleSubmit}
                      disabled={loading}
                      onPressIn={() => animateButton(0.97)}
                      onPressOut={() => animateButton(1)}
                    >
                      {loading ? (
                        <ActivityIndicator color="#ffffff" />
                      ) : (
                        <Text className="text-xl font-bold text-white">
                          Cập nhật
                        </Text>
                      )}
                    </Pressable>
                  </Animated.View>
                </View>

                <Pressable
                  className="mt-5 self-center"
                  onPress={() => navigation.goBack()}
                >
                  <Text className="text-sm font-semibold text-emerald-600">
                    Quay lại cài đặt
                  </Text>
                </Pressable>
              </View>
            </Animated.View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default ChangePasswordScreen;

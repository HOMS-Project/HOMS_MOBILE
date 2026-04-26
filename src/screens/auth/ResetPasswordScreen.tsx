import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  View,
  Text,
  TextInput,
  Alert,
  Pressable,
} from "react-native";
import KeyboardSafeArea from "../../components/KeyboardSafeArea";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import AuthHeader from "../../components/AuthHeader";
import type { RootStackParamList } from "../../../App";
import { apiRequest, endpoints } from "../../api";

interface Props {
  onSubmit?: (payload: {
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
  const [hidden, setHidden] = React.useState(true);
  return (
    <View className="gap-1.5">
      <Text className="text-[13px] font-bold text-slate-700">{label}</Text>
      <View className="h-[48px] flex-row items-center rounded-xl border border-emerald-100 bg-white/95 px-4">
        <Ionicons name={icon} size={18} color="#4b5563" />
        <TextInput
          className="ml-3 flex-1 text-[15px] text-slate-900"
          placeholder={placeholder}
          placeholderTextColor="#94a3b8"
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry && hidden}
        />
        {secureTextEntry && (
          <Pressable onPress={() => setHidden((h) => !h)} hitSlop={12}>
            <Ionicons
              name={hidden ? "eye-off-outline" : "eye-outline"}
              size={18}
              color="#94a3b8"
            />
          </Pressable>
        )}
      </View>
    </View>
  );
};


const ResetPasswordScreen: React.FC<Props> = ({ onSubmit }) => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, "ResetPassword">>();
  const email = (route.params as any)?.email || "";
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

      <KeyboardSafeArea
        scrollable
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingBottom: 24 }}
      >
          <Animated.View
            className="px-5 pb-4 pt-6"
            style={{ opacity: screenOpacity }}
          >
            <View className="items-center">
              <AuthHeader size={200} />
            </View>

            <Animated.View
              className="overflow-hidden rounded-[28px] border border-white/70 bg-white/30 shadow-xl"
              style={{ transform: [{ scale: cardScale }] }}
            >
              <BlurView
                intensity={26}
                tint="light"
                className="absolute inset-0"
              />
              <View className="p-5">
                <Text className="text-[24px] font-black tracking-tight text-slate-900">
                  Mật khẩu mới
                </Text>

                <Text className="mt-1 text-[13px] leading-5 text-slate-500">
                  Tạo mật khẩu mới để bảo vệ tài khoản của bạn.
                </Text>

                <View className="mt-5 gap-4">
                  <FormField
                    label="Nhập mật khẩu mới"
                    placeholder="@#%"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry
                    icon="lock-closed-outline"
                  />

                  <FormField
                    label="Xác nhận mật khẩu"
                    placeholder="@#%"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                    icon="shield-checkmark-outline"
                  />

                  <Animated.View
                    className="mt-1"
                    style={{ transform: [{ scale: buttonScale }] }}
                  >
                    <Pressable
                      className={`h-[52px] items-center justify-center rounded-full bg-[#16A34A] ${loading ? "opacity-70" : ""}`}
                      style={{
                        shadowColor: "#16A34A",
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 6,
                        elevation: 5,
                      }}
                      disabled={loading}
                      onPressIn={() => animateButton(0.97)}
                      onPressOut={() => animateButton(1)}
                      onPress={async () => {
                        if (onSubmit) {
                          onSubmit({ newPassword, confirmPassword });
                          return;
                        }

                        if (!email) {
                          Alert.alert(
                            "Thiếu email",
                            "Vui lòng quay lại và nhập email",
                          );
                          navigation.goBack();
                          return;
                        }
                        if (!newPassword || newPassword !== confirmPassword) {
                          Alert.alert("Lỗi", "Mật khẩu xác nhận không khớp");
                          return;
                        }

                        setLoading(true);
                        try {
                          const res = await apiRequest(
                            endpoints.auth.resetPassword,
                            {
                              method: "POST",
                              body: JSON.stringify({ email, newPassword }),
                            },
                          );

                          if (res?.success !== false) {
                            Alert.alert(
                              "Thành công",
                              "Đặt lại mật khẩu thành công",
                              [
                                {
                                  text: "OK",
                                  onPress: () => navigation.navigate("Login"),
                                },
                              ],
                            );
                          } else {
                            Alert.alert(
                              "Lỗi",
                              res?.message || "Không đặt lại được mật khẩu",
                            );
                          }
                        } catch (err: any) {
                          Alert.alert(
                            "Lỗi",
                            err?.message || "Không thể kết nối máy chủ",
                          );
                        } finally {
                          setLoading(false);
                        }
                      }}
                    >
                      {loading ? (
                        <ActivityIndicator color="#ffffff" />
                      ) : (
                        <Text className="text-base font-bold text-white">
                          Xác nhận
                        </Text>
                      )}
                    </Pressable>
                  </Animated.View>
                </View>

                <Pressable
                  className="mt-4 self-center"
                  onPress={() => navigation.goBack()}
                >
                  <Text className="text-[13px] font-semibold text-emerald-600">
                    Quay lại
                  </Text>
                </Pressable>
              </View>
            </Animated.View>
          </Animated.View>
      </KeyboardSafeArea>
    </View>
  );
};

export default ResetPasswordScreen;

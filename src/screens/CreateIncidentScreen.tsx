import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import KeyboardSafeArea from "../components/KeyboardSafeArea";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../App";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { showToast } from "../utils/toast";
import {
  createIncidentReport,
  fetchAssignedInvoices,
  fetchIncidentTypes,
  type IncidentMediaInput,
  type IncidentTypeOption,
  type TeamOrderSummary,
} from "../services/staffFeatureService";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type PickerKind = "invoice" | "type" | null;

type FormErrors = {
  invoiceId?: string;
  type?: string;
  description?: string;
  media?: string;
};

const isVideoUrl = (uri: string, mimeType?: string) => {
  if (mimeType?.startsWith("video/")) return true;
  return /\.(mp4|mov|m4v|webm)(\?|$)/i.test(uri);
};

const CreateIncidentScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pickerKind, setPickerKind] = useState<PickerKind>(null);

  const [invoiceOptions, setInvoiceOptions] = useState<TeamOrderSummary[]>([]);
  const [typeOptions, setTypeOptions] = useState<IncidentTypeOption[]>([]);

  const [invoiceId, setInvoiceId] = useState("");
  const [type, setType] = useState("");
  const [description, setDescription] = useState("");
  const [media, setMedia] = useState<IncidentMediaInput[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});

  const loadData = async () => {
    try {
      const [invoices, types] = await Promise.all([
        fetchAssignedInvoices(),
        fetchIncidentTypes(),
      ]);
      setInvoiceOptions(invoices);
      setTypeOptions(types);
    } catch (error: any) {
      console.error("Load create incident data failed:", error);
      showToast(error?.message || "Không thể tải dữ liệu biểu mẫu");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const selectedInvoiceLabel = useMemo(() => {
    const selected = invoiceOptions.find(
      (item) => item.invoiceId === invoiceId,
    );
    if (!selected) return "Chọn đơn hàng";
    const serviceLabel =
      selected.moveType === "FULL_HOUSE" ? "Chuyển nhà" :
      selected.moveType === "SPECIFIC_ITEMS" ? "Chuyển đồ" :
      selected.moveType === "TRUCK_RENTAL" ? "Thuê xe tải" : "";
    return `${selected.invoiceCode || selected.orderCode}${serviceLabel ? ` · ${serviceLabel}` : ""} · ${selected.status}`;
  }, [invoiceId, invoiceOptions]);

  const selectedTypeLabel = useMemo(() => {
    const selected = typeOptions.find((item) => item.value === type);
    return selected ? selected.label : "Chọn loại sự cố";
  }, [type, typeOptions]);

  const validate = () => {
    const nextErrors: FormErrors = {};

    if (!invoiceId) nextErrors.invoiceId = "Vui lòng chọn đơn hàng";
    if (!type) nextErrors.type = "Vui lòng chọn loại sự cố";
    if (!description.trim()) nextErrors.description = "Vui lòng nhập mô tả";
    else if (description.trim().length < 10) {
      nextErrors.description = "Mô tả cần ít nhất 10 ký tự";
    }

    if (media.length === 0) {
      nextErrors.media = "Vui lòng tải lên ít nhất 1 media";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const pickMedia = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permission.status !== "granted") {
        showToast("Cần quyền truy cập thư viện để tải media");
        return;
      }

      const mediaAll = (ImagePicker as any).MediaType?.All;
      const pickerOptions: any = {
        quality: 0.8,
        allowsMultipleSelection: true,
        selectionLimit: 5,
      };

      if (mediaAll) {
        pickerOptions.mediaTypes = [mediaAll];
      } else {
        pickerOptions.mediaTypes = ImagePicker.MediaTypeOptions.All;
      }

      const result = await ImagePicker.launchImageLibraryAsync(pickerOptions);
      if (result.canceled || !result.assets?.length) return;

      const selected = result.assets.map((asset) => ({
        uri: asset.uri,
        mimeType:
          asset.mimeType ||
          (asset.type === "video" ? "video/mp4" : "image/jpeg"),
        fileName: asset.fileName || undefined,
      }));

      setMedia((prev) => [...prev, ...selected].slice(0, 5));
      setErrors((prev) => ({ ...prev, media: undefined }));
    } catch (error) {
      console.error("Pick incident media failed:", error);
      showToast("Không thể chọn media lúc này");
    }
  };

  const removeMedia = (uri: string) => {
    setMedia((prev) => prev.filter((item) => item.uri !== uri));
  };

  const submit = async () => {
    if (!validate()) return;

    setSubmitting(true);
    try {
      const result = await createIncidentReport({
        invoiceId,
        type,
        description: description.trim(),
        media,
      });

      if ((result as any)?.success === false) {
        throw new Error((result as any)?.message || "Không thể tạo báo cáo");
      }

      showToast("Đã gửi báo cáo sự cố thành công");
      navigation.goBack();
    } catch (error: any) {
      console.error("Create incident failed:", error);
      showToast(error?.message || "Không thể gửi báo cáo sự cố");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-[#edf4ef]">
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  const pickerItems =
    pickerKind === "invoice"
      ? invoiceOptions.map((item) => {
          const serviceLabel =
            item.moveType === "FULL_HOUSE" ? "Chuyển nhà" :
            item.moveType === "SPECIFIC_ITEMS" ? "Chuyển đồ" :
            item.moveType === "TRUCK_RENTAL" ? "Thuê xe tải" : "";
          return {
            value: item.invoiceId,
            label: `${item.invoiceCode || item.orderCode}${serviceLabel ? ` · ${serviceLabel}` : ""}`,
            subLabel: `${item.pickupAddress} → ${item.deliveryAddress}`,
          };
        })
      : typeOptions.map((item) => ({
          value: item.value,
          label: item.label,
          subLabel: undefined,
        }));

  return (
    <View className="flex-1 bg-[#edf4ef]">
      <View className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-emerald-300/35" />
      <View className="absolute -left-16 bottom-14 h-56 w-56 rounded-full bg-sky-200/40" />

      {/* Fixed header */}
      <View className="flex-row items-center gap-3 px-4 pb-3 pt-12">
        <Pressable
          className="h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm"
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={20} color="#0f172a" />
        </Pressable>
        <Text className="flex-1 text-xl font-extrabold text-slate-900">
          Tạo báo cáo sự cố
        </Text>
      </View>

      <KeyboardSafeArea>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            padding: 16,
            paddingTop: 10,
            paddingBottom: 40,
          }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
        <Card className="mt-0 rounded-2xl p-4">
          <View className="gap-5">
            <View>
              <Text className="mb-1.5 text-sm font-bold text-slate-700">
                Đơn hàng
              </Text>
              <Pressable
                className="rounded-xl border border-emerald-100 bg-emerald-50/50 px-4 py-3"
                onPress={() => setPickerKind("invoice")}
              >
                <Text
                  className={`text-sm ${invoiceId ? "text-slate-900" : "text-slate-400"}`}
                >
                  {selectedInvoiceLabel}
                </Text>
              </Pressable>
              {errors.invoiceId ? (
                <Text className="mt-1 text-sm font-medium text-rose-500">
                  {errors.invoiceId}
                </Text>
              ) : null}
            </View>

            <View>
              <Text className="mb-1.5 text-sm font-bold text-slate-700">
                Loại sự cố
              </Text>
              <Pressable
                className="rounded-xl border border-emerald-100 bg-emerald-50/50 px-4 py-3"
                onPress={() => setPickerKind("type")}
              >
                <Text
                  className={`text-sm ${type ? "text-slate-900" : "text-slate-400"}`}
                >
                  {selectedTypeLabel}
                </Text>
              </Pressable>
              {errors.type ? (
                <Text className="mt-1 text-sm font-medium text-rose-500">
                  {errors.type}
                </Text>
              ) : null}
            </View>

            <View>
              <Text className="mb-1.5 text-sm font-bold text-slate-700">
                Media (ảnh/video)
              </Text>
              <Pressable
                className="items-center justify-center rounded-xl border border-dashed border-emerald-300 bg-emerald-50 px-4 py-4"
                onPress={pickMedia}
              >
                <Ionicons
                  name="cloud-upload-outline"
                  size={22}
                  color="#059669"
                />
                <Text className="mt-1 text-sm font-semibold text-emerald-700">
                  Chọn media
                </Text>
                <Text className="text-xs text-emerald-600">Tối đa 5 file</Text>
              </Pressable>

              {media.length > 0 ? (
                <ScrollView
                  horizontal
                  className="mt-3"
                  showsHorizontalScrollIndicator={false}
                >
                  {media.map((item, idx) => {
                    const video = isVideoUrl(item.uri, item.mimeType);
                    return (
                      <View key={`${item.uri}-${idx}`} className="mr-3 w-28">
                        {video ? (
                          <View className="h-24 w-28 items-center justify-center rounded-xl border border-slate-100 bg-white">
                            <Ionicons
                              name="videocam"
                              size={22}
                              color="#334155"
                            />
                          </View>
                        ) : (
                          <View className="h-24 w-28 items-center justify-center rounded-xl border border-slate-100 bg-white">
                            <Image
                              source={{ uri: item.uri }}
                              className="h-full w-full rounded-lg"
                              resizeMode="contain"
                            />
                          </View>
                        )}
                        <Pressable
                          className="mt-1.5 items-center rounded-full bg-rose-100 py-1"
                          onPress={() => removeMedia(item.uri)}
                        >
                          <Text className="text-xs font-semibold text-rose-600">
                            Xóa
                          </Text>
                        </Pressable>
                      </View>
                    );
                  })}
                </ScrollView>
              ) : null}

              {errors.media ? (
                <Text className="mt-1 text-sm font-medium text-rose-500">
                  {errors.media}
                </Text>
              ) : null}
            </View>

            <Input
              label="Ghi chú"
              placeholder="Mô tả ngắn gọn sự cố xảy ra..."
              value={description}
              onChangeText={(value) => {
                setDescription(value);
                setErrors((prev) => ({ ...prev, description: undefined }));
              }}
              multiline
              textAlignVertical="top"
              className="min-h-[80px]"
              error={errors.description}
            />

            <Pressable
              className={`mt-6 h-[52px] items-center justify-center rounded-full bg-[#16A34A] ${submitting ? "opacity-70" : ""}`}
              style={{
                shadowColor: "#16A34A",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 6,
                elevation: 4,
              }}
              onPress={submit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="text-base font-bold text-white">
                  Gửi báo cáo
                </Text>
              )}
            </Pressable>
          </View>
        </Card>
        </ScrollView>
      </KeyboardSafeArea>

      <Modal
        transparent
        animationType="fade"
        visible={pickerKind !== null}
        onRequestClose={() => setPickerKind(null)}
      >
        <View className="flex-1 justify-end bg-black/30">
          <View className="max-h-[70%] rounded-t-3xl bg-white p-5">
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="text-lg font-extrabold text-slate-900">
                {pickerKind === "invoice" ? "Chọn đơn hàng" : "Chọn loại sự cố"}
              </Text>
              <Pressable onPress={() => setPickerKind(null)}>
                <Ionicons name="close" size={24} color="#0f172a" />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {pickerItems.map((item) => (
                <Pressable
                  key={item.value}
                  className="mb-2 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-3.5"
                  onPress={() => {
                    if (pickerKind === "invoice") {
                      setInvoiceId(item.value);
                      setErrors((prev) => ({ ...prev, invoiceId: undefined }));
                    } else {
                      setType(item.value);
                      setErrors((prev) => ({ ...prev, type: undefined }));
                    }
                    setPickerKind(null);
                  }}
                >
                  <Text className="text-base font-extrabold text-slate-900">
                    {item.label}
                  </Text>
                  {item.subLabel ? (
                    <Text className="mt-1 text-sm font-medium text-slate-600">
                      {item.subLabel}
                    </Text>
                  ) : null}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default CreateIncidentScreen;

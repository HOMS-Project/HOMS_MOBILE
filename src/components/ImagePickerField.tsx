import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { colors, spacing, radius } from "../theme";

export type PickedImage = {
  uri: string;
  name: string;
  type: string;
};

interface Props {
  label: string;
  images: PickedImage[];
  onChange: (next: PickedImage[]) => void;
  max?: number;
}

const ImagePickerField: React.FC<Props> = ({
  label,
  images,
  onChange,
  max = 6,
}) => {
  const [requestingPermission, setRequestingPermission] = useState(false);

  const requestPermission = async () => {
    try {
      setRequestingPermission(true);
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      return status === "granted";
    } finally {
      setRequestingPermission(false);
    }
  };

  const handlePick = async () => {
    const granted = await requestPermission();
    if (!granted) return;

    // Use new MediaType enum when available; if missing, let picker default media types
    const mediaImages = (ImagePicker as any).MediaType?.Images;

    const pickerOptions: any = {
      allowsMultipleSelection: true,
      quality: 0.7,
      selectionLimit: max,
    };

    if (mediaImages) {
      pickerOptions.mediaTypes = [mediaImages];
    }

    const result = await ImagePicker.launchImageLibraryAsync(pickerOptions);

    if (result.canceled) return;

    const next = [
      ...images,
      ...result.assets.map((asset, idx) => ({
        uri: asset.uri,
        name: asset.fileName || `photo-${Date.now()}-${idx}.jpg`,
        type: asset.mimeType || "image/jpeg",
      })),
    ].slice(0, max);

    onChange(next);
  };

  const handleRemove = (uri: string) => {
    onChange(images.filter((img) => img.uri !== uri));
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.headerRow}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.count}>
          {images.length}/{max}
        </Text>
      </View>

      <FlatList
        data={images}
        keyExtractor={(item) => item.uri}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.previewCard}>
            <Image source={{ uri: item.uri }} style={styles.image} />
            <TouchableOpacity
              style={styles.removeBtn}
              onPress={() => handleRemove(item.uri)}
            >
              <Text style={styles.removeText}>✕</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={() => (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>Chưa có ảnh</Text>
          </View>
        )}
      />

      <TouchableOpacity
        style={[styles.pickBtn, requestingPermission && styles.disabled]}
        onPress={handlePick}
        disabled={requestingPermission}
      >
        <Text style={styles.pickText}>Thêm ảnh</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.sm,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  label: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  count: {
    color: colors.muted,
    fontWeight: "600",
  },
  list: {
    gap: spacing.sm,
  },
  previewCard: {
    width: 90,
    height: 90,
    borderRadius: radius.md,
    overflow: "hidden",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  removeBtn: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  removeText: {
    color: colors.buttonText,
    fontWeight: "800",
  },
  placeholder: {
    height: 90,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  placeholderText: {
    color: colors.muted,
    fontWeight: "600",
  },
  pickBtn: {
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  pickText: {
    color: colors.primary,
    fontWeight: "700",
    fontSize: 15,
  },
  disabled: {
    opacity: 0.6,
  },
});

export default ImagePickerField;

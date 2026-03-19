import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import LabeledTextInput from "../components/LabeledTextInput";
import PrimaryButton from "../components/PrimaryButton";
import { colors, spacing, radius } from "../theme";
import type { RootStackParamList } from "../../App";

type Nav = NativeStackNavigationProp<RootStackParamList>;

const avatarUri =
  "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80";

const EditProfileScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const [name, setName] = useState("Hieu tran");
  const [email, setEmail] = useState("hieutrumbgsg@gmail.com");
  const [phone, setPhone] = useState("0935225032");
  const [dob, setDob] = useState("18/04/2004");

  const handleSave = () => {
    navigation.goBack();
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
          <Text style={styles.headerTitle}>Edit Profile</Text>
        </View>

        <View style={styles.avatarWrap}>
          <Image source={{ uri: avatarUri }} style={styles.avatar} />
          <TouchableOpacity style={styles.cameraBadge}>
            <Text style={styles.cameraIcon}>📷</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          <LabeledTextInput
            label="Name"
            placeholder="Your name"
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
            label="Phone Number"
            placeholder="Phone number"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />

          <LabeledTextInput
            label="Date of Birth"
            placeholder="dd/mm/yyyy"
            value={dob}
            onChangeText={setDob}
          />

          <View style={{ marginTop: spacing.md, alignItems: "center" }}>
            <PrimaryButton
              title="Save changes"
              onPress={handleSave}
              fullWidth={false}
              style={{ width: 280 }}
            />
          </View>
        </View>
      </ScrollView>
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
});

export default EditProfileScreen;

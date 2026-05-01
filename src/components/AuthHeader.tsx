import React from "react";
import { View, StyleSheet, Image } from "react-native";
import { spacing } from "../theme";

const logo = require("../../assets/homslogotr.jpg");

interface Props {
  size?: number;
}

const AuthHeader: React.FC<Props> = ({ size = 140 }) => {
  return (
    <View style={styles.container}>
      <Image
        source={logo}
        style={[styles.logo, { width: size, height: size }]}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingVertical: spacing.sm,
    backgroundColor: "transparent",
  },
  logo: {
    width: 130,
    height: 130,
  },
});

export default AuthHeader;

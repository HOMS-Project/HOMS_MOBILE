import React from "react";
import { View, type ViewProps } from "react-native";

type CardProps = ViewProps & {
  className?: string;
};

const Card: React.FC<CardProps> = ({ className = "", ...props }) => {
  return (
    <View
      className={`rounded-3xl border border-slate-100 bg-white p-4 shadow-md ${className}`}
      {...props}
    />
  );
};

export default Card;

import React from "react";
import { Text } from "ink";

interface Props {
  label: string;
  isActive: boolean;
}

export function TabItem({ label, isActive }: Props) {
  return (
    <Text
      bold={isActive}
      underline={isActive}
      color={!isActive ? "#6c7086" : undefined}
    >
      {` ${label} `}
    </Text>
  );
}

import React from "react";
import { Text } from "ink";
import { getTheme } from "./theme.ts";

interface Props {
  label: string;
  isActive: boolean;
}

export function TabItem({ label, isActive }: Props) {
  return (
    <Text
      bold={isActive}
      underline={isActive}
      color={!isActive ? getTheme().ui.muted : undefined}
    >
      {` ${label} `}
    </Text>
  );
}

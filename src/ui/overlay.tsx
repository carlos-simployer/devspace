import React from "react";
import { Box, Text } from "ink";
import { getTheme } from "./theme.ts";

interface Props {
  title: string;
  titleColor?: string;
  width: number;
  height?: number;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function Overlay({
  title,
  titleColor = getTheme().ui.border,
  width,
  height,
  children,
  footer,
}: Props) {
  return (
    <Box
      flexDirection="column"
      width={width}
      height={height}
      borderStyle="round"
      borderColor={titleColor}
      paddingX={1}
    >
      <Box>
        <Text bold color={titleColor}>
          {title}
        </Text>
      </Box>
      {children}
      {footer && <Box marginTop={0}>{footer}</Box>}
    </Box>
  );
}

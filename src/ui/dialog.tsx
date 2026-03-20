import React from "react";
import { Box, Text } from "ink";
import { Panel } from "./panel.tsx";

export interface DialogProps {
  title: string;
  width: number;
  height?: number;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

export function Dialog({
  title,
  width,
  height,
  footer,
  children,
}: DialogProps) {
  // Render a solid background of spaces behind the panel
  // so text from the view underneath doesn't bleed through
  const bgHeight = height ?? 10;
  const bgLine = " ".repeat(width);

  return (
    <Box width={width} height={bgHeight} flexDirection="column">
      {/* Layer 0: solid background fill */}
      <Box
        position="absolute"
        width={width}
        height={bgHeight}
        flexDirection="column"
      >
        {Array.from({ length: bgHeight }, (_, i) => (
          <Text key={i}>{bgLine}</Text>
        ))}
      </Box>

      {/* Layer 1: the actual panel on top */}
      <Panel title={title} focused={true} width={width} height={height}>
        {children}
        {footer && (
          <Box marginTop={1}>
            <Text>{footer}</Text>
          </Box>
        )}
      </Panel>
    </Box>
  );
}

export interface DialogLayerProps {
  children: React.ReactNode;
  dialog: React.ReactNode | null;
  height: number;
  width: number;
  dimContent?: boolean;
}

export function DialogLayer({
  children,
  dialog,
  height,
  width,
}: DialogLayerProps) {
  return (
    <Box width={width} height={height}>
      <Box width={width} height={height}>
        {children}
      </Box>
      {dialog && (
        <Box
          position="absolute"
          width={width}
          height={height}
          alignItems="center"
          justifyContent="center"
        >
          {dialog}
        </Box>
      )}
    </Box>
  );
}

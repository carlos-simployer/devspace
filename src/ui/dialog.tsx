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
  return (
    <Panel title={title} focused={true} width={width} height={height}>
      {children}
      {footer && (
        <Box marginTop={1}>
          <Text>{footer}</Text>
        </Box>
      )}
    </Panel>
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

import React from "react";
import { Box } from "ink";

interface Props {
  width: number;
  children: React.ReactNode;
}

export function StatusBarLayout({ width, children }: Props) {
  return (
    <Box
      flexDirection="column"
      borderStyle="single"
      borderTop
      borderBottom={false}
      borderLeft={false}
      borderRight={false}
      width={width}
    >
      {children}
    </Box>
  );
}

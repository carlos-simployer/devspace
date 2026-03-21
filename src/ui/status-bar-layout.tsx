import React from "react";
import { Panel } from "./panel.tsx";

interface Props {
  width: number;
  children: React.ReactNode;
}

export function StatusBarLayout({ width, children }: Props) {
  return (
    <Panel width={width} paddingX={0}>
      {children}
    </Panel>
  );
}

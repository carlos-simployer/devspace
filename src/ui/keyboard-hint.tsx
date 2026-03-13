import { Text } from "ink";

interface Props {
  children: string;
}

export function KeyboardHint({ children }: Props) {
  return <Text dimColor>{children}</Text>;
}

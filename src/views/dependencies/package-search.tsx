import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import { TextInput } from "@inkjs/ui";
import { useAppContext } from "../../app-context.ts";
import { useRouter } from "../../ui/router.ts";
import { getTheme } from "../../ui/theme.ts";
import { useDepsContext } from "./deps-context.ts";

export function PackageSearch() {
  const { addPackage, width } = useAppContext();
  const { trackedPackages } = useDepsContext();
  const { navigate } = useRouter();
  const [query, setQuery] = useState("");

  const boxWidth = Math.min(50, width - 4);
  const alreadyTracked = trackedPackages.includes(query.trim());

  useInput((_input, key) => {
    if (key.escape) {
      navigate("dependencies");
      return;
    }
    if (key.return && query.trim()) {
      if (!alreadyTracked) {
        addPackage(query.trim());
      }
      navigate("dependencies");
    }
  });

  return (
    <Box
      flexDirection="column"
      width={boxWidth}
      height={7}
      borderStyle="round"
      borderColor={getTheme().ui.border}
      paddingX={1}
    >
      <Box>
        <Text bold color={getTheme().ui.heading}>
          Add Package to Track
        </Text>
      </Box>
      <Box>
        <Text>Name: </Text>
        <TextInput
          placeholder="e.g. react, @scope/pkg..."
          onChange={(val) => setQuery(val)}
        />
      </Box>
      {alreadyTracked ? (
        <Text color={getTheme().input.warning}>Already tracked</Text>
      ) : query.trim() ? (
        <Text dimColor>Enter: add | Esc: cancel</Text>
      ) : (
        <Text dimColor>Type a package name, then press Enter</Text>
      )}
    </Box>
  );
}

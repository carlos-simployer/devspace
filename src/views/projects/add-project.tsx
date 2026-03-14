import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import { TextInput } from "@inkjs/ui";
import type { LocalProject } from "../../api/types.ts";
import { getTheme } from "../../ui/index.ts";

interface Props {
  existingNames: string[];
  onSubmit: (project: LocalProject) => void;
  onCancel: () => void;
  width: number;
  height: number;
}

type Step = "name" | "path" | "command" | "url" | "dependencies";

const STEPS: Step[] = ["name", "path", "command", "url", "dependencies"];

export function AddProjectOverlay({
  existingNames,
  onSubmit,
  onCancel,
  width,
  height,
}: Props) {
  const [step, setStep] = useState<Step>("name");
  const [name, setName] = useState("");
  const [path, setPath] = useState("");
  const [command, setCommand] = useState("");
  const [url, setUrl] = useState("");
  const [deps, setDeps] = useState<string[]>([]);
  const [depSelIdx, setDepSelIdx] = useState(0);

  const theme = getTheme();

  useInput((input, key) => {
    if (key.escape) {
      onCancel();
      return;
    }

    if (step === "dependencies") {
      if (key.upArrow) {
        setDepSelIdx((i) => Math.max(0, i - 1));
      } else if (key.downArrow) {
        setDepSelIdx((i) => Math.min(existingNames.length - 1, i + 1));
      } else if (input === " " && existingNames.length > 0) {
        const depName = existingNames[depSelIdx];
        if (depName) {
          setDeps((prev) =>
            prev.includes(depName)
              ? prev.filter((d) => d !== depName)
              : [...prev, depName],
          );
        }
      } else if (key.return) {
        onSubmit({
          name,
          path,
          command,
          url: url || undefined,
          dependencies: deps,
        });
      }
    }
  });

  const advance = () => {
    const idx = STEPS.indexOf(step);
    if (idx < STEPS.length - 1) {
      setStep(STEPS[idx + 1]!);
    }
  };

  const overlayWidth = Math.min(60, width - 4);

  return (
    <Box
      position="absolute"
      marginLeft={Math.floor((width - overlayWidth) / 2)}
      marginTop={Math.floor((height - 16) / 2)}
    >
      <Box
        flexDirection="column"
        width={overlayWidth}
        borderStyle="round"
        borderColor={theme.ui.activeIndicator}
        paddingX={1}
      >
        <Text bold color={theme.ui.activeIndicator}>
          Add Project
        </Text>

        {/* Name */}
        <Box marginTop={1}>
          <Text bold={step === "name"}>Name: </Text>
          {step === "name" ? (
            <TextInput
              placeholder="my-api"
              onSubmit={(val) => {
                if (val.trim()) {
                  setName(val.trim());
                  advance();
                }
              }}
            />
          ) : (
            <Text color={theme.ui.activeIndicator}>{name}</Text>
          )}
        </Box>

        {/* Path */}
        {STEPS.indexOf(step) >= 1 && (
          <Box>
            <Text bold={step === "path"}>Path: </Text>
            {step === "path" ? (
              <TextInput
                placeholder="/Users/you/projects/my-api"
                onSubmit={(val) => {
                  if (val.trim()) {
                    setPath(val.trim());
                    advance();
                  }
                }}
              />
            ) : (
              <Text color={theme.ui.activeIndicator}>{path}</Text>
            )}
          </Box>
        )}

        {/* Command */}
        {STEPS.indexOf(step) >= 2 && (
          <Box>
            <Text bold={step === "command"}>Command: </Text>
            {step === "command" ? (
              <TextInput
                placeholder="npm run dev"
                onSubmit={(val) => {
                  if (val.trim()) {
                    setCommand(val.trim());
                    advance();
                  }
                }}
              />
            ) : (
              <Text color={theme.ui.activeIndicator}>{command}</Text>
            )}
          </Box>
        )}

        {/* URL */}
        {STEPS.indexOf(step) >= 3 && (
          <Box>
            <Text bold={step === "url"}>URL: </Text>
            {step === "url" ? (
              <TextInput
                placeholder="http://localhost:3000 (optional, Enter to skip)"
                onSubmit={(val) => {
                  setUrl(val.trim());
                  advance();
                }}
              />
            ) : (
              <Text color={theme.ui.activeIndicator}>{url || "(none)"}</Text>
            )}
          </Box>
        )}

        {/* Dependencies */}
        {step === "dependencies" && (
          <Box flexDirection="column" marginTop={1}>
            <Text bold>Dependencies (Space to toggle, Enter to finish):</Text>
            {existingNames.length === 0 ? (
              <Text dimColor>No other projects to depend on.</Text>
            ) : (
              existingNames.map((n, i) => (
                <Box key={n}>
                  <Text inverse={i === depSelIdx} bold={i === depSelIdx}>
                    {i === depSelIdx ? "> " : "  "}
                    {deps.includes(n) ? "[x] " : "[ ] "}
                    {n}
                  </Text>
                </Box>
              ))
            )}
          </Box>
        )}

        <Box marginTop={1}>
          <Text dimColor>
            {step === "dependencies"
              ? "Space: toggle | Enter: finish | Esc: cancel"
              : "Enter: next | Esc: cancel"}
          </Text>
        </Box>
      </Box>
    </Box>
  );
}

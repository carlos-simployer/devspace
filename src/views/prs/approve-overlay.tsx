import React, { useState } from "react";
import { ConfirmDialog } from "../../ui/confirm-dialog.tsx";
import { useRouter } from "../../ui/router.ts";
import { useAppContext } from "../../app-context.ts";
import { usePrsContext } from "./prs-context.ts";
import { ADD_PR_REVIEW } from "../../api/mutations.ts";
import { getTheme } from "../../ui/theme.ts";

export function ApproveOverlay() {
  const { navigate } = useRouter();
  const { width } = useAppContext();
  const { selectedPR, client, refetch, showStatus } = usePrsContext();

  const [applying, setApplying] = useState(false);

  const theme = getTheme();
  const boxWidth = Math.min(50, width - 4);

  if (!selectedPR) {
    return (
      <ConfirmDialog
        title="Approve PR"
        message="No PR selected"
        options={[{ label: "Close", value: "close" }]}
        onSelect={() => navigate("prs")}
        onCancel={() => navigate("prs")}
        width={boxWidth}
      />
    );
  }

  return (
    <ConfirmDialog
      title="Approve PR"
      message={`#${selectedPR.number} ${selectedPR.title.slice(0, boxWidth - 12)}`}
      detail={selectedPR.repository.name}
      options={[
        {
          label: applying ? "Approving..." : "Approve",
          value: "approve",
          color: theme.status.success,
        },
        { label: "Cancel", value: "cancel" },
      ]}
      onSelect={(value) => {
        if (applying) return;
        if (value === "cancel") {
          navigate("prs");
          return;
        }
        setApplying(true);
        (async () => {
          try {
            await client(ADD_PR_REVIEW, {
              pullRequestId: selectedPR.id,
              event: "APPROVE",
            });
            showStatus(`Approved PR #${selectedPR.number}`);
            refetch();
            navigate("prs");
          } catch (err: any) {
            showStatus(`Error: ${err.message}`);
            navigate("prs");
          }
        })();
      }}
      onCancel={() => navigate("prs")}
      width={boxWidth}
    />
  );
}

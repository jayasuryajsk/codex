import React from "react";
import { invoke } from "@tauri-apps/api/tauri";
import { parseDiff, Diff, Hunk } from "react-diff-view";
import "react-diff-view/style/index.css";

export function PatchViewer({ patch }) {
  const files = parseDiff(patch || "");

  return (
    <div>
      {files.map(({ oldPath, newPath, type, hunks }) => (
        <Diff
          key={`${oldPath}-${newPath}`}
          viewType="unified"
          diffType={type}
          hunks={hunks}
        >
          {(hunks) =>
            hunks.map((hunk) => <Hunk key={hunk.content} hunk={hunk} />)
          }
        </Diff>
      ))}
      <div>
        <button onClick={() => invoke("apply_patch_command", { patch })}>
          Apply
        </button>
        <button onClick={() => invoke("apply_patch_command", { patch })}>
          Reject
        </button>
      </div>
    </div>
  );
}

import React, { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import { parseDiff, Diff, Hunk } from "react-diff-view";
import "react-diff-view/style/index.css";

export function PatchViewer({ patch, onApply, onReject }) {
  const files = parseDiff(patch || "");
  const [checked, setChecked] = useState([]);

  useEffect(() => {
    setChecked(files.map((f) => f.hunks.map(() => true)));
  }, [patch]);

  const toggle = (fileIdx, hunkIdx) => {
    setChecked((prev) => {
      const next = prev.map((arr) => arr.slice());
      next[fileIdx][hunkIdx] = !next[fileIdx][hunkIdx];
      return next;
    });
  };

  const buildPatch = () => {
    const parts = [];
    files.forEach((file, fIdx) => {
      const selected = file.hunks.filter((_, hIdx) => checked[fIdx][hIdx]);
      if (selected.length === 0) return;
      parts.push(`diff --git a/${file.oldPath} b/${file.newPath}`);
      parts.push(`--- a/${file.oldPath}`);
      parts.push(`+++ b/${file.newPath}`);
      selected.forEach((h) => {
        parts.push(h.content);
        h.lines.forEach((l) => parts.push(l.content));
      });
    });
    return parts.join("\n");
  };

  const apply = async () => {
    const selectedPatch = buildPatch();
    try {
      await invoke("apply_patch_command", { patch: selectedPatch });
      await onApply?.(selectedPatch);
    } catch (e) {
      alert(`Failed to apply patch: ${e}`);
    }
  };

  return (
    <div>
      {files.map(({ oldPath, newPath, type, hunks }, fileIdx) => (
        <Diff
          key={`${oldPath}-${newPath}`}
          viewType="unified"
          diffType={type}
          hunks={hunks}
        >
          {(hunks) =>
            hunks.map((hunk, hunkIdx) => (
              <div key={hunk.content}>
                <label>
                  <input
                    type="checkbox"
                    checked={checked[fileIdx]?.[hunkIdx] ?? false}
                    onChange={() => toggle(fileIdx, hunkIdx)}
                  />
                  Apply this hunk
                </label>
                <Hunk hunk={hunk} />
              </div>
            ))
          }
        </Diff>
      ))}
      <div>
        <button onClick={apply}>Apply</button>
        <button onClick={onReject}>Reject</button>
      </div>
    </div>
  );
}

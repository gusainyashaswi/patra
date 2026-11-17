"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { EmailPaper } from "./EmailRender";
import { Button, Dialog } from "./ui";
import { createDraft } from "@/lib/template-drafts";
import { blankStarter, starterContent, starters } from "@/lib/template-starters";

export default function TemplatePicker({ open, onClose }) {
  const router = useRouter();
  const [selection, setSelection] = useState(null);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);

  function close() {
    setSelection(null);
    setError("");
    onClose();
  }

  function openDraft(starter) {
    setCreating(true);
    try {
      const draft = createDraft(starter);
      close();
      router.push(`/templates/${draft.id}`);
    } catch {
      setError("Couldn’t save this draft. Check whether your browser allows local storage.");
      setCreating(false);
    }
  }

  return (
    <Dialog open={open} onClose={close} title={selection?.name ?? "Choose a starter"}
      size="lg"
      description={selection ? undefined : "Preview a starter, then customize the copy and links in the editor."}
      footer={selection
        ? <><Button variant="secondary" onClick={() => { setSelection(null); setError(""); }}>Back to starters</Button><Button disabled={creating} onClick={() => openDraft(selection)}>Use template</Button></>
        : <Button variant="secondary" disabled={creating} onClick={() => openDraft(blankStarter)}>Start blank</Button>}
    >
      {error && <p role="alert" className="mb-3 text-danger">{error}</p>}
      <div className="max-h-[min(46dvh,420px)] overflow-y-auto">
        {selection ? (
          <div className="border border-line">
            <div className="border-b border-line bg-surface p-4">
              <p className="font-semibold">{selection.subject}</p>
              <p className="text-sm text-muted">{selection.previewText}</p>
            </div>
            <EmailPaper template={starterContent(selection)} />
          </div>
        ) : (
          <ul className="divide-y divide-line border-y border-line">
            {starters.map((starter) => (
              <li key={starter.id}>
                <button type="button" onClick={() => setSelection(starter)}
                  className="block w-full px-3 py-3 text-left hover:bg-surface-2"
                  aria-label={`Preview ${starter.name}`}>
                  <span className="block font-semibold">{starter.name}</span>
                  <span className="block text-sm text-muted">{starter.description}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Dialog>
  );
}

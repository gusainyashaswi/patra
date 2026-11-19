"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { EmailPaper } from "./EmailRender";
import { Icon } from "./icons";
import { Button, cx } from "./ui";
import { createDraft } from "@/lib/template-drafts";
import { draftContent, templateRequest } from "@/lib/template-api";
import { blankStarter, starterContent, starters } from "@/lib/template-starters";

const starterIcons = {
  announcement: Icon.Mail,
  invitation: Icon.Send,
  confirmation: Icon.Check,
  reminder: Icon.Mail,
  newsletter: Icon.Layout,
};

export default function TemplatePicker({ onClose, workspace }) {
  const router = useRouter();
  const dialog = useRef(null);
  const preview = useRef(null);
  const titleId = useId();
  const [selection, setSelection] = useState(starters[0]);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const element = dialog.current;
    const previous = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    element.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      element.close();
      document.body.style.overflow = previousOverflow;
      previous?.focus();
    };
  }, []);

  useEffect(() => {
    preview.current?.scrollTo(0, 0);
  }, [selection]);

  async function openDraft(starter) {
    if (creating) return;
    setError("");
    setCreating(true);
    try {
      const draft = workspace
        ? await templateRequest(workspace, "/templates", { method: "POST", body: draftContent(starterContent(starter)) })
        : createDraft(starter);
      if (workspace) {
        onClose();
        router.push(`/templates/${draft.id}?org=${workspace.org.id}`);
        return;
      }
      onClose();
      router.push(`/templates/${draft.id}`);
    } catch (error) {
      setError(workspace ? error.message : "Couldn’t save the draft in this browser.");
      setCreating(false);
    }
  }

  return (
    <dialog
      ref={dialog}
      aria-labelledby={titleId}
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      className="fixed inset-0 m-auto h-[min(780px,calc(100dvh_-_1rem))] max-h-none w-[calc(100%_-_1rem)] max-w-5xl overflow-hidden rounded-2xl border border-line bg-surface text-fg shadow-2xl backdrop:bg-black/45 sm:w-[calc(100%_-_3rem)]"
    >
      <div className="grid h-full grid-rows-[auto_minmax(0,1fr)_auto]">
        <header className="flex items-start justify-between gap-4 border-b border-line px-5 py-4 sm:px-7 sm:py-5">
          <div>
            <h2 id={titleId} className="display text-2xl sm:text-3xl">Choose a template</h2>
            <p className="mt-1 text-sm text-muted">Pick a starting point for your email.</p>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Close template picker">
            <Icon.X size={19} />
          </Button>
        </header>

        <div className="min-h-0 overflow-y-auto md:grid md:grid-cols-[minmax(255px,1fr)_minmax(0,1.8fr)] md:overflow-hidden">
          <fieldset className="min-w-0 p-4 md:overflow-y-auto md:border-r md:border-line sm:p-5">
            <legend className="sr-only">Starter templates</legend>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-1">
              {starters.map((starter) => {
                const selected = starter.id === selection.id;
                const StarterIcon = starterIcons[starter.id] ?? Icon.File;
                return (
                  <label key={starter.id} className={cx(
                    "relative flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors focus-within:ring-2 focus-within:ring-accent motion-reduce:transition-none",
                    selected ? "border-accent bg-accent-soft" : "border-line hover:bg-surface-2",
                  )}>
                    <input type="radio" name={titleId} className="sr-only" checked={selected}
                      onChange={() => { setSelection(starter); setError(""); }} />
                    <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-line bg-surface" aria-hidden="true">
                      <StarterIcon size={17} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold leading-snug">{starter.name}</span>
                      <span className="mt-0.5 hidden text-sm leading-snug text-muted sm:block">{starter.description}</span>
                    </span>
                    {selected && <span className="shrink-0 text-accent-ink" aria-hidden="true"><Icon.Check size={18} /></span>}
                  </label>
                );
              })}
            </div>
          </fieldset>

          <section ref={preview} aria-label="Email preview" tabIndex={0}
            className="min-w-0 border-t border-line bg-surface-2 p-4 outline-offset-[-3px] md:overflow-y-auto md:border-t-0 sm:p-6">
            <div className="mx-auto max-w-[600px] overflow-hidden rounded-xl border border-line bg-surface">
              <div className="border-b border-line px-4 py-3 sm:px-5">
                <p className="text-sm font-semibold text-muted">Email preview</p>
                <p className="mt-1 break-words font-semibold leading-snug">{selection.subject}</p>
                <p className="mt-1 break-words text-sm text-muted">{selection.previewText}</p>
              </div>
              <EmailPaper template={starterContent(selection)} />
            </div>
          </section>
        </div>

        <footer className="border-t border-line px-4 py-3 sm:px-7 sm:py-4">
          {error && <p role="alert" className="mb-2 text-sm text-danger">{error}</p>}
          <div className="flex flex-wrap items-center justify-end gap-2">
            <p className="mr-auto hidden text-sm text-muted sm:block">{workspace ? `Saved to ${workspace.org.name}` : "Drafts save in this browser."}</p>
            <Button variant="secondary" disabled={creating} onClick={() => openDraft(blankStarter)}>Start blank</Button>
            <Button disabled={creating} onClick={() => openDraft(selection)}>Use template <Icon.ChevronRight size={16} /></Button>
          </div>
        </footer>
      </div>
    </dialog>
  );
}

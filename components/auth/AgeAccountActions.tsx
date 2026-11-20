"use client";

import { useState, type FormEvent } from "react";
import { useHydrated } from "@/hooks/useHydrated";
import { useAuth } from "@/hooks/useAuth";

export default function AgeAccountActions() {
  const hydrated = useHydrated();
  const { signOut, loading } = useAuth();
  const [status, setStatus] = useState("");
  const [deleting, setDeleting] = useState(false);

  async function removeAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const confirmation = new FormData(event.currentTarget).get("confirmation");
    if (confirmation !== "DELETE MY ACCOUNT" || deleting) return;
    setDeleting(true);
    setStatus("");
    try {
      const response = await fetch("/api/account/delete", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation }),
      });
      if (!response.ok) throw new Error();
      window.location.replace("/");
    } catch {
      setStatus("We couldn’t delete your account. Please try again.");
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-3 border-t border-black/15 pt-4 text-sm">
      <div className="flex flex-wrap gap-5">
        <a href="/api/account/export" className="underline">Export your data</a>
        <button type="button" onClick={signOut} disabled={loading || deleting} className="underline">Sign out</button>
      </div>
      <details className="space-y-3">
        <summary className="cursor-pointer underline">Delete your account</summary>
        <form method="post" onSubmit={removeAccount} className="space-y-3">
          <label className="block">
            Type DELETE MY ACCOUNT to confirm permanent deletion.
            <input name="confirmation" required className="mt-2 block w-full rounded-lg border border-black/30 p-2" />
          </label>
          <button type="submit" disabled={!hydrated || deleting} className="rounded-full border border-red-700 px-4 py-2 text-red-800 disabled:opacity-50">
            Delete account
          </button>
          {status && <p role="alert">{status}</p>}
        </form>
      </details>
    </div>
  );
}

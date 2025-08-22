"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

export function ImportOpenApi() {
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    setError(null);

    try {
      let res: Response;
      if (url.trim()) {
        res = await fetch("/api/openapi/import", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ url: url.trim() }),
        });
      } else if (fileRef.current?.files && fileRef.current.files.length > 0) {
        const fd = new FormData();
        fd.set("file", fileRef.current.files[0]);
        res = await fetch("/api/openapi/import", { method: "POST", body: fd });
      } else {
        setError("Provide a URL or choose a file.");
        setBusy(false);
        return;
      }

      if (!res.ok) {
        const t = (await res.text()) || "";
        if (res.status === 413 || /too large|exceeded size limit/i.test(t)) {
          setError("The spec is too large. Please upload a smaller file or reduce remote spec size.");
          setBusy(false);
          return;
        }
        if (/timed out/i.test(t)) {
          setError("The import timed out. Try a smaller spec or try again later.");
          setBusy(false);
          return;
        }
        throw new Error(t || `Import failed (${res.status})`);
      }

      const data = await res.json();
      setMessage(
        `Imported successfully. Endpoint ID: ${data.endpointDefinitionId}. Operations inserted: ${data.operationsInserted}.`
      );
      // refresh list
      router.refresh();
      setUrl("");
      if (fileRef.current) fileRef.current.value = "";
    } catch (err: any) {
      setError(err?.message || "Import failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <input
        type="url"
        inputMode="url"
        placeholder="OpenAPI URL (http/https)"
        className="h-9 w-64 rounded border px-2 text-sm bg-background"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
      />
      <div className="text-xs text-muted-foreground">or</div>
      <input ref={fileRef} type="file" accept=".json,.yaml,.yml,application/json,text/yaml,text/x-yaml" className="text-sm" />
      <button
        type="submit"
        disabled={busy}
        className="h-9 rounded bg-primary px-3 text-primary-foreground text-sm disabled:opacity-50"
      >
        {busy ? "Importing..." : "Import OpenAPI"}
      </button>
      {message && <div className="text-xs text-green-600">{message}</div>}
      {error && <div className="text-xs text-red-600">{error}</div>}
    </form>
  );
}

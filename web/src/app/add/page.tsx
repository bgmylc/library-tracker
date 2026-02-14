"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { fetchJson } from "@/lib/http";
import { Button, GlassCard } from "@/components/ui/figma";

type FormState = {
  title: string;
  author: string;
  status: string;
  genre: string;
  subgenre: string;
  language: string;
  pages: string;
  purchase_year: string;
  publisher: string;
  purchase_location: string;
  rating: string;
  notes: string;
  is_owned: "" | "true" | "false";
  is_nonfiction: "" | "true" | "false";
};

const emptyForm: FormState = {
  title: "",
  author: "",
  status: "Not Started",
  genre: "",
  subgenre: "",
  language: "",
  pages: "",
  purchase_year: "",
  publisher: "",
  purchase_location: "",
  rating: "",
  notes: "",
  is_owned: "",
  is_nonfiction: "",
};

function boolValue(v: "" | "true" | "false") {
  if (v === "true") return true;
  if (v === "false") return false;
  return "";
}

function AddPageInner() {
  const params = useSearchParams();
  const router = useRouter();
  const editId = params.get("id");

  const [form, setForm] = useState<FormState>(emptyForm);
  const [showAdvanced, setShowAdvanced] = useState(Boolean(editId));
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!editId) return;
    fetchJson<any>(`/api/books/${editId}`)
      .then((book) => {
        setForm({
          title: book.title || "",
          author: book.author || "",
          status: book.status || "Not Started",
          genre: book.genre || "",
          subgenre: book.subgenre || "",
          language: book.language || "",
          pages: book.pages?.toString() || "",
          purchase_year: book.purchase_year?.toString() || "",
          publisher: book.publisher || "",
          purchase_location: book.purchase_location || "",
          rating: book.rating?.toString() || "",
          notes: book.notes || "",
          is_owned: book.is_owned === 1 ? "true" : book.is_owned === 0 ? "false" : "",
          is_nonfiction: book.is_nonfiction === 1 ? "true" : book.is_nonfiction === 0 ? "false" : "",
        });
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed"));
  }, [editId]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");

    const payload = {
      ...form,
      is_owned: boolValue(form.is_owned),
      is_nonfiction: boolValue(form.is_nonfiction),
    };

    try {
      if (editId) {
        await fetchJson(`/api/books/${editId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        setMessage("Book updated.");
      } else {
        await fetchJson("/api/books", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        setMessage("Book added.");
        setForm(emptyForm);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    }
  }

  return (
    <div className="fgScreen fgFormScreen">
      <header className="fgHeader">
        <h2>{editId ? "Edit Book" : "Add Book"}</h2>
        <p>Add a new book to your library</p>
      </header>

      <GlassCard>
        <form className="fgForm" onSubmit={onSubmit}>
          <label><span>Title *</span><input required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} /></label>
          <label><span>Author</span><input value={form.author} onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))} /></label>
          <div className="fgGrid fgGrid-2">
            <label><span>Status</span><select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}><option>Not Started</option><option>Reading</option><option>Paused</option><option>Finished</option><option>DNF</option></select></label>
            <label><span>Genre</span><input value={form.genre} onChange={(e) => setForm((f) => ({ ...f, genre: e.target.value }))} /></label>
          </div>

          <button type="button" className="fgTextToggle" onClick={() => setShowAdvanced((x) => !x)}>
            {showAdvanced ? "Hide advanced fields" : "Show advanced fields"}
          </button>

          {showAdvanced ? (
            <div className="fgGrid fgGrid-2">
              <label><span>Subgenre</span><input value={form.subgenre} onChange={(e) => setForm((f) => ({ ...f, subgenre: e.target.value }))} /></label>
              <label><span>Language</span><input value={form.language} onChange={(e) => setForm((f) => ({ ...f, language: e.target.value }))} /></label>
              <label><span>Pages</span><input type="number" min={1} value={form.pages} onChange={(e) => setForm((f) => ({ ...f, pages: e.target.value }))} /></label>
              <label><span>Publication Year</span><input type="number" value={form.purchase_year} onChange={(e) => setForm((f) => ({ ...f, purchase_year: e.target.value }))} /></label>
              <label><span>Publisher</span><input value={form.publisher} onChange={(e) => setForm((f) => ({ ...f, publisher: e.target.value }))} /></label>
              <label><span>Purchase Location</span><input value={form.purchase_location} onChange={(e) => setForm((f) => ({ ...f, purchase_location: e.target.value }))} /></label>
              <label><span>Rating</span><input type="number" min={1} max={5} value={form.rating} onChange={(e) => setForm((f) => ({ ...f, rating: e.target.value }))} /></label>
              <label><span>Owned</span><select value={form.is_owned} onChange={(e) => setForm((f) => ({ ...f, is_owned: e.target.value as "" | "true" | "false" }))}><option value="">Unknown</option><option value="true">Yes</option><option value="false">No</option></select></label>
              <label><span>Nonfiction</span><select value={form.is_nonfiction} onChange={(e) => setForm((f) => ({ ...f, is_nonfiction: e.target.value as "" | "true" | "false" }))}><option value="">Unknown</option><option value="true">Yes</option><option value="false">No</option></select></label>
              <label className="fgWide"><span>Notes</span><textarea rows={4} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} /></label>
            </div>
          ) : null}

          <div className="fgActions">
            <Button variant="ghost" type="button">Cancel</Button>
            <Button type="submit">{editId ? "Save Changes" : "Add to Library"}</Button>
            {editId ? <Button variant="secondary" type="button" onClick={() => router.push("/add")}>New Entry</Button> : null}
          </div>
        </form>
      </GlassCard>

      {message ? <p className="fgOk">{message}</p> : null}
      {error ? <p className="fgError">Error: {error}</p> : null}
    </div>
  );
}

export default function AddPage() {
  return <Suspense fallback={<div className="fgScreen"><p>Loading...</p></div>}><AddPageInner /></Suspense>;
}

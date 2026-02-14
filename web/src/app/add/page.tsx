"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { fetchJson } from "@/lib/http";
import { Button, GlassCard } from "@/components/ui/figma";
import { pushToast, ToastPresets } from "@/components/ui/toast-host";

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
  date_started: string;
  date_finished: string;
  isbn: string;
  current_page: string;
  tags: string;
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
  is_owned: "true",
  is_nonfiction: "",
  date_started: "",
  date_finished: "",
  isbn: "",
  current_page: "",
  tags: "",
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
          is_owned: book.is_owned === 1 ? "true" : book.is_owned === 0 ? "false" : "true",
          is_nonfiction: book.is_nonfiction === 1 ? "true" : book.is_nonfiction === 0 ? "false" : "",
          date_started: book.date_started || "",
          date_finished: book.date_finished || "",
          isbn: "",
          current_page: "",
          tags: "",
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
        pushToast(ToastPresets.bookUpdated);
      } else {
        await fetchJson("/api/books", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        setMessage("Book added.");
        pushToast(ToastPresets.bookAdded);
        setForm(emptyForm);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    }
  }

  return (
    <div className="fgScreen fgAddWrap">
      <GlassCard className="fgAddCard">
        <div className="fgFormHeader">
          <h2>{editId ? "Edit Book" : "Add Book"}</h2>
          <p>Add a new book to your library</p>
        </div>

        <form className="fgForm" onSubmit={onSubmit}>
          <label><span>Title *</span><input required placeholder="Enter book title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} /></label>
          <label><span>Author *</span><input required placeholder="Enter author name" value={form.author} onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))} /></label>

          <div className="fgGrid fgAddGrid2">
            <label>
              <span>Status *</span>
              <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
                <option>Not Started</option>
                <option>Reading</option>
                <option>Paused</option>
                <option>Finished</option>
                <option>DNF</option>
              </select>
            </label>
            <label>
              <span>Genre</span>
              <input placeholder="Select genre" value={form.genre} onChange={(e) => setForm((f) => ({ ...f, genre: e.target.value }))} />
            </label>
          </div>

          <div className="fgSectionDivider" />
          <h3 className="fgSubTitle">Additional Details</h3>

          <div className="fgGrid fgAddGrid2">
            <label><span>ISBN</span><input placeholder="Enter ISBN" value={form.isbn} onChange={(e) => setForm((f) => ({ ...f, isbn: e.target.value }))} /></label>
            <label><span>Publisher</span><input placeholder="Enter publisher" value={form.publisher} onChange={(e) => setForm((f) => ({ ...f, publisher: e.target.value }))} /></label>
          </div>

          <div className="fgGrid fgAddGrid3">
            <label><span>Pages</span><input type="number" min={1} placeholder="0" value={form.pages} onChange={(e) => setForm((f) => ({ ...f, pages: e.target.value }))} /></label>
            <label><span>Current Page</span><input type="number" min={0} placeholder="0" value={form.current_page} onChange={(e) => setForm((f) => ({ ...f, current_page: e.target.value }))} /></label>
            <label><span>Publication Year</span><input type="number" placeholder="2024" value={form.purchase_year} onChange={(e) => setForm((f) => ({ ...f, purchase_year: e.target.value }))} /></label>
          </div>

          <div className="fgGrid fgAddGrid2">
            <label><span>Date Started</span><input type="date" value={form.date_started} onChange={(e) => setForm((f) => ({ ...f, date_started: e.target.value }))} /></label>
            <label><span>Date Finished</span><input type="date" value={form.date_finished} onChange={(e) => setForm((f) => ({ ...f, date_finished: e.target.value }))} /></label>
          </div>

          <div>
            <span className="fgFieldLabel">Rating</span>
            <div className="fgStars" role="radiogroup" aria-label="Rating">
              {[1, 2, 3, 4, 5].map((star) => {
                const active = Number(form.rating || 0) >= star;
                return (
                  <button
                    key={star}
                    type="button"
                    className={`fgStarBtn ${active ? "isActive" : ""}`}
                    onClick={() => setForm((f) => ({ ...f, rating: String(star) }))}
                    aria-label={`Set rating ${star}`}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </button>
                );
              })}
            </div>
          </div>

          <label><span>Notes</span><textarea rows={4} placeholder="Add your thoughts, review, or notes..." value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} /></label>
          <label><span>Tags</span><input placeholder="Add tags separated by commas" value={form.tags} onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))} /></label>

          <div className="fgSectionDivider" />

          <div className="fgActions fgFormActions">
            <Button variant="ghost" type="button" onClick={() => router.back()}>Cancel</Button>
            <Button type="submit">{editId ? "Save Changes" : "Add to Library"}</Button>
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

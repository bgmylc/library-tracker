"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

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
  const [showAdvancedForm, setShowAdvancedForm] = useState(Boolean(editId));
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
    const res = await fetch(url, { ...init, headers: { "Content-Type": "application/json" } });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Request failed");
    return data as T;
  }

  useEffect(() => {
    async function loadEditBook() {
      if (!editId) {
        setForm(emptyForm);
        return;
      }
      setLoading(true);
      setError("");
      try {
        const book = await fetchJson<any>(`/api/books/${editId}`);
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
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load book");
      } finally {
        setLoading(false);
      }
    }

    loadEditBook();
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
        await fetchJson(`/api/books/${editId}`, { method: "PUT", body: JSON.stringify(payload) });
        setMessage("Book updated.");
      } else {
        await fetchJson("/api/books", { method: "POST", body: JSON.stringify(payload) });
        setMessage("Book added.");
        setForm(emptyForm);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    }
  }

  return (
    <section id="book-form" className="panel">
      <div className="sectionHead">
        <h2>{editId ? "Edit Book" : "Quick Add"}</h2>
        <p className="meta">Enter essentials first, expand for details when needed.</p>
      </div>

      {loading ? <p className="meta">Loading...</p> : null}

      <form className="formGrid" onSubmit={onSubmit}>
        <label className="label full">Title
          <input required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
        </label>
        <label className="label">Author
          <input value={form.author} onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))} />
        </label>
        <label className="label">Status
          <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
            <option>Not Started</option>
            <option>Reading</option>
            <option>Paused</option>
            <option>Finished</option>
            <option>DNF</option>
          </select>
        </label>

        <div className="full">
          <button type="button" className="ghostBtn" onClick={() => setShowAdvancedForm((x) => !x)}>
            {showAdvancedForm ? "Hide Details" : "Add Details"}
          </button>
        </div>

        {showAdvancedForm ? (
          <>
            <label className="label">Genre
              <input value={form.genre} onChange={(e) => setForm((f) => ({ ...f, genre: e.target.value }))} />
            </label>
            <label className="label">Subgenre
              <input value={form.subgenre} onChange={(e) => setForm((f) => ({ ...f, subgenre: e.target.value }))} />
            </label>
            <label className="label">Language
              <input value={form.language} onChange={(e) => setForm((f) => ({ ...f, language: e.target.value }))} />
            </label>
            <label className="label">Pages
              <input type="number" min={1} value={form.pages} onChange={(e) => setForm((f) => ({ ...f, pages: e.target.value }))} />
            </label>
            <label className="label">Purchase Year
              <input type="number" value={form.purchase_year} onChange={(e) => setForm((f) => ({ ...f, purchase_year: e.target.value }))} />
            </label>
            <label className="label">Publisher
              <input value={form.publisher} onChange={(e) => setForm((f) => ({ ...f, publisher: e.target.value }))} />
            </label>
            <label className="label">Purchase Location
              <input value={form.purchase_location} onChange={(e) => setForm((f) => ({ ...f, purchase_location: e.target.value }))} />
            </label>
            <label className="label">Rating
              <input type="number" min={1} max={5} value={form.rating} onChange={(e) => setForm((f) => ({ ...f, rating: e.target.value }))} />
            </label>
            <label className="label">Owned
              <select value={form.is_owned} onChange={(e) => setForm((f) => ({ ...f, is_owned: e.target.value as "" | "true" | "false" }))}>
                <option value="">Unknown</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </label>
            <label className="label">Nonfiction
              <select value={form.is_nonfiction} onChange={(e) => setForm((f) => ({ ...f, is_nonfiction: e.target.value as "" | "true" | "false" }))}>
                <option value="">Unknown</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </label>
            <label className="label full">Notes
              <textarea rows={3} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
            </label>
          </>
        ) : null}

        <div className="actions full">
          <button type="submit">{editId ? "Save Changes" : "Add Book"}</button>
          {editId ? (
            <button type="button" className="ghostBtn" onClick={() => router.push("/add")}>New Entry</button>
          ) : null}
        </div>
      </form>

      {message ? <p className="meta">{message}</p> : null}
      {error ? <p className="meta">Error: {error}</p> : null}
    </section>
  );
}

export default function AddPage() {
  return (
    <Suspense fallback={<section id="book-form" className="panel"><p className="meta">Loading...</p></section>}>
      <AddPageInner />
    </Suspense>
  );
}

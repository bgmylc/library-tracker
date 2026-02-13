const state = {
  books: [],
  total: 0,
  editingId: null,
  filters: {
    search: "",
    status: "",
    genre: "",
    language: "",
  },
};

const els = {
  booksTbody: document.getElementById("booksTbody"),
  tableMeta: document.getElementById("tableMeta"),
  form: document.getElementById("bookForm"),
  formTitle: document.getElementById("formTitle"),
  submitBtn: document.getElementById("submitBtn"),
  cancelEditBtn: document.getElementById("cancelEditBtn"),
  searchInput: document.getElementById("searchInput"),
  statusFilter: document.getElementById("statusFilter"),
  genreFilter: document.getElementById("genreFilter"),
  languageFilter: document.getElementById("languageFilter"),
  refreshBtn: document.getElementById("refreshBtn"),
  kpis: document.getElementById("kpis"),
  genreChart: document.getElementById("genreChart"),
  authorChart: document.getElementById("authorChart"),
  statusChart: document.getElementById("statusChart"),
  subgenreChart: document.getElementById("subgenreChart"),
  pagesStatusChart: document.getElementById("pagesStatusChart"),
  completionYearChart: document.getElementById("completionYearChart"),
  ownershipChart: document.getElementById("ownershipChart"),
  nonfictionChart: document.getElementById("nonfictionChart"),
  publisherChart: document.getElementById("publisherChart"),
  csvPath: document.getElementById("csvPath"),
  importBtn: document.getElementById("importBtn"),
  importMeta: document.getElementById("importMeta"),
};

function q(params) {
  const url = new URLSearchParams(params);
  return url.toString();
}

async function api(path, options = {}) {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

function boolToFormValue(v) {
  if (v === true) return "true";
  if (v === false) return "false";
  return "";
}

function formValueToBool(v) {
  if (v === "true") return true;
  if (v === "false") return false;
  return "";
}

function resetForm() {
  state.editingId = null;
  els.form.reset();
  els.formTitle.textContent = "Add Book";
  els.submitBtn.textContent = "Add Book";
  els.cancelEditBtn.hidden = true;
}

function bookToForm(book) {
  const f = els.form;
  for (const key of [
    "title", "author", "status", "genre", "subgenre", "language", "pages", "purchase_year",
    "publisher", "purchase_location", "rating", "notes"
  ]) {
    f.elements[key].value = book[key] ?? "";
  }
  f.elements.is_owned.value = boolToFormValue(book.is_owned);
  f.elements.is_nonfiction.value = boolToFormValue(book.is_nonfiction);
}

function formToPayload() {
  const f = els.form;
  return {
    title: f.elements.title.value.trim(),
    author: f.elements.author.value.trim(),
    status: f.elements.status.value,
    genre: f.elements.genre.value.trim(),
    subgenre: f.elements.subgenre.value.trim(),
    language: f.elements.language.value.trim(),
    pages: f.elements.pages.value,
    purchase_year: f.elements.purchase_year.value,
    publisher: f.elements.publisher.value.trim(),
    purchase_location: f.elements.purchase_location.value.trim(),
    rating: f.elements.rating.value,
    notes: f.elements.notes.value.trim(),
    is_owned: formValueToBool(f.elements.is_owned.value),
    is_nonfiction: formValueToBool(f.elements.is_nonfiction.value),
  };
}

function renderBooks() {
  els.booksTbody.innerHTML = "";
  for (const b of state.books) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHtml(b.title || "")}</td>
      <td>${escapeHtml(b.author || "")}</td>
      <td>${escapeHtml(b.status || "")}</td>
      <td>${escapeHtml(b.genre || "")}</td>
      <td>${escapeHtml(b.language || "")}</td>
      <td>${b.purchase_year ?? ""}</td>
      <td>
        <button data-action="edit" data-id="${b.id}">Edit</button>
        <button data-action="delete" data-id="${b.id}">Delete</button>
      </td>
    `;
    els.booksTbody.appendChild(tr);
  }
  els.tableMeta.textContent = `${state.total} books`;
}

function renderSelect(el, options, includeAllLabel) {
  const prev = el.value;
  el.innerHTML = `<option value="">${includeAllLabel}</option>`;
  for (const v of options) {
    const opt = document.createElement("option");
    opt.value = v;
    opt.textContent = v;
    el.appendChild(opt);
  }
  el.value = prev;
}

function renderKpis(kpis) {
  const data = [
    ["Total", kpis.total_books],
    ["Finished", kpis.finished_books],
    ["Reading", kpis.reading_books],
    ["Paused", kpis.paused_books],
    ["DNF", kpis.dnf_books],
    ["Not Started", kpis.not_started_books],
    ["Read %", `${kpis.read_ratio}%`],
    ["Avg Pages", kpis.avg_pages],
  ];
  els.kpis.innerHTML = "";
  for (const [label, value] of data) {
    const div = document.createElement("div");
    div.className = "kpi";
    div.innerHTML = `<div class="label">${label}</div><div class="value">${value}</div>`;
    els.kpis.appendChild(div);
  }
}

function renderBars(el, data, valueFormatter = (v) => v) {
  el.innerHTML = "";
  if (!data.length) {
    el.textContent = "No data";
    return;
  }
  const max = Math.max(...data.map((d) => d.value));
  for (const d of data) {
    const row = document.createElement("div");
    row.className = "bar-row";
    const pct = Math.max(2, Math.round((d.value / max) * 100));
    row.innerHTML = `
      <div>
        <div class="bar-label">${escapeHtml(String(d.label))}</div>
        <div class="bar" style="width:${pct}%"></div>
      </div>
      <strong>${valueFormatter(d.value)}</strong>
    `;
    el.appendChild(row);
  }
}

function escapeHtml(s) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function loadBooks() {
  const query = q({ ...state.filters, page: 1, page_size: 100, sort: "title", order: "asc" });
  const data = await api(`/api/books?${query}`);
  state.books = data.items;
  state.total = data.total;
  renderBooks();
}

async function loadFilters() {
  const data = await api("/api/filters");
  renderSelect(els.statusFilter, data.statuses, "All statuses");
  renderSelect(els.genreFilter, data.genres, "All genres");
  renderSelect(els.languageFilter, data.languages, "All languages");
}

async function loadDashboard() {
  const data = await api("/api/dashboard");
  renderKpis(data.kpis);
  renderBars(els.genreChart, data.by_genre);
  renderBars(els.authorChart, data.top_authors);
  renderBars(els.statusChart, data.by_status);
  renderBars(els.subgenreChart, data.top_subgenres);
  renderBars(els.pagesStatusChart, data.pages_by_status);
  renderBars(els.completionYearChart, data.completed_by_year, (v) => `${v}%`);
  renderBars(els.ownershipChart, data.ownership_split);
  renderBars(els.nonfictionChart, data.nonfiction_split);
  renderBars(els.publisherChart, data.top_publishers);
}

async function refreshAll() {
  await Promise.all([loadBooks(), loadFilters(), loadDashboard()]);
}

els.searchInput.addEventListener("input", async (e) => {
  state.filters.search = e.target.value;
  await loadBooks();
});

for (const [el, key] of [
  [els.statusFilter, "status"],
  [els.genreFilter, "genre"],
  [els.languageFilter, "language"],
]) {
  el.addEventListener("change", async (e) => {
    state.filters[key] = e.target.value;
    await loadBooks();
  });
}

els.refreshBtn.addEventListener("click", refreshAll);

els.booksTbody.addEventListener("click", async (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;
  const id = Number(btn.dataset.id);
  const action = btn.dataset.action;

  if (action === "edit") {
    const book = await api(`/api/books/${id}`);
    state.editingId = id;
    bookToForm(book);
    els.formTitle.textContent = "Edit Book";
    els.submitBtn.textContent = "Save Changes";
    els.cancelEditBtn.hidden = false;
    return;
  }

  if (action === "delete") {
    const ok = window.confirm("Delete this book?");
    if (!ok) return;
    await api(`/api/books/${id}`, { method: "DELETE" });
    await refreshAll();
    if (state.editingId === id) resetForm();
  }
});

els.form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const payload = formToPayload();

  if (state.editingId) {
    await api(`/api/books/${state.editingId}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  } else {
    await api("/api/books", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  resetForm();
  await refreshAll();
});

els.cancelEditBtn.addEventListener("click", resetForm);

els.importBtn.addEventListener("click", async () => {
  const csvPath = els.csvPath.value.trim();
  if (!csvPath) return;
  els.importMeta.textContent = "Importing...";
  try {
    const res = await api("/api/import", {
      method: "POST",
      body: JSON.stringify({ csv_path: csvPath }),
    });
    els.importMeta.textContent = `Imported ${res.imported} books.`;
    resetForm();
    await refreshAll();
  } catch (err) {
    els.importMeta.textContent = err.message;
  }
});

refreshAll().catch((err) => {
  els.tableMeta.textContent = err.message;
});

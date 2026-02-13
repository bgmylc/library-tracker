import { NextRequest, NextResponse } from "next/server";
import { deleteBook, getBook, updateBook } from "@/lib/db";

function parseId(raw: string) {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_: NextRequest, context: RouteContext) {
  const { id: idRaw } = await context.params;
  const id = parseId(idRaw);
  if (!id) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  const book = getBook(id);
  if (!book) return NextResponse.json({ error: "Book not found" }, { status: 404 });
  return NextResponse.json(book);
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const { id: idRaw } = await context.params;
  const id = parseId(idRaw);
  if (!id) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  try {
    const payload = await request.json();
    const book = updateBook(id, payload);
    if (!book) return NextResponse.json({ error: "Book not found" }, { status: 404 });
    return NextResponse.json(book);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Invalid payload" }, { status: 400 });
  }
}

export async function DELETE(_: NextRequest, context: RouteContext) {
  const { id: idRaw } = await context.params;
  const id = parseId(idRaw);
  if (!id) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  const ok = deleteBook(id);
  if (!ok) return NextResponse.json({ error: "Book not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}

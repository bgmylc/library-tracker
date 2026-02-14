import { NextRequest, NextResponse } from "next/server";
import { createBook, listBooks } from "@/lib/db";

export function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const data = listBooks({
    search: searchParams.get("search") ?? "",
    status: searchParams.get("status") ?? "",
    genre: searchParams.get("genre") ?? "",
    language: searchParams.get("language") ?? "",
    purchase_year: searchParams.get("purchase_year"),
    starts_with: searchParams.get("starts_with"),
    sort: searchParams.get("sort") ?? "title",
    order: (searchParams.get("order") as "asc" | "desc") ?? "asc",
    page: Number(searchParams.get("page") ?? "1"),
    page_size: Number(searchParams.get("page_size") ?? "50"),
  });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const book = createBook(payload);
    return NextResponse.json(book, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Invalid payload" }, { status: 400 });
  }
}

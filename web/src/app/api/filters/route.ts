import { NextResponse } from "next/server";
import { getFilters } from "@/lib/db";

export function GET() {
  return NextResponse.json(getFilters());
}

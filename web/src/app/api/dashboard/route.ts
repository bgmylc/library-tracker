import { NextResponse } from "next/server";
import { getDashboard } from "@/lib/db";

export function GET() {
  return NextResponse.json(getDashboard());
}

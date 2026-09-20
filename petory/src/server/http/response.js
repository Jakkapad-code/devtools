import { NextResponse } from "next/server";

export function jsonError(message, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function isUniqueViolation(error) {
  return error?.code === "23505";
}

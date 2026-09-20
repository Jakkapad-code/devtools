import { NextResponse } from "next/server";

const PUBLIC_PATHS = new Set([
  "/petory",
  "/petory/login",
  "/petory/register",
  "/petory/forgot",
]);

export function proxy(request) {
  if (PUBLIC_PATHS.has(request.nextUrl.pathname)) return NextResponse.next();

  if (!request.cookies.get("petory_session")?.value) {
    return NextResponse.redirect(new URL("/petory/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/petory/:path*"],
};

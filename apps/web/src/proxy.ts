import { NextResponse, type NextRequest } from "next/server";

// Cek optimistis saja (ada cookie atau tidak). Otorisasi sebenarnya ditegakkan API pada setiap request.
export function proxy(req: NextRequest) {
  if (!req.cookies.has("ncri_session")) return NextResponse.redirect(new URL("/login", req.url));
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!login|_next/static|_next/image|brand|geo|vendor|favicon.ico).*)"],
};

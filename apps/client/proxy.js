import { NextResponse } from "next/server";

export function proxy(request) {
  if (!request.cookies.get("accessToken")?.value) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/campaigns/:path*", "/templates/:path*", "/contacts/:path*", "/settings/:path*"],
};

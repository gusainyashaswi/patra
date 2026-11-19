import { NextResponse, type NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const demoRequested = request.nextUrl.searchParams.get("demo") === "1";
  const demoSession = request.cookies.get("patra-demo")?.value === "1";
  if (demoRequested || demoSession) {
    const response = NextResponse.next();
    if (demoRequested) response.cookies.set("patra-demo", "1", { path: "/", sameSite: "lax" });
    return response;
  }
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

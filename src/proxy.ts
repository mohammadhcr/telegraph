import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { Roles } from "@/types/globals";

const isProtectedRoute = createRouteMatcher(["/profile"]);
const isAuthPage = createRouteMatcher([
  "/login",
  "/signup",
  "/forgot-password",
]);
const isAdminRoute = createRouteMatcher(["/admin(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  const authPromise = await auth();

  if (isProtectedRoute(req)) await auth.protect();

  if (isAuthPage(req) && authPromise.userId) {
    return NextResponse.redirect(new URL("/profile", req.url));
  }
  if (
    isAdminRoute(req) &&
    // @ts-expect-error any
    authPromise.sessionClaims?.metadata?.role<Roles> !== "admin"
  ) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};

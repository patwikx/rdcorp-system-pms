import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { hasPermission, hasAnyPermission, hasAllPermissions } from "./permissions";

/**
 * Server-side permission checking utilities
 * Use these in Server Components, Server Actions, and API Routes
 */

/**
 * Require authentication - throws if not authenticated
 */
export async function requireAuth() {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/auth/sign-in");
  }
  
  if (!session.user.isActive) {
    redirect("/auth/sign-in?error=AccountDeactivated");
  }
  
  return session;
}

/**
 * Require specific permission - redirects to unauthorized if not permitted
 */
export async function requirePermission(module: string, action: string) {
  const session = await requireAuth();
  
  if (!hasPermission(session, module, action)) {
    redirect("/unauthorized");
  }
  
  return session;
}

/**
 * Require any of the specified permissions
 */
export async function requireAnyPermission(
  permissions: Array<{ module: string; action: string }>
) {
  const session = await requireAuth();
  
  if (!hasAnyPermission(session, permissions)) {
    redirect("/unauthorized");
  }
  
  return session;
}

/**
 * Require all of the specified permissions
 */
export async function requireAllPermissions(
  permissions: Array<{ module: string; action: string }>
) {
  const session = await requireAuth();
  
  if (!hasAllPermissions(session, permissions)) {
    redirect("/unauthorized");
  }
  
  return session;
}

/**
 * Check permission without redirecting - returns boolean
 */
export async function checkPermission(module: string, action: string): Promise<boolean> {
  const session = await auth();
  return hasPermission(session, module, action);
}

/**
 * Get current session or throw error
 */
export async function getCurrentUser() {
  const session = await requireAuth();
  return session.user;
}
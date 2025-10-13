"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { hasPermission, hasAnyPermission, hasAllPermissions } from "@/lib/auth/permissions";
import { Loader2 } from "lucide-react";

interface PermissionGuardProps {
  children: ReactNode;
  module?: string;
  action?: string;
  permissions?: Array<{ module: string; action: string }>;
  requireAll?: boolean; // If true, requires all permissions; if false, requires any permission
  fallback?: ReactNode;
  redirectTo?: string;
}

/**
 * Client-side component to guard content based on user permissions
 */
export function PermissionGuard({
  children,
  module,
  action,
  permissions,
  requireAll = false,
  fallback,
  redirectTo = "/unauthorized",
}: PermissionGuardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/auth/sign-in");
      return;
    }

    let hasAccess = false;

    // Check single permission
    if (module && action) {
      hasAccess = hasPermission(session, module, action);
    }
    // Check multiple permissions
    else if (permissions && permissions.length > 0) {
      hasAccess = requireAll
        ? hasAllPermissions(session, permissions)
        : hasAnyPermission(session, permissions);
    }
    // No permission specified - allow access
    else {
      hasAccess = true;
    }

    if (!hasAccess && redirectTo) {
      router.push(redirectTo);
    }
  }, [session, status, module, action, permissions, requireAll, redirectTo, router]);

  // Loading state
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Not authenticated
  if (!session) {
    return null;
  }

  // Check permissions
  let hasAccess = false;

  if (module && action) {
    hasAccess = hasPermission(session, module, action);
  } else if (permissions && permissions.length > 0) {
    hasAccess = requireAll
      ? hasAllPermissions(session, permissions)
      : hasAnyPermission(session, permissions);
  } else {
    hasAccess = true;
  }

  // Show fallback if no access
  if (!hasAccess && fallback) {
    return <>{fallback}</>;
  }

  // Show content if has access
  if (hasAccess) {
    return <>{children}</>;
  }

  // No access and no fallback
  return null;
}

/**
 * Component to show content only if user has permission
 */
export function ShowIfPermission({
  children,
  module,
  action,
}: {
  children: ReactNode;
  module: string;
  action: string;
}) {
  const { data: session } = useSession();

  if (!session || !hasPermission(session, module, action)) {
    return null;
  }

  return <>{children}</>;
}

/**
 * Component to hide content if user has permission (inverse of ShowIfPermission)
 */
export function HideIfPermission({
  children,
  module,
  action,
}: {
  children: ReactNode;
  module: string;
  action: string;
}) {
  const { data: session } = useSession();

  if (session && hasPermission(session, module, action)) {
    return null;
  }

  return <>{children}</>;
}
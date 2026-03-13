"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import type { AuthUser, UserRole } from "@/lib/auth";
import { getAuthUser, getRoleRedirectPath } from "@/lib/auth";

type UnauthorizedRedirect = "login" | "role";

export function useAuthGuard(options: {
  allowedRoles?: readonly UserRole[];
  unauthorizedRedirect?: UnauthorizedRedirect;
} = {}) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);

  const allowedRolesKey = (options.allowedRoles ?? []).join(",");
  const allowedRoles = allowedRolesKey ? (allowedRolesKey.split(",") as UserRole[]) : null;
  const unauthorizedRedirect = options.unauthorizedRedirect ?? "role";

  useEffect(() => {
    const authUser = getAuthUser();
    if (!authUser) {
      router.replace("/auth/login");
      return;
    }

    if (allowedRoles && !allowedRoles.includes(authUser.role)) {
      router.replace(unauthorizedRedirect === "login" ? "/auth/login" : getRoleRedirectPath(authUser.role));
      return;
    }

    setUser((prev) => {
      if (!prev) return authUser;
      return prev.id === authUser.id && prev.name === authUser.name && prev.role === authUser.role ? prev : authUser;
    });
  }, [allowedRolesKey, allowedRoles, router, unauthorizedRedirect]);

  return user;
}

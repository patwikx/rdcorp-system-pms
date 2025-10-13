import NextAuth, { type DefaultSession } from "next-auth";
import { JWT } from "next-auth/jwt";

// Define the structure for a permission
export interface UserPermission {
  id: string;
  name: string;
  module: string;
  action: string;
  description: string | null;
}

// Define the structure for a user's role
export interface UserRole {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  permissions: UserPermission[];
}

declare module "next-auth" {
  /**
   * Returned by `auth`, `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      name: string;
      image: string | null;
      department: string | null;
      position: string | null;
      isActive: boolean;
      role: UserRole;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    image: string | null;
    department: string | null;
    position: string | null;
    isActive: boolean;
    roleId: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    name: string;
    image: string | null;
    department: string | null;
    position: string | null;
    isActive: boolean;
    role: UserRole;
  }
}
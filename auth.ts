import NextAuth from "next-auth"
import { prisma } from "@/lib/prisma"
import { authConfig } from "./auth.config"

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/",
    error: "/auth/error",
    signOut: "/"
  },
  providers: authConfig.providers,
  callbacks: {
    async signIn({ user }) {
      if (!user?.id) return false;
     
      // Check if user exists and is active
      const existingUser = await prisma.user.findUnique({
        where: { id: user.id }
      });
     
      return existingUser?.isActive === true;
    },
   
    async jwt({ token }) {
      if (!token.sub) return token;
     
      // Fetch user with role and permissions
      const userWithDetails = await prisma.user.findUnique({
        where: { id: token.sub },
        include: {
          role: {
            include: {
              permissions: {
                include: {
                  permission: true
                }
              }
            }
          }
        },
      });
     
      if (!userWithDetails) return token;
      
      // Set token data
      token.id = userWithDetails.id;
      token.email = userWithDetails.email;
      token.firstName = userWithDetails.firstName;
      token.lastName = userWithDetails.lastName;
      token.name = `${userWithDetails.firstName} ${userWithDetails.lastName}`;
      token.image = userWithDetails.image;
      token.department = userWithDetails.department;
      token.position = userWithDetails.position;
      token.isActive = userWithDetails.isActive;
     
      // Role data with permissions
      token.role = {
        id: userWithDetails.role.id,
        name: userWithDetails.role.name,
        description: userWithDetails.role.description,
        isSystem: userWithDetails.role.isSystem,
        permissions: userWithDetails.role.permissions.map(rp => ({
          id: rp.permission.id,
          name: rp.permission.name,
          module: rp.permission.module,
          action: rp.permission.action,
          description: rp.permission.description
        }))
      };
     
      return token;
    },
   
    async session({ token, session }) {
      if (token.sub && session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.firstName = token.firstName as string;
        session.user.lastName = token.lastName as string;
        session.user.name = token.name as string;
        session.user.image = token.image as string | null;
        session.user.department = token.department as string | null;
        session.user.position = token.position as string | null;
        session.user.isActive = token.isActive as boolean;
        session.user.role = token.role as {
          id: string;
          name: string;
          description: string | null;
          isSystem: boolean;
          permissions: Array<{
            id: string;
            name: string;
            module: string;
            action: string;
            description: string | null;
          }>;
        };
      }
      return session;
    },
  },
});
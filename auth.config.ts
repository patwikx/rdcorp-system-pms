import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcryptjs from "bcryptjs";
import { LoginSchema } from "@/lib/validations/login-schema";
import { getUserByEmail } from "@/lib/auth-actions/auth-users";

export const authConfig = {
  providers: [
    Credentials({
      async authorize(credentials) {
        const validatedFields = LoginSchema.safeParse(credentials);
        
        if (validatedFields.success) {
          const { email, password } = validatedFields.data;
          const user = await getUserByEmail(email);
         
          if (!user || !user.password) return null;
         
          const passwordsMatch = await bcryptjs.compare(
            password,
            user.password
          );
         
          if (passwordsMatch) {
            return {
              id: user.id,
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
              image: user.image,
              department: user.department,
              position: user.position,
              isActive: user.isActive,
              roleId: user.roleId,
            };
          }
        }
        return null;
      },
    }),
  ],
} satisfies NextAuthConfig;
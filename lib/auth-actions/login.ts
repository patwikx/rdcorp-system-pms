"use server";

import * as z from "zod";
import { AuthError } from "next-auth";
import { getUserByEmail } from "./auth-users";
import { LoginSchema } from "../validations/login-schema";
import { signIn } from "../../auth";

export const login = async (
  values: z.infer<typeof LoginSchema>,
  callbackUrl?: string | null
): Promise<{ error?: string; success?: string }> => {
  const validatedFields = LoginSchema.safeParse(values);
  
  if (!validatedFields.success) {
    return { error: "Invalid fields!" };
  }

  const { email, password } = validatedFields.data;
  
  const existingUser = await getUserByEmail(email);
  
  if (!existingUser || !existingUser.email || !existingUser.password) {
    return { error: "Email does not exist!" };
  }

  if (!existingUser.isActive) {
    return { error: "Your account has been deactivated. Please contact an administrator." };
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: callbackUrl || "/dashboard",
    });
    
    // This line should not be reached due to redirect, but just in case
    return { success: "Logged in successfully!" };
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid credentials!" };
        default:
          return { error: "Something went wrong!" };
      }
    }
    
    // Re-throw the error to let NextAuth handle redirects
    throw error;
  }
};
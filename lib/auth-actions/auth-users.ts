import { prisma } from "@/lib/prisma";

/**
 * Retrieves a user by their email address
 * @param email - The email address to search for
 * @returns The user object or null if not found
 */
export async function getUserByEmail(email: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
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
      }
    });
    
    return user;
  } catch (error) {
    console.error("Error fetching user by email:", error);
    return null;
  }
}

/**
 * Retrieves a user by their ID
 * @param id - The user ID to search for
 * @returns The user object or null if not found
 */
export async function getUserById(id: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
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
      }
    });
    
    return user;
  } catch (error) {
    console.error("Error fetching user by ID:", error);
    return null;
  }
}
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { updateProfile } from "@/lib/actions/profile-actions"
import { z } from "zod"

const updateProfileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  department: z.string().optional(),
  position: z.string().optional(),
})

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    
    // Validate the request body
    const validationResult = updateProfileSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid data", details: validationResult.error.issues },
        { status: 400 }
      )
    }

    const result = await updateProfile(session.user.id, validationResult.data)
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: "Profile updated successfully",
      user: result.user
    })
    
  } catch (error) {
    console.error("Profile update error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
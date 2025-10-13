// app/(root)/layout.tsx (Type-safe and aligned with schema)
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { BusinessUnitModal } from '@/components/modals/business-unit-modal';
import type { Session } from 'next-auth';


// Type guard to ensure we have a complete user session
function isValidUserSession(session: Session | null): session is Session & {
  user: NonNullable<Session['user']> & {
    businessUnit: NonNullable<Session['user']['businessUnit']>;
  }
} {
  return !!(
    session?.user?.id &&
    session.user.businessUnit?.id &&
    session.user.isActive
  );
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 1. Get the session, which includes the user's business unit assignment
  const session = await auth();

  // 2. If there's no user session, redirect to sign-in
  if (!session?.user) {
    redirect('/auth/sign-in');
  }

  // 3. If user is inactive, redirect to sign-in
  if (!session.user.isActive) {
    redirect('/auth/sign-in');
  }

  // 4. Check if user has a valid business unit assignment
  if (isValidUserSession(session)) {
    // --- Scenario 1: User has valid business unit assignment ---
    // Redirect them to the dashboard of their assigned business unit
    const businessUnitId = session.user.businessUnit.id;
    redirect(`/${businessUnitId}`);
  }

  // --- Scenario 2: User has NO business unit assignment ---
  // If the code reaches here, it means the user is logged in but not assigned to any business unit.
  // This could happen if:
  // - Admin hasn't assigned them to a business unit yet
  // - Their business unit was deactivated
  // - Data integrity issue
  
  // We render the page with the modal to handle this edge case
  return (
    <>
                  <BusinessUnitModal />
            {children}

    </>
  );
}
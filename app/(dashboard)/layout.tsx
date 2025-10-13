import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import "../globals.css";
import { Toaster } from 'sonner';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import type { Session } from 'next-auth';
import { AppSidebar } from '@/components/sidebar/app-sidebar';
import { Separator } from '@/components/ui/separator';
import { DynamicBreadcrumbs } from '@/components/dashboard/dynamic-breadcurmbs';
import { GlobalSearch } from '@/components/search/global-search';
import { NotificationsMenu } from '@/components/notifications/notification-menu';

export const metadata = {
  title: "Dashboard | RD Corporation Property Management",
  description: "Property Management System for RD Corporation",
};

// Type guard to ensure we have a complete user session
function isValidUserSession(session: Session | null): session is Session & {
  user: NonNullable<Session['user']> & {
    role: NonNullable<Session['user']['role']>;
  }
} {
  return !!(
    session?.user?.id &&
    session.user.role?.id &&
    session.user.isActive
  );
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth();

  // Redirect to sign-in if there's no session or user
  if (!session?.user) {
    redirect("/auth/sign-in");
  }

  // Check if user account is active
  if (!session.user.isActive) {
    redirect("/auth/sign-in?error=AccountDeactivated");
  }

  // Ensure we have a complete user session
  if (!isValidUserSession(session)) {
    redirect("/auth/sign-in?error=IncompleteProfile");
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        {/* App Sidebar */}
        <AppSidebar session={session} />
       
        {/* Main Content Area */}
        <SidebarInset className="flex-1">
          {/* Header with breadcrumb, search, and notifications */}
          <header className="flex h-16 shrink-0 items-center gap-4 px-4 border-b">
            {/* Left side: Sidebar trigger and breadcrumbs */}
            <div className="flex items-center gap-2">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="h-4" />
              <DynamicBreadcrumbs />
            </div>
            
            {/* Center: Global Search */}
            <div className="flex-1 flex justify-center px-4">
              <div className="w-full max-w-sm">
                <GlobalSearch />
              </div>
            </div>
            
            {/* Right side: Notifications */}
            <div className="flex items-center">
              <NotificationsMenu />
            </div>
          </header>
          {/* Main Content */}
          <main className="flex-1 p-4">
            {children}
          </main>
        </SidebarInset>
        {/* Toast Notifications */}
        <Toaster />
      </div>
    </SidebarProvider>
  )
}
// app-sidebar.tsx
"use client"

import * as React from "react"
import { 
  Building2, 
  FileText, 
  Shield, 
  BarChart3, 
  History,
  FolderOpen,
  CheckSquare,
  Receipt,
  TrendingUp
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import type { Session } from "next-auth"
import type { UserPermission } from "@/next-auth"
import { NavMain } from "./nav-main"
import { NavUser } from "./nav-user"

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  session: Session
}

// Define navigation items based on property management system
const getNavigationItems = (userPermissions: UserPermission[], userRole: string) => {
  // Helper function to check if user has permission
  const hasPermission = (module: string, action: string): boolean => {
    // Administrators should have access to everything
    if (userRole === 'Super Admin' || userRole === 'Administrator' || userRole === 'System Administrator') {
      return true;
    }
    return userPermissions.some(p => p.module === module && p.action === action);
  };

  const navItems = [];

  // Dashboard - accessible to all authenticated users
  navItems.push({
    title: "Dashboard",
    url: "/dashboard",
    icon: BarChart3,
    isActive: true,
  });

  // Properties - check for property permissions
  if (hasPermission('property', 'read') || hasPermission('property', 'create')) {
    navItems.push({
      title: "Properties",
      url: "/properties",
      icon: Building2,
      items: [
        {
          title: "All Properties",
          url: "/properties",
        },
        ...(hasPermission('property', 'create') ? [{
          title: "Add Property",
          url: "/properties/create",
        }] : []),
      ],
    });
  }

  // Title Movement - check for title_movement permissions
  const hasTitleMovementRead = hasPermission('title_movement', 'read');
  const hasTitleMovementCreate = hasPermission('title_movement', 'create');
  
  console.log('Title movement permission check:', {
    hasTitleMovementRead,
    hasTitleMovementCreate,
    shouldShow: hasTitleMovementRead || hasTitleMovementCreate
  });
  
  if (hasTitleMovementRead || hasTitleMovementCreate) {
    navItems.push({
      title: "Title Movements",
      url: "/title-movements",
      icon: TrendingUp,
      items: [
        {
          title: "All Movements",
          url: "/title-movements",
        },
        {
          title: "Process Returns",
          url: "/title-returns",
        },
      ],
    });
  }

  // Real Property Tax - check for tax permissions
  if (hasPermission('tax', 'read') || hasPermission('tax', 'create')) {
    navItems.push({
      title: "Property Tax",
      url: "/property-tax",
      icon: Receipt,
      items: [
        {
          title: "All Tax Records",
          url: "/property-tax",
        },
        {
          title: "Payment History",
          url: "/property-tax/payments",
        },
      ],
    });
  }

  // Approvals - check for approval permissions
  if (hasPermission('approval', 'read') || hasPermission('approval', 'approve')) {
    navItems.push({
      title: "Approvals",
      url: "/approvals",
      icon: CheckSquare,
      items: [
        {
          title: "Pending Approvals",
          url: "/approvals",
        },
        {
          title: "My Requests",
          url: "/approvals/my-requests",
        },
      ],
    });
  }

  // Documents - check for document permissions
  if (hasPermission('document', 'read')) {
    navItems.push({
      title: "Documents",
      url: "/documents",
      icon: FolderOpen,
      items: [
        {
          title: "All Documents",
          url: "/documents",
        },
      ],
    });
  }

  // Reports - check for read permissions
  if (hasPermission('property', 'read') || hasPermission('tax', 'read')) {
    navItems.push({
      title: "Reports",
      url: "/reports",
      icon: FileText,
    });
  }

  // Audit Logs - typically for admins
  if (hasPermission('audit', 'read') || userPermissions.some(p => p.module === 'user' && p.action === 'manage_roles')) {
    navItems.push({
      title: "Audit Logs",
      url: "/audit-logs",
      icon: History,
    });
  }

  // Administration - check for user management permissions
  if (hasPermission('user', 'create') || hasPermission('user', 'manage_roles')) {
    navItems.push({
      title: "Administration",
      url: "/admin",
      icon: Shield,
      items: [
        ...(hasPermission('user', 'read') ? [{
          title: "Users",
          url: "/users",
        }] : []),
        ...(hasPermission('user', 'manage_roles') ? [{
          title: "Roles & Permissions",
          url: "/users/roles",
        }] : []),
        {
          title: "System Settings",
          url: "/admin/settings",
        },
      ],
    });
  }


  return navItems;
}

export function AppSidebar({ 
  session, 
  ...props 
}: AppSidebarProps) {
  // Debug: Log user permissions
  React.useEffect(() => {
    console.log('Current user:', session.user.name);
    console.log('Current role:', session.user.role.name);
    console.log('Is admin role?', ['Super Admin', 'Administrator', 'System Administrator'].includes(session.user.role.name));
    console.log('User permissions:', session.user.role.permissions);
    console.log('Title movement permissions:', session.user.role.permissions.filter(p => p.module === 'title_movement'));
  }, [session.user]);

  const navItems = React.useMemo(() => 
    getNavigationItems(session.user.role.permissions, session.user.role.name),
    [session.user.role.permissions, session.user.role.name]
  );

  const userData = React.useMemo(() => ({
    name: session.user.name,
    email: session.user.email ?? '',
    avatar: session.user.image ?? '',
    department: session.user.department ?? '',
    position: session.user.position ?? '',
    role: session.user.role.name,
  }), [session.user]);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="mt-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Building2 className="h-5 w-5" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-semibold">RD Corporation</span>
            <span className="text-xs text-muted-foreground">Property Management</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItems} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
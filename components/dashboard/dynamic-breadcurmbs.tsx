'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { 
  Building2, 
  FileText, 
  Settings, 
  Shield, 
  BarChart3, 
  History,
  FolderOpen,
  CheckSquare,
  Receipt,
  TrendingUp,
  Home,
  Plus,
  Eye,
  Users,
  List,
  DollarSign,
  Archive,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';

interface BreadcrumbItemType {
  label: string;
  href?: string;
  icon?: React.ComponentType<{ className?: string }>;
  isCurrentPage?: boolean;
}

const routeConfig: Record<string, { label: string; icon?: React.ComponentType<{ className?: string }> }> = {
  'dashboard': { label: 'Dashboard', icon: BarChart3 },
  
  // Properties
  'properties': { label: 'Properties', icon: Building2 },
  'properties/create': { label: 'Add Property', icon: Plus },
  'properties/classification': { label: 'By Classification', icon: Building2 },
  'properties/status': { label: 'By Status', icon: Building2 },
  
  // Title Movements
  'title-movements': { label: 'Title Movements', icon: TrendingUp },
  'title-movements/create': { label: 'Record Movement', icon: Plus },
  'title-movements/released': { label: 'Released Titles', icon: TrendingUp },
  'title-movements/returned': { label: 'Returned Titles', icon: Archive },
  
  // Property Tax
  'property-tax': { label: 'Property Tax', icon: Receipt },
  'property-tax/create': { label: 'Create Tax Record', icon: Plus },
  'property-tax/due': { label: 'Due Taxes', icon: Clock },
  'property-tax/overdue': { label: 'Overdue Taxes', icon: XCircle },
  'property-tax/payments': { label: 'Payment History', icon: DollarSign },
  
  // Approvals
  'approvals': { label: 'Approvals', icon: CheckSquare },
  'approvals/pending': { label: 'Pending Approvals', icon: Clock },
  'approvals/my-requests': { label: 'My Requests', icon: List },
  'approvals/approved': { label: 'Approved', icon: CheckCircle },
  'approvals/rejected': { label: 'Rejected', icon: XCircle },
  
  // Documents
  'documents': { label: 'Documents', icon: FolderOpen },
  'documents/title-deeds': { label: 'Title Deeds', icon: FileText },
  'documents/tax-receipts': { label: 'Tax Receipts', icon: Receipt },
  
  // Reports
  'reports': { label: 'Reports', icon: FileText },
  'reports/properties': { label: 'Property Reports', icon: Building2 },
  'reports/taxes': { label: 'Tax Reports', icon: Receipt },
  'reports/movements': { label: 'Movement Reports', icon: TrendingUp },
  'reports/financial': { label: 'Financial Summary', icon: DollarSign },
  
  // Audit Logs
  'audit-logs': { label: 'Audit Logs', icon: History },
  
  // Administration
  'admin': { label: 'Administration', icon: Shield },
  'admin/users': { label: 'Users', icon: Users },
  'admin/roles': { label: 'Roles & Permissions', icon: Shield },
  'admin/settings': { label: 'System Settings', icon: Settings },
  
  // Settings
  'settings': { label: 'Settings', icon: Settings },
  'settings/profile': { label: 'Profile', icon: Users },
  'settings/preferences': { label: 'Preferences', icon: Settings },
};

export function DynamicBreadcrumbs() {
  const pathname = usePathname();
  
  const generateBreadcrumbs = (): BreadcrumbItemType[] => {
    const pathSegments = pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItemType[] = [];
    
    // Always start with Dashboard
    breadcrumbs.push({
      label: 'Dashboard',
      href: '/dashboard',
      icon: Home
    });

    // Handle root path
    if (pathSegments.length === 0 || (pathSegments.length === 1 && pathSegments[0] === 'dashboard')) {
      breadcrumbs[0].isCurrentPage = true;
      breadcrumbs[0].href = undefined;
      return breadcrumbs;
    }

    let currentPath = '';
    let actualPath = '';
    
    for (let i = 0; i < pathSegments.length; i++) {
      const segment = pathSegments[i];
      
      // Skip 'dashboard' segment if it's the first one
      if (i === 0 && segment === 'dashboard') {
        continue;
      }
      
      // Build the actual path
      actualPath = actualPath ? `${actualPath}/${segment}` : segment;
      
      // Check if this is a dynamic route (UUID pattern)
      const isUuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment);
      
      if (isUuidPattern) {
        // For UUID segments, use the parent route's label + "Details"
        const parentPath = currentPath;
        const parentConfig = routeConfig[parentPath];
        
        breadcrumbs.push({
          label: parentConfig ? `${parentConfig.label} Details` : 'Details',
          href: i === pathSegments.length - 1 ? undefined : `/${actualPath}`,
          icon: parentConfig?.icon || Eye,
          isCurrentPage: i === pathSegments.length - 1
        });
      } else {
        // For non-UUID segments, build the currentPath for config lookup
        currentPath = currentPath ? `${currentPath}/${segment}` : segment;
        
        const config = routeConfig[currentPath];
        const isLastSegment = i === pathSegments.length - 1;
        
        breadcrumbs.push({
          label: config?.label || segment.split('-').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
          ).join(' '),
          href: isLastSegment ? undefined : `/${actualPath}`,
          icon: config?.icon,
          isCurrentPage: isLastSegment
        });
      }
    }

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  return (
    <Breadcrumb>
      <BreadcrumbList className="items-center">
        {breadcrumbs.map((crumb, index) => (
          <React.Fragment key={index}>
            <BreadcrumbItem className={index === 0 ? "hidden md:block" : ""}>
              {crumb.isCurrentPage ? (
                <BreadcrumbPage className="flex items-center gap-2 h-8 text-sm">
                  {crumb.icon && <crumb.icon className="h-4 w-4" />}
                  <span>{crumb.label}</span>
                </BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link href={crumb.href!} className="flex items-center gap-2 h-8 text-sm">
                    {crumb.icon && <crumb.icon className="h-4 w-4" />}
                    <span>{crumb.label}</span>
                  </Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
            {index < breadcrumbs.length - 1 && (
              <BreadcrumbSeparator className={index === 0 ? "hidden md:block" : ""} />
            )}
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
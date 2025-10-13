import { PrismaClient, Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting production seed...');

  // ============================================
  // 1. CREATE PERMISSIONS
  // ============================================
  const permissionsData: Prisma.PermissionCreateInput[] = [
    // Property permissions
    { name: 'property.create', module: 'property', action: 'create', description: 'Create new properties' },
    { name: 'property.read', module: 'property', action: 'read', description: 'View properties' },
    { name: 'property.update', module: 'property', action: 'update', description: 'Update property details' },
    { name: 'property.delete', module: 'property', action: 'delete', description: 'Delete properties' },
    
    // User permissions
    { name: 'user.create', module: 'user', action: 'create', description: 'Create new users' },
    { name: 'user.read', module: 'user', action: 'read', description: 'View users' },
    { name: 'user.update', module: 'user', action: 'update', description: 'Update user details' },
    { name: 'user.delete', module: 'user', action: 'delete', description: 'Delete users' },
    
    // Role permissions
    { name: 'role.create', module: 'role', action: 'create', description: 'Create new roles' },
    { name: 'role.read', module: 'role', action: 'read', description: 'View roles' },
    { name: 'role.update', module: 'role', action: 'update', description: 'Update roles' },
    { name: 'role.delete', module: 'role', action: 'delete', description: 'Delete roles' },
    
    // Approval permissions
    { name: 'approval.create', module: 'approval', action: 'create', description: 'Create approval requests' },
    { name: 'approval.read', module: 'approval', action: 'read', description: 'View approval requests' },
    { name: 'approval.approve', module: 'approval', action: 'approve', description: 'Approve requests' },
    { name: 'approval.reject', module: 'approval', action: 'reject', description: 'Reject requests' },
    
    // Tax permissions
    { name: 'tax.create', module: 'tax', action: 'create', description: 'Create tax records' },
    { name: 'tax.read', module: 'tax', action: 'read', description: 'View tax records' },
    { name: 'tax.update', module: 'tax', action: 'update', description: 'Update tax records' },
    { name: 'tax.delete', module: 'tax', action: 'delete', description: 'Delete tax records' },
    
    // Title Movement permissions
    { name: 'title_movement.create', module: 'title_movement', action: 'create', description: 'Create title movements' },
    { name: 'title_movement.read', module: 'title_movement', action: 'read', description: 'View title movements' },
    { name: 'title_movement.update', module: 'title_movement', action: 'update', description: 'Update title movements' },
    { name: 'title_movement.delete', module: 'title_movement', action: 'delete', description: 'Delete title movements' },
    
    // Document permissions
    { name: 'document.create', module: 'document', action: 'create', description: 'Upload documents' },
    { name: 'document.read', module: 'document', action: 'read', description: 'View documents' },
    { name: 'document.delete', module: 'document', action: 'delete', description: 'Delete documents' },
    
    // Audit permissions
    { name: 'audit.read', module: 'audit', action: 'read', description: 'View audit logs' },
    { name: 'audit.export', module: 'audit', action: 'export', description: 'Export audit logs' },
    
    // System Config permissions
    { name: 'system.read', module: 'system', action: 'read', description: 'View system configuration' },
    { name: 'system.update', module: 'system', action: 'update', description: 'Update system configuration' },
  ];

  const permissions = await Promise.all(
    permissionsData.map(permission => 
      prisma.permission.create({ data: permission })
    )
  );

  console.log(`✅ Created ${permissions.length} permissions`);

  // ============================================
  // 2. CREATE ROLES
  // ============================================
  
  // Super Admin Role - Full System Access
  const superAdminRole = await prisma.role.create({
    data: {
      name: 'Super Admin',
      description: 'Full system access with all permissions including user and role management',
      isSystem: true,
      isActive: true,
    },
  });

  // Property Manager Role - Manage Properties & Operations
  const propertyManagerRole = await prisma.role.create({
    data: {
      name: 'Property Manager',
      description: 'Manage properties, taxes, title movements, and documents. Can create approval requests.',
      isSystem: true,
      isActive: true,
    },
  });

  // Approver Role - Approve Workflows
  const approverRole = await prisma.role.create({
    data: {
      name: 'Approver',
      description: 'Review and approve/reject property changes, transfers, and other approval workflows',
      isSystem: true,
      isActive: true,
    },
  });

  // Finance Role - Tax & Financial Records
  const financeRole = await prisma.role.create({
    data: {
      name: 'Finance Manager',
      description: 'Manage tax records, view financial information, and generate reports',
      isSystem: true,
      isActive: true,
    },
  });

  // Viewer Role - Read-Only Access
  const viewerRole = await prisma.role.create({
    data: {
      name: 'Viewer',
      description: 'Read-only access to properties, reports, and basic system information',
      isSystem: true,
      isActive: true,
    },
  });

  console.log('✅ Created 5 roles');

  // ============================================
  // 3. ASSIGN PERMISSIONS TO ROLES
  // ============================================
  
  // Super Admin - All permissions
  await Promise.all(
    permissions.map(permission =>
      prisma.rolePermission.create({
        data: {
          roleId: superAdminRole.id,
          permissionId: permission.id,
        },
      })
    )
  );

  // Property Manager - Property, Tax, Title Movement, Document, Approval (create/read)
  const managerPermissions = permissions.filter(p =>
    ['property', 'tax', 'title_movement', 'document'].includes(p.module) ||
    (p.module === 'approval' && ['create', 'read'].includes(p.action))
  );
  
  await Promise.all(
    managerPermissions.map(permission =>
      prisma.rolePermission.create({
        data: {
          roleId: propertyManagerRole.id,
          permissionId: permission.id,
        },
      })
    )
  );

  // Approver - Read properties, full approval permissions, read audit
  const approverPermissions = permissions.filter(p =>
    (p.module === 'property' && p.action === 'read') ||
    (p.module === 'approval' && ['read', 'approve', 'reject'].includes(p.action)) ||
    (p.module === 'tax' && p.action === 'read') ||
    (p.module === 'title_movement' && p.action === 'read') ||
    (p.module === 'document' && p.action === 'read') ||
    (p.module === 'audit' && p.action === 'read')
  );
  
  await Promise.all(
    approverPermissions.map(permission =>
      prisma.rolePermission.create({
        data: {
          roleId: approverRole.id,
          permissionId: permission.id,
        },
      })
    )
  );

  // Finance Manager - Full tax permissions, read property, read title movements, read documents
  const financePermissions = permissions.filter(p =>
    p.module === 'tax' ||
    (p.module === 'property' && p.action === 'read') ||
    (p.module === 'title_movement' && p.action === 'read') ||
    (p.module === 'document' && p.action === 'read') ||
    (p.module === 'audit' && p.action === 'read')
  );
  
  await Promise.all(
    financePermissions.map(permission =>
      prisma.rolePermission.create({
        data: {
          roleId: financeRole.id,
          permissionId: permission.id,
        },
      })
    )
  );

  // Viewer - Read-only permissions
  const viewerPermissions = permissions.filter(p => 
    p.action === 'read' && 
    !['user', 'role', 'system'].includes(p.module)
  );
  
  await Promise.all(
    viewerPermissions.map(permission =>
      prisma.rolePermission.create({
        data: {
          roleId: viewerRole.id,
          permissionId: permission.id,
        },
      })
    )
  );

  console.log('✅ Assigned permissions to roles');

  // ============================================
  // 4. CREATE ADMIN USER
  // ============================================
  const hashedPassword = await bcrypt.hash('P455W00asrd!@#', 10);

  const admin = await prisma.user.create({
    data: {
      firstName: 'System',
      lastName: 'Administrator',
      email: 'admin@rdcorp.com.ph',
      password: hashedPassword,
      roleId: superAdminRole.id,
      department: 'IT',
      position: 'System Administrator',
      isActive: true,
    },
  });

  console.log('✅ Created admin user');

  // ============================================
  // 5. CREATE SYSTEM CONFIG
  // ============================================
  await prisma.systemConfig.createMany({
    data: [
      {
        key: 'company_name',
        value: 'RD Corporation',
        description: 'Official company name',
        isActive: true,
      },
      {
        key: 'company_email',
        value: 'admin@rdcorp.com.ph',
        description: 'Company contact email address',
        isActive: true,
      },
      {
        key: 'tax_rate',
        value: '0.02',
        description: 'Real property tax rate (2%)',
        isActive: true,
      },
      {
        key: 'penalty_rate',
        value: '0.02',
        description: 'Monthly penalty rate for overdue taxes (2%)',
        isActive: true,
      },
      {
        key: 'notification_email',
        value: 'admin@rdcorp.com.ph',
        description: 'System notification email address',
        isActive: true,
      },
      {
        key: 'enable_email_notifications',
        value: 'true',
        description: 'Enable/disable email notifications',
        isActive: true,
      },
      {
        key: 'max_file_upload_size',
        value: '10485760',
        description: 'Maximum file upload size in bytes (10MB)',
        isActive: true,
      },
    ],
  });

  console.log('✅ Created system configuration');

  // ============================================
  // SUMMARY
  // ============================================
  console.log('\n🎉 Production seed completed successfully!\n');
  console.log('📊 Summary:');
  console.log(`   - ${permissions.length} Permissions`);
  console.log('   - 5 Roles:');
  console.log('     • Super Admin (Full Access)');
  console.log('     • Property Manager (Operations)');
  console.log('     • Approver (Workflow Approval)');
  console.log('     • Finance Manager (Tax & Finance)');
  console.log('     • Viewer (Read-Only)');
  console.log('   - 1 Admin User');
  console.log('   - 7 System Configurations\n');
  console.log('👤 Admin Credentials:');
  console.log('   Email: admin@rdcorp.com.ph');
  console.log('   Password: P455W00asrd!@#\n');
  console.log('💡 Next Steps:');
  console.log('   1. Login with admin credentials');
  console.log('   2. Create additional users as needed');
  console.log('   3. Add property titles manually through the UI');
  console.log('   4. Configure system settings as required\n');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
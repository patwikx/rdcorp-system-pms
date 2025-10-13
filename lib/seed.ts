import { PrismaClient, Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Clear existing data (optional - remove if you want to preserve data)
  await prisma.notification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.changeHistory.deleteMany();
  await prisma.approvalWorkflow.deleteMany();
  await prisma.titleMovement.deleteMany();
  await prisma.realPropertyTax.deleteMany();
  await prisma.propertyDocument.deleteMany();
  await prisma.property.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.role.deleteMany();

  console.log('✅ Cleared existing data');

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
    
    // Document permissions
    { name: 'document.create', module: 'document', action: 'create', description: 'Upload documents' },
    { name: 'document.read', module: 'document', action: 'read', description: 'View documents' },
    { name: 'document.delete', module: 'document', action: 'delete', description: 'Delete documents' },
    
    // Audit permissions
    { name: 'audit.read', module: 'audit', action: 'read', description: 'View audit logs' },
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
  const superAdminRole = await prisma.role.create({
    data: {
      name: 'Super Admin',
      description: 'Full system access with all permissions',
      isSystem: true,
      isActive: true,
    },
  });

  const propertyManagerRole = await prisma.role.create({
    data: {
      name: 'Property Manager',
      description: 'Manage properties, taxes, and title movements',
      isSystem: false,
      isActive: true,
    },
  });

  const viewerRole = await prisma.role.create({
    data: {
      name: 'Viewer',
      description: 'Read-only access to properties and reports',
      isSystem: false,
      isActive: true,
    },
  });

  console.log('✅ Created roles');

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

  // Property Manager - Property, Tax, Title Movement, Document permissions
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

  // Viewer - Read-only permissions
  const viewerPermissions = permissions.filter(p => p.action === 'read');
  
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
  // 4. CREATE USERS
  // ============================================
  const hashedAdminPassword = await bcrypt.hash('asdasd123', 10);
  const hashedUserPassword = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.create({
    data: {
      firstName: 'System',
      lastName: 'Administrator',
      email: 'admin@rdcorp.com.ph',
      password: hashedAdminPassword,
      roleId: superAdminRole.id,
      department: 'IT',
      position: 'System Administrator',
      isActive: true,
    },
  });

  const propertyManager1 = await prisma.user.create({
    data: {
      firstName: 'Maria',
      lastName: 'Santos',
      email: 'maria.santos@rdcorp.com.ph',
      password: hashedUserPassword,
      roleId: propertyManagerRole.id,
      department: 'Property Management',
      position: 'Senior Property Manager',
      isActive: true,
    },
  });

  const propertyManager2 = await prisma.user.create({
    data: {
      firstName: 'Juan',
      lastName: 'Dela Cruz',
      email: 'juan.delacruz@rdcorp.com.ph',
      password: hashedUserPassword,
      roleId: propertyManagerRole.id,
      department: 'Property Management',
      position: 'Property Manager',
      isActive: true,
    },
  });

  const viewer1 = await prisma.user.create({
    data: {
      firstName: 'Anna',
      lastName: 'Reyes',
      email: 'anna.reyes@rdcorp.com.ph',
      password: hashedUserPassword,
      roleId: viewerRole.id,
      department: 'Finance',
      position: 'Financial Analyst',
      isActive: true,
    },
  });

  const viewer2 = await prisma.user.create({
    data: {
      firstName: 'Carlos',
      lastName: 'Garcia',
      email: 'carlos.garcia@rdcorp.com.ph',
      password: hashedUserPassword,
      roleId: viewerRole.id,
      department: 'Accounting',
      position: 'Accountant',
      isActive: true,
    },
  });

  console.log('✅ Created users');

  // ============================================
  // 5. CREATE PROPERTIES
  // ============================================
  const propertiesData: Prisma.PropertyCreateInput[] = [
    {
      titleNumber: 'TCT-001-2024',
      lotNumber: 'LOT-001',
      lotArea: new Prisma.Decimal(350.50),
      location: 'Corner Bonifacio Street and Rizal Avenue',
      barangay: 'Poblacion',
      city: 'Butuan City',
      province: 'Agusan del Norte',
      zipCode: '8600',
      description: 'Prime commercial lot in the city center',
      classification: 'COMMERCIAL',
      status: 'ACTIVE',
      registeredOwner: 'RD Corporation',
      bank: 'Land Bank of the Philippines',
      custodyOfTitle: 'Main Office Vault',
      taxDeclaration: 'TD-2024-001',
      createdBy: { connect: { id: admin.id } },
    },
    {
      titleNumber: 'TCT-002-2024',
      lotNumber: 'LOT-002',
      lotArea: new Prisma.Decimal(500.00),
      location: 'Golden Ribbon Building, JP Rizal Street',
      barangay: 'Golden Ribbon',
      city: 'Butuan City',
      province: 'Agusan del Norte',
      zipCode: '8600',
      description: 'Office building with ground floor retail spaces',
      classification: 'COMMERCIAL',
      status: 'COLLATERAL',
      registeredOwner: 'RD Corporation',
      bank: 'Philippine National Bank',
      custodyOfTitle: 'PNB Main Branch',
      encumbrance: 'Mortgage with PNB - PHP 15,000,000.00',
      mortgageDetails: 'Loan amount: PHP 15M, Term: 10 years, Interest: 8% per annum',
      borrowerMortgagor: 'RD Corporation',
      taxDeclaration: 'TD-2024-002',
      createdBy: { connect: { id: propertyManager1.id } },
    },
    {
      titleNumber: 'TCT-003-2024',
      lotNumber: 'LOT-003',
      lotArea: new Prisma.Decimal(250.75),
      location: 'Montilla Boulevard',
      barangay: 'Libertad',
      city: 'Butuan City',
      province: 'Agusan del Norte',
      zipCode: '8600',
      description: 'Residential property with 2-storey house',
      classification: 'RESIDENTIAL',
      status: 'ACTIVE',
      registeredOwner: 'RD Corporation',
      custodyOfTitle: 'Main Office Vault',
      taxDeclaration: 'TD-2024-003',
      createdBy: { connect: { id: propertyManager1.id } },
    },
    {
      titleNumber: 'TCT-004-2024',
      lotNumber: 'LOT-004',
      lotArea: new Prisma.Decimal(1500.00),
      location: 'Km 5, National Highway',
      barangay: 'Baan',
      city: 'Butuan City',
      province: 'Agusan del Norte',
      zipCode: '8600',
      description: 'Warehouse facility with office space',
      classification: 'INDUSTRIAL',
      status: 'ACTIVE',
      registeredOwner: 'RD Corporation',
      custodyOfTitle: 'Main Office Vault',
      taxDeclaration: 'TD-2024-004',
      createdBy: { connect: { id: propertyManager2.id } },
    },
    {
      titleNumber: 'TCT-005-2024',
      lotNumber: 'LOT-005',
      lotArea: new Prisma.Decimal(5000.00),
      location: 'Sitio Magsaysay',
      barangay: 'Banza',
      city: 'Butuan City',
      province: 'Agusan del Norte',
      zipCode: '8600',
      description: 'Agricultural land for future development',
      classification: 'AGRICULTURAL',
      status: 'UNDER_DEVELOPMENT',
      registeredOwner: 'RD Corporation',
      custodyOfTitle: 'Main Office Vault',
      taxDeclaration: 'TD-2024-005',
      remarks: 'Planned for residential subdivision development in 2026',
      createdBy: { connect: { id: propertyManager1.id } },
    },
    {
      titleNumber: 'TCT-006-2024',
      lotNumber: 'LOT-006',
      lotArea: new Prisma.Decimal(450.00),
      location: 'Robinsons Place Complex',
      barangay: 'Guingona',
      city: 'Butuan City',
      province: 'Agusan del Norte',
      zipCode: '8600',
      description: 'Retail space in commercial complex',
      classification: 'COMMERCIAL',
      status: 'ACTIVE',
      registeredOwner: 'RD Corporation',
      custodyOfTitle: 'Main Office Vault',
      taxDeclaration: 'TD-2024-006',
      createdBy: { connect: { id: propertyManager2.id } },
    },
    {
      titleNumber: 'TCT-007-2024',
      lotNumber: 'LOT-007',
      lotArea: new Prisma.Decimal(300.00),
      location: 'J.C. Aquino Avenue',
      barangay: 'Bancasi',
      city: 'Butuan City',
      province: 'Agusan del Norte',
      zipCode: '8600',
      description: 'Mixed-use building with commercial and residential units',
      classification: 'MIXED_USE',
      status: 'ACTIVE',
      registeredOwner: 'RD Corporation',
      custodyOfTitle: 'Main Office Vault',
      taxDeclaration: 'TD-2024-007',
      createdBy: { connect: { id: admin.id } },
    },
    {
      titleNumber: 'TCT-008-2024',
      lotNumber: 'LOT-008',
      lotArea: new Prisma.Decimal(800.00),
      location: 'Brgy. Road',
      barangay: 'Lumbocan',
      city: 'Butuan City',
      province: 'Agusan del Norte',
      zipCode: '8600',
      description: 'Vacant lot for future construction',
      classification: 'RESIDENTIAL',
      status: 'ACTIVE',
      registeredOwner: 'RD Corporation',
      custodyOfTitle: 'Main Office Vault',
      taxDeclaration: 'TD-2024-008',
      createdBy: { connect: { id: propertyManager1.id } },
    },
    {
      titleNumber: 'TCT-009-2024',
      lotNumber: 'LOT-009',
      lotArea: new Prisma.Decimal(600.00),
      location: 'Capitol Drive',
      barangay: 'Diego Silang',
      city: 'Butuan City',
      province: 'Agusan del Norte',
      zipCode: '8600',
      description: 'Office building near government center',
      classification: 'INSTITUTIONAL',
      status: 'ACTIVE',
      registeredOwner: 'RD Corporation',
      custodyOfTitle: 'Main Office Vault',
      taxDeclaration: 'TD-2024-009',
      createdBy: { connect: { id: propertyManager2.id } },
    },
    {
      titleNumber: 'TCT-010-2024',
      lotNumber: 'LOT-010',
      lotArea: new Prisma.Decimal(2000.00),
      location: 'Barangay Road',
      barangay: 'Los Angeles',
      city: 'Butuan City',
      province: 'Agusan del Norte',
      zipCode: '8600',
      description: 'Industrial lot with warehouse',
      classification: 'INDUSTRIAL',
      status: 'COLLATERAL',
      registeredOwner: 'RD Corporation',
      bank: 'BDO Unibank',
      custodyOfTitle: 'BDO Butuan Branch',
      encumbrance: 'Mortgage with BDO - PHP 25,000,000.00',
      mortgageDetails: 'Loan amount: PHP 25M, Term: 15 years, Interest: 7.5% per annum',
      borrowerMortgagor: 'RD Corporation',
      taxDeclaration: 'TD-2024-010',
      createdBy: { connect: { id: admin.id } },
    },
    {
      titleNumber: 'TCT-011-2024',
      lotNumber: 'LOT-011',
      lotArea: new Prisma.Decimal(400.00),
      location: 'Langihan Road',
      barangay: 'Langihan',
      city: 'Butuan City',
      province: 'Agusan del Norte',
      zipCode: '8600',
      description: 'Townhouse development property',
      classification: 'RESIDENTIAL',
      status: 'UNDER_DEVELOPMENT',
      registeredOwner: 'RD Corporation',
      custodyOfTitle: 'Main Office Vault',
      taxDeclaration: 'TD-2024-011',
      remarks: 'Construction of 8 townhouse units in progress',
      createdBy: { connect: { id: propertyManager1.id } },
    },
    {
      titleNumber: 'TCT-012-2024',
      lotNumber: 'LOT-012',
      lotArea: new Prisma.Decimal(550.00),
      location: 'A.D. Curato Street',
      barangay: 'Obrero',
      city: 'Butuan City',
      province: 'Agusan del Norte',
      zipCode: '8600',
      description: 'Commercial building with parking facility',
      classification: 'COMMERCIAL',
      status: 'ACTIVE',
      registeredOwner: 'RD Corporation',
      custodyOfTitle: 'Main Office Vault',
      taxDeclaration: 'TD-2024-012',
      createdBy: { connect: { id: propertyManager2.id } },
    },
  ];

  const properties = await Promise.all(
    propertiesData.map(property => 
      prisma.property.create({ data: property })
    )
  );

  console.log(`✅ Created ${properties.length} properties`);

  // ============================================
  // 6. CREATE REAL PROPERTY TAXES
  // ============================================
  // Add tax records for first 6 properties
  const taxRecords: Prisma.RealPropertyTaxCreateInput[] = [];

  for (let i = 0; i < 6; i++) {
    const property = properties[i];
    
    // Q1 2024 - Paid
    taxRecords.push({
      property: { connect: { id: property.id } },
      taxYear: 2024,
      taxQuarter: 1,
      taxAmount: new Prisma.Decimal(15000 + (i * 2000)),
      isPaid: true,
      amountPaid: new Prisma.Decimal(15000 + (i * 2000)),
      paymentDate: new Date('2024-03-15'),
      officialReceiptNumber: `OR-2024-Q1-00${i + 1}`,
      paymentMethod: 'BANK_TRANSFER',
      status: 'PAID',
      dueDate: new Date('2024-03-31'),
      periodFrom: new Date('2024-01-01'),
      periodTo: new Date('2024-03-31'),
      recordedBy: { connect: { id: propertyManager1.id } },
    });

    // Q2 2024 - Paid
    taxRecords.push({
      property: { connect: { id: property.id } },
      taxYear: 2024,
      taxQuarter: 2,
      taxAmount: new Prisma.Decimal(15000 + (i * 2000)),
      isPaid: true,
      amountPaid: new Prisma.Decimal(15000 + (i * 2000)),
      paymentDate: new Date('2024-06-10'),
      officialReceiptNumber: `OR-2024-Q2-00${i + 1}`,
      paymentMethod: 'CHECK',
      status: 'PAID',
      dueDate: new Date('2024-06-30'),
      periodFrom: new Date('2024-04-01'),
      periodTo: new Date('2024-06-30'),
      recordedBy: { connect: { id: propertyManager1.id } },
    });

    // Q3 2024 - Paid
    taxRecords.push({
      property: { connect: { id: property.id } },
      taxYear: 2024,
      taxQuarter: 3,
      taxAmount: new Prisma.Decimal(15000 + (i * 2000)),
      isPaid: true,
      amountPaid: new Prisma.Decimal(15000 + (i * 2000)),
      paymentDate: new Date('2024-09-20'),
      officialReceiptNumber: `OR-2024-Q3-00${i + 1}`,
      paymentMethod: 'ONLINE_PAYMENT',
      status: 'PAID',
      dueDate: new Date('2024-09-30'),
      periodFrom: new Date('2024-07-01'),
      periodTo: new Date('2024-09-30'),
      recordedBy: { connect: { id: propertyManager2.id } },
    });

    // Q4 2024 - Due
    taxRecords.push({
      property: { connect: { id: property.id } },
      taxYear: 2024,
      taxQuarter: 4,
      taxAmount: new Prisma.Decimal(15000 + (i * 2000)),
      isPaid: false,
      status: 'OVERDUE',
      dueDate: new Date('2024-12-31'),
      periodFrom: new Date('2024-10-01'),
      periodTo: new Date('2024-12-31'),
      penalty: new Prisma.Decimal(500 + (i * 50)),
      recordedBy: { connect: { id: propertyManager1.id } },
    });
  }

  await Promise.all(
    taxRecords.map(tax => 
      prisma.realPropertyTax.create({ data: tax })
    )
  );

  console.log(`✅ Created ${taxRecords.length} tax records`);

  // ============================================
  // 7. CREATE TITLE MOVEMENTS
  // ============================================
  const titleMovement1 = await prisma.titleMovement.create({
    data: {
      property: { connect: { id: properties[1].id } },
      dateReleased: new Date('2024-08-15'),
      releasedBy: 'Maria Santos',
      purposeOfRelease: 'Mortgage processing with PNB',
      approvedBy: 'System Administrator',
      receivedByTransmittal: 'PNB-BXU-2024-0815',
      receivedByName: 'Roberto Cruz',
      turnedOverDate: new Date('2024-08-16'),
      turnedOverBy: 'Juan Dela Cruz',
      receivedByPerson: 'PNB Loan Officer - Roberto Cruz',
      movementStatus: 'RECEIVED',
      movedBy: { connect: { id: propertyManager1.id } },
    },
  });

  const titleMovement2 = await prisma.titleMovement.create({
    data: {
      property: { connect: { id: properties[9].id } },
      dateReleased: new Date('2024-09-01'),
      releasedBy: 'Juan Dela Cruz',
      purposeOfRelease: 'Loan renewal processing with BDO',
      approvedBy: 'System Administrator',
      receivedByTransmittal: 'BDO-BXU-2024-0901',
      receivedByName: 'Angelica Torres',
      turnedOverDate: new Date('2024-09-02'),
      turnedOverBy: 'Maria Santos',
      receivedByPerson: 'BDO Credit Officer - Angelica Torres',
      movementStatus: 'RECEIVED',
      movedBy: { connect: { id: propertyManager2.id } },
    },
  });

  console.log('✅ Created title movements');

  // ============================================
  // 8. CREATE NOTIFICATIONS
  // ============================================
  const notificationsData: Prisma.NotificationCreateInput[] = [
    {
      user: { connect: { id: admin.id } },
      title: 'System Update Completed',
      message: 'The property management system has been successfully updated to version 2.1.0 with enhanced features.',
      type: 'SYSTEM',
      priority: 'NORMAL',
      isRead: true,
      readAt: new Date('2024-10-01T10:30:00Z'),
    },
    {
      user: { connect: { id: propertyManager1.id } },
      title: 'Overdue Tax Payment Alert',
      message: `Property ${properties[0].titleNumber} has an overdue tax payment for Q4 2024. Please process payment immediately to avoid additional penalties.`,
      type: 'TAX',
      priority: 'HIGH',
      actionUrl: `/properties/${properties[0].id}/taxes`,
      entityType: 'Property',
      entityId: properties[0].id,
      isRead: false,
    },
    {
      user: { connect: { id: propertyManager2.id } },
      title: 'Title Movement Update',
      message: `Title for property ${properties[1].titleNumber} has been successfully received by PNB. Status updated to RECEIVED.`,
      type: 'TITLE_MOVEMENT',
      priority: 'NORMAL',
      actionUrl: `/properties/${properties[1].id}/movements`,
      entityType: 'TitleMovement',
      entityId: titleMovement1.id,
      isRead: true,
      readAt: new Date('2024-08-17T09:15:00Z'),
    },
    {
      user: { connect: { id: viewer1.id } },
      title: 'New Property Added',
      message: `A new commercial property (${properties[11].titleNumber}) has been added to the system in Obrero, Butuan City.`,
      type: 'PROPERTY',
      priority: 'LOW',
      actionUrl: `/properties/${properties[11].id}`,
      entityType: 'Property',
      entityId: properties[11].id,
      isRead: false,
    },
    {
      user: { connect: { id: propertyManager1.id } },
      title: 'Development Project Update',
      message: `Property ${properties[10].titleNumber} townhouse development is 60% complete. Expected completion date: March 2025.`,
      type: 'PROPERTY',
      priority: 'NORMAL',
      actionUrl: `/properties/${properties[10].id}`,
      entityType: 'Property',
      entityId: properties[10].id,
      isRead: false,
    },
  ];

  const notifications = await Promise.all(
    notificationsData.map(notification => 
      prisma.notification.create({ data: notification })
    )
  );

  console.log(`✅ Created ${notifications.length} notifications`);

  // ============================================
  // 9. CREATE SYSTEM CONFIG
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
    ],
  });

  console.log('✅ Created system configuration');

  // ============================================
  // SUMMARY
  // ============================================
  console.log('\n🎉 Seed completed successfully!\n');
  console.log('📊 Summary:');
  console.log(`   - ${permissions.length} Permissions`);
  console.log('   - 3 Roles (Super Admin, Property Manager, Viewer)');
  console.log('   - 5 Users');
  console.log(`   - ${properties.length} Properties`);
  console.log(`   - ${taxRecords.length} Tax Records`);
  console.log('   - 2 Title Movements');
  console.log(`   - ${notifications.length} Notifications`);
  console.log('   - 4 System Configurations\n');
  console.log('👤 Admin Credentials:');
  console.log('   Email: admin@rdcorp.com.ph');
  console.log('   Password: asdasd123\n');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
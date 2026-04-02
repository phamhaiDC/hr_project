import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // ── Branches ──────────────────────────────────────────────
  const branchHCM = await prisma.branch.create({
    data: { name: 'Ho Chi Minh City Branch' },
  });

  const branchHN = await prisma.branch.create({
    data: { name: 'Hanoi Branch' },
  });

  console.log('Branches created:', branchHCM.name, '|', branchHN.name);

  // ── Departments ────────────────────────────────────────────
  const deptIT = await prisma.department.create({
    data: { name: 'Information Technology', branchId: branchHCM.id },
  });

  const deptHR = await prisma.department.create({
    data: { name: 'Human Resources', branchId: branchHN.id },
  });

  console.log('Departments created:', deptIT.name, '|', deptHR.name);

  // ── Positions ──────────────────────────────────────────────
  const posAdmin = await prisma.position.create({
    data: { name: 'System Administrator' },
  });

  const posSWE = await prisma.position.create({
    data: { name: 'Software Engineer' },
  });

  console.log('Positions created');

  // ── Employees ──────────────────────────────────────────────
  const saltRounds = 12;
  const hashedPassword = await bcrypt.hash('password123', saltRounds);

  const adminEmp = await prisma.employee.create({
    data: {
      code: 'E001',
      fullName: 'System Admin',
      email: 'admin@company.com',
      password: hashedPassword,
      role: 'admin',
      status: 'official',
      branchId: branchHCM.id,
      departmentId: deptIT.id,
      positionId: posAdmin.id,
    },
  });

  const hrEmp = await prisma.employee.create({
    data: {
      code: 'E002',
      fullName: 'HR Manager',
      email: 'hr@company.com',
      password: hashedPassword,
      role: 'hr',
      status: 'official',
      branchId: branchHCM.id,
      departmentId: deptHR.id,
      positionId: posSWE.id,
    },
  });

  const managerEmp = await prisma.employee.create({
    data: {
      code: 'E003',
      fullName: 'Department Manager',
      email: 'manager@company.com',
      password: hashedPassword,
      role: 'manager',
      status: 'official',
      branchId: branchHCM.id,
      departmentId: deptIT.id,
      positionId: posSWE.id,
    },
  });

  const regularEmp = await prisma.employee.create({
    data: {
      code: 'E004',
      fullName: 'Regular Employee',
      email: 'employee@company.com',
      password: hashedPassword,
      role: 'employee',
      status: 'probation',
      branchId: branchHCM.id,
      departmentId: deptIT.id,
      positionId: posSWE.id,
      managerId: managerEmp.id,
    },
  });

  console.log(
    'Employees created:',
    adminEmp.email,
    '|',
    hrEmp.email,
    '|',
    managerEmp.email,
    '|',
    regularEmp.email,
  );

  // ── Leave Balance for E004 ────────────────────────────────
  await prisma.leaveBalance.create({
    data: {
      employeeId: regularEmp.id,
      total: 12,
      used: 0,
      remaining: 12,
    },
  });

  console.log('Leave balance created for E004');

  console.log('\nSeed completed successfully!');
  console.log('\nDefault accounts (password: password123):');
  console.log('  Admin    -> admin@company.com');
  console.log('  HR       -> hr@company.com');
  console.log('  Manager  -> manager@company.com');
  console.log('  Employee -> employee@company.com');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

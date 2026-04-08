const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();
async function main() {
  const hash = await bcrypt.hash('password', 12);
  await prisma.employee.updateMany({ data: { password: hash } });
  console.log('Password reset to "password" for all');
}
main();

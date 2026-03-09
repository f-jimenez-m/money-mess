import { PrismaClient, AccountType, CategoryType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Check if default user exists
  let user = await prisma.user.findFirst({
    where: { email: 'demo@example.com' },
  });

  if (!user) {
    const passwordHash = await bcrypt.hash('password123', 10);
    user = await prisma.user.create({
      data: {
        email: 'demo@example.com',
        passwordHash,
      },
    });
    console.log(`✓ Created demo user: ${user.email}`);
  } else {
    console.log(`✓ Demo user already exists: ${user.email}`);
  }

  // Create default accounts
  const accountsData: Array<{ name: string; type: AccountType; currency: string }> = [
    { name: 'Cash', type: 'CASH', currency: 'USD' },
    { name: 'Main Bank Account', type: 'BANK', currency: 'USD' },
  ];

  for (const accountData of accountsData) {
    const existingAccount = await prisma.account.findFirst({
      where: {
        userId: user.id,
        name: accountData.name,
      },
    });

    if (!existingAccount) {
      await prisma.account.create({
        data: {
          userId: user.id,
          name: accountData.name,
          type: accountData.type,
          currency: accountData.currency,
        },
      });
      console.log(`✓ Created account: ${accountData.name}`);
    } else {
      console.log(`✓ Account already exists: ${accountData.name}`);
    }
  }

  // Create default categories
  const categoriesData: Array<{
    name: string;
    type: CategoryType;
    color: string;
    icon: string;
  }> = [
    // Income categories
    { name: 'Salary', type: 'INCOME', color: '#10B981', icon: 'briefcase' },
    { name: 'Freelance', type: 'INCOME', color: '#3B82F6', icon: 'code' },
    { name: 'Bonus', type: 'INCOME', color: '#F59E0B', icon: 'gift' },
    { name: 'Investment Returns', type: 'INCOME', color: '#8B5CF6', icon: 'trending-up' },
    // Expense categories
    { name: 'Groceries', type: 'EXPENSE', color: '#EF4444', icon: 'shopping-cart' },
    { name: 'Transport', type: 'EXPENSE', color: '#06B6D4', icon: 'car' },
    { name: 'Entertainment', type: 'EXPENSE', color: '#EC4899', icon: 'film' },
    { name: 'Utilities', type: 'EXPENSE', color: '#F97316', icon: 'zap' },
    { name: 'Loan', type: 'EXPENSE', color: '#6B7280', icon: 'credit-card' },
    { name: 'Subscription', type: 'EXPENSE', color: '#14B8A6', icon: 'calendar' },
    { name: 'Healthcare', type: 'EXPENSE', color: '#DC2626', icon: 'heart' },
    { name: 'Education', type: 'EXPENSE', color: '#7C3AED', icon: 'book' },
  ];

  for (const categoryData of categoriesData) {
    const existingCategory = await prisma.category.findFirst({
      where: {
        userId: user.id,
        name: categoryData.name,
      },
    });

    if (!existingCategory) {
      await prisma.category.create({
        data: {
          userId: user.id,
          name: categoryData.name,
          type: categoryData.type,
          color: categoryData.color,
          icon: categoryData.icon || null,
        },
      });
      console.log(`✓ Created category: ${categoryData.name}`);
    } else {
      console.log(`✓ Category already exists: ${categoryData.name}`);
    }
  }

  console.log('✅ Database seed completed!');
}

main()
  .catch((error) => {
    console.error('❌ Seed error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

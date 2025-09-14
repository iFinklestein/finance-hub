import { Account, Transaction, Subscription, Budget, UserPrefs } from "@/api/entities";
import { format, addDays, subDays } from "date-fns";

const CATEGORIES = [
  'Groceries', 'Rent', 'Utilities', 'Entertainment', 'Subscriptions', 
  'Transportation', 'Healthcare', 'Shopping', 'Dining', 'Other'
];

export async function generateInitialData() {
  // Clear any previous demo data to avoid duplicates
  await deleteAllData();
  
  // Create Accounts
  const createdAccounts = await Account.bulkCreate([
    { name: "Demo Checking", type: "Checking", balance: 1200, bank_name: "Demo Bank", account_number_last_4: "1234", is_demo: true },
    { name: "Demo Credit Card", type: "Credit Card", balance: -250, bank_name: "Demo Credit", account_number_last_4: "5678", is_demo: true },
    { name: "Savings", type: "Savings", balance: 10000, bank_name: "Demo Bank", account_number_last_4: "9012", is_demo: true },
  ]);
  
  const checkingId = createdAccounts.find(a => a.name === "Demo Checking")?.id;
  const creditId = createdAccounts.find(a => a.name === "Demo Credit Card")?.id;

  if (!checkingId || !creditId) {
    console.error("Could not find demo account IDs");
    return;
  }
  
  // Create Transactions
  const today = new Date();
  const transactionsToCreate = [
    { account_id: checkingId, date: format(subDays(today, 15), 'yyyy-MM-dd'), description: "Paycheck", amount: 2500, category: "Income" },
    { account_id: checkingId, date: format(subDays(today, 30), 'yyyy-MM-dd'), description: "Paycheck", amount: 2500, category: "Income" },
    { account_id: checkingId, date: format(subDays(today, 1), 'yyyy-MM-dd'), description: "Rent", amount: -1500, category: "Rent" },
    { account_id: creditId, date: format(subDays(today, 3), 'yyyy-MM-dd'), description: "Netflix", amount: -15.99, category: "Subscriptions", is_recurring: true },
    { account_id: creditId, date: format(subDays(today, 5), 'yyyy-MM-dd'), description: "Spotify", amount: -9.99, category: "Subscriptions", is_recurring: true },
    { account_id: creditId, date: format(subDays(today, 3), 'yyyy-MM-dd'), description: "Groceries at Safeway", amount: -124.30, category: "Groceries" },
    { account_id: creditId, date: format(subDays(today, 10), 'yyyy-MM-dd'), description: "Groceries at Trader Joe's", amount: -65.40, category: "Groceries" },
    { account_id: creditId, date: format(subDays(today, 4), 'yyyy-MM-dd'), description: "Dinner with friends", amount: -55.00, category: "Dining" },
    { account_id: creditId, date: format(subDays(today, 11), 'yyyy-MM-dd'), description: "Amazon Purchase", amount: -49.99, category: "Shopping" },
    { account_id: creditId, date: format(subDays(today, 8), 'yyyy-MM-dd'), description: "Gas at Shell", amount: -45.00, category: "Transportation" },
  ];
  await Transaction.bulkCreate(transactionsToCreate);
  
  // Create Subscriptions
  const subscriptionsToCreate = [
    { name: 'Netflix', monthly_cost: 15.99, next_renewal_date: format(addDays(today, 27), 'yyyy-MM-dd'), category: 'Entertainment' },
    { name: 'Spotify', monthly_cost: 9.99, next_renewal_date: format(addDays(today, 25), 'yyyy-MM-dd'), category: 'Music' },
  ];
  await Subscription.bulkCreate(subscriptionsToCreate);
  
  // Create Budgets
  const currentMonthYear = format(today, 'yyyy-MM');
  const budgetsToCreate = CATEGORIES.map(category => ({
    category,
    monthly_limit: category === 'Rent' ? 1500 : category === 'Groceries' ? 400 : 200,
    month_year: currentMonthYear,
  }));
  await Budget.bulkCreate(budgetsToCreate);
  
  // Create UserPrefs
  await UserPrefs.create({
    monthly_income: 5000,
    currency_symbol: '$',
    notifications_enabled: true
  });
}

export async function deleteAllData() {
  const entities = [Transaction, Subscription, Budget, Account, UserPrefs];
  for (const entity of entities) {
    try {
      const records = await entity.list();
      for (const record of records) {
        await entity.delete(record.id);
      }
    } catch (e) {
      console.error(`Error clearing ${entity.name}:`, e);
    }
  }
}
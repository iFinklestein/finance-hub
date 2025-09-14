import React, { useState, useEffect } from "react";
import { Account } from "@/api/entities";
import { Transaction } from "@/api/entities";
import { Subscription } from "@/api/entities";
import { UserPrefs } from "@/api/entities";
import { generateInitialData } from "@/components/DemoDataManager";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  DollarSign, 
  CreditCard, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  Target,
  Calendar,
  PlusCircle
} from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Dashboard() {
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [userPrefs, setUserPrefs] = useState(null);
  const [monthlyStats, setMonthlyStats] = useState({
    income: 0,
    expenses: 0,
    netFlow: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      setIsLoading(true);
      try {
        const existingAccounts = await Account.list();
        if (existingAccounts.length === 0) {
          setIsSeeding(true);
          await generateInitialData();
          setIsSeeding(false);
        }
        await loadData();
      } catch (error) {
        console.error("Error initializing app:", error);
      } finally {
        setIsLoading(false);
      }
    };
    initializeApp();
  }, []);

  const loadData = async () => {
    try {
      const [accountsData, transactionsData, subscriptionsData, prefsData] = await Promise.all([
        Account.list(),
        Transaction.list("-date"),
        Subscription.list(),
        UserPrefs.list()
      ]);
      
      setAccounts(accountsData);
      setTransactions(transactionsData);
      setSubscriptions(subscriptionsData);
      setUserPrefs(prefsData[0]);
      
      // Calculate monthly stats
      const now = new Date();
      const monthStart = startOfMonth(now);
      const monthEnd = endOfMonth(now);
      
      const monthlyTransactions = transactionsData.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate >= monthStart && transactionDate <= monthEnd;
      });
      
      const income = monthlyTransactions
        .filter(t => t.amount > 0)
        .reduce((sum, t) => sum + t.amount, 0);
      
      const expenses = Math.abs(monthlyTransactions
        .filter(t => t.amount < 0)
        .reduce((sum, t) => sum + t.amount, 0));
      
      setMonthlyStats({
        income,
        expenses,
        netFlow: income - expenses
      });
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  const getTotalBalance = () => {
    return accounts.reduce((sum, account) => sum + (account.balance || 0), 0);
  };

  const getTotalSubscriptions = () => {
    return subscriptions
      .filter(s => !s.is_canceled)
      .reduce((sum, s) => sum + (s.monthly_cost || 0), 0);
  };

  const getSafeToSpend = () => {
    const monthlyIncome = userPrefs?.monthly_income || 0;
    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    const currentDay = new Date().getDate();
    const daysRemaining = daysInMonth - currentDay + 1;
    
    if (daysRemaining <= 0) return 0;
    
    const remainingAfterExpenses = monthlyIncome - monthlyStats.expenses;
    return Math.max(0, remainingAfterExpenses / daysRemaining);
  };

  const currencySymbol = userPrefs?.currency_symbol || "$";

  if (isSeeding) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-green-500 mb-4"></div>
        <h2 className="text-2xl font-semibold mb-2">Setting up your dashboard...</h2>
        <p className="text-gray-400">Generating demo data for your first run.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-900 min-h-screen">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Financial Dashboard</h1>
          <p className="text-gray-400">Welcome to Finance Hub - Your complete financial overview</p>
        </div>
        <div className="flex gap-3">
          <Link to={createPageUrl("Accounts")}>
            <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700">
              <PlusCircle className="w-4 h-4 mr-2" />
              Add Account
            </Button>
          </Link>
          <Link to={createPageUrl("Transactions")}>
            <Button className="bg-green-500 hover:bg-green-600">
              <PlusCircle className="w-4 h-4 mr-2" />
              Add Transaction
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Balance</p>
                <p className="text-2xl font-bold text-white">
                  {currencySymbol}{getTotalBalance().toLocaleString()}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Monthly Spending</p>
                <p className="text-2xl font-bold text-white">
                  {currencySymbol}{monthlyStats.expenses.toLocaleString()}
                </p>
              </div>
              <TrendingDown className="w-8 h-8 text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Active Subscriptions</p>
                <p className="text-2xl font-bold text-white">
                  {currencySymbol}{getTotalSubscriptions().toFixed(2)}
                </p>
                <p className="text-xs text-gray-500">
                  {subscriptions.filter(s => !s.is_canceled).length} active
                </p>
              </div>
              <CreditCard className="w-8 h-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Safe to Spend Today</p>
                <p className="text-2xl font-bold text-green-400">
                  {currencySymbol}{getSafeToSpend().toFixed(2)}
                </p>
              </div>
              <Target className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Accounts */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white">Account Overview</CardTitle>
            <Link to={createPageUrl("Accounts")}>
              <Button variant="ghost" size="sm" className="text-green-400 hover:bg-green-500/20">
                View All
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-4">
            {accounts.slice(0, 3).map((account) => (
              <div key={account.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-700/30">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    account.balance >= 0 ? 'bg-green-400' : 'bg-red-400'
                  }`} />
                  <div>
                    <p className="font-medium text-white text-sm">{account.name}</p>
                    <p className="text-gray-400 text-xs">{account.type}</p>
                  </div>
                </div>
                <p className={`font-semibold ${
                  account.balance >= 0 ? 'text-white' : 'text-red-400'
                }`}>
                  {currencySymbol}{Math.abs(account.balance).toLocaleString()}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white">Recent Transactions</CardTitle>
            <Link to={createPageUrl("Transactions")}>
              <Button variant="ghost" size="sm" className="text-green-400 hover:bg-green-500/20">
                View All
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-4">
            {transactions.slice(0, 5).map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-700/30">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    transaction.amount >= 0 ? 'bg-green-400' : 'bg-red-400'
                  }`} />
                  <div>
                    <p className="font-medium text-white text-sm">{transaction.description}</p>
                    <p className="text-gray-400 text-xs">{format(new Date(transaction.date), "MMM d")}</p>
                  </div>
                </div>
                <p className={`font-semibold ${
                  transaction.amount >= 0 ? 'text-green-400' : 'text-white'
                }`}>
                  {transaction.amount >= 0 ? '+' : ''}{currencySymbol}{Math.abs(transaction.amount).toLocaleString()}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Upcoming Renewals */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white">Upcoming Renewals</CardTitle>
            <Link to={createPageUrl("Subscriptions")}>
              <Button variant="ghost" size="sm" className="text-green-400 hover:bg-green-500/20">
                Manage
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-4">
            {subscriptions
              .filter(s => !s.is_canceled)
              .slice(0, 4)
              .map((subscription) => (
              <div key={subscription.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-700/30">
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="font-medium text-white text-sm">{subscription.name}</p>
                    <p className="text-gray-400 text-xs">
                      {format(new Date(subscription.next_renewal_date), "MMM d")}
                    </p>
                  </div>
                </div>
                <p className="font-semibold text-white">
                  {currencySymbol}{subscription.monthly_cost.toFixed(2)}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
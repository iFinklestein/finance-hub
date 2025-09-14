import React, { useState, useEffect } from "react";
import { Budget as BudgetEntity } from "@/api/entities";
import { Transaction } from "@/api/entities";
import { UserPrefs } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Target,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Edit,
  Plus,
  DollarSign,
  Calendar
} from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const categoryIcons = {
  'Groceries': '🛒',
  'Rent': '🏠',
  'Utilities': '⚡',
  'Entertainment': '🎬',
  'Subscriptions': '📱',
  'Transportation': '🚗',
  'Healthcare': '⚕️',
  'Shopping': '🛍️',
  'Dining': '🍽️',
  'Other': '📦'
};

const categoryColors = {
  'Groceries': 'bg-green-500',
  'Rent': 'bg-blue-500',
  'Utilities': 'bg-yellow-500',
  'Entertainment': 'bg-purple-500',
  'Subscriptions': 'bg-pink-500',
  'Transportation': 'bg-orange-500',
  'Healthcare': 'bg-red-500',
  'Shopping': 'bg-indigo-500',
  'Dining': 'bg-amber-500',
  'Other': 'bg-gray-500'
};

export default function Budget() {
  const [budgets, setBudgets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [userPrefs, setUserPrefs] = useState(null);
  const [editingBudget, setEditingBudget] = useState(null);
  const [newBudgetAmount, setNewBudgetAmount] = useState('');
  const [safeToSpend, setSafeToSpend] = useState(0);
  const [monthlyStats, setMonthlyStats] = useState({
    totalBudget: 0,
    totalSpent: 0,
    remaining: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const currentMonth = format(new Date(), 'yyyy-MM');
      const [budgetsData, transactionsData, prefsData] = await Promise.all([
        BudgetEntity.list(),
        Transaction.list(),
        UserPrefs.list()
      ]);

      setBudgets(budgetsData);
      setTransactions(transactionsData);
      setUserPrefs(prefsData[0]);

      // Calculate current month spending
      const now = new Date();
      const monthStart = startOfMonth(now);
      const monthEnd = endOfMonth(now);
      
      const thisMonthTransactions = transactionsData.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate >= monthStart && transactionDate <= monthEnd && t.amount < 0;
      });

      // Update budgets with current spending
      const updatedBudgets = await Promise.all(budgetsData.map(async (budget) => {
        const categorySpending = thisMonthTransactions
          .filter(t => t.category === budget.category)
          .reduce((sum, t) => sum + Math.abs(t.amount), 0);

        if (budget.current_spend !== categorySpending) {
          await BudgetEntity.update(budget.id, { ...budget, current_spend: categorySpending });
        }

        return {
          ...budget,
          current_spend: categorySpending
        };
      }));

      setBudgets(updatedBudgets);

      // Calculate monthly stats
      const totalBudget = updatedBudgets.reduce((sum, b) => sum + b.monthly_limit, 0);
      const totalSpent = updatedBudgets.reduce((sum, b) => sum + b.current_spend, 0);
      
      setMonthlyStats({
        totalBudget,
        totalSpent,
        remaining: totalBudget - totalSpent
      });

      // Calculate Safe to Spend
      const monthlyIncome = prefsData[0]?.monthly_income || 0;
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const currentDay = now.getDate();
      const daysRemaining = daysInMonth - currentDay + 1;
      
      const remainingAfterExpenses = monthlyIncome - totalSpent;
      const dailySafeSpend = daysRemaining > 0 ? Math.max(0, remainingAfterExpenses / daysRemaining) : 0;
      setSafeToSpend(dailySafeSpend);

    } catch (error) {
      console.error("Error loading budget data:", error);
    }
    setIsLoading(false);
  };

  const handleEditBudget = async (budgetId, newAmount) => {
    try {
      await BudgetEntity.update(budgetId, { monthly_limit: parseFloat(newAmount) });
      setEditingBudget(null);
      setNewBudgetAmount('');
      loadData();
    } catch (error) {
      console.error("Error updating budget:", error);
    }
  };

  const createMissingBudgets = async () => {
    const currentMonth = format(new Date(), 'yyyy-MM');
    const categories = ['Groceries', 'Rent', 'Utilities', 'Entertainment', 'Subscriptions', 'Transportation', 'Healthcare', 'Shopping', 'Dining', 'Other'];
    const existingCategories = budgets.map(b => b.category);
    const missingCategories = categories.filter(cat => !existingCategories.includes(cat));

    const newBudgets = missingCategories.map(category => ({
      category,
      monthly_limit: category === 'Rent' ? 1500 : category === 'Groceries' ? 400 : 200,
      month_year: currentMonth,
      current_spend: 0
    }));

    if (newBudgets.length > 0) {
      await BudgetEntity.bulkCreate(newBudgets);
      loadData();
    }
  };

  const getBudgetStatus = (budget) => {
    const percentage = (budget.current_spend / budget.monthly_limit) * 100;
    if (percentage >= 100) return { status: 'over', color: 'text-red-400', icon: AlertTriangle };
    if (percentage >= 80) return { status: 'warning', color: 'text-amber-400', icon: AlertTriangle };
    return { status: 'good', color: 'text-green-400', icon: CheckCircle };
  };

  const currencySymbol = userPrefs?.currency_symbol || "$";

  return (
    <div className="p-6 space-y-6 bg-gray-900 min-h-screen">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Budget Coach</h1>
          <p className="text-gray-400">Track your spending and stay within budget</p>
        </div>
        <Button
          onClick={createMissingBudgets}
          className="bg-green-500 hover:bg-green-600"
        >
          <Plus className="w-4 h-4 mr-2" />
          Setup Budgets
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Safe to Spend Today</p>
                <p className="text-2xl font-bold text-green-400">
                  {currencySymbol}{safeToSpend.toFixed(2)}
                </p>
              </div>
              <Target className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Monthly Budget</p>
                <p className="text-2xl font-bold text-white">
                  {currencySymbol}{monthlyStats.totalBudget.toLocaleString()}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Spent</p>
                <p className="text-2xl font-bold text-white">
                  {currencySymbol}{monthlyStats.totalSpent.toLocaleString()}
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
                <p className="text-gray-400 text-sm">Remaining</p>
                <p className={`text-2xl font-bold ${monthlyStats.remaining >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {currencySymbol}{monthlyStats.remaining.toLocaleString()}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Budget Categories */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            {format(new Date(), "MMMM yyyy")} Budget
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-green-500 mx-auto mb-4"></div>
              <p className="text-gray-400">Loading budget data...</p>
            </div>
          ) : budgets.length === 0 ? (
            <div className="text-center py-16">
              <Target className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No budgets set up yet</h3>
              <p className="text-gray-400 mb-6">Create budget categories to track your spending.</p>
              <Button onClick={createMissingBudgets} className="bg-green-500 hover:bg-green-600">
                <Plus className="w-4 h-4 mr-2" />
                Setup Budget Categories
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {budgets.map((budget) => {
                const percentage = Math.min(100, (budget.current_spend / budget.monthly_limit) * 100);
                const { status, color, icon: StatusIcon } = getBudgetStatus(budget);
                
                return (
                  <div key={budget.id} className="p-4 rounded-lg border border-gray-700/50 hover:bg-gray-700/30 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 ${categoryColors[budget.category]} rounded-lg flex items-center justify-center text-lg`}>
                          {categoryIcons[budget.category]}
                        </div>
                        <div>
                          <h3 className="font-medium text-white">{budget.category}</h3>
                          <p className="text-gray-400 text-sm">
                            {currencySymbol}{budget.current_spend.toFixed(2)} of {currencySymbol}{budget.monthly_limit.toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <StatusIcon className={`w-5 h-5 ${color}`} />
                        <Badge variant="outline" className={`${color.replace('text-', 'border-').replace('400', '500/30')} ${color}`}>
                          {percentage.toFixed(0)}%
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingBudget(budget);
                            setNewBudgetAmount(budget.monthly_limit.toString());
                          }}
                          className="border-gray-600 text-gray-300 hover:bg-gray-700"
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Progress 
                        value={percentage} 
                        className="h-2"
                      />
                      <div className="flex justify-between text-xs text-gray-400">
                        <span>Spent: {currencySymbol}{budget.current_spend.toFixed(2)}</span>
                        <span>Remaining: {currencySymbol}{Math.max(0, budget.monthly_limit - budget.current_spend).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Budget Dialog */}
      {editingBudget && (
        <Dialog open={!!editingBudget} onOpenChange={() => setEditingBudget(null)}>
          <DialogContent className="bg-gray-800 border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-white">Edit {editingBudget.category} Budget</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="budget-amount" className="text-gray-300">Monthly Budget Amount</Label>
                <Input
                  id="budget-amount"
                  type="number"
                  value={newBudgetAmount}
                  onChange={(e) => setNewBudgetAmount(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                  placeholder="Enter amount"
                />
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setEditingBudget(null)} className="border-gray-600 text-gray-300">
                  Cancel
                </Button>
                <Button 
                  onClick={() => handleEditBudget(editingBudget.id, newBudgetAmount)}
                  className="bg-green-500 hover:bg-green-600"
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
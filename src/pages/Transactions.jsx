import React, { useState, useEffect } from "react";
import { Transaction } from "@/api/entities";
import { Account } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  ArrowUpRight, 
  ArrowDownRight,
  Filter,
  Plus
} from "lucide-react";
import { format } from "date-fns";

import AddTransactionDialog from "../components/accounts/AddTransactionDialog";
import TransactionExplainDialog from "../components/accounts/TransactionExplainDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

const categoryColors = {
  'Groceries': 'bg-green-500/20 text-green-400 border-green-500/30',
  'Rent': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'Utilities': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  'Entertainment': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  'Subscriptions': 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  'Transportation': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  'Healthcare': 'bg-red-500/20 text-red-400 border-red-500/30',
  'Shopping': 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  'Dining': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  'Income': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  'Other': 'bg-gray-500/20 text-gray-400 border-gray-500/30'
};

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [filters, setFilters] = useState({
    search: "",
    category: "all",
    account: "all",
    type: "all"
  });
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [transactionsData, accountsData] = await Promise.all([
        Transaction.list("-date"),
        Account.list()
      ]);
      setTransactions(transactionsData);
      setAccounts(accountsData);
    } catch (error) {
      console.error("Error loading transactions:", error);
    }
    setIsLoading(false);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const getAccountName = (accountId) => {
    const account = accounts.find(a => a.id === accountId);
    return account ? account.name : 'N/A';
  };

  const filteredTransactions = transactions.filter(t => {
    const searchMatch = filters.search === "" || t.description.toLowerCase().includes(filters.search.toLowerCase());
    const categoryMatch = filters.category === "all" || t.category === filters.category;
    const accountMatch = filters.account === "all" || t.account_id === filters.account;
    const typeMatch = filters.type === "all" || (filters.type === "income" && t.amount > 0) || (filters.type === "expense" && t.amount < 0);

    return searchMatch && categoryMatch && accountMatch && typeMatch;
  });

  return (
    <div className="p-6 space-y-6 bg-gray-900 min-h-screen">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Transactions</h1>
          <p className="text-gray-400">Review your income and expenses</p>
        </div>
        <Button
          onClick={() => setShowAddDialog(true)}
          className="bg-green-500 hover:bg-green-600"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Transaction
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center">
          <Filter className="w-5 h-5 text-gray-400 hidden md:block" />
          <Input
            placeholder="Search descriptions..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="bg-gray-700 border-gray-600 text-white"
          />
          <Select value={filters.category} onValueChange={(v) => handleFilterChange('category', v)}>
            <SelectTrigger className="w-full md:w-[180px] bg-gray-700 border-gray-600 text-white">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent className="bg-gray-700 border-gray-600 text-white">
              <SelectItem value="all">All Categories</SelectItem>
              {Object.keys(categoryColors).map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filters.account} onValueChange={(v) => handleFilterChange('account', v)}>
            <SelectTrigger className="w-full md:w-[180px] bg-gray-700 border-gray-600 text-white">
              <SelectValue placeholder="Account" />
            </SelectTrigger>
            <SelectContent className="bg-gray-700 border-gray-600 text-white">
              <SelectItem value="all">All Accounts</SelectItem>
              {accounts.map(acc => <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filters.type} onValueChange={(v) => handleFilterChange('type', v)}>
            <SelectTrigger className="w-full md:w-[120px] bg-gray-700 border-gray-600 text-white">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent className="bg-gray-700 border-gray-600 text-white">
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="income">Income</SelectItem>
              <SelectItem value="expense">Expense</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Transaction List */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardContent className="p-0">
          <div className="space-y-3 p-4">
            {isLoading ? (
              Array(10).fill(0).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-gray-700">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-10 h-10 rounded-full bg-gray-700" />
                    <div>
                      <Skeleton className="h-4 w-32 mb-2 bg-gray-700" />
                      <Skeleton className="h-3 w-48 bg-gray-700" />
                    </div>
                  </div>
                  <Skeleton className="h-5 w-16 bg-gray-700" />
                </div>
              ))
            ) : filteredTransactions.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-gray-400">No transactions match your filters</p>
                  <p className="text-gray-500 text-sm mt-1">Try adjusting your search criteria</p>
                </div>
            ) : (
              filteredTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-700/50 hover:bg-gray-700/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      transaction.amount > 0 ? 'bg-green-500/20' : 'bg-red-500/20'
                    }`}>
                      {transaction.amount > 0 ? (
                        <ArrowUpRight className="w-4 h-4 text-green-400" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4 text-red-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-white text-sm">{transaction.description}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <p className="text-gray-400 text-xs">{format(new Date(transaction.date), "MMM d, yyyy")}</p>
                        <Badge className={`text-xs ${categoryColors[transaction.category] || categoryColors['Other']}`}>
                          {transaction.category}
                        </Badge>
                        <Badge variant="outline" className="text-xs border-gray-600 text-gray-400">
                          {getAccountName(transaction.account_id)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className={`font-semibold ${
                        transaction.amount > 0 ? 'text-green-400' : 'text-white'
                      }`}>
                        {transaction.amount > 0 ? '+' : ''}${Math.abs(transaction.amount).toLocaleString()}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedTransaction(transaction)}
                      className="text-green-400 hover:bg-green-500/20 hidden md:inline-flex"
                    >
                      Explain
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Dialogs */}
      {showAddDialog && (
          <AddTransactionDialog
            open={showAddDialog}
            onClose={() => setShowAddDialog(false)}
            onTransactionAdded={loadData}
          />
      )}

      {selectedTransaction && (
          <TransactionExplainDialog
            open={!!selectedTransaction}
            onClose={() => setSelectedTransaction(null)}
            transaction={selectedTransaction}
          />
      )}
    </div>
  );
}
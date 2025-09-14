import React, { useState, useEffect } from "react";
import { Account, Transaction } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  CreditCard,
  Building,
  Wallet,
  TrendingUp,
  Eye,
  Edit,
  Trash2,
  Link as LinkIcon
} from "lucide-react";
import { format } from "date-fns";
import AddAccountDialog from "../components/accounts/AddAccountDialog";
import PlaidConnectDialog from "../components/accounts/PlaidConnectDialog";

const accountTypeIcons = {
  "Checking": Wallet,
  "Savings": Building,
  "Credit Card": CreditCard,
  "Investment": TrendingUp
};

const accountTypeColors = {
  "Checking": "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "Savings": "bg-green-500/20 text-green-400 border-green-500/30", 
  "Credit Card": "bg-red-500/20 text-red-400 border-red-500/30",
  "Investment": "bg-purple-500/20 text-purple-400 border-purple-500/30"
};

export default function Accounts() {
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showPlaidDialog, setShowPlaidDialog] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [accountsData, transactionsData] = await Promise.all([
        Account.list(),
        Transaction.list("-date")
      ]);
      setAccounts(accountsData);
      setTransactions(transactionsData);
    } catch (error) {
      console.error("Error loading accounts:", error);
    }
    setIsLoading(false);
  };

  const getAccountTransactions = (accountId) => {
    return transactions.filter(t => t.account_id === accountId).slice(0, 5);
  };

  const getTotalBalance = () => {
    return accounts.reduce((sum, account) => sum + (account.balance || 0), 0);
  };

  return (
    <div className="p-6 space-y-6 bg-gray-900 min-h-screen">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Accounts</h1>
          <p className="text-gray-400">Manage your financial accounts and view balances</p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => setShowPlaidDialog(true)}
            variant="outline"
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            <LinkIcon className="w-4 h-4 mr-2" />
            Connect Bank
          </Button>
          <Button
            onClick={() => setShowAddDialog(true)}
            className="bg-green-500 hover:bg-green-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Account
          </Button>
        </div>
      </div>

      {/* Summary Card */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-gray-400 text-sm mb-1">Total Balance</p>
              <p className="text-2xl font-bold text-white">${getTotalBalance().toLocaleString()}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-1">Total Accounts</p>
              <p className="text-2xl font-bold text-white">{accounts.length}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-1">Connected Banks</p>
              <p className="text-2xl font-bold text-white">
                {accounts.filter(a => a.is_demo).length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Accounts Grid */}
      <div className="grid gap-6">
        {isLoading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-green-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading accounts...</p>
          </div>
        ) : accounts.length === 0 ? (
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-16 text-center">
              <CreditCard className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No accounts yet</h3>
              <p className="text-gray-400 mb-6">Get started by adding your first account or connecting your bank.</p>
              <div className="flex gap-3 justify-center">
                <Button onClick={() => setShowPlaidDialog(true)} variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                  <LinkIcon className="w-4 h-4 mr-2" />
                  Connect Bank
                </Button>
                <Button onClick={() => setShowAddDialog(true)} className="bg-green-500 hover:bg-green-600">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Manually
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          accounts.map((account) => {
            const Icon = accountTypeIcons[account.type] || Wallet;
            const accountTransactions = getAccountTransactions(account.id);
            
            return (
              <Card key={account.id} className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${accountTypeColors[account.type] || accountTypeColors["Checking"]}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <CardTitle className="text-white text-lg">{account.name}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={accountTypeColors[account.type] || accountTypeColors["Checking"]}>
                            {account.type}
                          </Badge>
                          {account.is_demo && (
                            <Badge variant="outline" className="border-amber-500/30 text-amber-400">
                              Demo
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-2xl font-bold ${account.balance >= 0 ? 'text-white' : 'text-red-400'}`}>
                        ${Math.abs(account.balance).toLocaleString()}
                      </p>
                      {account.bank_name && (
                        <p className="text-gray-400 text-sm">{account.bank_name} ****{account.account_number_last_4}</p>
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                {accountTransactions.length > 0 && (
                  <CardContent>
                    <div className="border-t border-gray-700 pt-4">
                      <h4 className="text-white font-medium mb-3">Recent Transactions</h4>
                      <div className="space-y-2">
                        {accountTransactions.map((transaction) => (
                          <div key={transaction.id} className="flex items-center justify-between p-2 rounded bg-gray-700/30">
                            <div>
                              <p className="text-white text-sm font-medium">{transaction.description}</p>
                              <p className="text-gray-400 text-xs">{format(new Date(transaction.date), "MMM d, yyyy")}</p>
                            </div>
                            <p className={`font-semibold ${transaction.amount >= 0 ? 'text-green-400' : 'text-white'}`}>
                              {transaction.amount >= 0 ? '+' : ''}${Math.abs(transaction.amount).toLocaleString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })
        )}
      </div>

      {/* Dialogs */}
      {showAddDialog && (
        <AddAccountDialog
          open={showAddDialog}
          onClose={() => setShowAddDialog(false)}
          onAccountAdded={loadData}
        />
      )}

      {showPlaidDialog && (
        <PlaidConnectDialog
          open={showPlaidDialog}
          onClose={() => setShowPlaidDialog(false)}
          onAccountsAdded={loadData}
        />
      )}
    </div>
  );
}
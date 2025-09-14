import React, { useState, useEffect } from "react";
import { UserPrefs } from "@/api/entities";
import { Account } from "@/api/entities";
import { Transaction } from "@/api/entities";
import { Subscription } from "@/api/entities";
import { Budget } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Settings as SettingsIcon, 
  Download, 
  Trash2, 
  RefreshCw,
  Database,
  FileText,
  DollarSign,
  Bell
} from "lucide-react";
import { generateInitialData, deleteAllData } from "@/components/DemoDataManager";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";

export default function Settings() {
  const [userPrefs, setUserPrefs] = useState(null);
  const [stats, setStats] = useState({
    accounts: 0,
    transactions: 0,
    subscriptions: 0,
    budgets: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [prefsData, accountsData, transactionsData, subscriptionsData, budgetsData] = await Promise.all([
        UserPrefs.list(),
        Account.list(),
        Transaction.list(),
        Subscription.list(),
        Budget.list()
      ]);
      
      setUserPrefs(prefsData[0] || {
        monthly_income: 5000,
        daily_goal: 0,
        currency_symbol: '$',
        notifications_enabled: true
      });
      
      setStats({
        accounts: accountsData.length,
        transactions: transactionsData.length,
        subscriptions: subscriptionsData.length,
        budgets: budgetsData.length
      });
    } catch (error) {
      console.error("Error loading settings data:", error);
    }
    setIsLoading(false);
  };

  const handleSavePrefs = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      const existingPrefs = await UserPrefs.list();
      
      if (existingPrefs.length > 0) {
        await UserPrefs.update(existingPrefs[0].id, {
          ...userPrefs,
          monthly_income: parseFloat(userPrefs.monthly_income) || 0,
          daily_goal: parseFloat(userPrefs.daily_goal) || 0,
        });
      } else {
        await UserPrefs.create(userPrefs);
      }
      
      loadData();
    } catch (error) {
      console.error("Error saving preferences:", error);
    }
    
    setIsSaving(false);
  };

  const handleExportData = async (formatType) => {
    setIsExporting(true);
    try {
      const transactions = await Transaction.list();
      if (formatType === 'json') {
          const accounts = await Account.list();
          const subscriptions = await Subscription.list();
          const budgets = await Budget.list();
          const exportData = {
              exported_at: new Date().toISOString(),
              accounts, transactions, subscriptions, budgets, preferences: userPrefs
          };
          const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
          downloadBlob(blob, `finance-hub-export-${new Date().toISOString().split('T')[0]}.json`);
      } else if (formatType === 'csv') {
          const csvHeader = "Date,Account,Description,Category,Amount\n";
          const csvRows = transactions.map(t => 
              [
                  t.date,
                  t.account_id, // Could be enhanced to show account name
                  `"${t.description.replace(/"/g, '""')}"`,
                  t.category,
                  t.amount
              ].join(',')
          ).join('\n');
          const csvContent = csvHeader + csvRows;
          const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
          downloadBlob(blob, `transactions-${new Date().toISOString().split('T')[0]}.csv`);
      }
    } catch (error) {
      console.error("Error exporting data:", error);
    }
    setIsExporting(false);
  };

  const downloadBlob = (blob, fileName) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
  };

  const handleWipeData = async () => {
    setIsDeleting(true);
    try {
      await deleteAllData();
      await loadData(); // Reload data after deletion
    } catch (error) {
      console.error("Error deleting data:", error);
    }
    setIsDeleting(false);
  };

  const handleGenerateData = async () => {
    setIsGenerating(true);
    try {
      await generateInitialData();
      await loadData(); // Reload data after generation
    } catch (error) {
      console.error("Error generating demo data:", error);
    }
    setIsGenerating(false);
  };

  return (
    <div className="p-6 space-y-6 bg-gray-900 min-h-screen">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
          <p className="text-gray-400">Configure your application preferences and manage data</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* General Preferences */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-400" />
                Financial Preferences
              </CardTitle>
            </CardHeader>
            <CardContent>
              {userPrefs && (
                <form onSubmit={handleSavePrefs} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="monthly_income" className="text-gray-300">Monthly Income</Label>
                      <Input
                        id="monthly_income"
                        type="number"
                        value={userPrefs.monthly_income}
                        onChange={(e) => setUserPrefs({ ...userPrefs, monthly_income: e.target.value })}
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="currency_symbol" className="text-gray-300">Currency</Label>
                      <Select
                        value={userPrefs.currency_symbol}
                        onValueChange={(value) => setUserPrefs({ ...userPrefs, currency_symbol: value })}
                      >
                        <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-700 border-gray-600">
                          <SelectItem value="$">USD ($)</SelectItem>
                          <SelectItem value="€">EUR (€)</SelectItem>
                          <SelectItem value="£">GBP (£)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button type="submit" disabled={isSaving} className="bg-green-500 hover:bg-green-600">
                      {isSaving ? "Saving..." : "Save Preferences"}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
          
          {/* Data Export */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Download className="w-5 h-5 text-blue-400" />
                Export Data
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col md:flex-row gap-4">
              <Button
                variant="outline"
                onClick={() => handleExportData('csv')}
                disabled={isExporting}
                className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                Export Transactions (CSV)
              </Button>
              <Button
                variant="outline"
                onClick={() => handleExportData('json')}
                disabled={isExporting}
                className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                Export All Data (JSON)
              </Button>
              <Button
                variant="outline"
                disabled
                className="flex-1 border-gray-600 text-gray-500"
              >
                Export Report (PDF) - Coming Soon
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Data Stats */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Database className="w-5 h-5 text-purple-400" />
                Data Statistics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400">Accounts</span>
                <span className="font-semibold text-white">{stats.accounts}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400">Transactions</span>
                <span className="font-semibold text-white">{stats.transactions}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400">Subscriptions</span>
                <span className="font-semibold text-white">{stats.subscriptions}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400">Budget Categories</span>
                <span className="font-semibold text-white">{stats.budgets}</span>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="bg-red-900/30 border-red-500/30">
            <CardHeader>
              <CardTitle className="text-red-400">Danger Zone</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                onClick={handleGenerateData}
                disabled={isGenerating}
                className="w-full justify-start border-amber-500/30 text-amber-400 hover:bg-amber-500/20"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
                {isGenerating ? 'Generating...' : 'Load Demo Data'}
              </Button>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full justify-start" disabled={isDeleting}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    {isDeleting ? 'Deleting...' : 'Delete All Data'}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-gray-800 border-gray-700">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-white">Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription className="text-gray-400">
                      This action cannot be undone. This will permanently delete all your accounts, transactions, and other financial data.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction asChild>
                      <Button variant="destructive" onClick={handleWipeData}>
                        Delete Data
                      </Button>
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
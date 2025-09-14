import React, { useState, useEffect, useCallback } from "react";
import { Subscription } from "@/api/entities";
import { Transaction } from "@/api/entities";
import { UserPrefs } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar,
  AlertTriangle,
  CheckCircle,
  X,
  ExternalLink,
  Plus,
  DollarSign,
  Clock
} from "lucide-react";
import { format, addDays, isWithinInterval, subDays } from "date-fns";
import AddSubscriptionDialog from "../components/subscriptions/AddSubscriptionDialog";
import CancelGuideDialog from "../components/subscriptions/CancelGuideDialog";

const categoryColors = {
  'Entertainment': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  'Software': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'News': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  'Fitness': 'bg-green-500/20 text-green-400 border-green-500/30',
  'Music': 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  'Shopping': 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  'Other': 'bg-gray-500/20 text-gray-400 border-gray-500/30'
};

export default function Subscriptions() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [userPrefs, setUserPrefs] = useState(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showCancelGuide, setShowCancelGuide] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Helper to categorize transactions - defined here so detectRecurringSubscriptions can use it
  const categorizeTransaction = (description) => {
    const desc = description.toLowerCase();
    if (desc.includes('netflix') || desc.includes('hulu') || desc.includes('disney') || desc.includes('amazon prime')) return 'Entertainment';
    if (desc.includes('spotify') || desc.includes('apple music')) return 'Music';
    if (desc.includes('adobe') || desc.includes('microsoft') || desc.includes('github')) return 'Software';
    if (desc.includes('gym') || desc.includes('fitness') || desc.includes('yoga')) return 'Fitness';
    if (desc.includes('news') || desc.includes('times') || desc.includes('post')) return 'News';
    return 'Other';
  };

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [subscriptionsData, prefsData] = await Promise.all([
        Subscription.list(),
        UserPrefs.list()
      ]);
      setSubscriptions(subscriptionsData);
      setUserPrefs(prefsData[0]);
    } catch (error) {
      console.error("Error loading subscriptions:", error);
    }
    setIsLoading(false);
  }, []);

  const detectRecurringSubscriptions = useCallback(async () => {
    try {
      // Get all transactions from the last 3 months
      const threeMonthsAgo = subDays(new Date(), 90);
      const transactions = await Transaction.list();
      const recentTransactions = transactions.filter(t => 
        new Date(t.date) >= threeMonthsAgo && t.amount < 0
      );
      
      const existingSubscriptions = await Subscription.list();

      // Group by description to find recurring patterns
      const transactionGroups = {};
      recentTransactions.forEach(t => {
        const key = t.description.toLowerCase().trim();
        if (!transactionGroups[key]) {
          transactionGroups[key] = [];
        }
        transactionGroups[key].push(t);
      });

      // Find potential subscriptions (2+ transactions with similar amounts)
      const potentialSubscriptions = [];
      Object.entries(transactionGroups).forEach(([description, txs]) => {
        if (txs.length >= 2) {
          const amounts = txs.map(t => Math.abs(t.amount));
          const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
          const isConsistent = amounts.every(amt => Math.abs(amt - avgAmount) <= 2); // Within $2
          
          if (isConsistent) {
            const existingSubscription = existingSubscriptions.find(s => 
              s.name.toLowerCase().includes(description) || 
              description.includes(s.name.toLowerCase())
            );
            
            if (!existingSubscription) {
              potentialSubscriptions.push({
                name: txs[0].description,
                monthly_cost: avgAmount,
                next_renewal_date: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
                category: categorizeTransaction(description),
                detected_from_transaction: txs[0].id
              });
            }
          }
        }
      });

      if (potentialSubscriptions.length > 0) {
        await Subscription.bulkCreate(potentialSubscriptions);
        loadData(); // Refresh the list
      }
    } catch (error) {
      console.error("Error detecting subscriptions:", error);
    }
  }, [loadData]);

  useEffect(() => {
    loadData().then(() => {
        detectRecurringSubscriptions();
    });
  }, [loadData, detectRecurringSubscriptions]);


  const handleMarkCanceled = async (subscriptionId) => {
    try {
      await Subscription.update(subscriptionId, { is_canceled: true });
      loadData();
    } catch (error) {
      console.error("Error marking subscription as canceled:", error);
    }
  };

  const getUpcomingRenewals = () => {
    const now = new Date();
    const nextWeek = addDays(now, 7);
    return subscriptions.filter(s => 
      !s.is_canceled && 
      isWithinInterval(new Date(s.next_renewal_date), { start: now, end: nextWeek })
    );
  };

  const getTotalMonthlyCost = () => {
    return subscriptions
      .filter(s => !s.is_canceled)
      .reduce((sum, s) => sum + (s.monthly_cost || 0), 0);
  };

  const getAnnualCost = () => {
    return getTotalMonthlyCost() * 12;
  };

  const currencySymbol = userPrefs?.currency_symbol || "$";
  const upcomingRenewals = getUpcomingRenewals();

  return (
    <div className="p-6 space-y-6 bg-gray-900 min-h-screen">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Subscription Buster</h1>
          <p className="text-gray-400">Track and manage your recurring subscriptions</p>
        </div>
        <Button
          onClick={() => setShowAddDialog(true)}
          className="bg-green-500 hover:bg-green-600"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Subscription
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Monthly Total</p>
                <p className="text-2xl font-bold text-white">
                  {currencySymbol}{getTotalMonthlyCost().toFixed(2)}
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
                <p className="text-gray-400 text-sm">Annual Cost</p>
                <p className="text-2xl font-bold text-white">
                  {currencySymbol}{getAnnualCost().toFixed(2)}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Active Subscriptions</p>
                <p className="text-2xl font-bold text-white">
                  {subscriptions.filter(s => !s.is_canceled).length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Renewals Alert */}
      {upcomingRenewals.length > 0 && (
        <Card className="bg-amber-900/30 border-amber-500/30">
          <CardHeader>
            <CardTitle className="text-amber-400 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Upcoming Renewals ({upcomingRenewals.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingRenewals.map((subscription) => (
                <div key={subscription.id} className="flex items-center justify-between p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-amber-400" />
                    <div>
                      <p className="font-medium text-white">{subscription.name}</p>
                      <p className="text-amber-400 text-sm">Renews {format(new Date(subscription.next_renewal_date), "MMM d, yyyy")}</p>
                    </div>
                  </div>
                  <p className="font-semibold text-white">
                    {currencySymbol}{subscription.monthly_cost.toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Subscriptions List */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">All Subscriptions</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-green-500 mx-auto mb-4"></div>
              <p className="text-gray-400">Loading subscriptions...</p>
            </div>
          ) : subscriptions.length === 0 ? (
            <div className="text-center py-16">
              <Calendar className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No subscriptions found</h3>
              <p className="text-gray-400 mb-6">Add your subscriptions manually or let us detect them from your transactions.</p>
              <Button onClick={() => setShowAddDialog(true)} className="bg-green-500 hover:bg-green-600">
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Subscription
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {subscriptions.map((subscription) => (
                <div key={subscription.id} className="flex items-center justify-between p-4 rounded-lg border border-gray-700/50 hover:bg-gray-700/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full ${subscription.is_canceled ? 'bg-red-400' : 'bg-green-400'}`} />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className={`font-medium ${subscription.is_canceled ? 'text-gray-400 line-through' : 'text-white'}`}>
                          {subscription.name}
                        </p>
                        <Badge className={categoryColors[subscription.category] || categoryColors['Other']}>
                          {subscription.category}
                        </Badge>
                        {subscription.is_canceled && (
                          <Badge variant="outline" className="border-red-500/30 text-red-400">
                            Canceled
                          </Badge>
                        )}
                      </div>
                      <p className="text-gray-400 text-sm">
                        {subscription.is_canceled ? 'Canceled' : `Next renewal: ${format(new Date(subscription.next_renewal_date), "MMM d, yyyy")}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className={`font-semibold ${subscription.is_canceled ? 'text-gray-400' : 'text-white'}`}>
                      {currencySymbol}{subscription.monthly_cost.toFixed(2)}/month
                    </p>
                    {!subscription.is_canceled && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setShowCancelGuide(subscription)}
                          className="border-gray-600 text-gray-300 hover:bg-gray-700"
                        >
                          <ExternalLink className="w-3 h-3 mr-1" />
                          Cancel Guide
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleMarkCanceled(subscription.id)}
                          className="border-red-500/30 text-red-400 hover:bg-red-500/20"
                        >
                          <X className="w-3 h-3 mr-1" />
                          Mark Canceled
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      {showAddDialog && (
        <AddSubscriptionDialog
          open={showAddDialog}
          onClose={() => setShowAddDialog(false)}
          onSubscriptionAdded={loadData}
        />
      )}

      {showCancelGuide && (
        <CancelGuideDialog
          open={!!showCancelGuide}
          onClose={() => setShowCancelGuide(null)}
          subscription={showCancelGuide}
        />
      )}
    </div>
  );
}
import React, { useState } from "react";
import { Account } from "@/api/entities";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Building,
  CheckCircle,
  AlertTriangle,
  Link as LinkIcon
} from "lucide-react";

export default function PlaidConnectDialog({ open, onClose, onAccountsAdded }) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);
    
    // Simulate Plaid connection delay
    setTimeout(async () => {
      try {
        // Create demo accounts to simulate Plaid connection
        await Account.bulkCreate([
          {
            name: "Demo Checking",
            type: "Checking", 
            balance: 1200,
            bank_name: "Demo Bank",
            account_number_last_4: "1234",
            is_demo: true
          },
          {
            name: "Demo Credit Card",
            type: "Credit Card",
            balance: -250,
            bank_name: "Demo Credit",
            account_number_last_4: "5678", 
            is_demo: true
          }
        ]);
        
        setIsConnected(true);
        setIsConnecting(false);
        
        // Close dialog after 2 seconds and refresh data
        setTimeout(() => {
          onAccountsAdded();
          onClose();
          setIsConnected(false);
        }, 2000);
      } catch (error) {
        console.error("Error creating demo accounts:", error);
        setIsConnecting(false);
      }
    }, 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-gray-800 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <LinkIcon className="w-5 h-5" />
            Connect Your Bank
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {!isConnected && !isConnecting && (
            <>
              <div className="text-center">
                <Building className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Connect with Plaid</h3>
                <p className="text-gray-400 text-sm">
                  Securely connect your bank accounts to automatically import transactions and balances.
                </p>
              </div>

              <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-blue-400 mt-0.5" />
                  <div>
                    <h4 className="text-blue-400 font-medium mb-1">Demo Mode</h4>
                    <p className="text-blue-300 text-sm">
                      This will create demo accounts with sample data for testing purposes.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  Bank-level security and encryption
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  Read-only access to your accounts
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  Automatic transaction categorization
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={onClose} className="border-gray-600 text-gray-300">
                  Cancel
                </Button>
                <Button onClick={handleConnect} className="bg-blue-500 hover:bg-blue-600">
                  <LinkIcon className="w-4 h-4 mr-2" />
                  Connect Bank Account
                </Button>
              </div>
            </>
          )}

          {isConnecting && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold text-white mb-2">Connecting to your bank...</h3>
              <p className="text-gray-400 text-sm">This may take a few seconds</p>
            </div>
          )}

          {isConnected && (
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Successfully Connected!</h3>
              <p className="text-gray-400 text-sm mb-4">Your demo accounts have been added.</p>
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                2 Accounts Added
              </Badge>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
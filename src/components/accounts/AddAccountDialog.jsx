import React, { useState } from "react";
import { Account } from "@/api/entities";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AddAccountDialog({ open, onClose, onAccountAdded }) {
  const [formData, setFormData] = useState({
    name: "",
    type: "Checking",
    balance: "",
    bank_name: "",
    account_number_last_4: ""
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await Account.create({
        ...formData,
        balance: parseFloat(formData.balance) || 0
      });
      onAccountAdded();
      onClose();
      setFormData({
        name: "",
        type: "Checking",
        balance: "",
        bank_name: "",
        account_number_last_4: ""
      });
    } catch (error) {
      console.error("Error creating account:", error);
    }
    
    setIsLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-gray-800 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white">Add New Account</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name" className="text-gray-300">Account Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="bg-gray-700 border-gray-600 text-white"
              placeholder="My Checking Account"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="type" className="text-gray-300">Account Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => setFormData({ ...formData, type: value })}
            >
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-700 border-gray-600">
                <SelectItem value="Checking">Checking</SelectItem>
                <SelectItem value="Savings">Savings</SelectItem>
                <SelectItem value="Credit Card">Credit Card</SelectItem>
                <SelectItem value="Investment">Investment</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="balance" className="text-gray-300">Current Balance</Label>
            <Input
              id="balance"
              type="number"
              step="0.01"
              value={formData.balance}
              onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
              className="bg-gray-700 border-gray-600 text-white"
              placeholder="1000.00"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="bank_name" className="text-gray-300">Bank Name (Optional)</Label>
            <Input
              id="bank_name"
              value={formData.bank_name}
              onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
              className="bg-gray-700 border-gray-600 text-white"
              placeholder="Chase Bank"
            />
          </div>
          
          <div>
            <Label htmlFor="account_number_last_4" className="text-gray-300">Last 4 Digits (Optional)</Label>
            <Input
              id="account_number_last_4"
              value={formData.account_number_last_4}
              onChange={(e) => setFormData({ ...formData, account_number_last_4: e.target.value })}
              className="bg-gray-700 border-gray-600 text-white"
              placeholder="1234"
              maxLength={4}
            />
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="border-gray-600 text-gray-300">
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-green-500 hover:bg-green-600">
              {isLoading ? "Adding..." : "Add Account"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
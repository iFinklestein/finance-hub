import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, Info } from "lucide-react";

// Simple rule-based "AI" for explanations
const getExplanation = (description) => {
  const desc = description.toLowerCase();
  
  if (desc.includes('netflix')) return {
    explanation: "This is a recurring payment for your Netflix video streaming subscription.",
    tip: "Review your plan. Are you paying for 4K but only watching on your phone? You could downgrade to save money."
  };
  if (desc.includes('spotify')) return {
    explanation: "This is a recurring payment for your Spotify music streaming subscription.",
    tip: "Consider a Family or Duo plan if others in your household also use Spotify. It's often cheaper than individual accounts."
  };
  if (desc.includes('starbucks')) return {
    explanation: "This is a purchase from a Starbucks coffee shop.",
    tip: "Making coffee at home can save you over $100 a month. Consider it a small change with a big impact."
  };
  if (desc.includes('groceries') || desc.includes('safeway') || desc.includes('trader joe')) return {
    explanation: "This is a purchase from a grocery store for food and household items.",
    tip: "Always shop with a list to avoid impulse buys. Buying generic brands for staple items can also cut down your bill."
  };
  if (desc.includes('rent')) return {
    explanation: "This is a payment for your monthly housing rent.",
    tip: "Housing is usually the largest expense. Ensure it's not more than 30% of your take-home pay."
  };
   if (desc.includes('paycheck') || desc.includes('deposit')) return {
    explanation: "This is income deposited into your account, likely from your employer.",
    tip: "A great habit is to 'pay yourself first' by automatically transferring a portion of each paycheck to your savings."
  };

  return {
    explanation: `This is a transaction for "${description}".`,
    tip: "Track similar expenses over time to see where your money is going and identify potential savings."
  };
};

export default function TransactionExplainDialog({ open, onClose, transaction }) {
  if (!transaction) return null;

  const { explanation, tip } = getExplanation(transaction.description);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-gray-800 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white">Transaction Explained</DialogTitle>
          <DialogDescription className="text-gray-400">
            AI-powered insights into your spending.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="p-4 rounded-lg bg-gray-700/50">
            <h4 className="font-semibold text-white mb-1">{transaction.description}</h4>
            <p className={`font-bold text-xl ${transaction.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
              {transaction.amount > 0 ? '+' : '-'}${Math.abs(transaction.amount).toLocaleString()}
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 flex-shrink-0 bg-blue-500/20 rounded-full flex items-center justify-center">
                <Info className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h5 className="font-semibold text-white mb-1">What is this?</h5>
                <p className="text-gray-300 text-sm">{explanation}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 flex-shrink-0 bg-amber-500/20 rounded-full flex items-center justify-center">
                <Lightbulb className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h5 className="font-semibold text-white mb-1">Coaching Tip</h5>
                <p className="text-gray-300 text-sm">{tip}</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
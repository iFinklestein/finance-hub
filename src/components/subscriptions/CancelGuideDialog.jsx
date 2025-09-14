import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink, Info } from "lucide-react";

// Simple hardcoded guide for canceling subscriptions
const getCancelInfo = (subscription) => {
  const name = subscription.name.toLowerCase();
  
  if (name.includes('netflix')) return {
    steps: "Go to Netflix.com, log in, navigate to 'Account', and click 'Cancel Membership'.",
    url: "https://www.netflix.com/cancelplan"
  };
  if (name.includes('spotify')) return {
    steps: "Log in to spotify.com/account, go to 'Your plan', and click 'CHANGE PLAN'. Scroll to Spotify Free and click 'CANCEL PREMIUM'.",
    url: "https://www.spotify.com/account/subscription/cancel/"
  };
  if (name.includes('amazon prime')) return {
    steps: "Go to your Amazon Prime membership page, click 'Manage Membership', then 'End Membership'.",
    url: "https://www.amazon.com/prime/central"
  };

  // Default guide
  return {
    steps: `The easiest way to cancel '${subscription.name}' is to search online for "how to cancel ${subscription.name}". Look for an official support or account page.`,
    url: `https://www.google.com/search?q=how+to+cancel+${encodeURIComponent(subscription.name)}`
  };
};

export default function CancelGuideDialog({ open, onClose, subscription }) {
  if (!subscription) return null;

  const { steps, url } = getCancelInfo(subscription);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-gray-800 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white">Cancel Guide for {subscription.name}</DialogTitle>
          <DialogDescription className="text-gray-400">
            Follow these steps to cancel your subscription.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="flex items-start gap-3 p-4 rounded-lg bg-gray-700/50">
            <Info className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <h5 className="font-semibold text-white mb-1">Cancellation Steps</h5>
              <p className="text-gray-300 text-sm">{steps}</p>
            </div>
          </div>
          
          <Button 
            asChild
            className="w-full bg-blue-500 hover:bg-blue-600"
          >
            <a href={url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4 mr-2" />
              Go to Cancellation Page
            </a>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
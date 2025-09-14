
import React, { useState } from "react";
import { Subscription } from "@/api/entities";
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
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";

const subscriptionCategories = ["Entertainment", "Software", "News", "Fitness", "Music", "Shopping", "Other"];

export default function AddSubscriptionDialog({ open, onClose, onSubscriptionAdded }) {
  const [formData, setFormData] = useState({
    name: "",
    monthly_cost: "",
    next_renewal_date: new Date(),
    category: "Other",
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await Subscription.create({
        ...formData,
        monthly_cost: parseFloat(formData.monthly_cost) || 0,
        next_renewal_date: formData.next_renewal_date ? format(formData.next_renewal_date, 'yyyy-MM-dd') : null
      });
      onSubscriptionAdded();
      onClose();
    } catch (error) { // Fixed syntax error here: removed `=>` from catch block
      console.error("Error creating subscription:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-gray-800 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white">Add New Subscription</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name" className="text-gray-300">Service Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="bg-gray-700 border-gray-600 text-white"
              placeholder="e.g. Netflix"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="monthly_cost" className="text-gray-300">Monthly Cost</Label>
              <Input
                id="monthly_cost"
                type="number"
                step="0.01"
                value={formData.monthly_cost}
                onChange={(e) => setFormData({ ...formData, monthly_cost: e.target.value })}
                className="bg-gray-700 border-gray-600 text-white"
                placeholder="15.99"
                required
              />
            </div>
            <div>
              <Label htmlFor="category" className="text-gray-300">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent className="bg-gray-700 border-gray-600">
                  {subscriptionCategories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <Label htmlFor="date" className="text-gray-300">Next Renewal Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className="w-full justify-start text-left font-normal bg-gray-700 border-gray-600 text-white"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.next_renewal_date ? format(formData.next_renewal_date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-gray-800 border-gray-700">
                <Calendar
                  mode="single"
                  selected={formData.next_renewal_date}
                  onSelect={(date) => setFormData({...formData, next_renewal_date: date})}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="border-gray-600 text-gray-300">
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-green-500 hover:bg-green-600">
              {isLoading ? "Adding..." : "Add Subscription"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

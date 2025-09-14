
import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  LayoutDashboard,
  CreditCard,
  Calendar,
  Target,
  Settings,
  Receipt,
  DollarSign
} from "lucide-react";

const sidebarLinks = [
  { name: "Dashboard", icon: LayoutDashboard, path: "Dashboard" },
  { name: "Accounts", icon: CreditCard, path: "Accounts" },
  { name: "Transactions", icon: Receipt, path: "Transactions" },
  { name: "Subscriptions", icon: Calendar, path: "Subscriptions" },
  { name: "Budget", icon: Target, path: "Budget" },
  { name: "Settings", icon: Settings, path: "Settings" }
];

export default function Layout({ children, currentPageName }) {
  return (
    <div className="flex min-h-screen bg-gray-900">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800/50 border-r border-gray-700 flex-shrink-0">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-white">Finance Hub</h1>
          </div>
          
          <nav className="space-y-2">
            {sidebarLinks.map((link) => {
              const isActive = currentPageName === link.path;
              const Icon = link.icon;
              
              return (
                <Link
                  key={link.path}
                  to={createPageUrl(link.path)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    isActive
                      ? "bg-green-500/20 text-green-400 border border-green-500/30"
                      : "text-gray-300 hover:bg-gray-700/50 hover:text-white"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{link.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
        
        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 w-64 p-6 border-t border-gray-700">
          <div className="text-xs text-gray-500">
            <p>Finance Hub v1.0</p>
            <p>Your personal finance assistant</p>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
}

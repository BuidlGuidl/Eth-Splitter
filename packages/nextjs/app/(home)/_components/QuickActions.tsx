"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowUpDown, ChevronRight, Plus } from "lucide-react";

interface QuickAction {
  title: string;
  description: string;
  icon: React.ReactNode;
  action: () => void;
  buttonText: string;
  color: string;
}

interface QuickActionsProps {
  className?: string;
}

export const QuickActions: React.FC<QuickActionsProps> = ({ className = "" }) => {
  const router = useRouter();

  const quickActions: QuickAction[] = [
    {
      title: "Create New Split",
      description: "Initiate a new transaction to split ETH or other tokens among multiple recipients.",
      icon: <ArrowUpDown className="w-6 h-6" />,
      action: () => router.push("/split"),
      buttonText: "Start Split",
      color: "bg-primary",
    },
    {
      title: "Add New Address",
      description: "Add a new wallet address to your contact list.",
      icon: <Plus className="w-6 h-6" />,
      action: () => router.push("/contacts"),
      buttonText: "Add Contact",
      color: "bg-success",
    },
  ];

  return (
    <div className={className}>
      <h2 className="text-2xl font-bold mb-6">Quick Actions</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {quickActions.map((action, index) => (
          <motion.div
            key={action.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="group"
          >
            <div className="rounded-2xl p-6 shadow-md hover:shadow-lg transition-all duration-300 h-full flex flex-col bg-secondary">
              <div
                className={`${action.color} w-14 h-14 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
              >
                {action.icon}
              </div>
              <h3 className="text-lg font-semibold mb-2">{action.title}</h3>
              <p className="mb-6 flex-grow">{action.description}</p>
              <button onClick={action.action} className={`${action.color} btn btn-md rounded-md`}>
                {action.buttonText}
                <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

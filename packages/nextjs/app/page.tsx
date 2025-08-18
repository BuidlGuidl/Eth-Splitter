"use client";

import React, { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUpDown,
  Check,
  ChevronRight,
  Copy,
  Edit,
  Eye,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Upload,
  Users,
} from "lucide-react";
import { Address } from "~~/components/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

const mockContacts = [
  { address: "0x1c873c172662c3774D089aB967911bC32C04bb08", label: null },
  { address: "0x1c873c172662c3774D089aB967911bC32C04bb08", label: "Savings" },
  { address: "0x1c873c172662c3774D089aB967911bC32C04bb08", label: "Donations" },
  { address: "0x1c873c172662c3774D089aB967911bC32C04bb08", label: "Staking Pool" },
  { address: "0x1c873c172662c3774D089aB967911bC32C04bb08", label: "NFT Trades" },
];

export default function DashboardLayout() {
  const pathname = usePathname();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [contacts, setContacts] = useState(mockContacts);

  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    notification.success("Address copied to clipboard");
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  const handleDeleteContact = (address: string) => {
    setContacts(contacts.filter(c => c.address !== address));
    notification.success("Contact deleted successfully");
  };

  const filteredContacts = contacts.filter(
    contact =>
      contact.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.label?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const quickActions = [
    {
      title: "Create New Split",
      description: "Initiate a new transaction to split your ETH or other tokens among multiple recipients.",
      icon: <ArrowUpDown className="w-6 h-6" />,
      action: () => router.push("/split-configuration"),
      buttonText: "Start Split",
      color: "bg-primary",
    },
    {
      title: "Add New Address",
      description: "Manually add a new cryptocurrency wallet address to your contact list.",
      icon: <Plus className="w-6 h-6" />,
      action: () => router.push("/contacts"),
      buttonText: "Add Contact",
      color: "bg-success",
    },
  ];

  return (
    <div className="max-w-6xl px-4 mx-auto py-10">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <div className="bg-gradient-to-r from-primary  to-secondary rounded-3xl p-8 shadow-md">
          <div className="flex items-center mb-4">
            <Sparkles className="w-8 h-8 mr-3 animate-pulse" />
            <h1 className="text-4xl font-bold">Welcome to SplitETH: Your Decentralized Crypto Splitter</h1>
          </div>
          <p className="text-lg opacity-95 max-w-3xl">
            Effortlessly manage your digital assets and distribute funds with precision and transparency. Get started by
            configuring your splits or organizing your contacts.
          </p>
        </div>
      </motion.div>

      <div className="mb-10">
        <h2 className="text-2xl font-bold  mb-6">Quick Actions</h2>
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
                  className={`${action.color} w-14 h-14 rounded-xl flex items-center justify-center  mb-4 group-hover:scale-110 transition-transform duration-300`}
                >
                  {action.icon}
                </div>
                <h3 className="text-lg font-semibold  mb-2">{action.title}</h3>
                <p className="mb-6 flex-grow">{action.description}</p>
                <button onClick={action.action} className={` ${action.color} btn btn-md rounded-md`}>
                  {action.buttonText}
                  <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Your Saved Contacts</h2>
          <button onClick={() => router.push("/contacts")} className="btn btn-md btn-ghost py-1">
            Manage All Contacts
            <ChevronRight className="w-4 h-4 ml-1" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search contacts by name, address, or label..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
            />
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className=" rounded-2xl shadow-md overflow-hidden border border-base-100"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-base-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">Address</th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">Label</th>
                  <th className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-base-100 ">
                <AnimatePresence>
                  {filteredContacts.length > 0 ? (
                    filteredContacts.map((contact, index) => (
                      <motion.tr
                        key={contact.address}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-secondary transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <Address address={contact.address} />
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-secondary text-blue-800  dark:text-blue-400">
                            {contact.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleDeleteContact(contact.address)}
                              className="btn btn-ghost text-error"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="px-6 py-6 text-center">
                        <div className="flex flex-col items-center">
                          <Users className="w-12 h-12 text-gray-400 mb-3" />
                          <p className="">No contacts found</p>
                          <button
                            onClick={() => router.push("/contacts")}
                            className="mt-4 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                          >
                            Add your first contact
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

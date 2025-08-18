"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, ChevronRight, Edit, Search, Trash2, Users } from "lucide-react";
import { Address } from "~~/components/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";
import { Contact } from "~~/utils/splitter";

interface SavedContactsnotificationProps {
  contacts: Contact[];
  onDeleteContact?: (address: string) => void;
  onEditContact?: (contact: Contact) => void;
  showManageButton?: boolean;
  title?: string;
  className?: string;
}

export const SavedContacts: React.FC<SavedContactsnotificationProps> = ({
  contacts,
  onDeleteContact,
  onEditContact,
  showManageButton = true,
  title = "Your Saved Contacts",
  className = "",
}) => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredContacts = contacts.filter(
    contact =>
      contact.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.label?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleDeleteContact = (address: string) => {
    if (onDeleteContact) {
      onDeleteContact(address);
      notification.success("Contact deleted successfully");
    }
  };

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h2>
        {showManageButton && (
          <button onClick={() => router.push("/contacts")} className="btn btn-md btn-ghost py-1">
            Manage All Contacts
            <ChevronRight className="w-4 h-4 ml-1" />
          </button>
        )}
      </div>

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
        className="rounded-2xl shadow-md overflow-hidden border border-base-100"
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
            <tbody className="divide-y divide-base-100">
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
                        <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-secondary text-blue-800 dark:text-blue-400">
                          {contact.label || "-"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          {onEditContact && (
                            <button
                              onClick={() => onEditContact(contact)}
                              className="btn btn-ghost text-primary"
                              title="Edit contact"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}
                          {onDeleteContact && (
                            <button
                              onClick={() => handleDeleteContact(contact.address)}
                              className="btn btn-ghost text-error"
                              title="Delete contact"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))
                ) : contacts.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-12">
                      <div className="flex flex-col items-center">
                        <AlertCircle className="w-12 h-12 text-gray-400 mb-3" />
                        <p className="text-gray-600 dark:text-gray-400">No contacts added yet</p>
                        <button
                          onClick={() => router.push("/contacts")}
                          className="mt-4 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                        >
                          Add your first contact
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr>
                    <td colSpan={3} className="px-6 py-6 text-center">
                      <div className="flex flex-col items-center">
                        <Users className="w-12 h-12 text-gray-400 mb-3" />
                        <p className="text-gray-600 dark:text-gray-400">No contacts found</p>
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
  );
};

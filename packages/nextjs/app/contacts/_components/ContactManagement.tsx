"use client";

import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Edit, Trash2 } from "lucide-react";
import { Address, InputBase } from "~~/components/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";
import { Contact, updateContact } from "~~/utils/splitter";

const MAX_LABEL_LENGTH = 25;

interface ContactManagementProps {
  contacts: Contact[];
  onContactsChange: (contacts: Contact[]) => void;
  onDeleteContact: (address: string) => void;
  className?: string;
}

export const ContactManagement: React.FC<ContactManagementProps> = ({
  contacts,
  onContactsChange,
  onDeleteContact,
  className = "",
}) => {
  const [editingContact, setEditingContact] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");

  const handleLabelChange = (value: string) => {
    if (value.length <= MAX_LABEL_LENGTH) {
      setEditLabel(value);
    }
  };

  const handleStartEdit = (contact: Contact) => {
    setEditingContact(contact.address);
    setEditLabel(contact.label || "");
  };

  const handleSaveEdit = (address: string) => {
    if (!editLabel.trim()) {
      notification.error("Label cannot be empty");
      return;
    }

    const updatedContacts = contacts.map(contact =>
      contact.address === address ? { ...contact, label: editLabel } : contact,
    );

    onContactsChange(updatedContacts);
    updateContact(address, editLabel);
    setEditingContact(null);
    setEditLabel("");
    notification.success("Contact updated successfully");
  };

  const handleCancelEdit = () => {
    setEditingContact(null);
    setEditLabel("");
  };

  const handleDeleteAddress = (address: string) => {
    onDeleteContact(address);
    notification.success("Contact deleted successfully");
  };

  return (
    <div className={className}>
      <h2 className="text-xl font-semibold mb-6">Saved Contacts</h2>
      <p className="mb-6">Review and manage your contacts.</p>

      {contacts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">No addresses added yet</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-base-100">
              <tr>
                <th className="text-left pb-3 text-sm font-medium">Address</th>
                <th className="text-left pb-3 text-sm font-medium pl-8">Label</th>
                <th className="text-left pb-3 text-sm font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-base-100 w-full">
              <AnimatePresence>
                {contacts.map(contact => (
                  <motion.tr
                    key={contact.address}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="group"
                  >
                    <td className="px-2 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <Address address={contact.address} />
                      </div>
                    </td>
                    <td className="pl-8">
                      {editingContact === contact.address ? (
                        <div className="flex items-start space-x-2">
                          <div className="flex flex-col">
                            <InputBase
                              value={editLabel}
                              onChange={handleLabelChange}
                              placeholder="Enter label"
                              maxLength={MAX_LABEL_LENGTH}
                            />
                            <span className="text-xs text-gray-500 mt-1">
                              {editLabel.length}/{MAX_LABEL_LENGTH}
                            </span>
                          </div>
                          <button onClick={() => handleSaveEdit(contact.address)} className="btn btn-sm btn-success">
                            <Check className="w-4 h-4" />
                          </button>
                          <button onClick={handleCancelEdit} className="btn btn-sm btn-ghost">
                            ×
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <span className="text-sm" title={contact.label}>
                            {contact.label || "-"}
                          </span>
                          <button
                            onClick={() => handleStartEdit(contact)}
                            className="btn btn-sm btn-ghost md:opacity-0 md:group-hover:opacity-100 transition-opacity "
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="">
                      <button
                        onClick={() => handleDeleteAddress(contact.address)}
                        className="btn btn-sm rounded-md text-error btn-ghost"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

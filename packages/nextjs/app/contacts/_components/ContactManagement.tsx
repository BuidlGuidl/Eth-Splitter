"use client";

import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronLeft, ChevronRight, Download, Edit, Search, Trash2 } from "lucide-react";
import { normalize } from "viem/ens";
import { useEnsAddress } from "wagmi";
import { Address, InputBase } from "~~/components/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";
import { Contact, updateContact } from "~~/utils/splitter";

const MAX_LABEL_LENGTH = 25;
const CONTACTS_PER_PAGE = 10;

interface ContactManagementProps {
  contacts: Contact[];
  onContactsChange: (contacts: Contact[]) => void;
  onDeleteContact: (address: string) => void;
  onExport: () => void;
  className?: string;
}

export const ContactManagement: React.FC<ContactManagementProps> = ({
  contacts,
  onContactsChange,
  onDeleteContact,
  onExport,
  className = "",
}) => {
  const [editingContact, setEditingContact] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const isEnsName = debouncedSearchTerm.includes(".eth");

  const { data: resolvedAddress } = useEnsAddress({
    name: isEnsName ? normalize(debouncedSearchTerm) : undefined,
  });

  const filteredContacts = useMemo(() => {
    let filtered = contacts;

    if (debouncedSearchTerm) {
      const search = debouncedSearchTerm.toLowerCase();

      filtered = contacts.filter(contact => {
        const addressMatch = contact.address.toLowerCase().includes(search);

        const labelMatch = contact.label?.toLowerCase().includes(search);

        const ensMatch = resolvedAddress && contact.address.toLowerCase() === resolvedAddress.toLowerCase();

        return addressMatch || labelMatch || ensMatch;
      });
    }

    return filtered.sort((a, b) => {
      const labelA = (a.label || "").toLowerCase();
      const labelB = (b.label || "").toLowerCase();

      if (!labelA && !labelB) return 0;
      if (!labelA) return 1;
      if (!labelB) return -1;

      return labelA.localeCompare(labelB);
    });
  }, [contacts, debouncedSearchTerm, resolvedAddress]);

  const totalPages = Math.ceil(filteredContacts.length / CONTACTS_PER_PAGE);
  const startIndex = (currentPage - 1) * CONTACTS_PER_PAGE;
  const endIndex = startIndex + CONTACTS_PER_PAGE;
  const paginatedContacts = filteredContacts.slice(startIndex, endIndex);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm]);

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

    const newTotalPages = Math.ceil((filteredContacts.length - 1) / CONTACTS_PER_PAGE);
    if (currentPage > newTotalPages && newTotalPages > 0) {
      setCurrentPage(newTotalPages);
    }
  };

  const PaginationControls = () => {
    if (totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-base-100">
        <div className="text-sm text-base-content/60">
          Showing {startIndex + 1}-{Math.min(endIndex, filteredContacts.length)} of {filteredContacts.length}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="btn btn-sm btn-ghost"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
              if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`btn btn-sm ${page === currentPage ? "btn-primary" : "btn-ghost"}`}
                  >
                    {page}
                  </button>
                );
              } else if (page === currentPage - 2 || page === currentPage + 2) {
                return (
                  <span key={page} className="px-2">
                    ...
                  </span>
                );
              }
              return null;
            })}
          </div>

          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="btn btn-sm btn-ghost"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className={className}>
      <div className="flex flex-col items-center justify-between mb-6">
        <div className="flex justify-between w-full items-start">
          <div>
            <h2 className="text-xl font-semibold">Saved Contacts</h2>
            <p className="text-sm text-base-content/60 mt-1">
              {contacts.length} total contact{contacts.length !== 1 ? "s" : ""}
            </p>
          </div>

          <button onClick={onExport} className="btn btn-md rounded-md bg-primary mt-6">
            <Download className="w-5 h-5 mr-2" />
            Export Addresses (CSV)
          </button>
        </div>

        {contacts.length > CONTACTS_PER_PAGE && (
          <div className="relative mr-auto mt-2 w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-base-content/40" />
            <input
              type="text"
              placeholder="Search by address, ENS, or label..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="input input-sm pl-9 w-full rounded-md"
            />
            {isEnsName && resolvedAddress && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <span className="text-xs text-success">✓ ENS resolved</span>
              </div>
            )}
          </div>
        )}
      </div>

      {filteredContacts.length === 0 ? (
        <div className="text-center py-12 bg-base-100 rounded-lg">
          {searchTerm ? (
            <>
              <p className="text-gray-600 dark:text-gray-400">
                No contacts match &quot;{searchTerm}&quot;
                {isEnsName && !resolvedAddress && " (ENS name not found)"}
              </p>
              <button onClick={() => setSearchTerm("")} className="mt-2 text-primary hover:text-primary-focus">
                Clear search
              </button>
            </>
          ) : (
            <p className="text-gray-600 dark:text-gray-400">No addresses added yet</p>
          )}
        </div>
      ) : (
        <>
          <div className="overflow-x-auto bg-base-200 border border-base-100 p-2 rounded-lg shadow-lg">
            <table className="w-full">
              <thead className="border-b border-base-200 bg-base-200/50">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium">Address</th>
                  <th className="text-left px-4 py-3 text-sm font-medium">Label</th>
                  <th className="text-right px-4 py-3 text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-base-200">
                <AnimatePresence initial={false}>
                  {paginatedContacts.map(contact => (
                    <motion.tr
                      key={contact.address}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0, transition: { duration: 0.2 } }}
                      transition={{ duration: 0.2 }}
                      className="group hover:bg-base-200/30 transition-colors"
                    >
                      <td className="px-2 py-3">
                        <Address address={contact.address} />
                      </td>
                      <td className="px-4 py-3">
                        {editingContact === contact.address ? (
                          <div className="flex items-center gap-2">
                            <InputBase value={editLabel} onChange={handleLabelChange} placeholder="Enter label" />
                            <span className="text-xs text-base-content/60">
                              {editLabel.length}/{MAX_LABEL_LENGTH}
                            </span>
                            <button
                              onClick={() => handleSaveEdit(contact.address)}
                              className="btn btn-sm btn-success btn-circle"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                            <button onClick={handleCancelEdit} className="btn btn-sm btn-ghost btn-circle">
                              ×
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-sm px-2 py-1 bg-base-200 rounded">{contact.label || "-"}</span>
                            <button
                              onClick={() => handleStartEdit(contact)}
                              className="btn btn-sm btn-ghost btn-circle opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Edit className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="px-2 py-3 text-right">
                        <button
                          onClick={() => handleDeleteAddress(contact.address)}
                          className="btn btn-sm btn-ghost text-error hover:bg-error/10"
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

          <PaginationControls />
        </>
      )}
    </div>
  );
};

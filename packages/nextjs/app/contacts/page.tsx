"use client";

import React, { useEffect, useState } from "react";
import { AddressImport } from "./_components/AddressImport";
import { ContactManagement } from "./_components/ContactManagement";
import { motion } from "framer-motion";
import Papa from "papaparse";
import { notification } from "~~/utils/scaffold-eth";
import { Contact, loadContacts, removeContact } from "~~/utils/splitter";

export default function Contacts() {
  const [addresses, setAddresses] = useState<Contact[]>([]);

  useEffect(() => {
    const loadedContacts = loadContacts();
    setAddresses(loadedContacts);
  }, []);

  const handleContactsAdded = (newContacts: Contact[]) => {
    const updatedAddresses = [...addresses, ...newContacts];
    setAddresses(updatedAddresses);
  };

  const handleContactsChange = (updatedContacts: Contact[]) => {
    setAddresses(updatedContacts);
  };

  const handleDeleteContact = (address: string) => {
    const updatedAddresses = addresses.filter(c => c.address !== address);
    setAddresses(updatedAddresses);
    removeContact(address);
  };

  const handleExport = () => {
    const csvContent = Papa.unparse(
      addresses.map(a => ({
        address: a.address,
        label: a.label,
      })),
    );

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "addresses.csv";
    link.click();
    notification.success("Addresses exported successfully");
  };

  return (
    <div className="max-w-7xl w-full mx-auto py-10 min-h-screen px-2">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold mb-8">Address Management</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          <AddressImport existingContacts={addresses} onContactsAdded={handleContactsAdded} onExport={handleExport} />

          <div className="md:border-l border-base-100 px-4">
            <ContactManagement
              contacts={addresses}
              onContactsChange={handleContactsChange}
              onDeleteContact={handleDeleteContact}
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}

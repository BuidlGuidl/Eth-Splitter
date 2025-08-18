"use client";

import React, { useEffect, useState } from "react";
import { QuickActions } from "./_components/QuickActions";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { SavedContacts } from "~~/components/SavedContacts";
import { Contact, loadContacts, removeContact } from "~~/utils/splitter";

export default  function Home() {
  const [contacts, setContacts] = useState<Contact[]>([]);

  useEffect(() => {
    const loadedContacts = loadContacts();
    setContacts(loadedContacts);
  }, []);

  const handleDeleteContact = (address: string) => {
    const updatedContacts = contacts.filter(c => c.address !== address);
    setContacts(updatedContacts);
    removeContact(address);
  };

  return (
    <div className="max-w-6xl px-4 mx-auto py-10 w-full">
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
        <QuickActions />
      </div>

      <SavedContacts contacts={contacts} onDeleteContact={handleDeleteContact} showManageButton={true} />
    </div>
  );
}

// utils/splitter.ts
const CONTACTS_STORAGE_KEY = "ES_CONTACTS_SK";
const CACHE_STORAGE_KEY = "ES_CACHE_SK";

export interface Contact {
  address: string;
  label: string;
}

export interface SplitCache {
  wallets: string[];
  amounts: string[];
  amount: string;
  expiry: number;
}

// Contact Management Functions
export const saveContacts = (contacts: Contact[]) => {
  if (typeof window !== "undefined") {
    const savedContacts = window.localStorage.getItem(CONTACTS_STORAGE_KEY);

    if (savedContacts) {
      const contactsObj: Contact[] = JSON.parse(savedContacts);
      contacts.forEach(contact => {
        // Check if contact with same address already exists
        const existingContactIndex = contactsObj.findIndex(
          c => c.address.toLowerCase() === contact.address.toLowerCase(),
        );
        if (existingContactIndex >= 0) {
          // Update existing contact's label
          contactsObj[existingContactIndex] = contact;
        } else {
          // Add new contact
          contactsObj.push(contact);
        }
      });
      window.localStorage.setItem(CONTACTS_STORAGE_KEY, JSON.stringify(contactsObj));
    } else {
      window.localStorage.setItem(CONTACTS_STORAGE_KEY, JSON.stringify(contacts));
    }
  }
};

export const loadContacts = (): Contact[] => {
  if (typeof window !== "undefined") {
    const contacts = window.localStorage.getItem(CONTACTS_STORAGE_KEY);
    if (contacts) {
      try {
        return JSON.parse(contacts);
      } catch (error) {
        console.error("Failed to parse contacts:", error);
        return [];
      }
    }
  }
  return [];
};

export const saveContact = (address: string, label: string) => {
  saveContacts([{ address, label }]);
};

export const getContactByAddress = (address: string): Contact | null => {
  const contacts = loadContacts();
  return contacts.find(contact => contact.address.toLowerCase() === address.toLowerCase()) || null;
};

export const updateContact = (address: string, newLabel: string) => {
  if (typeof window !== "undefined") {
    const contacts = loadContacts();
    const contactIndex = contacts.findIndex(contact => contact.address.toLowerCase() === address.toLowerCase());
    if (contactIndex >= 0) {
      contacts[contactIndex].label = newLabel;
      window.localStorage.setItem(CONTACTS_STORAGE_KEY, JSON.stringify(contacts));
    }
  }
};

export const getContactLabel = (address: string): string | null => {
  const contact = getContactByAddress(address);
  return contact ? contact.label : null;
};

export const removeContact = (address: string) => {
  if (typeof window !== "undefined") {
    const contacts = loadContacts();
    const updatedContacts = contacts.filter(contact => contact.address.toLowerCase() !== address.toLowerCase());
    window.localStorage.setItem(CONTACTS_STORAGE_KEY, JSON.stringify(updatedContacts));
  }
};

// Cache Management Functions
export const loadCache = (): SplitCache | null => {
  if (typeof window !== "undefined") {
    const cachedString = localStorage.getItem(CACHE_STORAGE_KEY);
    const now = new Date().getTime();

    if (!cachedString) {
      return null;
    }

    try {
      const cacheData = JSON.parse(cachedString);

      // Check if cache has expired (30 minutes)
      if (now > cacheData.expiry) {
        localStorage.removeItem(CACHE_STORAGE_KEY);
        return null;
      }

      return {
        wallets: cacheData.wallets || [],
        amounts: cacheData.amounts || [],
        amount: cacheData.amount || "",
        expiry: cacheData.expiry,
      };
    } catch (error) {
      console.error("Failed to parse cache:", error);
      localStorage.removeItem(CACHE_STORAGE_KEY);
      return null;
    }
  }
  return null;
};

export const updateCacheWallets = (wallets: string[]) => {
  if (typeof window !== "undefined") {
    const now = new Date().getTime();
    const cachedString = localStorage.getItem(CACHE_STORAGE_KEY);

    let cacheData: SplitCache = {
      wallets: [],
      amounts: [],
      amount: "",
      expiry: now + 30 * 60 * 1000, // 30 minutes from now
    };

    if (cachedString) {
      try {
        cacheData = JSON.parse(cachedString);
      } catch (error) {
        console.error("Failed to parse cache:", error);
      }
    }

    cacheData.wallets = wallets;
    cacheData.expiry = now + 30 * 60 * 1000;
    localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(cacheData));
  }
};

export const updateCacheAmounts = (amounts: string[]) => {
  if (typeof window !== "undefined") {
    const now = new Date().getTime();
    const cachedString = localStorage.getItem(CACHE_STORAGE_KEY);

    let cacheData: SplitCache = {
      wallets: [],
      amounts: [],
      amount: "",
      expiry: now + 30 * 60 * 1000,
    };

    if (cachedString) {
      try {
        cacheData = JSON.parse(cachedString);
      } catch (error) {
        console.error("Failed to parse cache:", error);
      }
    }

    cacheData.amounts = amounts;
    cacheData.expiry = now + 30 * 60 * 1000;
    localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(cacheData));
  }
};

export const updateCacheAmount = (amount: string) => {
  if (typeof window !== "undefined") {
    const now = new Date().getTime();
    const cachedString = localStorage.getItem(CACHE_STORAGE_KEY);

    let cacheData: SplitCache = {
      wallets: [],
      amounts: [],
      amount: "",
      expiry: now + 30 * 60 * 1000,
    };

    if (cachedString) {
      try {
        cacheData = JSON.parse(cachedString);
      } catch (error) {
        console.error("Failed to parse cache:", error);
      }
    }

    cacheData.amount = amount;
    cacheData.expiry = now + 30 * 60 * 1000;
    localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(cacheData));
  }
};

export const clearCache = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem(CACHE_STORAGE_KEY);
  }
};

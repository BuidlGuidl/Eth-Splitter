const CONTACTS_STORAGE_KEY = "ES_CONTACTS_SK";
const CACHE_STORAGE_KEY = "ES_CACHE_SK";

export interface Contact {
  address: string;
  label: string;
}

export const saveContacts = (contacts: Contact[]) => {
  if (typeof window != "undefined" && window != null) {
    const savedContacts = window.localStorage.getItem(CONTACTS_STORAGE_KEY);

    if (savedContacts) {
      const contactsObj: Contact[] = JSON.parse(savedContacts);
      contacts.forEach(contact => {
        // Check if contact with same address already exists
        const existingContactIndex = contactsObj.findIndex(c => c.address === contact.address);
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
  if (typeof window != "undefined" && window != null) {
    const contacts = window.localStorage.getItem(CONTACTS_STORAGE_KEY);
    if (contacts) return JSON.parse(contacts);
  }
  return [];
};

export const saveContact = (address: string, label: string) => {
  saveContacts([{ address, label }]);
};

export const getContactByAddress = (address: string): Contact | null => {
  const contacts = loadContacts();
  if (contacts) {
    return contacts.find(contact => contact.address === address) || null;
  }
  return null;
};

export const updateContact = (address: string, newLabel: string) => {
  if (typeof window != "undefined" && window != null) {
    const contacts = loadContacts();
    const contactIndex = contacts.findIndex(contact => contact.address === address);
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
  if (typeof window != "undefined" && window != null) {
    const contacts = loadContacts();
    if (contacts) {
      const updatedContacts = contacts.filter(contact => contact.address !== address);
      window.localStorage.setItem(CONTACTS_STORAGE_KEY, JSON.stringify(updatedContacts));
    }
  }
};

export const updateContactLabel = (address: string, newLabel: string) => {
  if (typeof window != "undefined" && window != null) {
    const contacts = loadContacts();
    if (contacts) {
      const contactIndex = contacts.findIndex(contact => contact.address === address);
      if (contactIndex >= 0) {
        contacts[contactIndex].label = newLabel;
        window.localStorage.setItem(CONTACTS_STORAGE_KEY, JSON.stringify(contacts));
      }
    }
  }
};

export const loadCache = () => {
  if (typeof window != "undefined" && window != null) {
    const cachedString = localStorage.getItem(CACHE_STORAGE_KEY);
    const now = new Date().getTime();
    const item = {
      wallets: [],
      amounts: [],
      amount: "",
      expiry: now + 30 * 60 * 1000,
    };
    if (!cachedString) {
      localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(item));
      return null;
    }
    const cacheData = JSON.parse(cachedString);
    if (now > cacheData.expiry) {
      localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(item));
      return null;
    }
    return { wallets: cacheData.wallets, amounts: cacheData.amounts, amount: cacheData.amount };
  }
};

export const updateCacheWallets = (wallets: string[]) => {
  if (typeof window != "undefined" && window != null) {
    const cachedString = localStorage.getItem(CACHE_STORAGE_KEY);
    const now = new Date().getTime();
    if (cachedString) {
      const cacheData = JSON.parse(cachedString);
      cacheData.wallets = wallets;
      cacheData.expiry = now + 30 * 60 * 1000;
      localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(cacheData));
    }
  }
};

export const updateCacheAmounts = (amounts: string[]) => {
  if (typeof window != "undefined" && window != null) {
    const cachedString = localStorage.getItem(CACHE_STORAGE_KEY);
    const now = new Date().getTime();
    if (cachedString) {
      const cacheData = JSON.parse(cachedString);
      cacheData.amounts = amounts;
      cacheData.expiry = now + 30 * 60 * 1000;
      localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(cacheData));
    }
  }
};

export const updateCacheAmount = (amount: string) => {
  if (typeof window != "undefined" && window != null) {
    const cachedString = localStorage.getItem(CACHE_STORAGE_KEY);
    const now = new Date().getTime();
    if (cachedString) {
      const cacheData = JSON.parse(cachedString);
      cacheData.amount = amount;
      cacheData.expiry = now + 30 * 60 * 1000;
      localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(cacheData));
    }
  }
};

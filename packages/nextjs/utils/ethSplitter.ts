const CONTACTS_STORAGE_KEY = "ES_CONTACTS_SK";
const CACHE_STORAGE_KEY = "ES_CACHE_SK";

export const saveContacts = (contacts: string[]) => {
  if (typeof window != "undefined" && window != null) {
    const savedContacts = window.localStorage.getItem(CONTACTS_STORAGE_KEY);

    if (savedContacts) {
      const contactsObj = JSON.parse(savedContacts);
      contacts.forEach(contact => {
        if (!contactsObj.includes(contact)) {
          contactsObj.push(contact);
        }
      });
      window.localStorage.setItem(CONTACTS_STORAGE_KEY, JSON.stringify(contactsObj));
    } else window.localStorage.setItem(CONTACTS_STORAGE_KEY, JSON.stringify(contacts));
  }
};

export const loadContacts = () => {
  if (typeof window != "undefined" && window != null) {
    const contacts = window.localStorage.getItem(CONTACTS_STORAGE_KEY);
    if (contacts) return JSON.parse(contacts);
  } else return null;
};

export const loadCache = () => {
  if (typeof window != "undefined" && window != null) {
    const cachedString = localStorage.getItem(CACHE_STORAGE_KEY);
    const now = new Date().getTime();
    if (!cachedString) {
      const item = {
        wallets: [],
        amounts: [],
        amount: "",
        expiry: now + 30 * 60 * 1000,
      };
      localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(item));
      return null;
    }
    const cacheData = JSON.parse(cachedString);
    if (now > cacheData.expiry) {
      localStorage.removeItem(CACHE_STORAGE_KEY);
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

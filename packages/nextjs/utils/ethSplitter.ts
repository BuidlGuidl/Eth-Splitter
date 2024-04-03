const STORAGE_KEY = "ES_CONTACTS_SK";

export const saveContacts = (contacts: string[]) => {
  if (typeof window != "undefined" && window != null) {
    const savedContacts = window.localStorage.getItem(STORAGE_KEY);

    if (savedContacts) {
      const contactsObj = JSON.parse(savedContacts);
      contacts.forEach(contact => {
        if (!contactsObj.includes(contact)) {
          contactsObj.push(contact);
        }
      });
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(contactsObj));
    } else window.localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts));
  }
};

export const loadContacts = () => {
  if (typeof window != "undefined" && window != null) {
    const contacts = window.localStorage.getItem(STORAGE_KEY);
    if (contacts) return JSON.parse(contacts);
  } else return null;
};

import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { PlusIcon } from "@heroicons/react/24/solid";
import { Address } from "~~/components/scaffold-eth";
import { loadContacts } from "~~/utils/ethSplitter";

const Contacts = ({ setWallets, wallets }: { setWallets: Dispatch<SetStateAction<string[]>>; wallets: string[] }) => {
  const [contacts, setContacts] = useState<string[]>([]);

  useEffect(() => {
    const loadedContacts = loadContacts();
    const contacts = loadedContacts?.filter((contact: string) => !wallets.includes(contact));
    setContacts(contacts);
  }, [wallets]);

  return (
    <div className="dropdown dropdown-end">
      <div tabIndex={0} role="button" className="btn m-1 btn-primary btn-sm">
        Contacts
      </div>

      <ul tabIndex={0} className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52 max-h-72 ">
        <div className="overflow-y-scroll">
          {contacts?.length > 0 ? (
            contacts?.map((contact: string) => (
              <li key={contact}>
                <a
                  className="flex justify-between flex-row tooltip"
                  data-tip="Add to recipients"
                  onClick={() => {
                    setWallets(prevWallets => {
                      const filteredWallets = prevWallets.filter(wallet => wallet !== "");
                      return [...filteredWallets, contact];
                    });
                  }}
                >
                  <Address hideBlockie={true} hideCopyIcon={true} disableAddressLink={true} address={contact} />
                  <PlusIcon className="w-1/6" />
                </a>
              </li>
            ))
          ) : (
            <div className="p-2">Empty List</div>
          )}
        </div>
      </ul>
    </div>
  );
};

export default Contacts;

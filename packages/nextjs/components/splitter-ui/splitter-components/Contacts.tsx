import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { isAddress } from "viem";
import { Address } from "~~/components/scaffold-eth";
import { loadContacts } from "~~/utils/ethSplitter";

const Contacts = ({ setWallets, wallets }: { setWallets: Dispatch<SetStateAction<string[]>>; wallets: string[] }) => {
  const [contacts, setContacts] = useState<string[]>([]);

  useEffect(() => {
    const loadedContacts = loadContacts();
    const contacts = loadedContacts?.filter((contact: string) => !wallets.includes(contact) && isAddress(contact));
    setContacts(contacts);
  }, [wallets]);

  return (
    <div>
      <details className="dropdown dropdown-end">
        <summary tabIndex={0} role="button" className="btn m-1 btn-primary btn-sm">
          Contacts
        </summary>

        <ul tabIndex={0} className="dropdown-content menu p-2 shadow bg-base-100 rounded-box max-h-72 ">
          <div className="overflow-y-scroll">
            {contacts?.length > 0 ? (
              contacts?.map((contact: string, index) => (
                <li key={contact}>
                  <a
                    className={`flex justify-between flex-row tooltip` + (index === 0 ? ` tooltip-bottom` : ``)}
                    data-tip="Add to recipients"
                    onClick={() => {
                      setWallets(prevWallets => {
                        const filteredWallets = prevWallets.filter(wallet => wallet !== "");
                        return [...filteredWallets, contact];
                      });
                    }}
                  >
                    <Address hideBlockie={true} hideCopyIcon={true} disableAddressLink={true} address={contact} />
                  </a>
                </li>
              ))
            ) : (
              <div className="p-2">Empty List</div>
            )}
          </div>
        </ul>
      </details>
    </div>
  );
};

export default Contacts;

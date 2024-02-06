import React, { useState } from "react";
import { useRouter } from "next/router";
import { compressToEncodedURIComponent } from "lz-string";
import CopyToClipboard from "react-copy-to-clipboard";
import { ArrowDownTrayIcon, CheckCircleIcon, DocumentDuplicateIcon } from "@heroicons/react/24/outline";

const ExportList = ({ wallets, splitType }: { wallets: string[]; splitType?: string }) => {
  const router = useRouter();
  const [listCopied, setListCopied] = useState(false);
  const [listUrlCopied, setListUrlCopied] = useState(false);
  const downloadFile = () => {
    const blob = new Blob([wallets.join(", ")], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    link.download = "Recipient Addresses";
    link.click();
  };

  const walletsUri = compressToEncodedURIComponent(JSON.stringify(wallets));
  const splitUrl = `${window.location.origin}${router.pathname}?walletsUri=${walletsUri}&activeSplitType=${splitType}`;

  return (
    <div>
      <details className="dropdown my-1">
        <summary className="m-1 btn btn-primary btn-sm">Export </summary>
        <ul className="p-2 shadow menu dropdown-content z-[1] bg-base-100 rounded-box w-max">
          <li>
            {listCopied ? (
              <div className="btn-sm !rounded-xl flex gap-3 py-3">
                <CheckCircleIcon
                  className="text-xl font-normal h-6 w-4 cursor-pointer ml-2 sm:ml-0"
                  aria-hidden="true"
                />
                <span className=" whitespace-nowrap">Copy List</span>
              </div>
            ) : (
              <CopyToClipboard
                text={wallets.join(", ")}
                onCopy={() => {
                  setListCopied(true);
                  setTimeout(() => {
                    setListCopied(false);
                  }, 800);
                }}
              >
                <div className="btn-sm !rounded-xl flex gap-3 py-3">
                  <DocumentDuplicateIcon
                    className="text-xl font-normal h-6 w-4 cursor-pointer ml-2 sm:ml-0"
                    aria-hidden="true"
                  />
                  <span className=" whitespace-nowrap">Copy List</span>
                </div>
              </CopyToClipboard>
            )}
          </li>
          <li>
            <div onClick={downloadFile} className="btn-sm !rounded-xl flex gap-3 py-3">
              <ArrowDownTrayIcon
                className="text-xl font-normal h-6 w-4 cursor-pointer ml-2 sm:ml-0"
                aria-hidden="true"
              />
              <span className=" whitespace-nowrap">Export Text File</span>
            </div>
          </li>
          <li>
            {listUrlCopied ? (
              <div className="btn-sm !rounded-xl flex gap-3 py-3">
                <CheckCircleIcon
                  className="text-xl font-normal h-6 w-4 cursor-pointer ml-2 sm:ml-0"
                  aria-hidden="true"
                />
                <span className=" whitespace-nowrap">Copy List Url</span>
              </div>
            ) : (
              <CopyToClipboard
                text={splitUrl}
                onCopy={() => {
                  setListUrlCopied(true);
                  setTimeout(() => {
                    setListUrlCopied(false);
                  }, 800);
                }}
              >
                <div className="btn-sm !rounded-xl flex gap-3 py-3">
                  <DocumentDuplicateIcon
                    className="text-xl font-normal h-6 w-4 cursor-pointer ml-2 sm:ml-0"
                    aria-hidden="true"
                  />
                  <span className=" whitespace-nowrap">Copy List Url</span>
                </div>
              </CopyToClipboard>
            )}
          </li>
        </ul>
      </details>
    </div>
  );
};

export default ExportList;

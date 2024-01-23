import { useAccount } from "wagmi";
import { InformationCircleIcon } from "@heroicons/react/24/outline";
import EqualEthSplitsHistory from "~~/components/history/EqualEthSplitsHistory";
import EqualTokenSplitsHistory from "~~/components/history/EqualTokenSplitsHistory";
import EthSplitsHistory from "~~/components/history/EthSplitsHistory";
import TokenSplitsHistory from "~~/components/history/TokenSplitsHistory";
import useSpliiterHistory from "~~/hooks/useSpliiterHistory";

const History = () => {
  const { noEthSplits, noTokenSplits, loading } = useSpliiterHistory();
  const { isConnected } = useAccount();
  return (
    <div className="w-full ">
      <h1 className="font-bold font-typo-round tracking-wide my-2 mt-8 border-b py-2">HISTORY</h1>
      {loading &&
        isConnected &&
        Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="animate-pulse flex justify-between py-4">
            <div className="rounded-md bg-slate-300 h-6 w-full"></div>
          </div>
        ))}
      {!loading && isConnected && (
        <div>
          {!noEthSplits && (
            <div>
              <h1 className="font-semibold font-typo-round tracking-wide my-4">ETH SPLITS</h1>
              <EqualEthSplitsHistory />
              <EthSplitsHistory />
            </div>
          )}
          {!noTokenSplits && (
            <div>
              <h1 className="font-semibold font-typo-round tracking-wide my-4 mt-8">TOKEN SPLITS</h1>
              <EqualTokenSplitsHistory />
              <TokenSplitsHistory />
            </div>
          )}
        </div>
      )}
      {noEthSplits && noTokenSplits && (
        <div className="flex justify-center gap-1 mt-5">
          <InformationCircleIcon className="text-sm w-5 cursor-pointer" aria-hidden="true" /> No History
        </div>
      )}
    </div>
  );
};

export default History;

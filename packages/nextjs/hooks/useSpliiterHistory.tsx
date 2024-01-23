import { useEffect, useState } from "react";
import { readContract } from "@wagmi/core";
import { erc20ABI, useAccount, useNetwork } from "wagmi";
import { useScaffoldEventHistory, useScaffoldEventSubscriber } from "~~/hooks/scaffold-eth";

const useSpliiterHistory = () => {
  const [ethSplitEvents, setEthSplitEvents] = useState<any[] | undefined>([]);
  const [ethSplitEqualEvents, setEthSplitEqualEvents] = useState<any[] | undefined>([]);
  const [erc20SplitEvents, setErc20SplitEvents] = useState<any[] | undefined>([]);
  const [erc20SplitEqualEvents, setErc20SplitEqualEvents] = useState<any[] | undefined>([]);

  const { address } = useAccount();
  const { chain } = useNetwork();

  const getTokenSymbol = async (tokenAddress: string) => {
    if (tokenAddress && tokenAddress != "") {
      try {
        const data = await readContract({
          address: tokenAddress,
          abi: erc20ABI,
          functionName: "symbol",
        });
        return data;
      } catch (error) {
        console.log(error);
      }
    }
    return "";
  };

  const ethSplits = useScaffoldEventHistory({
    contractName: "ETHSplitter",
    eventName: "EthSplit",
    fromBlock: BigInt(Number(process.env.NEXT_PUBLIC_DEPLOY_BLOCK) || 0),
    blockData: true,
  });

  const ethSplitsEqual = useScaffoldEventHistory({
    contractName: "ETHSplitter",
    eventName: "EthSplitEqual",
    fromBlock: BigInt(Number(process.env.NEXT_PUBLIC_DEPLOY_BLOCK) || 0),
    blockData: true,
  });

  const erc20Splits = useScaffoldEventHistory({
    contractName: "ETHSplitter",
    eventName: "Erc20Split",
    fromBlock: BigInt(Number(process.env.NEXT_PUBLIC_DEPLOY_BLOCK) || 0),
    blockData: true,
  });

  const erc20SplitsEqual = useScaffoldEventHistory({
    contractName: "ETHSplitter",
    eventName: "Erc20SplitEqual",
    fromBlock: BigInt(Number(process.env.NEXT_PUBLIC_DEPLOY_BLOCK) || 0),
    blockData: true,
  });

  useEffect(() => {
    const events = ethSplits.data?.filter(obj => obj.args.sender === address);
    setEthSplitEvents(events);
  }, [ethSplits.isLoading, address, ethSplits.data, chain]);

  useEffect(() => {
    const events = ethSplitsEqual.data?.filter(obj => obj.args.sender === address);
    setEthSplitEqualEvents(events);
  }, [ethSplitsEqual.isLoading, address, ethSplitsEqual.data, chain]);

  useEffect(() => {
    const events = erc20Splits.data?.filter(obj => obj.args.sender === address);
    if (events) {
      const eventsWithTokenSymbol = events.map(async event => {
        const symbol = await getTokenSymbol(event.args.token);
        return {
          ...event,
          tokenSymbol: symbol,
        };
      });
      Promise.all(eventsWithTokenSymbol).then(updatedEvents => {
        setErc20SplitEvents(updatedEvents);
      });
    }
    // setErc20SplitEvents(events);
  }, [erc20Splits.isLoading, address, erc20Splits.data, chain]);

  useEffect(() => {
    const events = erc20SplitsEqual.data?.filter(obj => obj.args.sender === address);
    if (events) {
      const eventsWithTokenSymbol = events.map(async event => {
        const symbol = await getTokenSymbol(event.args.token);
        return {
          ...event,
          tokenSymbol: symbol,
        };
      });
      Promise.all(eventsWithTokenSymbol).then(updatedEvents => {
        setErc20SplitEqualEvents(updatedEvents);
      });
    }
    // setErc20SplitEqualEvents(events);
  }, [erc20SplitsEqual.isLoading, address, erc20SplitsEqual.data, chain]);

  useScaffoldEventSubscriber({
    contractName: "ETHSplitter",
    eventName: "EthSplit",
    listener: logs => {
      logs.map(log => {
        const sender = log.args.sender;
        const amounts = log.args.amounts;
        const totalAmount = log.args.totalAmount;
        const recipients = log.args.recipients;
        const newEvent = {
          args: { sender, amounts, recipients, totalAmount },
          block: { timestamp: Math.floor(Date.now() / 1000) },
          log: { transactionHash: log.transactionHash },
        };
        setEthSplitEvents(prev => {
          if (prev) {
            const updatedEvents = [newEvent, ...prev];
            return updatedEvents;
          }
          return [newEvent];
        });
      });
    },
  });

  useScaffoldEventSubscriber({
    contractName: "ETHSplitter",
    eventName: "EthSplitEqual",
    listener: logs => {
      logs.map(log => {
        const sender = log.args.sender;
        const totalAmount = log.args.totalAmount;
        const recipients = log.args.recipients;
        const newEvent = {
          args: { sender, totalAmount, recipients },
          block: { timestamp: Math.floor(Date.now() / 1000) },
          log: { transactionHash: log.transactionHash },
        };
        setEthSplitEqualEvents(prev => {
          if (prev) {
            const updatedEvents = [newEvent, ...prev];
            return updatedEvents;
          }
          return [newEvent];
        });
      });
    },
  });

  useScaffoldEventSubscriber({
    contractName: "ETHSplitter",
    eventName: "Erc20Split",
    listener: logs => {
      logs.map(async log => {
        const sender = log.args.sender;
        const amounts = log.args.amounts;
        const recipients = log.args.recipients;
        const token = log.args.token;
        const newEvent = {
          args: { sender, amounts, recipients, token },
          block: { timestamp: Math.floor(Date.now() / 1000) },
          log: { transactionHash: log.transactionHash },
          tokenSymbol: await getTokenSymbol(token as string),
        };
        setErc20SplitEvents(prev => {
          if (prev) {
            const updatedEvents = [newEvent, ...prev];
            return updatedEvents;
          }
          return [newEvent];
        });
      });
    },
  });

  useScaffoldEventSubscriber({
    contractName: "ETHSplitter",
    eventName: "Erc20SplitEqual",
    listener: logs => {
      logs.map(async log => {
        const sender = log.args.sender;
        const totalAmount = log.args.totalAmount;
        const recipients = log.args.recipients;
        const token = log.args.token;
        const newEvent = {
          args: { sender, totalAmount, recipients, token },
          block: { timestamp: Math.floor(Date.now() / 1000) },
          log: { transactionHash: log.transactionHash },
          tokenSymbol: getTokenSymbol(token as string),
        };
        setErc20SplitEqualEvents(prev => {
          if (prev) {
            const updatedEvents = [newEvent, ...prev];
            return updatedEvents;
          }
          return [newEvent];
        });
      });
    },
  });

  return {
    ethSplitEvents,
    ethSplitEqualEvents,
    erc20SplitEvents,
    erc20SplitEqualEvents,
    noEthSplits: ethSplitEvents?.length == 0 && ethSplitEqualEvents?.length == 0,
    noTokenSplits: erc20SplitEvents?.length == 0 && erc20SplitEqualEvents?.length == 0,
    loading: ethSplits.isLoading || ethSplitsEqual.isLoading || erc20Splits.isLoading || erc20SplitsEqual.isLoading,
  };
};

export default useSpliiterHistory;

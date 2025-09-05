import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { Activity, Coins, TrendingUp, Users } from "lucide-react";
import { formatUnits } from "viem";
import { useTargetNetwork } from "~~/hooks/scaffold-eth";
import type { SplitHistoryItem } from "~~/hooks/useSplitterHistory";
import { isErc20Transaction } from "~~/utils/splitterHistory";

interface HistoryStatsProps {
  history: SplitHistoryItem[];
}

export const HistoryStats: React.FC<HistoryStatsProps> = ({ history }) => {
  const { targetNetwork } = useTargetNetwork();

  const stats = useMemo(() => {
    if (history.length === 0) {
      return {
        totalSplits: 0,
        uniqueRecipients: 0,
        totalEthVolume: "0",
        totalErc20Volume: "0",
        mostUsedSplitType: "N/A",
      };
    }

    const uniqueRecipients = new Set<string>();
    let totalEthVolume = BigInt(0);
    let totalErc20Volume = BigInt(0);

    const splitTypeCounts = {
      ETH_SPLIT: 0,
      ETH_EQUAL_SPLIT: 0,
      ERC20_SPLIT: 0,
      ERC20_EQUAL_SPLIT: 0,
    };

    history.forEach(split => {
      split.recipients.forEach(r => uniqueRecipients.add(r.toLowerCase()));

      const isErc20 = isErc20Transaction(split);

      if (isErc20) {
        totalErc20Volume += BigInt(split.totalAmount);
      } else {
        totalEthVolume += BigInt(split.totalAmount);
      }

      splitTypeCounts[split.type]++;
    });

    const mostUsedType = Object.entries(splitTypeCounts).reduce((a, b) =>
      splitTypeCounts[a[0] as keyof typeof splitTypeCounts] > splitTypeCounts[b[0] as keyof typeof splitTypeCounts]
        ? a
        : b,
    );

    const typeLabels = {
      ETH_SPLIT: "ETH Custom",
      ETH_EQUAL_SPLIT: "ETH Equal",
      ERC20_SPLIT: "ERC20 Custom",
      ERC20_EQUAL_SPLIT: "ERC20 Equal",
    };

    return {
      totalSplits: history.length,
      uniqueRecipients: uniqueRecipients.size,
      totalEthVolume: formatUnits(totalEthVolume, 18),
      totalErc20Volume: formatUnits(totalErc20Volume, 18),
      mostUsedSplitType: typeLabels[mostUsedType[0] as keyof typeof typeLabels],
    };
  }, [history]);

  const formatVolume = (volume: string) => {
    const num = parseFloat(volume);
    if (num === 0) return "0";
    if (num < 0.01) return "<0.01";
    if (num < 1) return num.toFixed(3);
    if (num < 1000) return num.toFixed(2);
    if (num < 1000000) return `${(num / 1000).toFixed(1)}K`;
    return `${(num / 1000000).toFixed(2)}M`;
  };

  const statCards = [
    {
      icon: <Activity className="w-5 h-5" />,
      label: "Total Splits",
      value: stats.totalSplits.toString(),
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      icon: <Users className="w-5 h-5" />,
      label: "Unique Recipients",
      value: stats.uniqueRecipients.toString(),
      color: "text-secondary",
      bgColor: "bg-secondary/10",
    },
    {
      icon: <Coins className="w-5 h-5" />,
      label: `${targetNetwork.nativeCurrency.symbol} Volume`,
      value: formatVolume(stats.totalEthVolume),
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      icon: <TrendingUp className="w-5 h-5" />,
      label: "Most Used",
      value: stats.mostUsedSplitType,
      color: "text-success",
      bgColor: "bg-success/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {statCards.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="card bg-base-100 shadow-md border border-base-300"
        >
          <div className="card-body p-4">
            <div className={`inline-flex p-2 rounded-lg ${stat.bgColor} ${stat.color} mb-2 w-fit`}>{stat.icon}</div>
            <p className="text-base-content/60 text-sm">{stat.label}</p>
            <p className="text-2xl font-bold">{stat.value}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

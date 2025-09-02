import React from "react";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
  variant: "primary" | "success" | "warning" | "info";
}

export const StatsCard: React.FC<StatsCardProps> = ({ title, value, subtitle, icon, variant }) => {
  const variantStyles = {
    primary: "bg-primary/20 text-primary",
    success: "bg-success/20 text-success",
    warning: "bg-warning/20 text-warning",
    info: "bg-info/20 text-info",
  };

  return (
    <div className="card bg-base-200 shadow-xl">
      <div className="card-body p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm opacity-70">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs opacity-60">{subtitle}</p>
          </div>
          <div className={`p-3 rounded-lg ${variantStyles[variant]}`}>{icon}</div>
        </div>
      </div>
    </div>
  );
};

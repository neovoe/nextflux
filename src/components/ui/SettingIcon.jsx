import { cn } from "@/lib/utils";

export default function SettingIcon({ variant = "default", children }) {
  const colorVariants = {
    default:
      "from-default-300 to-default-400 dark:from-default-400 dark:to-default-300",
    blue: "from-blue-400 to-blue-500",
    purple: "from-purple-400 to-purple-500",
    green: "from-green-400 to-green-500",
    red: "from-red-400 to-red-500",
    pink: "from-pink-400 to-pink-500",
    amber: "from-amber-300 to-amber-500",
    orange: "from-orange-400 to-orange-500",
    cyan: "from-cyan-400 to-cyan-500",
  };

  return (
    <div
      className={cn(
        "flex items-center justify-center shrink-0 size-6 rounded-md shadow-xs bg-linear-to-b",
        colorVariants[variant],
      )}
    >
      <div className="flex items-center justify-center shrink-0 size-4 text-primary-foreground">
        {children}
      </div>
    </div>
  );
}

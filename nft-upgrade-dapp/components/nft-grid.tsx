import type { ReactNode } from "react";

interface NFTGridProps {
  children: ReactNode;
}

export function NFTGrid({ children }: NFTGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
      {children}
    </div>
  );
}

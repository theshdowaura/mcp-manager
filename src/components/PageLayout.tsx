import { ReactNode } from "react";

interface PageLayoutProps {
  title: string;
  children: ReactNode;
}

export function PageLayout({ title, children }: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-semibold tracking-tight mb-8">{title}</h1>
        {children}
      </div>
    </div>
  );
}

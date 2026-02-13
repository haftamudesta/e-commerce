"use client";

import SideBar from "@/components/sidebar/SideBar";

type DashboardLayoutProps = {
  children: React.ReactNode;
};

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen bg-gray-100 mt-[-32] ml-[-32]">
      <div>
        <SideBar />
      </div>
      <main className="flex-1 overflow-auto">
        <div>{children}</div>
      </main>
    </div>
  );
}

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
      <main
        className="flex-1 min-w-full overflow-auto"
        style={{
          background:
            "linear-gradient(90deg, #eff6ff 0%, #dbeafe 50%, #bfdbfe 100%)",
        }}
      >
        <div>{children}</div>
      </main>
    </div>
  );
}

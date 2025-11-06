"use client";

import Sidebar from "@/components/sidebar";

interface DashboardLayoutProps {
    children: React.ReactNode;
}
    
export default function CoordinatorDashboardLayout({
    children,
}: DashboardLayoutProps) {
    return (
        <div className="h-screen flex">
            {/* Sidebar */}
            <Sidebar
                role="coordinator"
                userInfo={{
                name: "John Doe",
                email: "john@example.com",
                }}
            />
        </div>
    );
}

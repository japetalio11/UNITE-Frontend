"use client";

import { Button } from "@heroui/button";
import {
    LayoutDashboard,
    Package,
    Settings,
    Mailbox,
    Ticket,
    Bell,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Popover, PopoverTrigger, PopoverContent } from "@heroui/popover";
    
export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const links = [
        { href: "/dashboard", icon: LayoutDashboard },
        { href: "/inventory", icon: Package },
        { href: "/requests", icon: Mailbox },
        { href: "/campaign", icon: Ticket },
    ];
    
    const bottomLinks = [{ href: "/notifications", icon: Bell }];
    
    const renderButton = (href: string, Icon: any, key: string) => {
        const isActive = pathname === href;
        return (
        <Link href={href} key={key}>
            {" "}
            {/* Add key prop here */}
            <Button
            isIconOnly
            variant="light"
            className={`w-10 h-10 rounded-full ${
                isActive
                ? "bg-red-600 text-white"
                : "text-black border border-gray-300"
            }`}
            >
            <Icon size={18} />
            </Button>
        </Link>
        );
    };
    
    const handleLogout = () => {
        try {
        localStorage.removeItem("token");
        localStorage.removeItem("authToken");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
        localStorage.removeItem("hospitalId");
        } catch {}
        router.push("/auth/login");
    };
    
    return (
        <div className="w-18 h-screen bg-white flex flex-col items-center justify-between py-6 border-r border-default-300">
        <div className="flex flex-col items-center space-y-4">
            {links.map(({ href, icon }) =>
            renderButton(href, icon, `link-${href}`),
            )}{" "}
            {/* Add key */}
        </div>
        <div className="flex flex-col items-center space-y-4">
            {bottomLinks.map(({ href, icon }) =>
            renderButton(href, icon, `bottom-${href}`),
            )}{" "}
            {/* Add key */}
            <Popover placement="right">
            <PopoverTrigger>
                <Button
                isIconOnly
                variant="light"
                className="w-10 h-10 rounded-full text-black border border-default-300"
                >
                <Settings size={18} />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="p-2">
                <div className="flex flex-col gap-1 min-w-[140px]">
                <Button
                    variant="light"
                    className="justify-start"
                    onClick={handleLogout}
                >
                    Log out
                </Button>
                </div>
            </PopoverContent>
            </Popover>
        </div>
        </div>
    );
}

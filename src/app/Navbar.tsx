"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Settings } from "lucide-react";

export default function Navbar() {
    const currentPageName = usePathname();
    return (
        <nav className="bg-white shadow-sm">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex">
                        <Link href='/'
                            className={`inline-flex items-center px-3 py-2 text-sm font-medium ${currentPageName === "/"
                                ? "text-purple-600"
                                : "text-gray-600 hover:text-purple-500"
                                }`}
                        >
                            <Home className="w-5 h-5 mr-1.5" />
                            Home
                        </Link>
                        <Link href='/settings'
                            className={`inline-flex items-center px-3 py-2 text-sm font-medium ${currentPageName === "/settings"
                                ? "text-purple-600"
                                : "text-gray-600 hover:text-purple-500"
                                }`}
                        >
                            <Settings className="w-5 h-5 mr-1.5" />
                            Settings
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    )
}
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FiHome,
  FiMessageCircle,
  FiLink,
  FiBarChart2,
  FiList,
  FiUser,
  FiSettings,
} from "react-icons/fi";

export default function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { icon: <FiHome size={20} />, href: "/home", label: "Home" },
    { icon: <FiMessageCircle size={20} />, href: "/chats", label: "Chats" },
    { icon: <FiLink size={20} />, href: "/links", label: "Links" },
    { icon: <FiBarChart2 size={20} />, href: "/analytics", label: "Analytics" },
    { icon: <FiList size={20} />, href: "/lists", label: "Lists" },
    { icon: <FiUser size={20} />, href: "/profile", label: "Profile" },
  ];

  return (
    <aside className="w-16 bg-white border-r border-gray-200 flex flex-col h-screen">
      <div className="p-3 flex justify-center border-b border-gray-200">
        <div className="w-10 h-10 bg-green-600 rounded-md flex items-center justify-center text-white font-bold">
          F2
        </div>
      </div>

      <nav className="flex-1 py-4">
        <ul className="space-y-4">
          {navItems.map((item, index) => (
            <li key={index}>
              <Link
                href={item.href}
                className={`flex justify-center p-3 hover:bg-gray-100 ${
                  pathname === item.href ? "text-green-600" : "text-gray-500"
                }`}
              >
                {item.icon}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t border-gray-200">
        <button className="w-full flex justify-center text-gray-500 hover:bg-gray-100 p-3 rounded-md">
          <FiSettings size={20} />
        </button>
      </div>
    </aside>
  );
}

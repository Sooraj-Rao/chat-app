"use client";
import Link from "next/link";
import { AiFillMessage, AiOutlineLineChart } from "react-icons/ai";
import { BsStars } from "react-icons/bs";
import { FaAddressBook } from "react-icons/fa";
import { HiSpeakerphone } from "react-icons/hi";
import { IoIosGitNetwork, IoMdHome } from "react-icons/io";
import { IoTicket } from "react-icons/io5";
import { LuPanelLeftOpen } from "react-icons/lu";
import { MdChecklist } from "react-icons/md";
import { RiFolderImageFill, RiSettings5Fill } from "react-icons/ri";
import { TbStarsFilled } from "react-icons/tb";

export default function Sidebar() {
  const navItems = [
    { icon: <IoMdHome size={20} />, label: "Home" },
    { icon: <AiFillMessage size={20} />, label: "Chats" },
    { icon: <IoTicket size={20} />, label: "Links" },
    { icon: <AiOutlineLineChart size={20} />, label: "Analytics" },
    { icon: <HiSpeakerphone size={20} />, label: "Lists" },
    {
      icon: <IoIosGitNetwork className=" rotate-180" size={20} />,
      label: "Profile",
    },
    {
      icon: <FaAddressBook size={20} />,
      label: "Address",
    },
    {
      icon: <RiFolderImageFill size={20} />,
      label: "Image",
    },
    {
      icon: <MdChecklist size={20} />,
      label: "List",
    },
    {
      icon: <RiSettings5Fill size={20} />,
      label: "Settings ",
    },
  ];
  const navEnd = [
    {
      icon: <TbStarsFilled size={20} />,
      label: "Stars",
    },
    {
      icon: <LuPanelLeftOpen size={20} />,
      label: "Logout",
    },
  ];

  return (
    <aside className="w-16 bg-white border-r border-gray-200 flex flex-col h-screen">
      <div className="p-3 flex justify-center border-b border-gray-200">
        <div className="relative h-10 w-10">
       
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 512 512" 
            className="w-full h-full"
            fill="none"
          >
            <mask
              id="a"
              maskUnits="userSpaceOnUse"
              x="0"
              y="55"
              width="512"
              height="512"
            >
              <circle cx="256" cy="311" r="256" fill="#3C3" />
            </mask>
            <g mask="url(#a)">
              <circle cx="256" cy="311" r="256" fill="#15803D" />
              <path
                fill="#fff"
                d="M88 313c0-55.228 44.772-100 100-100h100v369H88V313z"
              />
              <path
                fill="#fff"
                d="M218 213h125c55.228 0 100 44.772 100 100s-44.772 100-100 100H218V213z"
              />
              <circle cx="339" cy="313" r="75" fill="#15803D" />
              <path
                fill="#15803D"
                d="m256.478 377.112 12.879-37.603 26.712 34.08-39.591 3.523z"
              />
              <circle cx="310" cy="316" r="10" fill="#fff" />
              <circle cx="343" cy="316" r="10" fill="#fff" />
              <circle cx="376" cy="316" r="10" fill="#fff" />
            </g>
          </svg>
        </div>
      </div>

      <nav className="flex-1 flex-col justify-between py-4">
        <ul>
          {navItems.map((item, index) => (
            <li key={index}>
              <Link
                href={"#"}
                className={`flex justify-center relative p-2 hover:bg-gray-100 ${
                  item.label == "Chats"
                    ? "text-green-600 bg-gray-100"
                    : "text-gray-500"
                }`}
              >
                {item.icon}
                {item.label == "Profile" && (
                  <BsStars
                    size={14}
                    className=" right-2 text-yellow-400 absolute"
                  />
                )}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-t border-gray-200">
        <button className="w-full flex justify-center text-gray-500 hover:bg-gray-100 p-3 rounded-md">
          {navEnd[0].icon}
        </button>
        <button className="w-full flex justify-center text-gray-500 hover:bg-gray-100 p-3 rounded-md">
          {navEnd[1]?.icon}
        </button>
      </div>
    </aside>
  );
}

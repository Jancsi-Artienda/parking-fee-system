import { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Car, FileText, User, LogOut, ChevronDown, ChevronUp } from "lucide-react";
import logo from "../assets/logo.png";
import useAuth from "../context/auth/useAuth";
import Swal from "sweetalert2";

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [openMenu, setOpenMenu] = useState("Dashboard"); // open by default

  const menuItems = [
    { text: "Dashboard", icon: <LayoutDashboard size={20} />, path: "/dashboard" },
    { text: "Vehicle", icon: <Car size={20} />, path: "/vehicle" },
    {
      text: "Report", icon: <FileText size={20} />,
      children: [
        { text: "By Batch", path: "/report" },
        { text: "To be continue...", path: "", badge: "NEW" },
      ],
    },
  ];
  const isAccountActive = location.pathname === "/account";

  const handleSignOut = async () => {
    const result = await Swal.fire({
      title: "Sign out",
      text: "Are you sure?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#E60000",
    });
    if (!result.isConfirmed) return;
    logout();
    navigate("/");
  };

  const toggleMenu = (text) => {
    setOpenMenu(openMenu === text ? null : text);
  };

  return (
    <div className="w-[280px] min-h-screen bg-white border-r border-black/10 flex flex-col p-4">

      {/* Logo */}
      <div className="flex justify-center items-center px-3 py-2">
        <img src={logo} alt="Parking Fee Logo" className="w-full max-w-[180px] h-auto" />
      </div>

      {/* Profile Card */}
      <div className="flex items-center mx-2 px-4 py-3 rounded-2xl bg-[#F2F2F2] shadow-sm">
        <div className="w-10 h-10 rounded-full bg-gray-300 flex-shrink-0 flex items-center justify-center">
          <User size={24} className="text-gray-600" />
        </div>
        <div className="flex flex-col items-center flex-1">
          <span className="text-xs text-gray-500 font-medium">User account</span>
          <span className="text-sm font-bold text-gray-800">{user?.name ?? user?.username ?? "Guest"}</span>
        </div>
      </div>

      <hr className="my-3 border-black/10" />

      {/* Navigation */}
      <nav className="flex-1 px-2 mt-1">
        {menuItems.map((item) => {
          const isOpen = openMenu === item.text;
          const hasActiveChild = item.children?.some(c => location.pathname === c.path);
          const isActive = location.pathname === item.path;

          if (!item.children) {
            return (
              <NavLink
                key={item.text}
                to={item.path}
                className={`flex items-center gap-3 w-full px-4 py-3 rounded-2xl mb-1 text-sm font-medium transition-all duration-200 no-underline shadow-sm
            ${isActive
                    ? "bg-[#D6D6D6] font-semibold text-gray-800"
                    : "bg-[#F2F2F2] text-gray-700 hover:bg-[#E0E0E0]"
                  }`}
              >
                <span className="text-gray-700">{item.icon}</span>
                {item.text}
              </NavLink>
            );
          }

          return (
            <div key={item.text} className="mb-1">
              <button
                onClick={() => toggleMenu(item.text)}
                className={`flex items-center w-full px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-200
            ${isOpen || hasActiveChild
                    ? "bg-[#D6D6D6] text-gray-800 font-semibold"
                    : "bg-[#F2F2F2] text-gray-700 hover:bg-[#E0E0E0]"
                  } shadow-sm`}
              >
                <span className="text-gray-700 mr-3">{item.icon}</span>
                <span className="flex-1 text-left">{item.text}</span>
                {isOpen ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
              </button>

              {isOpen && (
                <div className="ml-6 mt-1 space-y-1">
                  {item.children.map((child) => {
                    const isChildActive = location.pathname === child.path;
                    return (
                      <NavLink
                        key={child.text}
                        to={child.path}
                        className={`flex items-center justify-between px-4 py-2 rounded-xl text-sm transition-all duration-200 no-underline
                    ${isChildActive
                            ? "bg-[#E8E8E8] font-semibold text-gray-800"
                            : "text-gray-600 hover:bg-[#F2F2F2]"
                          }`}
                      >
                        <span>{child.text}</span>
                        {child.badge && (
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded
                      ${child.badge === "NEW" ? "bg-green-100 text-green-600" : "bg-gray-200 text-gray-500"}`}>
                            {child.badge}
                          </span>
                        )}
                      </NavLink>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-2 mt-4">
        <NavLink
          to="/account"
          className={`pl-10 flex items-center gap-3 w-full px-4 py-3 rounded-2xl mb-2 text-sm font-medium transition-all duration-200 no-underline shadow-sm
            ${isAccountActive ? "bg-[#e2e2e2] text-gray-800" : "bg-[#ededed] text-gray-800 hover:bg-[#E0E0E0]"}`}
        >
          <User size={20} className="text-gray-700" />
          Account
        </NavLink>

        <button
          onClick={handleSignOut}
          className="flex pl-10 gap-3 w-full px-4 py-3 rounded-2xl text-sm font-medium text-white bg-[#E60000] hover:bg-[#cc0000] transition-colors duration-200 shadow-sm"
        >
          <LogOut size={20} />
          Sign out
        </button>
      </div>
    </div>
  );
}
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Car, FileText, User, LogOut } from "lucide-react";
import logo from "../assets/logo.png";
import useAuth from "../context/auth/useAuth";
import Swal from "sweetalert2";

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const menuItems = [
    { text: "Dashboard", icon: <LayoutDashboard size={20} />, path: "/dashboard" },
    { text: "Vehicle", icon: <Car size={20} />, path: "/vehicle" },
    { text: "Report", icon: <FileText size={20} />, path: "/report" },
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

  return (
    <div className="w-[280px] min-h-screen bg-white border-r border-black/10 flex flex-col p-4">

      {/* Logo */}
      <div className="flex justify-center items-center px-3 py-2">
        <img
          src={logo}
          alt="Parking Fee Logo"
          className="w-full max-w-[180px] h-auto"
        />
      </div>

      {/* Divider */}
      <hr className="my-3 border-black/10" />

      {/* Navigation */}
      <nav className="flex-1 px-2 mt-3 ">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.text}
              to={item.path}
              className={`flex pl-10 items-center gap-3 px-4 py-3 rounded-2xl mb-2 text-sm font-medium transition-all duration-200 no-underline
                ${isActive
                  ? "bg-[#D6D6D6] font-semibold text-gray-800 shadow-sm"
                  : "bg-[#F2F2F2] text-gray-700 hover:bg-[#E0E0E0] shadow-sm"
                }`}
            >
              <span className="text-gray-700">{item.icon}</span>
              {item.text}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-2 mt-4">

        {/* Account Button */}
        <NavLink
          to="/account"
          className={` pl-10 flex items-center gap-3 w-full px-4 py-3   rounded-2xl mb-2 text-sm font-medium transition-all duration-200 no-underline shadow-sm
            ${isAccountActive
              ? "bg-[#e2e2e2] text-gray-800"
              : "bg-[#ededed] text-gray-800 hover:bg-[#E0E0E0]"
            }`}
        >
          <User size={20} className="text-gray-700 " />
          Account
        </NavLink>

        {/* Sign Out Button */}
        <button
          onClick={handleSignOut}
          className=" flex pl-10 gap-3 w-full px-4 py-3 rounded-2xl text-sm font-medium text-white bg-[#E60000] hover:bg-[#cc0000] transition-colors duration-200 shadow-sm"
        >
          <LogOut size={20} />
          Sign out
        </button>

      </div>
    </div>
  );
}
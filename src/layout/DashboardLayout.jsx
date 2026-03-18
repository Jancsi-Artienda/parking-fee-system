import Sidebar from "./Sidebar";
import { Outlet } from "react-router-dom";

export default function DashboardLayout() {
  return (
    <div className="flex h-screen w-full bg-white overflow-hidden">

      {/* Sidebar */}
      <div className="h-full">
        <Sidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 md:p-8 bg-[#F8FAFC] backdrop-blur-xl w-full h-full overflow-y-auto">
        <Outlet />
      </div>

    </div>
  );
}
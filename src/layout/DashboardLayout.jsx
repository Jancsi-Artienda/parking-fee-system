import Sidebar from "./Sidebar";
import { Outlet } from "react-router-dom";
import background2 from "../assets/background2.png";

export default function DashboardLayout() {
  return (
    <div
      className="flex h-screen w-full overflow-hidden backdrop-blur-2xl"
      style={{
        backgroundImage: `url(${background2})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
        {/* Glass blur overlay */}
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-0" />


      {/* Sidebar */}
      <div className="h-full">
        <Sidebar />
      </div>

      {/* Main Content */}
      <div className="relative flex-1 w-full h-full overflow-y-auto">        
        {/* Page content above overlay */}
        <div className="relative z-10 p-6 ">
          <Outlet />
        </div>

      </div>
    </div>
  );
}
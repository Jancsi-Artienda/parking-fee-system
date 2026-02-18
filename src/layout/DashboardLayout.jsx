import { Box } from "@mui/material";
import Sidebar from "./Sidebar";
import { Outlet } from "react-router-dom";

export default function DashboardLayout() {
  return (
    <Box sx={{ display: "flex", height: "100vh", width: "100%", backgroundColor: "#ffffff", overflow: "hidden" }}>
      <Box sx={{height: "100%"}}>
        <Sidebar />
      </Box>  
      

      {/* Main Content */}
      <Box sx={{ 
        flexGrow: 1, 
        p: { xs: 2, md: 4 },
        bgcolor: "#FFFFFF",
        width: "100%",
        height: "100%",
        overflowY: "auto" 
       }}>
        <Outlet/>
      </Box>
    </Box>
  );
}

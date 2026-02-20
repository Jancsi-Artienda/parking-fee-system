import {
  Box,
  Typography,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Button,
} from "@mui/material";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import DashboardIcon from "@mui/icons-material/Dashboard";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import SummarizeIcon from '@mui/icons-material/Summarize';
import logo from "../assets/logo.png";
import useAuth from "../context/auth/useAuth";

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const menuItems = [
    { text: "Dashboard", icon: <DashboardIcon />, path: "/dashboard" },
    { text: "Vehicle", icon: <DirectionsCarIcon />, path: "/vehicle" },
     { text: "Report", icon: <SummarizeIcon />, path: "/report" },
  ];

  const isAccountActive = location.pathname === "/account";

  const handleSignOut = () => {
    logout();
    navigate("/");
  };

  return (
    <Box
      sx={{
        width: 260,
        height: "100vh",
        backgroundColor: "#FFF6D5",
        display: "flex",
        flexDirection: "column", 
        py: 3,
      }}
    >
      {/* Logo */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          px: 3,
        }}
      >
        <Box
          component="img"
          src={logo}
          alt="Parking Fee Logo"
          sx={{ width: "70%", maxWidth: 150 }}
        />
      </Box>

      {/* Navigation */}
      <Box sx={{flexGrow: 0.8}}>
      <List sx={{ px: 2, mt: 3 }}>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;

          return (
            <ListItemButton
              key={item.text}
              component={NavLink}
              style={{textDecoration: "none", color: "#000"}}
              to={item.path}
              disableRipple
              sx={{
                borderRadius: "14px",
                mb: 2,
                py: 1.5,
                px: 2.5,
                backgroundColor: isActive ? "#D6D6D6" : "#F2F2F2",
                color: "#333",
                boxShadow: "0 2px 4px rgba(0,0,0,0.08)",
                transition: "all 0.2s ease",

                "&:hover": {
                  backgroundColor: "#E0E0E0",
                },

                "& .MuiListItemIcon-root": {
                  minWidth: 36,
                  color: "#333",
                },

                "& .MuiListItemText-primary": {
                  fontWeight: isActive ? 600 : 500,
                },
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          );
        })}
      </List>
        </Box>

      {/* Footer */}
      <Box sx={{ px: 2 }}>
        <Button
          component={NavLink}
          to="/account"
          fullWidth
          variant={isAccountActive ? "contained" : "outlined"}
          sx={{
            mb: 2,
            borderRadius: "14px",
            textTransform: "none",
            boxShadow: "0 2px 4px rgba(0,0,0,0.08)",
            backgroundColor: isAccountActive ? "#BFBFBF" : "#CFCFCF",
            color: "#000",
            "&:hover": {
              backgroundColor: "#B8B8B8",
              borderColor: "transparent",
            },
          }}
        >
          Account
        </Button>

        <Button
          onClick={handleSignOut}
          fullWidth
          variant="contained"
          sx={{
            backgroundColor: "#E60000",
            color: "#fff",
            borderRadius: "14px",
            py: 1.5,
            textTransform: "none",
            fontWeight: 500,
            boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
            "&:hover": {
              backgroundColor: "#cc0000",
            },
          }}
        >
          Sign out
        </Button>
      </Box>
    </Box>
  );
}

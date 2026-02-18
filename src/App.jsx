import { BrowserRouter, Routes, Route } from "react-router-dom"
import Register from "./pages/auth/Register"
import Login from "./pages/auth/Login"
import Dashboard from "./pages/dashboard/Dashboard"
import Vehicle from "./pages/vehiclePG/Vehicle"
import DashboardLayout from "./layout/DashboardLayout"
import ProtectedRoute from "./routes/ProtectedRoute"
import Account from "./pages/account/Account"


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route element={<ProtectedRoute><DashboardLayout/></ProtectedRoute>}>
         <Route path="/dashboard" element={<Dashboard/>}/>
         <Route path="/vehicle" element={<Vehicle/>}/>
         <Route path="/account" element={<Account/>}/>
        </Route>
        
      </Routes>

    </BrowserRouter>
  )
}

export default App

import { React, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Signup from "./pages/Signup";
import NavBar from "./components/Navbar";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute2 from "./utils/ProtectedRoute2";
import { ReloadProvider } from "./context/ReloadContext";
import XMLConfigurator from "./pages/XMLConfigurator";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NavBar />
        
        <div style={{ display: "flex" }}>
          <ReloadProvider>

              <Routes>
                <Route path="/login" element={<Login />} />
                <Route
                  path="/"
                  element={
                    <ProtectedRoute2>
                      <Home />
                    </ProtectedRoute2>
                  }
                />


 
                   <Route
                  path="/Configurator/:id"
                  element={
                    <ProtectedRoute2>
                      <XMLConfigurator />
                    </ProtectedRoute2>
                  }
                />
   
                <Route
                  path="/signup"
                  element={
                    <ProtectedRoute2>
                      <Signup />
                    </ProtectedRoute2>
                  }
                />
              </Routes>
          </ReloadProvider>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

import { React, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Signup from "./pages/Signup";
import Architecture from "./pages/Architecture";
import BSP from "./pages/BSP";
import NavBar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute2 from "./utils/ProtectedRoute2";
import Canvas from "./pages/Application";
import Application from "./pages/Application";
import { ReloadProvider } from "./context/ReloadContext";
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NavBar />
        <div style={{ display: "flex" }}>
          <ReloadProvider>
            <Sidebar />

            <div
              style={{
                maxHeight: "95vh",
                width: "90vw",
                backgroundColor: "rgb(37, 37, 37)",
                padding: "20px",
              }}
            >
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
                  path="/Architecture"
                  element={
                    <ProtectedRoute2>
                      <Architecture />
                    </ProtectedRoute2>
                  }
                />
                <Route
                  path="/BSP/:bspId"
                  element={
                    <ProtectedRoute2>
                      <BSP />
                    </ProtectedRoute2>
                  }
                />
                <Route
                  path="/Application/:appId"
                  element={
                    <ProtectedRoute2>
                      <Application />
                    </ProtectedRoute2>
                  }
                />
                <Route
                  path="/Architecture/:id"
                  element={
                    <ProtectedRoute2>
                      <Architecture />
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
            </div>
          </ReloadProvider>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

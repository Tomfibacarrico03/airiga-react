import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import logo from "../images/airLogo-removebg-preview.png";
import style from "../styles/nav.module.css";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false); // State to manage dropdown visibility

  const handleLogout = async () => {
    try {
      await logout();
      alert("Session Ended");
      console.log("You are logged out");
      navigate("/");
    } catch (e) {
      console.error(e.message);
    }
  };

  // Toggle Dropdown
  const toggleDropdown = () => setShowDropdown(!showDropdown);

  return (
    <>
      {user && (
        <div className={style.navbar}>
          <li>
            <Link to="/" style={{ textDecoration: "none" }}>
              <img src={logo} alt="Logo" key={logo} />
            </Link>
          </li>

          <div className={style.userInfo}>
            <button className={style.userButton} onClick={toggleDropdown}>
              {user.email || "User"}
            </button>
            {showDropdown && (
              <div className={style.dropdownContent}>
                <button className={style.dropdownItem} onClick={handleLogout}>
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;

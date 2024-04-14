// Import React and the useAuth hook from your AuthContext
import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import styles from "../styles/login.module.css";

const Signup = () => {
  const { createUser } = useAuth(); // Destructure the createUser function
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate(); // Initialize the useNavigate hook

  // Handle changes to the email input
  const handleEmailChange = (e) => {
    setEmail(e.target.value);
  };

  // Handle changes to the password input
  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
  };

  // Handle the signup submission
  const handleSignup = async (e) => {
    e.preventDefault(); // Prevent the default form submission behavior
    try {
      // Use the createUser function from AuthContext
      await createUser(email, password);
      navigate("/");
    } catch (error) {
      console.error(error.message); // Log any errors
    }
  };
  const navigateToSignin = () => {
    navigate("/");
  };
  return (
    <div className={styles.window}>
      <h2>Sign Up</h2>
      <form onSubmit={handleSignup}>
        <div>
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={handleEmailChange}
            required
          />
        </div>
        <div>
          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={handlePasswordChange}
            required
          />
        </div>
        <button type="submit">Sign Up</button>
        <button onClick={navigateToSignin}>Sign in</button>
      </form>
    </div>
  );
};

export default Signup;

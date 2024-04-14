import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import styles from "../styles/login.module.css";

const Login = () => {
  const { signIn, gitHubLogin } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate(); // Initialize the useNavigate hook

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    try {
      await signIn(email, password);
      navigate("/");
    } catch (error) {
      console.error(error.message);
    }
  };

  const handleGitHubLogin = async (e) => {
    e.preventDefault();
    try {
      await gitHubLogin();
    } catch (error) {
      console.error(error.message);
    }
  };
  const navigateToSignup = () => {
    navigate("/signup");
  };
  return (
    <div className={styles.window}>
      <h2>Login</h2>
      <form onSubmit={handleSignIn}>
        <div>
          <label>Email:</label>
          <input type="email" value={email} onChange={handleEmailChange} />
        </div>
        <div>
          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={handlePasswordChange}
          />
        </div>
        <button type="submit">Sign In</button>
      </form>
      <button onClick={handleGitHubLogin}>Sign In with GitHub</button>
      <button onClick={navigateToSignup}>Sign Up</button>
    </div>
  );
};

export default Login;

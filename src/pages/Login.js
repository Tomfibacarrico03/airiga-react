import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import styles from "../styles/login.module.css";
import logo from "../images/airLogo-removebg-preview.png";

const Login = () => {
  const { signIn, gitHubLogin } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError(null); // Reset error state
    try {
      await signIn(email, password);
      navigate("/");
    } catch (error) {
      setError(error.message);
    }
  };

  const handleGitHubLogin = async (e) => {
    e.preventDefault();
    setError(null); // Reset error state
    try {
      await gitHubLogin();
      navigate("/"); // Navigate to the home page after successful GitHub login
    } catch (error) {
      setError(error.message);
    }
  };

  const navigateToSignup = () => {
    navigate("/signup");
  };

  return (
    <div className={styles.window}>
      <img className={styles.logo} src={logo} alt="Logo" key={logo} />
      
      {error && <p className={styles.error}>{error}</p>} {/* Display error message */}
      <form className={styles.loginForm} onSubmit={handleSignIn}>
        <div>
          <label>Email</label>
          <input type="email" value={email} onChange={handleEmailChange} required />
        </div>
        <div>
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={handlePasswordChange}
            required
          />
        </div>
        <button type="submit">Sign In</button>
      <button onClick={handleGitHubLogin}><svg aria-label="github" height="20" viewBox="0 0 14 14" width="20"><path d="M7 .175c-3.872 0-7 3.128-7 7 0 3.084 2.013 5.71 4.79 6.65.35.066.482-.153.482-.328v-1.181c-1.947.415-2.363-.941-2.363-.941-.328-.81-.787-1.028-.787-1.028-.634-.438.044-.416.044-.416.7.044 1.071.722 1.071.722.635 1.072 1.641.766 2.035.59.066-.459.24-.765.437-.94-1.553-.175-3.193-.787-3.193-3.456 0-.766.262-1.378.721-1.881-.065-.175-.306-.897.066-1.86 0 0 .59-.197 1.925.722a6.754 6.754 0 0 1 1.75-.24c.59 0 1.203.087 1.75.24 1.335-.897 1.925-.722 1.925-.722.372.963.131 1.685.066 1.86.46.48.722 1.115.722 1.88 0 2.691-1.641 3.282-3.194 3.457.24.219.481.634.481 1.29v1.926c0 .197.131.415.481.328C11.988 12.884 14 10.259 14 7.175c0-3.872-3.128-7-7-7z" fill="currentColor" fill-rule="nonzero"></path></svg>Sign In with GitHub</button>
      <a onClick={navigateToSignup}>Sign Up</a>
      </form>
    </div>
  );
};

export default Login;

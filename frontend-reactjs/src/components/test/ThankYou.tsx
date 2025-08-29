import React from "react";
import logo from "../../assets/mirafraLogo.svg";

import "../css/ThankYou.css";

const ThankYou: React.FC = () => {
  return (
    <div className="thank-you-container">
      <div className="thank-you-card">
        <div className="success-icon">
          <img src={logo} alt="logo" />
        </div>
        <h1>Test Completed Successfully!</h1>
        <p>Your test has been submitted and saved securely.</p>
        <p className="instruction">
          You can now safely close this browser window.
        </p>
      </div>
    </div>
  );
};

export default ThankYou;

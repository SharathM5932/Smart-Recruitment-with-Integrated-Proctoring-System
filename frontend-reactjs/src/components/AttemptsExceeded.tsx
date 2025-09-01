import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../../src/components/css/AttemptsExceeded.css";

const AttemptsExceeded: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Push the current page into history stack
    window.history.pushState(null, "", window.location.href);

    const handleBack = () => {
      // Whenever user presses back, push this page again
      window.history.pushState(null, "", window.location.href);
      navigate("/attempts-exceeded", { replace: true });
    };

    window.addEventListener("popstate", handleBack);
    return () => {
      window.removeEventListener("popstate", handleBack);
    };
  }, [navigate]);

  return (
    <div className="attempts-exceeded-container">
      <div className="attempts-exceeded-card">
        <h1>Maximum Attempts Exceeded</h1>
        <p>
          You have reached the maximum number of allowed attempts for this test.
        </p>
        <p className="instruction">
          You can now safely close this browser window.
        </p>
      </div>
    </div>
  );
};

export default AttemptsExceeded;

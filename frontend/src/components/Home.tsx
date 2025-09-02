import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import type { RootState } from "../redux/store";
import "./css/Home.css";
import Dashboard from "./Dashboard";
import MeetOurTeam from "./MeetOurTeam";

function Home() {
  const navigate = useNavigate();

  //   const user = useSelector((state: RootState) => state.auth.user);
  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated
  );

  return (
    <div className="app-container ">
      <div className="dashboard-section">
        {/* <h1 className="welcome-text">Hi {user?.name}...</h1> */}
        {isAuthenticated && <Dashboard />}
      </div>

      {!isAuthenticated && (
        <div className="home_container">
          {/* Catch Line */}
          <h2 className="home_sub">Smarter Hiring. Smarter Future.</h2>

          {/* Description */}
          <p className="home_p">
            A smart recruitment system with secure proctoring — designed to
            simplify hiring, ensure fair assessments, and give every candidate a
            chance to shine.
          </p>
        </div>
      )}
      {!isAuthenticated && (
        <div className="team-section">
          <MeetOurTeam />
        </div>
      )}
    </div>
  );
}

export default Home;

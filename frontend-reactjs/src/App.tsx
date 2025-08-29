import {
  Outlet,
  Route,
  BrowserRouter as Router,
  Routes,
} from "react-router-dom";
import "./App.css";
import AddCodingQuestions from "./components/AddCodingQuestions";
import AddJob from "./components/AddJob";
import AddMCQ from "./components/AddMCQ";
import AddQuestions from "./components/AddQuestions";
import AddUsers from "./components/AddUsers";
import AllUsers from "./components/AllUsers";
import ApplicantDetails from "./components/ApplicantDetails";
import CodingResult from "./components/CodingResult";
import Footer from "./components/Footer";
import Home from "./components/Home";
import Jobs from "./components/Jobs";
import Login from "./components/Login";
import Logout from "./components/Logout";
import MalpracticeImages from "./components/MalpracticeImages";
import McqResult from "./components/McqResult";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import Results from "./components/Results";
import SendTest from "./components/SendTest";
import TestPage from "./components/test/TestPage";
import ThankYou from "./components/test/ThankYou";
import ViewCoding from "./components/ViewCoding";
import ViewMCQ from "./components/ViewMCQ";
import ViewQuestions from "./components/ViewQuestions";

function App() {
  return (
    <div className="container">
      <Router>
        <Routes>
          <Route path="/thank-you" element={<ThankYou />} />
          <Route
            path="/test/:token/:applicantId/:attemptId"
            element={<TestPage />}
          />
          <Route
            path="*"
            element={
              <div className="app-container">
                <Navbar />
                <Outlet />
                <main className="content">
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/logout" element={<Logout />} />

                    {/* Secured Routes */}
                    <Route
                      path="/all-users"
                      element={
                        <ProtectedRoute allowedRoles={["super admin"]}>
                          <AllUsers />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/add-users"
                      element={
                        <ProtectedRoute allowedRoles={["super admin"]}>
                          <AddUsers />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/send-test"
                      element={
                        <ProtectedRoute
                          allowedRoles={["super admin", "talent acquisition"]}
                        >
                          <SendTest />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/jobs"
                      element={
                        <ProtectedRoute
                          allowedRoles={[
                            "super admin",
                            "talent acquisition",
                            "manager",
                          ]}
                        >
                          <Jobs />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/add-job"
                      element={
                        <ProtectedRoute
                          allowedRoles={["super admin", "manager"]}
                        >
                          <AddJob />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/add-questions"
                      element={
                        <ProtectedRoute
                          allowedRoles={["super admin", "manager"]}
                        >
                          <AddQuestions />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/add-mcq"
                      element={
                        <ProtectedRoute
                          allowedRoles={["super admin", "manager"]}
                        >
                          <AddMCQ />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/add-coding"
                      element={
                        <ProtectedRoute
                          allowedRoles={["super admin", "manager"]}
                        >
                          <AddCodingQuestions />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/view-questions"
                      element={
                        <ProtectedRoute
                          allowedRoles={[
                            "super admin",
                            "manager",
                            "talent acquisition",
                          ]}
                        >
                          <ViewQuestions />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/view-mcq"
                      element={
                        <ProtectedRoute
                          allowedRoles={[
                            "super admin",
                            "manager",
                            "talent acquisition",
                          ]}
                        >
                          <ViewMCQ />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/view-coding"
                      element={
                        <ProtectedRoute
                          allowedRoles={[
                            "super admin",
                            "manager",
                            "talent acquisition",
                          ]}
                        >
                          <ViewCoding />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/results"
                      element={
                        <ProtectedRoute
                          allowedRoles={[
                            "super admin",
                            "manager",
                            "talent acquisition",
                          ]}
                        >
                          <Results />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/results/mcq/:applicantId"
                      element={
                        <ProtectedRoute
                          allowedRoles={[
                            "super admin",
                            "manager",
                            "talent acquisition",
                          ]}
                        >
                          <McqResult />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/results/coding/:applicantId"
                      element={
                        <ProtectedRoute
                          allowedRoles={[
                            "super admin",
                            "manager",
                            "talent acquisition",
                          ]}
                        >
                          <CodingResult />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/applicant-info/:id"
                      element={
                        <ProtectedRoute
                          allowedRoles={[
                            "super admin",
                            "manager",
                            "talent acquisition",
                          ]}
                        >
                          <ApplicantDetails />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/results/malpractice/:id"
                      element={
                        <ProtectedRoute
                          allowedRoles={[
                            "super admin",
                            "manager",
                            "talent acquisition",
                          ]}
                        >
                          <MalpracticeImages />
                        </ProtectedRoute>
                      }
                    />
                  </Routes>
                </main>
                <Footer />
              </div>
            }
          />
        </Routes>
      </Router>
    </div>
  );
}

export default App;

import { useQuery } from "@tanstack/react-query";
import { Loader2, XCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import "./css/Results.css";

const fetchDashboardData = async () => {
  const { data } = await axiosInstance.get("/dashboard");
  return data;
};

const Results = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortKey, setSortKey] = useState("name");
  const [filterStatus, setFilterStatus] = useState("all"); // all, selected, not-selected, completed, pending, expired, attempts-exceeded

  const { data, error, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: fetchDashboardData,
    refetchInterval: 30000, // refetch every 30s
  });

  const filteredAndSortedCandidates = useMemo(() => {
    if (!data?.data) return [];

    const candidates = data.data;
    const currentTime = new Date();

    // Helper functions from Dashboard logic
    const isTestExpired = (candidate) => {
      const token = candidate.test_attempts[0]?.test_access_tokens[0];
      const testAttempt = candidate.test_attempts[0];
      if (!token || !testAttempt) return false;
      const expiresAt = new Date(token.expires_at);
      return expiresAt < currentTime && testAttempt.is_submitted === false;
    };

    const isAttemptsExceeded = (candidate) => {
      const testAttempt = candidate.test_attempts[0];
      if (!testAttempt) return false;
      return (
        testAttempt.attempt_count >= 3 && testAttempt.is_submitted === false
      );
    };

    const getTestStatus = (candidate) => {
      const testAttempt = candidate.test_attempts[0];
      if (!testAttempt) return "pending";

      if (isAttemptsExceeded(candidate)) {
        return "attempts-exceeded";
      } else if (isTestExpired(candidate)) {
        return "expired";
      } else if (
        testAttempt.test_status === "pending" &&
        testAttempt.is_submitted === false
      ) {
        return "pending";
      } else if (testAttempt.test_status === "attending") {
        return "attending";
      } else if (testAttempt.test_status === "completed") {
        return "completed";
      } else {
        return "pending";
      }
    };

    const getCodingStatus = (candidate) => {
      if (candidate.submissions.length > 0) {
        return candidate.submissions.some((sub) => sub.status === "Passed")
          ? "Passed"
          : "Failed";
      }
      return "Not Attempted";
    };

    const isSelected = (candidate) => {
      const mcqScore = candidate.test_attempts[0]?.mcq_score || 0;
      const hasPassedCoding = candidate.submissions.some(
        (sub) => sub.status === "Passed"
      );
      return mcqScore > 20 && hasPassedCoding;
    };

    // Filter by search term
    let filtered = candidates.filter(
      (candidate) =>
        candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        candidate.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Filter by status
    if (filterStatus !== "all") {
      filtered = filtered.filter((candidate) => {
        switch (filterStatus) {
          case "selected":
            return isSelected(candidate);
          case "not-selected":
            return !isSelected(candidate);
          case "completed":
            return getTestStatus(candidate) === "completed";
          case "pending":
            return getTestStatus(candidate) === "pending";
          case "expired":
            return getTestStatus(candidate) === "expired";
          case "attempts-exceeded":
            return getTestStatus(candidate) === "attempts-exceeded";
          case "attending":
            return getTestStatus(candidate) === "attending";
          default:
            return true;
        }
      });
    }

    // Sort candidates
    return filtered.sort((a, b) => {
      switch (sortKey) {
        case "name":
          return a.name.localeCompare(b.name);
        case "email":
          return a.email.localeCompare(b.email);
        case "mcq":
          const aMcq = a.test_attempts[0]?.mcq_score || 0;
          const bMcq = b.test_attempts[0]?.mcq_score || 0;
          return bMcq - aMcq;
        case "coding":
          const aPassedTests =
            a.submissions.length > 0
              ? a.submissions[0].testResults?.filter((tr) => tr.passed)
                  .length || 0
              : 0;
          const bPassedTests =
            b.submissions.length > 0
              ? b.submissions[0].testResults?.filter((tr) => tr.passed)
                  .length || 0
              : 0;
          return bPassedTests - aPassedTests;
        case "skill":
          const aSkill = a.primary_skill?.name || "";
          const bSkill = b.primary_skill?.name || "";
          return aSkill.localeCompare(bSkill);
        case "experience":
          const aExp = a.experience_level?.name || "";
          const bExp = b.experience_level?.name || "";
          return aExp.localeCompare(bExp);
        default:
          return 0;
      }
    });
  }, [data, searchTerm, sortKey, filterStatus]);

  if (isLoading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  if (error instanceof Error) {
    return (
      <div className="dashboard-error">
        <div className="error-content">
          <XCircle className="h-8 w-8 text-red-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="results-container">
      <div className="results-header">
        <h1>Candidate Assessment Results</h1>
        <p>Detailed view of all candidate assessments</p>
        <p>
          Showing {filteredAndSortedCandidates.length} of{" "}
          {data?.data?.length || 0} candidates
        </p>
      </div>

      <div className="results-controls">
        <div className="search-control">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-controls">
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value)}
            className="sort-select"
          >
            <option value="name">Sort by Name</option>
            <option value="email">Sort by Email</option>
            <option value="mcq">Sort by MCQ Score</option>
            <option value="coding">Sort by Coding Tests</option>
            <option value="skill">Sort by Skill</option>
            <option value="experience">Sort by Experience</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Candidates</option>
            <option value="selected">Selected</option>
            <option value="not-selected">Not Selected</option>
            <option value="completed">Completed Tests</option>
            <option value="pending">Pending Tests</option>
            <option value="attending">In Progress</option>
            <option value="expired">Expired Tests</option>
            <option value="attempts-exceeded">Attempts Exceeded</option>
          </select>
        </div>
      </div>

      <div className="results-table-responsive">
        <table className="results-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Skill</th>
              <th>Experience</th>
              <th>MCQ Score</th>
              <th>Coding Test Cases</th>
              <th>Test Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedCandidates.map((candidate) => {
              const mcqScore = candidate.test_attempts[0]?.mcq_score || 0;
              const totalMcqQuestions = 30; // Based on dashboard logic

              const codingSubmission = candidate.submissions[0];
              const passedTests =
                codingSubmission?.testResults?.filter((tr) => tr.passed)
                  .length || 0;
              const totalTests = codingSubmission?.testResults?.length || 0;

              const codingStatus =
                candidate.submissions.length > 0
                  ? candidate.submissions.some((sub) => sub.status === "Passed")
                    ? "Passed"
                    : "Failed"
                  : "Not Attempted";

              // Get test status using dashboard logic
              const currentTime = new Date();
              const testAttempt = candidate.test_attempts[0];
              let testStatus = "pending";

              if (testAttempt) {
                const token = testAttempt.test_access_tokens[0];
                const isExpired =
                  token &&
                  new Date(token.expires_at) < currentTime &&
                  !testAttempt.is_submitted;
                const isAttemptsExceeded =
                  testAttempt.attempt_count >= 3 && !testAttempt.is_submitted;

                if (isAttemptsExceeded) {
                  testStatus = "attempts-exceeded";
                } else if (isExpired) {
                  testStatus = "expired";
                } else if (testAttempt.test_status === "attending") {
                  testStatus = "attending";
                } else if (testAttempt.test_status === "completed") {
                  testStatus = "completed";
                } else {
                  testStatus = "pending";
                }
              }

              return (
                <tr key={candidate.id}>
                  {/* <td className="candidate-name">{candidate.name}</td> */}
                  <td>
                    <Link
                      to={`/applicant-info/${candidate.id}`}
                      className="candidate-name-link"
                      state={{ candidate }}
                    >
                      {candidate.name}
                    </Link>
                  </td>

                  <td className="candidate-email">{candidate.email}</td>
                  <td className="skill-name">
                    {candidate.primary_skill?.name || "N/A"}
                  </td>
                  <td className="experience-name">
                    {candidate.experience_level?.name || "N/A"}
                  </td>
                  <td>
                    <span
                      className={`score-badge ${
                        mcqScore > 20 ? "score-pass" : "score-fail"
                      }`}
                    >
                      {mcqScore}/{totalMcqQuestions}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`score-badge ${
                        passedTests > 0
                          ? "score-pass"
                          : totalTests > 0
                          ? "score-fail"
                          : "score-pending"
                      }`}
                    >
                      {passedTests}/{totalTests}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`status-badge ${
                        testStatus === "completed"
                          ? "status-complete"
                          : testStatus === "attending"
                          ? "status-progress"
                          : testStatus === "attempts-exceeded"
                          ? "status-attempts-exceeded"
                          : testStatus === "expired"
                          ? "status-expired"
                          : "status-pending"
                      }`}
                    >
                      {testStatus === "attempts-exceeded"
                        ? "attempts exceeded"
                        : testStatus}
                    </span>
                  </td>
                  <td className="results-actions">
                    <Link
                      to={`/results/mcq/${candidate.id}`}
                      className="action-link"
                    >
                      <abbr title="View MCQ Result">MCQ</abbr>
                    </Link>
                    <Link
                      to={`/results/coding/${candidate.id}`}
                      className="action-link"
                    >
                      <abbr title="View Coding Result">Coding</abbr>
                    </Link>
                    <Link
                      to={`/results/malpractice/${candidate.id}`}
                      className="action-link"
                    >
                      <abbr title="View Malpractice Images or Candidate Images">
                        Images
                      </abbr>
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {filteredAndSortedCandidates.length === 0 && (
        <div className="no-results">
          <p>No candidates found matching your criteria.</p>
        </div>
      )}
    </div>
  );
};

export default Results;

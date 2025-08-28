import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  CheckCircle,
  Clock,
  TrendingUp,
  Users,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import "../components/css/Dashboard.css";

const fetchDashboardData = async () => {
  const response = await fetch("http://localhost:3000/dashboard");
  if (!response.ok) {
    throw new Error("Network response was not ok");
  }
  return response.json();
};

const Dashboard = () => {
  const [skillsFilter, setSkillsFilter] = useState("all"); // all, selected, not-selected
  const [experienceFilter, setExperienceFilter] = useState("all"); // all, selected, not-selected

  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboardData"],
    queryFn: fetchDashboardData,
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <span>Loading dashboard...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <div className="error-content">
          <XCircle className="error-icon" />
          <h3>Error loading dashboard</h3>
          <p>{error.message}</p>
        </div>
      </div>
    );
  }

  const candidates = data?.data || [];

  // Calculate metrics based on ALL candidates (no limits)
  const totalCandidates = candidates.length;

  // Selected: MCQ > 20 AND coding submission status is "Passed"
  const selectedCandidates = candidates.filter((candidate) => {
    const mcqScore = candidate.test_attempts[0]?.mcq_score || 0;
    const hasPassedCoding = candidate.submissions.some(
      (sub) => sub.status === "Passed"
    );
    return mcqScore > 20 && hasPassedCoding;
  });

  // Not Selected: MCQ <= 20 OR coding submission status is not "Passed" (or no submissions)
  const notSelectedCandidates = candidates.filter((candidate) => {
    const mcqScore = candidate.test_attempts[0]?.mcq_score || 0;
    const hasPassedCoding = candidate.submissions.some(
      (sub) => sub.status === "Passed"
    );
    return mcqScore <= 20 || !hasPassedCoding;
  });

  const currentTime = new Date();

  // Helper function to check if test is expired
  const isTestExpired = (candidate) => {
    const token = candidate.test_attempts[0]?.test_access_tokens[0];
    const testAttempt = candidate.test_attempts[0];
    if (!token || !testAttempt) return false;

    const expiresAt = new Date(token.expires_at);
    return expiresAt < currentTime && testAttempt.is_submitted === false;
  };

  // Categorize candidates based on test status with proper logic
  const testStatusCounts = candidates.reduce((acc, candidate) => {
    const testAttempt = candidate.test_attempts[0];
    if (!testAttempt) {
      acc.pending = (acc.pending || 0) + 1;
      return acc;
    }

    // Check if test is expired first
    if (isTestExpired(candidate)) {
      acc.expired = (acc.expired || 0) + 1;
    } else if (
      testAttempt.test_status === "pending" &&
      testAttempt.is_submitted === false
    ) {
      acc.pending = (acc.pending || 0) + 1;
    } else if (testAttempt.test_status === "attending") {
      acc.attending = (acc.attending || 0) + 1;
    } else if (testAttempt.test_status === "completed") {
      acc.completed = (acc.completed || 0) + 1;
    } else {
      // Fallback for any other status
      acc.pending = (acc.pending || 0) + 1;
    }

    return acc;
  }, {});

  // Expired tests count
  const expiredTests = testStatusCounts.expired || 0;

  // Skills distribution with filter (for charts)
  const getFilteredCandidates = (filter) => {
    switch (filter) {
      case "selected":
        return selectedCandidates;
      case "not-selected":
        return notSelectedCandidates;
      default:
        return candidates;
    }
  };

  const skillsDistribution = getFilteredCandidates(skillsFilter).reduce(
    (acc, candidate) => {
      const skill = candidate.primary_skill?.name || "Unknown";
      acc[skill] = (acc[skill] || 0) + 1;
      return acc;
    },
    {}
  );

  // Experience level distribution with filter (for charts)
  const experienceDistribution = getFilteredCandidates(experienceFilter).reduce(
    (acc, candidate) => {
      const level = candidate.experience_level?.name || "Unknown";
      acc[level] = (acc[level] || 0) + 1;
      return acc;
    },
    {}
  );

  // Recent 5 candidates based on test_attempts.updated_at (ONLY for Recent Test Results table)
  const recentCandidates = candidates
    .filter((c) => c.test_attempts[0]?.updated_at) // Filter candidates with test attempts
    .sort(
      (a, b) =>
        new Date(b.test_attempts[0].updated_at) -
        new Date(a.test_attempts[0].updated_at)
    )
    .slice(0, 5); // Only limit the Recent Test Results to 5

  // Chart data preparation
  const skillsChartData = Object.entries(skillsDistribution).map(
    ([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1).toLowerCase(),
      value,
    })
  );

  const experienceChartData = Object.entries(experienceDistribution).map(
    ([name, value]) => ({ name, value })
  );

  const COLORS = [
    "#3B82F6",
    "#10B981",
    "#F59E0B",
    "#EF4444",
    "#8B5CF6",
    "#06B6D4",
    "#F97316",
  ];

  const MetricCard = ({
    title,
    value,
    icon: Icon,
    color,
    description,
    linkTo,
  }) => (
    <div className="metric-card">
      {linkTo ? (
        <Link to={linkTo} className="metric-link">
          <div className="metric-content">
            <div className="metric-info">
              <p className="metric-title">{title}</p>
              <p className="metric-value" style={{ color }}>
                {value}
              </p>
              {description && (
                <p className="metric-description">{description}</p>
              )}
            </div>
            <Icon className="metric-icon" style={{ color }} />
          </div>
        </Link>
      ) : (
        <div className="metric-content">
          <div className="metric-info">
            <p className="metric-title">{title}</p>
            <p className="metric-value" style={{ color }}>
              {value}
            </p>
            {description && <p className="metric-description">{description}</p>}
          </div>
          <Icon className="metric-icon" style={{ color }} />
        </div>
      )}
    </div>
  );

  const ChartCard = ({ title, children, linkTo, dropdown, onFilterChange }) => (
    <div className="chart-card">
      <div className="chart-header">
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <h3 className="chart-title">{title}</h3>
          {dropdown && (
            <select
              value={dropdown.value}
              onChange={(e) => onFilterChange(e.target.value)}
              style={{
                padding: "0.25rem 0.5rem",
                borderRadius: "0.25rem",
                border: "1px solid var(--border-color)",
                fontSize: "0.875rem",
                backgroundColor: "var(--main-bg-color)",
                color: "var(--text-color)",
              }}
            >
              <option value="all">All Candidates</option>
              <option value="selected">Selected Only</option>
              <option value="not-selected">Not Selected Only</option>
            </select>
          )}
        </div>
        {linkTo && (
          <Link to={linkTo} className="view-details-link">
            <BarChart3 size={16} />
            View Details
          </Link>
        )}
      </div>
      <div className="chart-content">{children}</div>
    </div>
  );

  return (
    <div className="dashboard">
      <div className="dashboard-container">
        {/* Header */}
        <div className="dashboard-header">
          <h1>Candidate Assessment Dashboard</h1>
          <p>Overview of candidate performance and statistics</p>
        </div>

        {/* Overview Metrics - NO LIMITS, shows ALL candidates */}
        <div className="metrics-grid">
          <MetricCard
            title="Total Candidates"
            value={totalCandidates}
            icon={Users}
            color="#3B82F6"
            description="All registered candidates"
            linkTo="/results"
          />
          <MetricCard
            title="Selected"
            value={selectedCandidates.length}
            icon={CheckCircle}
            color="#10B981"
            description="MCQ > 20 & Coding Passed"
            linkTo="/results"
          />
          <MetricCard
            title="Not Selected"
            value={notSelectedCandidates.length}
            icon={XCircle}
            color="#EF4444"
            description="MCQ <= 20 OR Coding Failed/Not Attempted"
            linkTo="/results"
          />
        </div>

        {/* Test Status Overview - NO LIMITS, shows ALL candidates */}
        <div className="status-grid">
          <MetricCard
            title="Pending Tests"
            value={testStatusCounts.pending || 0}
            icon={Clock}
            color="#F59E0B"
            description="Not started yet"
            linkTo="/results"
          />
          <MetricCard
            title="In Progress"
            value={testStatusCounts.attending || 0}
            icon={TrendingUp}
            color="#8B5CF6"
            description="Currently taking test"
            linkTo="/results"
          />
          <MetricCard
            title="Completed Tests"
            value={testStatusCounts.completed || 0}
            icon={CheckCircle}
            color="#10B981"
            description="Assessment finished"
            linkTo="/results"
          />
          <MetricCard
            title="Expired Tests"
            value={expiredTests}
            icon={XCircle}
            color="#EF4444"
            description="Test access expired"
            linkTo="/results"
          />
        </div>

        {/* Distributions with Charts */}
        <div className="charts-grid">
          <ChartCard
            title="Primary Skills Distribution"
            linkTo="/results"
            dropdown={{ value: skillsFilter }}
            onFilterChange={setSkillsFilter}
          >
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={skillsChartData}
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {skillsChartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard
            title="Experience Level Distribution"
            linkTo="/results"
            dropdown={{ value: experienceFilter }}
            onFilterChange={setExperienceFilter}
          >
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={experienceChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Recent 5 Candidates - ONLY THIS SECTION IS LIMITED TO 5 */}
        <div className="recent-candidates">
          <div className="section-header">
            <h3>Recent Test Results (Last 5)</h3>
            <Link to="/results" className="view-all-link">
              View All
            </Link>
          </div>
          <div className="candidates-table">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Skill</th>
                  <th>MCQ Score</th>
                  <th>Coding Status</th>
                  <th>Test Status</th>
                  <th>Experience</th>
                </tr>
              </thead>
              <tbody>
                {recentCandidates.map((candidate) => {
                  const mcqScore = candidate.test_attempts[0]?.mcq_score || 0;
                  const codingStatus =
                    candidate.submissions.length > 0
                      ? candidate.submissions.find(
                          (sub) => sub.status === "Passed"
                        )
                        ? "Passed"
                        : "Failed"
                      : "Not Attempted";

                  // Determine actual test status (including expired)
                  let testStatus =
                    candidate.test_attempts[0]?.test_status || "pending";
                  if (isTestExpired(candidate)) {
                    testStatus = "expired";
                  }

                  return (
                    <tr key={candidate.id}>
                      <td className="candidate-name">{candidate.name}</td>
                      <td className="skill-name">
                        {candidate.primary_skill?.name || "N/A"}
                      </td>
                      <td>
                        <span
                          className={`score-badge ${
                            mcqScore > 20 ? "score-pass" : "score-fail"
                          }`}
                        >
                          {mcqScore}/30
                        </span>
                      </td>
                      <td>
                        <span
                          className={`status-badge ${
                            codingStatus === "Passed"
                              ? "status-pass"
                              : codingStatus === "Failed"
                              ? "status-fail"
                              : "status-pending"
                          }`}
                        >
                          {codingStatus}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`status-badge ${
                            testStatus === "completed"
                              ? "status-complete"
                              : testStatus === "attending"
                              ? "status-progress"
                              : testStatus === "expired"
                              ? "status-expired"
                              : "status-pending"
                          }`}
                        >
                          {testStatus}
                        </span>
                      </td>
                      <td>{candidate.experience_level?.name || "N/A"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

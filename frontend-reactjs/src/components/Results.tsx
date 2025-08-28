import { useQuery } from "@tanstack/react-query";
import { Award, Briefcase, Calendar, Mail, Phone, User } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import "./css/Results.css";

const fetchDashboardData = async () => {
  const response = await fetch("http://localhost:3000/dashboard");
  if (!response.ok) throw new Error("Network response was not ok");
  return response.json();
};

const Results = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortKey, setSortKey] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [statusFilter, setStatusFilter] = useState("all");
  const [skillFilter, setSkillFilter] = useState("all");
  const [experienceFilter, setExperienceFilter] = useState("all");
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  const dialogRef = useRef(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboardData"],
    queryFn: fetchDashboardData,
    refetchInterval: 30000,
  });

  const candidates = data?.data || [];

  // helpers
  const getTestStatus = (candidate) => {
    const testAttempt = candidate.test_attempts[0];
    if (!testAttempt) return "pending";
    return testAttempt.test_status;
  };

  const getCodingStats = (candidate) => {
    if (candidate.submissions.length === 0) {
      return { passed: 0, total: 0, status: "Not Attempted" };
    }
    const submission = candidate.submissions[0];
    if (!submission.testResults) {
      return { passed: 0, total: 0, status: submission.status };
    }
    const passed = submission.testResults.filter((t) => t.passed).length;
    const total = submission.testResults.length;
    return { passed, total, status: submission.status };
  };

  const getSelectionStatus = (candidate) => {
    const mcqScore = candidate.test_attempts[0]?.mcq_score || 0;
    const hasPassedCoding = candidate.submissions.some(
      (s) => s.status === "Passed"
    );
    return mcqScore > 20 && hasPassedCoding ? "selected" : "not-selected";
  };

  const filteredAndSortedCandidates = useMemo(() => {
    let filtered = candidates.filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === "all" ||
        getTestStatus(c) === statusFilter ||
        getSelectionStatus(c) === statusFilter;
      const matchesSkill =
        skillFilter === "all" || c.primary_skill?.name === skillFilter;
      const matchesExperience =
        experienceFilter === "all" ||
        c.experience_level?.name === experienceFilter;
      return (
        matchesSearch && matchesStatus && matchesSkill && matchesExperience
      );
    });

    return filtered.sort((a, b) => {
      let aValue, bValue;
      switch (sortKey) {
        case "name":
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case "mcq":
          aValue = a.test_attempts[0]?.mcq_score || 0;
          bValue = b.test_attempts[0]?.mcq_score || 0;
          break;
        case "coding":
          aValue = getCodingStats(a).passed;
          bValue = getCodingStats(b).passed;
          break;
        case "status":
          aValue = getTestStatus(a);
          bValue = getTestStatus(b);
          break;
        case "completed":
          aValue = new Date(a.test_attempts[0]?.applicant_completed_at || 0);
          bValue = new Date(b.test_attempts[0]?.applicant_completed_at || 0);
          break;
        default:
          return 0;
      }
      if (typeof aValue === "string") {
        const comp = aValue.localeCompare(bValue);
        return sortOrder === "asc" ? comp : -comp;
      }
      return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
    });
  }, [
    candidates,
    searchTerm,
    sortKey,
    sortOrder,
    statusFilter,
    skillFilter,
    experienceFilter,
  ]);

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
  };

  const formatDate = (dateString) =>
    !dateString
      ? "N/A"
      : new Date(dateString).toLocaleDateString() +
        " " +
        new Date(dateString).toLocaleTimeString();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading results</div>;

  return (
    <div className="results">
      <div className="results-container">
        <h1>Candidate Assessment Results</h1>

        <div className="results-table-container">
          <table className="results-table">
            <thead>
              <tr>
                <th onClick={() => handleSort("name")}>Name</th>
                <th>Email</th>
                <th>MCQ Score</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedCandidates.map((candidate) => (
                <tr key={candidate.id}>
                  <td
                    className="clickable-name"
                    onClick={() => {
                      setSelectedCandidate(candidate);
                      dialogRef.current.showModal();
                    }}
                  >
                    <User size={16} /> {candidate.name}
                  </td>
                  <td>{candidate.email}</td>
                  <td>{candidate.test_attempts[0]?.mcq_score || "N/A"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <dialog
        id="candidate-modal"
        ref={dialogRef}
        onClick={(e) => {
          const rect = dialogRef.current.getBoundingClientRect();
          const isInside =
            e.clientX >= rect.left &&
            e.clientX <= rect.right &&
            e.clientY >= rect.top &&
            e.clientY <= rect.bottom;
          if (!isInside) dialogRef.current.close();
        }}
      >
        {selectedCandidate && (
          <div className="modal-content">
            <h2>{selectedCandidate.name}</h2>
            <p>
              <Mail size={14} /> {selectedCandidate.email}
            </p>
            <p>
              <Phone size={14} /> {selectedCandidate.phone}
            </p>
            <p>
              <Award size={14} /> Primary:{" "}
              {selectedCandidate.primary_skill?.name || "N/A"}
            </p>
            {selectedCandidate.secondary_skill && (
              <p>
                <Award size={14} /> Secondary:{" "}
                {selectedCandidate.secondary_skill?.name}
              </p>
            )}
            <p>
              <Briefcase size={14} /> Experience:{" "}
              {selectedCandidate.experience_level?.name || "N/A"}
            </p>
            <p>
              <Calendar size={14} /> Scheduled:{" "}
              {formatDate(selectedCandidate.test_attempts[0]?.schedule_start)}
            </p>

            <button
              className="btn-close"
              onClick={() => dialogRef.current.close()}
            >
              Close
            </button>
          </div>
        )}
      </dialog>
    </div>
  );
};

export default Results;

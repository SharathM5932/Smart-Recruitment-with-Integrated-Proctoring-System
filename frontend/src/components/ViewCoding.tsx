import { useQuery } from "@tanstack/react-query";
import React, { useMemo, useState } from "react";
import axiosInstance from "../api/axiosInstance";
import "./css/ViewCoding.css";

interface LanguageConfig {
  language: string;
  signature: string;
  functionName: string;
}

interface TestCase {
  input: string;
  expectedOutput: string;
}

interface Problem {
  key: string;
  title: string;
  description: string;
  difficulty: string;
  languageConfigs: LanguageConfig[];
  testCases: TestCase[];
}

const fetchProblems = async (): Promise<Problem[]> => {
  const res = await axiosInstance.get("/problems");
  // adjust if your API shape differs; assuming { data: { data: [...] } } or { data: [...] }
  return res.data?.data ?? res.data ?? [];
};

const ViewCoding: React.FC = () => {
  const [difficultyFilter, setDifficultyFilter] = useState("");
  const [searchKey, setSearchKey] = useState("");

  const {
    data: problems = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["problems"],
    queryFn: fetchProblems,
    refetchOnWindowFocus: false,
    // optional: staleTime: 1000 * 60, // 1 minute cache
  });

  const filteredProblems = useMemo(() => {
    return problems.filter((p) => {
      const matchesDifficulty = difficultyFilter
        ? p.difficulty.toLowerCase() === difficultyFilter.toLowerCase()
        : true;

      const matchesSearch = searchKey
        ? p.key.toLowerCase().includes(searchKey.toLowerCase())
        : true;

      return matchesDifficulty && matchesSearch;
    });
  }, [problems, difficultyFilter, searchKey]);

  if (isLoading) return <p className="loading">Loading...</p>;
  if (isError)
    return <p className="error">Error: {(error as Error).message}</p>;

  return (
    <div className="coding-questions-container">
      <h1>Coding Problems</h1>

      {/* Filters */}
      <div className="filters">
        <input
          type="text"
          placeholder="Search by key..."
          value={searchKey}
          onChange={(e) => setSearchKey(e.target.value)}
        />

        <select
          value={difficultyFilter}
          onChange={(e) => setDifficultyFilter(e.target.value)}
        >
          <option value="">All Difficulties</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
      </div>

      {filteredProblems.length === 0 ? (
        <p className="no-results">No problems found.</p>
      ) : (
        <div className="problems-list">
          {filteredProblems.map((problem) => (
            <div key={problem.key} className="problem-card">
              <div className={`difficulty ${problem.difficulty.toLowerCase()}`}>
                {problem.difficulty}
              </div>
              <h2>{problem.title}</h2>
              <p className="description">{problem.description}</p>

              {problem.testCases.length > 0 && (
                <>
                  <h4>Test Cases:</h4>
                  <ul>
                    {problem.testCases.map((test, idx) => (
                      <li key={idx}>
                        <strong>Input:</strong> {test.input} |{" "}
                        <strong>Expected Output:</strong> {test.expectedOutput}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ViewCoding;

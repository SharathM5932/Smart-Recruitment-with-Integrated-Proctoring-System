import React, { useEffect, useState } from "react";
import axiosInstance from "../api/axiosInstance";
import "./css/ViewMCQ.css";

interface Option {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface Skill {
  id: string;
  name: string;
}

interface MCQ {
  id: string;
  questionTitle: string;
  difficulty: string;
  createdAt: string;
  modifiedAt: string;
  createdBy: string;
  skill: Skill;
  options: Option[];
}

const ViewMCQ: React.FC = () => {
  const [mcqs, setMcqs] = useState<MCQ[]>([]);
  const [filteredMcqs, setFilteredMcqs] = useState<MCQ[]>([]);
  const [search, setSearch] = useState("");
  const [skillFilter, setSkillFilter] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    axiosInstance
      .get("/mcq-questions")
      .then((res) => {
        setMcqs(res.data.data);
        setFilteredMcqs(res.data.data);
      })
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    let filtered = mcqs.filter((mcq) =>
      mcq.questionTitle.toLowerCase().includes(search.toLowerCase())
    );
    if (skillFilter) {
      filtered = filtered.filter((mcq) =>
        mcq.skill.name.toLowerCase().includes(skillFilter.toLowerCase())
      );
    }
    if (difficultyFilter) {
      filtered = filtered.filter(
        (mcq) => mcq.difficulty.toLowerCase() === difficultyFilter.toLowerCase()
      );
    }
    setFilteredMcqs(filtered);
    setCurrentPage(1); // reset to page 1 when filtering
  }, [search, skillFilter, difficultyFilter, mcqs]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredMcqs.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredMcqs.length / itemsPerPage);

  return (
    <div className="mcq-container">
      <h2>MCQ Questions</h2>

      {/* Filters */}
      <div className="filters">
        <input
          type="text"
          placeholder="Search Question"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <input
          type="text"
          placeholder="Filter by Skill"
          value={skillFilter}
          onChange={(e) => setSkillFilter(e.target.value)}
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
      <div className="quest-box">
        {/* MCQ Cards */}
        {currentItems.length === 0 ? (
          <p>No MCQs found.</p>
        ) : (
          currentItems.map((mcq, index) => (
            <div key={mcq.id} className="mcq-card">
              <h3>
                {indexOfFirstItem + index + 1}. {mcq.questionTitle}
              </h3>

              <div className="options-grid">
                {mcq.options.map((option) => (
                  <div
                    key={option.id}
                    className={`option-item ${
                      option.isCorrect ? "correct" : ""
                    }`}
                  >
                    {option.text}
                  </div>
                ))}
              </div>

              <div className="btm-container">
                <p className="meta">
                  Created By: {mcq.createdBy} |{" "}
                  {new Date(mcq.createdAt).toLocaleString("en-IN", {
                    timeZone: "Asia/Kolkata",
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
                <p className="tags">
                  <span className="skill-name">{mcq.skill.name}</span>
                  <span
                    className={`difficulty ${mcq.difficulty.toLowerCase()}`}
                  >
                    {mcq.difficulty}
                  </span>
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      <div className="pagination">
        <button
          onClick={() => {
            setCurrentPage((prev) => Math.max(prev - 1, 1));
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          disabled={currentPage === 1}
        >
          Prev
        </button>

        {(() => {
          const pageNumbers: number[] = [];
          let start = Math.max(1, currentPage - 2);
          let end = Math.min(totalPages, start + 4);

          if (end - start < 4) {
            start = Math.max(1, end - 4);
          }

          for (let i = start; i <= end; i++) {
            pageNumbers.push(i);
          }

          return pageNumbers.map((pageNum) => (
            <button
              key={pageNum}
              onClick={() => {
                setCurrentPage(pageNum);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className={pageNum === currentPage ? "active" : ""}
            >
              {pageNum}
            </button>
          ));
        })()}

        <button
          onClick={() => {
            setCurrentPage((prev) => Math.min(prev + 1, totalPages));
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          disabled={currentPage === totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default ViewMCQ;

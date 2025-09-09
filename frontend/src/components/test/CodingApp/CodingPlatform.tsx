import Editor from "@monaco-editor/react";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../../api/axiosInstance";
import axiosProctorInstance from "../../../api/axiosProctorInstance";
import "./CodingPlatform.css";

interface TestCase {
  input: string;
  expectedOutput: string;
  isHidden: boolean;
}

interface QuestionResponse {
  status: string;
  problemKey: string;
  title: string;
  description: string;
  difficulty: string;
  functionSignature: string;
  functionName: string;
  testCases: TestCase[];
}

interface TestResult {
  input: string;
  expected: string;
  actual: string;
  passed: boolean;
  stderr: string;
}

interface RunResponse {
  status: string;
  total: number;
  passed: number;
  output: string;
  testResults: TestResult[];
  error?: string;
}

interface Props {
  handleFinalSubmit: () => void;
  autoSubmit?: boolean;
}

const CodingPlatform: React.FC<Props> = ({ handleFinalSubmit, autoSubmit }) => {
  const [question, setQuestion] = useState<QuestionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState("");
  const [runResult, setRunResult] = useState<RunResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string>("");
  const [language, setLanguage] = useState(
    "58367b22-5147-4543-812c-48177a1f5feb"
  );

  const applicantId = localStorage.getItem("applicantId");
  const attemptId = localStorage.getItem("attemptId");

  const languageMap: any = {
    "ade9c9b9-b772-459e-9e98-d5f591f83826": "python",
    "af451228-e9e6-404f-97ac-070e89e23ff9": "javascript",
    "58367b22-5147-4543-812c-48177a1f5feb": "java",
    "6d823c70-4ed1-4c6f-8cd6-a188d820881d": "csharp",
  };
  const selectedLanguage = languageMap[language];

  // Get initial code template based on language
  const getCodeTemplate = (data: QuestionResponse, lang: string): string => {
    const langKey = languageMap[lang];

    if (langKey === "python") {
      return `${data.functionSignature}\n    # Write your code here\n  `;
    } else if (langKey === "javascript") {
      return `${data.functionSignature} {\n    // Write your code here\n    \n}`;
    } else if (langKey === "java") {
      return `${data.functionSignature} {\n    // Write your code here\n   \n}`;
    } else if (langKey === "csharp") {
      return `${data.functionSignature}\n{\n    // Write your code here\n   \n}`;
    }

    return `${data.functionSignature}\n{\n// Write your code here\n}`;
  };

  useEffect(() => {
    const fetchQuestion = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await axiosInstance.get(
          `/applicant-questions/start/${applicantId}/${attemptId}/${language}`
        );
        const data = res.data;
        setQuestion(data);
        setCode(getCodeTemplate(data, language));
      } catch (error: any) {
        console.error("Error fetching question:", error);
        setError(
          `Failed to load question: ${
            error.response?.data?.message || error.message
          }`
        );
      } finally {
        setLoading(false);
      }
    };
    fetchQuestion();
  }, [language]);

  const navigate = useNavigate();

  const handleRun = async () => {
    if (!question) return;

    setRunning(true);
    setError("");
    setRunResult(null);

    try {
      const res = await axiosInstance.post("/validate", {
        problemKey: question.problemKey,
        language: selectedLanguage,
        userCode: code,
      });

      if (res.data.error) {
        setError(res.data.error);
      } else {
        setRunResult(res.data);
      }
    } catch (err: any) {
      console.error("Error running code:", err);
      const errorMessage =
        err.response?.data?.message || err.message || "Failed to run code";
      setError(`Execution failed: ${errorMessage}`);
    } finally {
      setRunning(false);
    }
  };

  useEffect(() => {
    if (autoSubmit && !submitting) {
      handleAutoSubmit();
    }
  }, [autoSubmit]);

  const handleAutoSubmit = async () => {
    if (!question) return;
    setSubmitting(true);

    try {
      // Run test cases first
      const validateRes = await axiosInstance.post("/validate", {
        problemKey: question.problemKey,
        language: selectedLanguage,
        userCode: code,
      });

      // Submit code
      await axiosInstance.post("/submit", {
        applicantId,
        problemKey: question.problemKey,
        language: selectedLanguage,
        userCode: code,
      });

      // Trigger final evaluation
      await handleFinalSubmit();
    } catch (err: any) {
      console.error("❌ Auto submit failed:", err);
      setError(
        `Auto submit failed: ${err.response?.data?.message || err.message}`
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (!question) return;
    setSubmitting(true);
    setError("");

    try {
      await axiosInstance.post("/submit", {
        applicantId,
        problemKey: question.problemKey,
        language: selectedLanguage,
        userCode: code,
      });

      await handleFinalSubmit();

      // Pause detection
      const pauseResponse = await axiosProctorInstance.post("/pause-detection");

      // Cleanup images
      const cleanupResponse = await axiosProctorInstance.post("/cleanup");
    } catch (err: any) {
      console.error("Error submitting code:", err);
      setError(`Submit failed: ${err.response?.data?.message || err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusIcon = (passed: boolean) => {
    return passed ? "✅" : "❌";
  };

  const getStatusClass = (passed: boolean) => {
    return passed ? "passed" : "failed";
  };

  if (loading) return <p className="loading">Loading question...</p>;

  if (error && !question) {
    return (
      <div className="error-container">
        <h3>Error Loading Question</h3>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  return (
    <div className="coding-platform">
      {/* === LEFT PANEL: Problem Description === */}
      <div className="left-panel">
        {question && (
          <>
            <h1>{question.title}</h1>
            <p>{question.description}</p>

            <h3>Test Cases</h3>
            <ul className="test-cases">
              {question.testCases
                .filter((testCase, idx) => testCase.isHidden != true)
                .map((test, idx) => (
                  <li key={idx}>
                    <div className="test-case">
                      <h4>Test Case {idx + 1}</h4>
                      <strong>Input:</strong>
                      <pre>{test.input}</pre>
                      <strong>Expected Output:</strong>
                      <pre>{test.expectedOutput}</pre>
                    </div>
                  </li>
                ))}
            </ul>
          </>
        )}

        {/* Notes Section */}
        <div className="alter-before-coding">
          <p>Note</p>
          <ul>
            <li>Write your code inside the provided function signature.</li>
            <li>
              Your function must return the result; do not use print statements.
            </li>
            <li>Ensure your return type matches the expected output type.</li>
            <li>For boolean functions, return true/false, not 1/0.</li>
            <li>Avoid using built-in methods unless explicitly allowed.</li>
          </ul>
        </div>
      </div>

      {/* === RIGHT PANEL: Editor + Console === */}
      <div className="right-panel">
        {/* Language Selector */}
        <div className="language-selector">
          <label htmlFor="language">Language: </label>
          <select
            id="language"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            disabled={running || submitting}
          >
            <option value="ade9c9b9-b772-459e-9e98-d5f591f83826">Python</option>
            <option value="af451228-e9e6-404f-97ac-070e89e23ff9">
              JavaScript
            </option>
            <option value="58367b22-5147-4543-812c-48177a1f5feb">Java</option>
            <option value="6d823c70-4ed1-4c6f-8cd6-a188d820881d">C#</option>
          </select>
        </div>

        {/* Editor */}
        <div className="editor-section">
          <Editor
            height="60vh"
            language={languageMap[language]}
            value={code}
            theme="vs-dark"
            onChange={(val) => setCode(val || "")}
            options={{
              fontSize: 16,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              automaticLayout: true,
              wordWrap: "on",
              lineNumbers: "on",
              folding: true,
              bracketMatching: "always",
            }}
          />

          {/* Run / Submit Buttons */}
          <div className="button-row">
            <button
              className="run-btn"
              onClick={handleRun}
              disabled={running || submitting || !code.trim()}
            >
              {running ? "Running..." : "Run"}
            </button>
            <button
              className="submit-btn"
              onClick={handleSubmit}
              disabled={submitting || running}
            >
              {submitting ? "Submitting..." : "Submit"}
            </button>
          </div>
        </div>

        {/* Auto Submit Indicator */}
        {autoSubmit && submitting && (
          <div className="auto-submit-note">
            <p>⏳ Auto submit in progress...</p>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="error-display">
            <h3>⚠️ Error</h3>
            <pre className="error-message">{error}</pre>
          </div>
        )}

        {/* Loading Indicator */}
        {running && !error && (
          <div className="loading-indicator">
            <p>🔄 Running code, please wait...</p>
          </div>
        )}

        {/* Results Display */}
        {runResult && !running && !error && (
          <div className="results">
            <div className="results-header">
              <h3>Run Results</h3>
              <div className={`status-badge ${runResult.status.toLowerCase()}`}>
                <span className="status-text">
                  {runResult.status} ({runResult.passed}/{runResult.total}{" "}
                  passed)
                </span>
              </div>
            </div>

            {/* Overall Output */}
            {/* {runResult.output && (
              <div className="overall-output">
                <h4>Output:</h4>
                <pre className="output-text">{runResult.output}</pre>
              </div>
            )} */}

            {/* Test Results */}
            <div className="test-results">
              <h4>Test Case Results:</h4>
              {runResult.testResults.map((tr, index) => (
                <div
                  key={index}
                  className={`result-item ${getStatusClass(tr.passed)}`}
                >
                  <div className="result-header">
                    <span className="test-number">Test Case {index + 1}</span>
                    <span className="status-icon">
                      {getStatusIcon(tr.passed)}
                    </span>
                  </div>

                  <div className="result-details">
                    <div className="result-row">
                      <strong>Input:</strong>
                      <span className="result-value">
                        {tr.input || "No input"}
                      </span>
                    </div>
                    <div className="result-row">
                      <strong>Expected:</strong>
                      <span className="result-value expected">
                        {tr.expected || "No expected output"}
                      </span>
                    </div>
                    <div className="result-row">
                      <strong>Actual:</strong>
                      <span
                        className={`result-value ${
                          tr.passed ? "actual-correct" : "actual-incorrect"
                        }`}
                      >
                        {tr.actual || "No output produced"}
                      </span>
                    </div>
                    {tr.stderr && (
                      <div className="result-row error-row">
                        <strong>Error:</strong>
                        <pre className="error-text">{tr.stderr}</pre>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CodingPlatform;

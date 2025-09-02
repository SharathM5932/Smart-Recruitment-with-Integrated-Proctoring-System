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

interface RunResponse {
  status: string;
  total: number;
  passed: number;
  output: string;
  testResults: {
    input: string;
    expected: string;
    actual: string;
    passed: boolean;
    stderr: string;
  }[];
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

  useEffect(() => {
    const fetchQuestion = async () => {
      try {
        const res = await axiosInstance.get(
          `/applicant-questions/start/${applicantId}/${attemptId}/${language}`
        );
        const data = res.data;
        setQuestion(data);

        if (language === "ade9c9b9-b772-459e-9e98-d5f591f83826") {
          setCode(`${data.functionSignature}\n\n# Write your code here\n`);
        } else {
          setCode(`${data.functionSignature}\n{\n// Write your code here\n}`);
        }
      } catch (error) {
        console.error("Error fetching question:", error);
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
    try {
      const res = await axiosInstance.post("/validate", {
        problemKey: question.problemKey,
        language: selectedLanguage,
        userCode: code,
      });
      setRunResult(res.data);
    } catch (err) {
      console.error("Error running code:", err);
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
    try {
      // ✅ Run test cases
      await axiosInstance.post("/validate", {
        problemKey: question.problemKey,
        language: selectedLanguage,
        userCode: code,
      });

      // ✅ Submit code
      await axiosInstance.post("/submit", {
        applicantId,
        problemKey: question.problemKey,
        language: selectedLanguage,
        userCode: code,
      });

      // ✅ Trigger final evaluation
      await handleFinalSubmit();
    } catch (err) {
      console.error("❌ Auto submit failed:", err);
    }
  };

  const handleSubmit = async () => {
    if (!question) return;
    setSubmitting(true);

    try {
      await axiosInstance.post("/submit", {
        applicantId,
        problemKey: question.problemKey,
        language: selectedLanguage,
        userCode: code,
      });

      await handleFinalSubmit();

      // Pause detection: when click on capture btn then only it take a snapshot
      const pauseResponse = await axiosProctorInstance.post("/pause-detection");
      const pauseData = pauseResponse.data;
      // console.log("Detection paused:", pauseData);

      // Cleanup images
      const cleanupResponse = await axiosProctorInstance.post("/cleanup");
      const cleanupData = cleanupResponse.data;
      // console.log("Cleanup result:", cleanupData);
    } catch (err) {
      console.error("Error submitting code:", err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p className="loading">Loading question...</p>;

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
              {question.testCases.slice(0, 2).map((test, idx) => (
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
            }}
          />

          {/* Run / Submit Buttons */}
          <div className="button-row">
            <button className="run-btn" onClick={handleRun} disabled={running}>
              {running ? "Running..." : "Run"}
            </button>
            <button
              className="submit-btn"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? "Submitting..." : "Submit"}
            </button>
          </div>
        </div>

        {/* Auto Submit Trigger */}
        {autoSubmit && !submitting && (
          <p className="auto-submit-note">⏳ Auto submit in progress...</p>
        )}

        {/* Console + Test Results */}
        {running && <p className="loading">Running code, please wait...</p>}

        {runResult && !running && (
          <div className="results">
            <h3>Run Results</h3>
            <p>
              Status: {runResult.status} ({runResult.passed}/{runResult.total}{" "}
              passed)
            </p>
            <ul>
              {runResult.testResults.map((tr, index) => (
                <li
                  key={index}
                  className={`result-item ${tr.passed ? "passed" : "failed"}`}
                >
                  <div>
                    <strong>Input:</strong> {tr.input}
                  </div>
                  <div>
                    <strong>Expected:</strong> {tr.expected}
                  </div>
                  <div>
                    <strong>Actual:</strong> {tr.actual}
                  </div>
                  <div>
                    <strong>Passed:</strong> {tr.passed ? "✅" : "❌"}
                  </div>
                  {tr?.stderr && <div>{tr.stderr}</div>}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default CodingPlatform;

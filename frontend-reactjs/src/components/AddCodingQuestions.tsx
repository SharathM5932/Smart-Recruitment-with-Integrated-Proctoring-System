import React, { useState } from "react";
import "./css/AddCodingQuestions.css";

interface LanguageConfig {
  language: string;
  signature: string;
  functionName: string;
}

interface TestCase {
  input: string;
  expectedOutput: string;
}

interface CodingQuestion {
  key: string;
  title: string;
  description: string;
  languageConfigs: LanguageConfig[];
  testCases: TestCase[];
}

const AddCodingQuestions: React.FC = () => {
  const [question, setQuestion] = useState<CodingQuestion>({
    key: "",
    title: "",
    description: "",
    languageConfigs: [{ language: "", signature: "", functionName: "" }],
    testCases: [{ input: "", expectedOutput: "" }],
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    field: keyof CodingQuestion
  ) => {
    setQuestion({ ...question, [field]: e.target.value });
  };

  const handleLangConfigChange = (
    index: number,
    field: keyof LanguageConfig,
    value: string
  ) => {
    const updatedConfigs = [...question.languageConfigs];
    updatedConfigs[index][field] = value;
    setQuestion({ ...question, languageConfigs: updatedConfigs });
  };

  // const addLanguageConfig = () => {
  //   setQuestion({
  //     ...question,
  //     languageConfigs: [...question.languageConfigs, { language: '', signature: '', functionName: '' }],
  //   });
  // };

  const handleTestCaseChange = (
    index: number,
    field: keyof TestCase,
    value: string
  ) => {
    const testCases = [...question.testCases];
    testCases[index][field] = value;
    setQuestion({ ...question, testCases });
  };

  const addTestCase = () => {
    setQuestion({
      ...question,
      testCases: [...question.testCases, { input: "", expectedOutput: "" }],
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Make POST request here if needed
  };

  return (
    <div className="add-coding-container">
      <h2>ADD CODING QUESTION</h2>
      <form className="coding-form" onSubmit={handleSubmit}>
        <fieldset>
          <legend>Problem Details</legend>
          <label>Key:</label>
          <input
            type="text"
            value={question.key}
            onChange={(e) => handleChange(e, "key")}
          />

          <label>Title:</label>
          <input
            type="text"
            value={question.title}
            onChange={(e) => handleChange(e, "title")}
          />

          <label>Description:</label>
          <textarea
            value={question.description}
            onChange={(e) => handleChange(e, "description")}
          />
        </fieldset>

        <fieldset>
          <legend>Language Configs</legend>
          {question.languageConfigs.map((config, i) => (
            <div key={i}>
              {/* <input
                type="text"
                placeholder="Language"
                value={config.language}
                onChange={(e) => handleLangConfigChange(i, 'language', e.target.value)}
              /> */}

              <select
                value={config.language}
                onChange={(e) =>
                  handleLangConfigChange(i, "language", e.target.value)
                }
              >
                <option value="">Select Language</option>
                <option value="1">Python</option>
                <option value="2">JavaScript</option>
                <option value="3">Java</option>
                <option value="4">C</option>
                <option value="5">C++</option>
              </select>

              <input
                type="text"
                placeholder="Function Signature"
                value={config.signature}
                onChange={(e) =>
                  handleLangConfigChange(i, "signature", e.target.value)
                }
              />
              <input
                type="text"
                placeholder="Function Name"
                value={config.functionName}
                onChange={(e) =>
                  handleLangConfigChange(i, "functionName", e.target.value)
                }
              />
            </div>
          ))}
          {/* <button type="button" onClick={addLanguageConfig}>+ Add Language Config</button> */}
        </fieldset>

        <fieldset>
          <legend>Test Cases</legend>
          {question.testCases.map((test, i) => (
            <div key={i}>
              <input
                type="text"
                placeholder="Input"
                value={test.input}
                onChange={(e) =>
                  handleTestCaseChange(i, "input", e.target.value)
                }
              />
              <input
                type="text"
                placeholder="Expected Output"
                value={test.expectedOutput}
                onChange={(e) =>
                  handleTestCaseChange(i, "expectedOutput", e.target.value)
                }
              />
            </div>
          ))}
          <button type="button" onClick={addTestCase}>
            + Add Test Case
          </button>
        </fieldset>

        <div className="submit-container">
          <button type="submit" className="submit-btn">
            Submit Question
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddCodingQuestions;

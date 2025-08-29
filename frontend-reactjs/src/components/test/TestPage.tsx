// Updated TestPage.tsx using Redux Toolkit and createAsyncThunk
import { useEffect, useState } from "react";
import { useFullScreenHandle } from "react-full-screen";
import { useDispatch, useSelector } from "react-redux";
import { Outlet, useNavigate, useParams } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../css/TestPage.css";
import MalpracticeTerminated from "./ProctorApp/MalpracticeTerminated";
import QuestionBlock from "./QuestionBlock";
import Sidebar from "./Sidebar";

import {
  incrementMalpractice,
  setAlertMessage,
  setIsTestCompleted,
  setIsTestStarted,
} from "../../redux/slices/proctorSlice";
import {
  decrementTime,
  setAnswer,
  setCurrentIndex,
  setStarted,
} from "../../redux/slices/test/testSlice";
import {
  evaluateTest,
  fetchTestData,
  skipQuestion,
  submitAnswer,
} from "../../redux/slices/test/testThunks";
import { type RootState } from "../../redux/store";
import CodingPlatform from "./CodingApp/CodingPlatform";
import Alerts from "./ProctorApp/Alerts";
import Navbar from "./ProctorApp/Navbar";
import ProctorApp from "./ProctorApp/ProctorApp";

const formatTime = (sec: number) => {
  const m = Math.floor(sec / 60)
    .toString()
    .padStart(2, "0");
  const s = (sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
};

const TestPage = () => {
  const { token, applicantId, attemptId } = useParams();
  const { verificationComplete, malpracticeCount } = useSelector(
    (state: RootState) => state.proctor
  );

  if (applicantId !== undefined && attemptId !== undefined) {
    localStorage.setItem("applicantId", applicantId.toString());
    localStorage.setItem("attemptId", attemptId.toString());
  }
  //   console.log("Applicant ID:", applicantId, "Attempt ID:", attemptId);

  const dispatch = useDispatch<any>();
  const handle = useFullScreenHandle();
  const [submittingFinal, setSubmittingFinal] = useState(false);

  const {
    questions,
    answers,
    currentIndex,
    submitted,
    score,
    timeLeft,
    started,
    loading,
  } = useSelector((state: RootState) => state.test);
  const navigate = useNavigate();

  useEffect(() => {
    if (submitted) {
      navigate("/thank-you");
    }
    const saved = localStorage.getItem(`timer-${attemptId}`);
    if (saved) {
      // timer restoration if needed
    }
  }, [attemptId]);

  useEffect(() => {
    if (!started || submitted) return;

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) toast.warning("You exited fullscreen.");
    };
    const handleTabChange = () => {
      if (document.hidden) {
        toast.warning("Tab switching is not allowed.");
        if (malpracticeCount < 7) {
          dispatch(incrementMalpractice());
        }

        const newCount = malpracticeCount + 1;
        if (newCount >= 7) {
          dispatch(
            setAlertMessage("❌ Test terminated due to multiple malpractices.")
          );
          dispatch(setIsTestCompleted(true));
          handleFinalSubmit();
          setTimeout(() => {
            // window.location.href = "about:blank";
            return <MalpracticeTerminated />;
          }, 5000);
        }
      }
    };

    const beforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "Are you sure you want to leave?";
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("visibilitychange", handleTabChange);
    window.addEventListener("beforeunload", beforeUnload);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("visibilitychange", handleTabChange);
      window.removeEventListener("beforeunload", beforeUnload);
    };
  }, [started, submitted]);

  useEffect(() => {
    if (!started || submitted) return;
    const timer = setInterval(() => {
      dispatch(decrementTime());
    }, 1000);
    return () => clearInterval(timer);
  }, [started, submitted, dispatch]);

  // Handler Functions
  const handleOptionSelect = (questionId: string, optionId: string) => {
    const question = questions[currentIndex];
    if (!question.editable) return;
    dispatch(setAnswer({ questionId, optionId }));
  };

  const handleNext = async () => {
    const q = questions[currentIndex];
    const selected = answers[q.mcq_question.id];
    if (!selected && q.status !== "answered") {
      toast.warning("Please select an option or click Skip to proceed.");
      return;
    }
    if (q.status !== "answered") {
      await dispatch(
        submitAnswer({
          token,
          applicantId,
          attemptId,
          questionId: q.mcq_question.id,
          selectedOptionId: selected,
        })
      );
    }
    if (currentIndex < questions.length - 1) {
      dispatch(setCurrentIndex(currentIndex + 1));
    }
  };

  const handleSkip = async () => {
    const q = questions[currentIndex];
    if (q.status === "answered") return;
    await dispatch(
      skipQuestion({
        token,
        applicantId,
        attemptId,
        questionId: q.mcq_question.id,
      })
    );
    if (currentIndex < questions.length - 1) {
      dispatch(setCurrentIndex(currentIndex + 1));
    }
  };

  const handleFinalSubmit = async () => {
    setSubmittingFinal(true);

    try {
      await dispatch(evaluateTest({ token, applicantId, attemptId }));
      // ✅ Clear the registered face from backend
      const formData = new FormData();
      formData.append("applicant_id", applicantId || "");
      //   await axios.post("http://localhost:8000/clear", formData);
      console.log("🧹 Face data cleared successfully");
      localStorage.removeItem(`timer-${attemptId}`);
      toast.success("Test submitted successfully!");
    } catch (err) {
      console.error("❌ Error during test submit:", err);
      toast.error("Error while submitting test.");
    } finally {
      setSubmittingFinal(false);
    }
  };

  const handleStartTest = async () => {
    try {
      const data = await dispatch(
        fetchTestData({ token, applicantId, attemptId })
      ).unwrap();
      handle.enter();
      dispatch(setStarted(true));
      dispatch(setIsTestStarted(true));

      toast.info(`Attempts left: ${3 - (data.attemptCount ?? 0)}`);
    } catch (err: any) {
      toast.error(err || "Unable to resume test");
    }
  };

  const answeredCount = questions.filter((q) => q.status === "answered").length;
  const [showCodingPlatform, setShowCodingPlatform] = useState(false);

  return (
    // <FullScreen handle={handle} className="test-page">
    <>
      <Navbar />
      <Outlet />
      <Alerts />
      <ProctorApp handleFinalSubmit={handleFinalSubmit} />

      <div className="coding-platform">
        {/* // Main container */}
        <div className="main-containers">
          <ToastContainer
            position="bottom-left"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="colored"
          />
          {loading ? (
            <div className="spinner">Loading test...</div>
          ) : (
            <div className="mcq-test-container">
              {!started && !submitted ? (
                // Instructions
                <div className="instructions">
                  <div className="start-testtt">
                    <h2>Test Instructions</h2>
                    {verificationComplete && (
                      <button
                        className="submit-button str-btn"
                        onClick={handleStartTest}
                      >
                        Start Test
                      </button>
                    )}
                  </div>

                  <h3>General Guidelines</h3>
                  <ul>
                    <li>
                      The test consists of two sections:
                      <ul>
                        <li>Multiple Choice Questions (MCQs)</li>
                        <li>Coding Questions</li>
                      </ul>
                    </li>
                    <li>
                      Ensure you have a stable internet connection throughout
                      the test.
                    </li>
                    <li>
                      Do not refresh or close the browser while taking the test.
                    </li>
                    <li>
                      Your activity will be monitored by the proctoring system.
                    </li>
                  </ul>

                  <h3>MCQ Section</h3>
                  <ul>
                    <li>Each question has only one correct answer.</li>
                    <li>
                      You may skip questions and return to them before starting
                      the coding section.
                    </li>
                    <li>
                      Once you select an answer and click Next, you cannot
                      revisit that question.
                    </li>
                    <li>
                      Carefully review all your answers before proceeding to the
                      coding section.
                    </li>
                  </ul>

                  <h3>Coding Section</h3>
                  <ul>
                    <li>
                      Write your code inside the provided function signature.
                    </li>
                    <li>
                      Your function must return the result; do not use print
                      statements.
                    </li>
                    <li>
                      Avoid using built-in methods unless explicitly allowed.
                    </li>
                    <li>
                      Ensure your code is correct, complete, and efficient
                      before submission.
                    </li>
                  </ul>

                  <h3>Submission Guidelines</h3>
                  <ul>
                    <li>
                      Carefully review your code and ensure it meets all
                      requirements before submitting.
                    </li>
                    <li>Click the Submit button to finalize your test.</li>
                    <li>
                      Once submitted, you will not be able to make any further
                      changes to your code.
                    </li>
                    <li>
                      After submission, the system will automatically perform
                      proctoring cleanup and record your final submission.
                    </li>
                  </ul>

                  <div style={{ paddingRight: "30px" }}>
                    {verificationComplete && (
                      <button
                        className="submit-button str-btn"
                        style={{ marginLeft: "400px", marginTop: "20px" }}
                        onClick={handleStartTest}
                      >
                        Start Test
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                !showCodingPlatform && (
                  <>
                    {/* //QuestionBlock */}
                    <QuestionBlock
                      currentQuestion={questions[currentIndex]}
                      currentIndex={currentIndex}
                      answers={answers}
                      handleOptionSelect={handleOptionSelect}
                      handleNext={handleNext}
                      handleSkip={handleSkip}
                    />

                    {/* Side Bar */}
                    <Sidebar
                      questions={questions}
                      currentIndex={currentIndex}
                      setCurrentIndex={(index) =>
                        dispatch(setCurrentIndex(index))
                      }
                      answeredCount={answeredCount}
                      timeLeft={timeLeft}
                      formatTime={formatTime}
                      onStartCodingTest={() => setShowCodingPlatform(true)}
                    />

                    {/* ConfirModal
                      {showConfirmModal && (
                        <ConfirmModal
                          onConfirm={handleFinalSubmit}
                          isSubmitting={submittingFinal}
                        />
                      )} */}
                  </>
                )
              )}
            </div>
          )}
        </div>
        {showCodingPlatform && (
          <CodingPlatform handleFinalSubmit={handleFinalSubmit} />
        )}
      </div>
    </>
    // </FullScreen>
  );
};

export default TestPage;

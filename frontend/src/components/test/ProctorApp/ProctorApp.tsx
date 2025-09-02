// ProctorApp.tsx
import React, { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import "./ProctorApp.css";
import WebcamCapture from "./WebcamCapture";

import {
  incrementMalpractice,
  setAlertMessage,
  setIsTestCompleted,
  setVerificationComplete,
} from "../../../redux/slices/proctorSlice";

import { type RootState } from "../../../redux/store";

type MyComponentProps = {
  handleFinalSubmit: () => Promise<void>;
  onVerificationComplete: () => void;
};

const ProctorApp: React.FC<MyComponentProps> = ({
  handleFinalSubmit,
  onVerificationComplete,
}) => {
  const dispatch = useDispatch();
  const handlingViolation = useRef(false);

  const {
    isTestStarted,
    isTestCompleted,
    malpracticeCount,
    verificationComplete,
  } = useSelector((state: RootState) => state.proctor);

  const applicantId = localStorage.getItem("applicantId") || "";

  const handleVerificationComplete = (): void => {
    dispatch(setVerificationComplete(true));
    dispatch(
      setAlertMessage("✅ Verification complete - Ready to start test!")
    );
    onVerificationComplete();
  };

  const handleMalpracticeDetected = (message: string): void => {
    if (handlingViolation.current || malpracticeCount >= 7 || !isTestStarted)
      return;

    handlingViolation.current = true;

    if (verificationComplete && malpracticeCount < 7 && isTestStarted) {
      dispatch(incrementMalpractice());
    }

    setTimeout(() => {
      handlingViolation.current = false;

      if (malpracticeCount >= 6 && isTestStarted) {
        dispatch(
          setAlertMessage("❌ Test terminated due to multiple malpractices.")
        );
        dispatch(setIsTestCompleted(true));
        handleFinalSubmit();
      }
    }, 1000);
  };

  useEffect(() => {
    if (malpracticeCount >= 7 && isTestStarted) {
      dispatch(setIsTestCompleted(true));
      dispatch(
        setAlertMessage("❌ Test terminated due to multiple malpractices.")
      );
      handleFinalSubmit();
    }
  }, [malpracticeCount, isTestStarted]);

  return (
    <div>
      <div className="main-content">
        {isTestStarted && !isTestCompleted && (
          <div className="violation-count">
            Violations: {malpracticeCount}/7
          </div>
        )}
        <WebcamCapture
          onMalpracticeDetected={handleMalpracticeDetected}
          isTestStarted={isTestStarted}
          isTestCompleted={isTestCompleted}
          onVerificationComplete={handleVerificationComplete}
          applicantId={applicantId}
        />
      </div>
    </div>
  );
};

export default ProctorApp;

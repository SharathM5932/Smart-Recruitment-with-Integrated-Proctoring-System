import axios, { type AxiosResponse } from "axios";
import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Webcam from "react-webcam";
import { type RootState } from "../../../redux/store";
import "./WebcamCapture.css";

import axiosProctorInstance from "../../../api/axiosProctorInstance";
import {
  setAlertMessage,
  setCapturedImage,
} from "../../../redux/slices/proctorSlice";

interface WebcamCaptureProps {
  onMalpracticeDetected: (message: string) => void;
  isTestStarted: boolean;
  isTestCompleted: boolean;
  onVerificationComplete: () => void;
  applicantId: string;
}

interface VerificationResponse {
  status:
    | "verified"
    | "identity_registered"
    | "face_not_detected"
    | "multiple_faces"
    | "mismatch"
    | "no_reference_face";
  message?: string;
  similarity?: number;
}

interface MalpracticeResponse {
  malpracticeImageUrl: string;
}

interface PassiveDetectionResponse {
  status:
    | "face_detected"
    | "multiple_faces"
    | "no_face"
    | "invalid_image"
    | "detection_error";
  count?: number;
  coverage?: number;
  x_offset?: number;
  y_offset?: number;
}

const WebcamCapture: React.FC<WebcamCaptureProps> = ({
  onMalpracticeDetected,
  isTestStarted,
  isTestCompleted,
  onVerificationComplete,
  applicantId,
}) => {
  const webcamRef = useRef<Webcam>(null);
  const [canCapture, setCanCapture] = useState<boolean>(false);
  const [faceDetected, setFaceDetected] = useState<boolean>(false);
  const [verificationComplete, setVerificationComplete] =
    useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [multipleFacesDetected, setMultipleFacesDetected] =
    useState<boolean>(false);
  const [cameraReady, setCameraReady] = useState<boolean>(false);
  const [lastAlertTime, setLastAlertTime] = useState<number>(0);
  const [faceVerifiedAlertShown, setFaceVerifiedAlertShown] =
    useState<boolean>(false);
  const [lastDetectionTime, setLastDetectionTime] = useState<number>(0);
  const [detectionStatus, setDetectionStatus] = useState<string>(""); // Track current detection status
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const passiveDetectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [malpracticeCooldown, setMalpracticeCooldown] = useState(false);
  const [hasCapturedImage, setHasCapturedImage] = useState<boolean>(false);
  const [capturedImageSrc, setCapturedImageSrc] = useState<string | null>(null);
  const [lastMalpracticeAlert, setLastMalpracticeAlert] = useState<{
    message: string;
    timestamp: number;
  } | null>(null);

  const [faceCoverage, setFaceCoverage] = useState<number>(0);
  const [faceCentered, setFaceCentered] = useState<boolean>(false);

  const dispatch = useDispatch();
  const malpracticeCount = useSelector(
    (state: RootState) => state.proctor.malpracticeCount
  );

  const handleUserMedia = (): void => {
    setCameraReady(true);
    dispatch(
      setAlertMessage(
        "✅ Camera ready - Please position your face in the circle"
      )
    );
    startPassiveDetection();
  };

  const handleUserMediaError = (): void => {
    setCameraReady(false);
    dispatch(setAlertMessage("🚫 Camera access denied or not available"));
  };

  const setRateLimitedAlert = (
    message: string,
    minInterval: number = 2000
  ): void => {
    const now = Date.now();
    if (now - lastAlertTime >= minInterval) {
      dispatch(setAlertMessage(message));
      setLastAlertTime(now);
    }
  };

  // Passive detection for initial face detection (no image storage)
  const startPassiveDetection = (): void => {
    if (passiveDetectionIntervalRef.current) {
      clearInterval(passiveDetectionIntervalRef.current);
    }

    passiveDetectionIntervalRef.current = setInterval(async () => {
      if (
        !webcamRef.current ||
        !webcamRef.current.video?.readyState ||
        verificationComplete ||
        hasCapturedImage
      ) {
        return;
      }

      try {
        const imageSrc = webcamRef.current.getScreenshot();
        if (!imageSrc) return;

        const blob = await (await fetch(imageSrc)).blob();
        const file = new File([blob], "detection.jpg", { type: blob.type });

        const formData = new FormData();
        formData.append("file", file);

        // Use a passive detection endpoint that doesn't store images
        const res = await axiosProctorInstance.post<PassiveDetectionResponse>(
          "/detect/passive",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
            withCredentials: true, // keep this if you need cookies/sessions
          }
        );

        switch (res.data.status) {
          case "face_detected":
            setFaceDetected(true);
            setMultipleFacesDetected(false);

            // Check if face is properly framed (coverage > 20% and centered within 20%)
            const coverage = res.data.coverage || 0;
            const xOffset = res.data.x_offset || 100;
            const yOffset = res.data.y_offset || 100;

            setFaceCoverage(coverage);
            setFaceCentered(xOffset < 20 && yOffset < 20);

            // Enable capture only if face is properly framed
            setCanCapture(coverage >= 20 && xOffset < 20 && yOffset < 20);
            break;
          case "multiple_faces":
            setFaceDetected(false);
            setMultipleFacesDetected(true);
            setCanCapture(false);
            setFaceCoverage(0);
            setFaceCentered(false);
            setRateLimitedAlert("⚠️ Multiple faces detected");
            break;
          case "no_face":
            setFaceDetected(false);
            setMultipleFacesDetected(false);
            setCanCapture(false);
            setFaceCoverage(0);
            setFaceCentered(false);
            setRateLimitedAlert("🚫 Face not detected");
            break;
          case "invalid_image":
          case "detection_error":
            setFaceDetected(false);
            setMultipleFacesDetected(false);
            setCanCapture(false);
            setFaceCoverage(0);
            setFaceCentered(false);
            setRateLimitedAlert("❌ Detection error");
            break;
        }
      } catch (error) {
        console.error("Passive detection error:", error);
      }
    }, 2000);
  };

  useEffect(() => {
    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
      if (passiveDetectionIntervalRef.current) {
        clearInterval(passiveDetectionIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (
      !isTestStarted ||
      !isTestStarted ||
      isTestCompleted ||
      !verificationComplete
    ) {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
        detectionIntervalRef.current = null;
      }
      return;
    }

    const DETECTION_INTERVAL = 3000;

    if (malpracticeCount >= 7) {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
        detectionIntervalRef.current = null;
      }
      return;
    }

    const performDetection = async (): Promise<void> => {
      if (!hasCapturedImage) return;
      if (!webcamRef.current || !webcamRef.current.video?.readyState) return;

      try {
        const now = Date.now();
        if (now - lastDetectionTime < DETECTION_INTERVAL) return;
        setLastDetectionTime(now);

        const imageSrc = webcamRef.current.getScreenshot();
        if (!imageSrc) return;

        const blob = await (await fetch(imageSrc)).blob();
        const file = new File([blob], "live.jpg", { type: blob.type });

        const formData = new FormData();
        formData.append("file", file);
        formData.append("applicant_id", applicantId);

        const res = await axiosProctorInstance.post<VerificationResponse>(
          "/verify/embedding",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
            withCredentials: true,
          }
        );
        const status = res.data.status;

        // Update detection status for visual feedback
        setDetectionStatus(status);

        // Handle alerts every 3 seconds when issues are detected
        const shouldAlert =
          !lastMalpracticeAlert ||
          now - lastMalpracticeAlert.timestamp >= DETECTION_INTERVAL;

        switch (status) {
          case "verified":
            if (!faceVerifiedAlertShown) {
              setRateLimitedAlert("✅ Face Verified");
              setFaceVerifiedAlertShown(true);
              setLastMalpracticeAlert(null);
            }
            break;
          case "multiple_faces":
            if (shouldAlert) {
              await handleMalpractice("Multiple faces detected");
              setLastMalpracticeAlert({
                message: "Multiple faces detected",
                timestamp: now,
              });
            }
            break;
          case "mismatch":
            if (shouldAlert) {
              await handleMalpractice("Face mismatch detected");
              setLastMalpracticeAlert({
                message: "Face mismatch detected",
                timestamp: now,
              });
            }
            break;
          case "face_not_detected":
            if (shouldAlert) {
              await handleMalpractice("Face not detected");
              setLastMalpracticeAlert({
                message: "Face not detected",
                timestamp: now,
              });
            }
            break;
          case "no_reference_face":
            setRateLimitedAlert("ℹ️ Please register your face first.");
            break;
        }
      } catch (err) {
        console.error("Live detection error:", err);
        setDetectionStatus("detection_error");
      }
    };

    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
    }

    detectionIntervalRef.current = setInterval(
      performDetection,
      DETECTION_INTERVAL
    );

    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
    };
  }, [
    isTestStarted,
    isTestCompleted,
    verificationComplete,
    applicantId,
    lastDetectionTime,
    faceVerifiedAlertShown,
    hasCapturedImage,
    malpracticeCount,
    lastMalpracticeAlert,
  ]);

  const handleMalpractice = async (message: string): Promise<void> => {
    if (malpracticeCooldown || malpracticeCount >= 7 || !isTestStarted) return;

    setMalpracticeCooldown(true);
    setFaceVerifiedAlertShown(false);
    setRateLimitedAlert(`⚠️ ${message}`);

    // Only capture evidence if test has started
    if (isTestStarted) {
      await captureAndReportMalpractice(message);
      onMalpracticeDetected(message);
    }

    setTimeout(() => {
      setMalpracticeCooldown(false);
    }, 3000);
  };

  const captureAndReportMalpractice = async (
    message: string
  ): Promise<void> => {
    try {
      if (!webcamRef.current) return;

      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) return;

      const blob = await (await fetch(imageSrc)).blob();
      const file = new File([blob], "malpractice.jpg", { type: blob.type });

      const formData = new FormData();
      formData.append("file", file);
      formData.append("alertMessage", message);
      formData.append("applicantId", applicantId);

      await axios.post<MalpracticeResponse>(
        "http://localhost:3000/malpractice/alert",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
    } catch (error) {
      console.error(
        "Error reporting malpractice:",
        axios.isAxiosError(error)
          ? error.response?.data || error.message
          : error
      );
      setRateLimitedAlert("⚠️ Failed to report malpractice");
      throw error;
    }
  };

  const registerCandidate = async (imageSrc: string): Promise<any> => {
    try {
      if (!imageSrc) throw new Error("No image captured");

      const blob = await (await fetch(imageSrc)).blob();
      const file = new File([blob], "profile.jpg", { type: blob.type });

      const formData = new FormData();
      formData.append("file", file);
      formData.append("applicantId", applicantId);

      const response = await axios.post(
        "http://localhost:3000/malpractice/register-candidate",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      console.error("Registration failed:", error);
      throw error;
    }
  };

  const verifyIdentity = async (
    imageSrc: string
  ): Promise<AxiosResponse<VerificationResponse>> => {
    try {
      if (!imageSrc) throw new Error("No image captured");

      const blob = await (await fetch(imageSrc)).blob();
      const file = new File([blob], "verify.jpg", { type: blob.type });

      const formData = new FormData();
      formData.append("file", file);
      formData.append("applicant_id", applicantId);

      return await axiosProctorInstance.post<VerificationResponse>(
        "/verify",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          withCredentials: true,
        }
      );
    } catch (error) {
      console.error("Verification error:", error);
      throw error;
    }
  };

  const cleanupOldImages = async (): Promise<boolean> => {
    try {
      const formData = new FormData();
      formData.append("applicant_id", applicantId);

      const response = await axiosProctorInstance.post("/cleanup", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        withCredentials: true,
      });

      //   console.log("Cleanup result:", response.data);
      return true;
    } catch (error) {
      console.error("Error during cleanup:", error);
      return false;
    }
  };

  const cleanupRegisteredFace = async (): Promise<boolean> => {
    try {
      const formData = new FormData();
      formData.append("applicant_id", applicantId);

      const response = await axiosProctorInstance.post(
        "/cleanup/face",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          withCredentials: true,
        }
      );

      //   console.log("Face cleanup result:", response.data);
      return true;
    } catch (error) {
      console.error("Error during face cleanup:", error);
      return false;
    }
  };

  const capture = async (): Promise<void> => {
    if (!canCapture || !applicantId || !webcamRef.current) {
      setRateLimitedAlert(
        "🚫 Cannot capture – No valid face detected or missing user ID"
      );
      return;
    }

    setIsLoading(true);
    setRateLimitedAlert("⏳ Cleaning up old data...");

    try {
      // Stop passive detection
      if (passiveDetectionIntervalRef.current) {
        clearInterval(passiveDetectionIntervalRef.current);
        passiveDetectionIntervalRef.current = null;
      }

      // Cleanup old registered face first
      const faceCleanupSuccess = await cleanupRegisteredFace();

      // Cleanup debug images
      const imageCleanupSuccess = await cleanupOldImages();

      if (!faceCleanupSuccess || !imageCleanupSuccess) {
        setRateLimitedAlert("⚠️ Cleanup failed - trying to proceed anyway");
      }

      setRateLimitedAlert("⏳ Verifying your identity...");

      // Take screenshot
      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) throw new Error("Failed to capture image");

      // Store the captured image for later comparison
      setCapturedImageSrc(imageSrc);

      // Register and verify candidate
      await registerCandidate(imageSrc);
      const verifyResponse = await verifyIdentity(imageSrc);
      const status = verifyResponse.data.status;

      let message = "";
      switch (status) {
        case "face_not_detected":
          message = "🚫 Face not detected – please look at the camera.";
          // Restart passive detection if verification fails
          startPassiveDetection();
          break;
        case "multiple_faces":
          message = "⚠️ Multiple faces detected – only one person allowed.";
          // Restart passive detection if verification fails
          startPassiveDetection();
          break;
        case "mismatch":
          message = "❌ Face mismatch – identity verification failed.";
          // Restart passive detection if verification fails
          startPassiveDetection();
          break;
        case "identity_registered":
        case "verified":
          message = "✅ Identity verified successfully.";
          setVerificationComplete(true);
          setHasCapturedImage(true);
          dispatch(setCapturedImage(imageSrc));
          onVerificationComplete();
          setFaceVerifiedAlertShown(false);
          setLastMalpracticeAlert(null);
          break;
        default:
          message = "❗ Unknown verification response.";
          // Restart passive detection if verification fails
          startPassiveDetection();
      }

      setRateLimitedAlert(message);
    } catch (error) {
      console.error("Error during verification:", error);
      setRateLimitedAlert(
        `❌ Error: ${
          axios.isAxiosError(error)
            ? error.response?.data?.message || error.message
            : error
        }`
      );
      // Restart passive detection if verification fails
      startPassiveDetection();
    } finally {
      setIsLoading(false);
    }
  };

  // Get wrapper class based on current state
  const getWrapperClass = (): string => {
    if (!cameraReady) return "webcam-wrapper camera-not-ready";
    if (isLoading) return "webcam-wrapper processing";

    // During live proctoring
    if (verificationComplete) {
      switch (detectionStatus) {
        case "verified":
          return "webcam-wrapper verified";
        case "multiple_faces":
        case "mismatch":
        case "face_not_detected":
        case "detection_error":
          return "webcam-wrapper malpractice-detected";
        default:
          return "webcam-wrapper verified";
      }
    }

    // During initial face detection
    if (multipleFacesDetected) return "webcam-wrapper multiple-faces";
    if (faceDetected) {
      if (faceCoverage >= 20 && faceCentered) {
        return "webcam-wrapper face-detected-ready";
      } else if (faceCoverage < 20) {
        return "webcam-wrapper face-too-small";
      } else {
        return "webcam-wrapper face-not-centered";
      }
    }
    return "webcam-wrapper no-face";
  };

  const getButtonText = (): string => {
    if (isLoading) return "Processing...";
    if (!cameraReady) return "Camera Not Available";
    if (faceDetected) {
      if (faceCoverage < 20) return "Move closer - Face too small";
      if (!faceCentered) return "Center your face in the circle";
      return "Capture & Verify Identity";
    }
    return "Face Not Detected";
  };

  return (
    <div className="webcam-container">
      <div className={getWrapperClass()}>
        {!cameraReady && (
          <div className="loading-overlay">Loading camera...</div>
        )}
        <Webcam
          ref={webcamRef}
          className={`webcam ${cameraReady ? "show" : "hide"}`}
          screenshotFormat="image/jpeg"
          width={640}
          height={480}
          videoConstraints={{
            width: 640,
            height: 480,
            facingMode: "user",
          }}
          onUserMedia={handleUserMedia}
          onUserMediaError={handleUserMediaError}
        />
        {cameraReady && faceDetected && !verificationComplete && (
          <div className="positioning-guide">
            {faceCoverage < 20 && "Move closer to the camera"}
            {faceCoverage >= 20 &&
              !faceCentered &&
              "Center your face in the circle"}
            {faceCoverage >= 20 &&
              faceCentered &&
              "Perfect! Click Capture to verify"}
          </div>
        )}
      </div>

      {!verificationComplete && (
        <button
          className={`capture-button ${
            canCapture && !isLoading ? "active" : "disabled"
          }`}
          onClick={capture}
          disabled={!canCapture || isLoading || !cameraReady}
        >
          {getButtonText()}
        </button>
      )}
    </div>
  );
};

export default WebcamCapture;

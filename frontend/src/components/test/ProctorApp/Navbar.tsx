import { useEffect } from "react";
import { useSelector } from "react-redux";
import { type RootState } from "../../../redux/store";
import "./Navbar.css";
interface NavbarProps {
  timeLeft?: number;
  formatTime?: (s: number) => string;
  onTimeUp?: () => void;
}

const Navbar = ({ timeLeft, formatTime, onTimeUp }: NavbarProps) => {
  const capturedImage = useSelector(
    (state: RootState) => state.proctor.capturedImage
  );
  const { started } = useSelector((state: RootState) => state.test);

  // Trigger auto-submit when timer hits 0
  useEffect(() => {
    if (timeLeft === 0 && onTimeUp) {
      onTimeUp();
    }
  }, [timeLeft, onTimeUp]);
  return (
    <nav className="navbarr">
      <img
        src="../../../../src/assets/mirafraLogo.svg"
        alt="Logo"
        className="navbar__logo"
      />

      <div className="navbar-center">
        {timeLeft !== undefined && formatTime && capturedImage && started && (
          <div className="navbar-timer">{formatTime(timeLeft)}</div>
        )}
      </div>

      <div className="navbarr-right">
        {capturedImage && (
          <img
            src={capturedImage}
            alt="Captured Face"
            className="captured-image"
            width={50}
            height={50}
          />
        )}
      </div>
    </nav>
  );
};

export default Navbar;

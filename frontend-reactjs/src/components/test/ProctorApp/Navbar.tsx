import { useSelector } from "react-redux";
import { type RootState } from "../../../redux/store";
import "./Navbar.css";

const Navbar = () => {
  const capturedImage = useSelector(
    (state: RootState) => state.proctor.capturedImage
  );
  return (
    <nav className="navbarr">
      <img
        src="../../../../src/assets/mirafraLogo.svg"
        alt="Logo"
        className="navbar__logo"
      />
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

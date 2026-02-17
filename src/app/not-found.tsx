import Link from "next/link";
import styles from "../styles/NotFound.module.scss";
import { FaHome } from "react-icons/fa";

const NotFound = () => {
  const { a404, zero, t404, icon } = styles;

  return (
    <div className="userWrapper">
      <div className={a404}>
        <h2>۴</h2>
        <span className={zero}></span>
        <h2>۴</h2>
      </div>
      <div className={t404}>
        <p>اشتباه اومدی! اینجا خبری نیست...</p>
        <Link href="/">
          <FaHome className={icon} />
          صفحه اصلی
        </Link>
      </div>
    </div>
  );
};

export default NotFound;

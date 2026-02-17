import styles from "../styles/Loading.module.scss";

const Loading = () => {
  return (
    <div className="userWrapper">
      <span className={styles.loader}></span>
      <span className={styles.loaderText}>لودینگ...</span>
    </div>
  );
};

export default Loading;

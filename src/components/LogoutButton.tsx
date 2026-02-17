"use client";

import { useClerk } from "@clerk/nextjs";
import styles from "../styles/Profile.module.scss";
import { useState } from "react";

export const LogoutButton = () => {
  const { signOut } = useClerk();
  const [loading, setLoading] = useState(false);

  const Logout = async () => {
    setLoading(true);
    await signOut({
      redirectUrl: "/",
    });
  };

  return (
    <button className={styles.userLogout} onClick={Logout}>
      {loading ? (
        <span className={styles.btnLoader}></span>
      ) : (
        "خروج از حساب کاربری"
      )}
    </button>
  );
};

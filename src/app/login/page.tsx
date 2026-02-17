/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Link from "next/link";
import styles from "../../styles/Signup.module.scss";
import { SiGithub } from "react-icons/si";
import { FcGoogle } from "react-icons/fc";
import { FaEye, FaLock } from "react-icons/fa";
import { MdOutlineAlternateEmail } from "react-icons/md";
import Image from "next/image";
import { useSignIn } from "@clerk/nextjs";
import { useState } from "react";
import Loading from "@/app/loading";

const Login = () => {
  const { isLoaded, signIn, setActive } = useSignIn();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setshowPassword] = useState(false);
  const [btnLoad, setBtnLoad] = useState(false);
  const [btnGitHub, setBtnGitHub] = useState(false);
  const [btnGoogle, setBtnGoogle] = useState(false);

  if (!isLoaded) {
    return <Loading />;
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isLoaded) {
      return;
    }
    setBtnLoad(true);

    try {
      const result = await signIn.create({ identifier, password });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
      }
    } catch (error: any) {
      console.log(JSON.stringify(error, null, 2));
      setError(error.errors[0].message);
      setBtnLoad(false);
    }
  };

  const gitHubLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isLoaded) {
      return;
    }
    setBtnGitHub(true);

    try {
      await signIn.authenticateWithRedirect({
        strategy: "oauth_github",
        redirectUrl: "",
        redirectUrlComplete: `/`,
      });
    } catch (error: any) {
      console.log(JSON.stringify(error, null, 2));
      setError(error.errors[0].message);
      setBtnGitHub(false);
    }
  };

  const googleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isLoaded) {
      return;
    }
    setBtnGoogle(true);

    try {
      await signIn.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: "",
        redirectUrlComplete: `/`,
      });
    } catch (error: any) {
      console.log(JSON.stringify(error, null, 2));
      setError(error.errors[0].message);
      setBtnGoogle(false);
    }
  };

  const {
    sForm,
    signup,
    title,
    inputs,
    submitB,
    errMsg,
    options,
    socialLoginButtons,
    line,
    socialLoginButton,
    bxl,
    bxlp,
    btnLoader,
    bxlpActive,
    input,
    placeholder,
  } = styles;

  return (
    <form className={sForm}>
      <div className={signup}>
        <div className={title}>
          <h1>خوش برگشتی!</h1>
          <p>برای استفاده از خدمات وب‌سایت، نیازه که وارد اکانتت شی...</p>
        </div>
        <div className={inputs}>
          <div className={input}>
            <span className={placeholder}>ایمیل:</span>
            <div>
              <MdOutlineAlternateEmail className={bxl} />
              <input
                type="text"
                name="email"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
              />
            </div>
          </div>
          <div className={input}>
            <span className={placeholder}>رمز عبور:</span>
            <div>
              <FaLock className={bxl} />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                name="password"
                onChange={(e) => setPassword(e.target.value)}
              />
              <FaEye
                className={`${bxlp} ${showPassword ? `${bxlpActive}` : ""}`}
                onClick={() => setshowPassword(!showPassword)}
              />
            </div>
          </div>
        </div>
        <span className={errMsg}>{error && error}</span>
        <div className={submitB}>
          <button onClick={submit} type="submit">
            {btnLoad ? (
              <span className={btnLoader}></span>
            ) : (
              "ورود به حساب کاربری"
            )}
          </button>
        </div>
        <div className={line}>
          <hr />
          روش‌های دیگر
          <hr />
        </div>
        <div className={socialLoginButtons}>
          <button onClick={googleLogin} className={socialLoginButton}>
            <FcGoogle className={bxl} />
            {btnGoogle ? <span className={btnLoader}></span> : "ورود با گوگل"}
          </button>
          <button onClick={gitHubLogin} className={socialLoginButton}>
            <SiGithub className={bxl} />
            {btnGitHub ? (
              <span className={btnLoader}></span>
            ) : (
              "ورود با گیت‌هاب"
            )}
          </button>
        </div>
        <div className={options}>
          <p>
            عضوی از ما نیستی؟ <Link href="/signup">ثبت نام کن</Link>
          </p>
        </div>
        <div className={options}>
          <p>
            نیاز به کمک دارم!{" "}
            <Link href="/forgot-password">رمزم رو فراموش کردم</Link>
          </p>
        </div>
      </div>
    </form>
  );
};

export default Login;

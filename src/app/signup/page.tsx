/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Link from "next/link";
import styles from "../../styles/Signup.module.scss";
import { SiGithub } from "react-icons/si";
import { FcGoogle } from "react-icons/fc";
import { FaEye, FaLock } from "react-icons/fa";
import { FaUser } from "react-icons/fa";
import { MdOutlineAlternateEmail } from "react-icons/md";
import Image from "next/image";
import { useSignUp } from "@clerk/nextjs";
import { useState } from "react";
import Loading from "@/app/loading";

const Signup = () => {
  const { isLoaded, signUp, setActive } = useSignUp();
  const [username, setUsername] = useState("");
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [pendingVerification, setpendingVerification] = useState(false);
  const [code, setCode] = useState("");
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
    setError("");

    try {
      await signUp.create({
        username,
        emailAddress,
        password,
      });

      await signUp.prepareEmailAddressVerification({
        strategy: "email_code",
      });

      setpendingVerification(true);
    } catch (error: any) {
      console.log(JSON.stringify(error, null, 2));
      setError(error.errors[0].message);
      setBtnLoad(false);
    }
  };

  const onPressVerify = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isLoaded) {
      return;
    }

    setBtnLoad(false);

    try {
      const completeSignup = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (completeSignup.status !== "complete") {
        console.log(JSON.stringify(completeSignup, null, 2));
      } else if (completeSignup.status === "complete") {
        await setActive({ session: completeSignup.createdSessionId });
      }
    } catch (err: any) {
      console.log(JSON.stringify(err, null, 2));
      setError(err.errors[0].message);
      setBtnLoad(true);
    }
  };

  const gitHubSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isLoaded) {
      return;
    }
    setBtnGitHub(true);

    try {
      await signUp.authenticateWithRedirect({
        strategy: "oauth_github",
        redirectUrl: "",
        redirectUrlComplete: `/`,
      });

      setBtnGitHub(false);
    } catch (error: any) {
      console.log(JSON.stringify(error, null, 2));
      setError(error.errors[0].message);
      setBtnGitHub(false);
    }
  };

  const googleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isLoaded) {
      return;
    }
    setBtnGoogle(true);

    try {
      await signUp.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: "",
        redirectUrlComplete: `/`,
      });

      setBtnGoogle(false);
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
    verifyCode,
    bxl,
    bxlp,
    btnLoader,
    errMsgCode,
    bxlpActive,
    input,
    placeholder,
  } = styles;

  return (
    <form className={sForm}>
      {!pendingVerification ? (
        <div className={signup}>
          <div className={title}>
            <h1>خوش اومدی!</h1>
            <p>برای استفاده از خدمات وب‌سایت، نیازه که اکانت بسازی...</p>
          </div>
          <div className={inputs}>
            <div className={input}>
              <span className={placeholder}>نام کاربری:</span>
              <div>
                <FaUser className={bxl} />
                <input
                  type="text"
                  name="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>
            <div className={input}>
              <span className={placeholder}>ایمیل:</span>
              <div>
                <MdOutlineAlternateEmail className={bxl} />
                <input
                  type="email"
                  name="email"
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
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
                "ساخت حساب کاربری"
              )}
            </button>
          </div>
          <div className={line}>
            <hr />
            روش‌های دیگر
            <hr />
          </div>
          <div className={socialLoginButtons}>
            <button onClick={googleSignup} className={socialLoginButton}>
              <FcGoogle className={bxl} />
              {btnGoogle ? (
                <span className={btnLoader}></span>
              ) : (
                "ثبت نام با گوگل"
              )}
            </button>
            <button onClick={gitHubSignup} className={socialLoginButton}>
              <SiGithub className={bxl} />
              {btnGitHub ? (
                <span className={btnLoader}></span>
              ) : (
                "ثبت نام با گیت‌هاب"
              )}
            </button>
          </div>
          <div className={options}>
            <p>
              قبلا عضوی از ما شدی؟ <Link href="/login">وارد شو</Link>
            </p>
          </div>
        </div>
      ) : (
        <div className={signup}>
          <div className={title}>
            <h1>تائید ایمیل</h1>
            <p>کد تائیدی که برات ایمیل کردیم رو اینجا وارد کن...</p>
          </div>
          <div className={inputs}>
            <div className={input}>
              <span className={placeholder}></span>
              <div>
                <FaLock className={bxl} />
                <input
                  className={verifyCode}
                  type="text"
                  name="verify"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
              </div>
            </div>
          </div>
          <span className={errMsgCode}>{error && error}</span>
          <div className={submitB}>
            <button onClick={onPressVerify} type="submit">
              {btnLoad ? "تائید کد" : <span className={btnLoader}></span>}
            </button>
          </div>
        </div>
      )}
    </form>
  );
};

export default Signup;

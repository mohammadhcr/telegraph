/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import styles from "../../styles/Signup.module.scss";
import { MdOutlineAlternateEmail } from "react-icons/md";
import Image from "next/image";
import { useSignIn } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Suspense, useState } from "react";
import Loading from "@/app/loading";
import { FaEye, FaLock } from "react-icons/fa";

const ForgotPassword = () => {
  const { isLoaded, signIn, setActive } = useSignIn();
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [pendingVerification, setpendingVerification] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setshowPassword] = useState(false);
  const [btnLoad, setBtnLoad] = useState(false);

  const router = useRouter();

  if (!isLoaded) {
    return <Loading />;
  }

  const ResetAction = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isLoaded) {
      return;
    }
    setBtnLoad(true);
    setError("");

    try {
      await signIn.create({
        strategy: "reset_password_email_code",
        identifier: emailAddress,
      });

      setpendingVerification(true);
    } catch (error: any) {
      console.log(JSON.stringify(error, null, 2));
      setError(error.errors[0].message);
      setBtnLoad(false);
    }
  };

  const DoneAction = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isLoaded) {
      return;
    }
    setBtnLoad(false);
    setError("");

    try {
      await signIn
        .attemptFirstFactor({
          strategy: "reset_password_email_code",
          code,
          password,
        })
        .then((result) => {
          if (result.status !== "complete") {
            console.log(JSON.stringify(result, null, 2));
          } else if (result.status === "complete") {
            setActive({ session: result.createdSessionId });
            router.push("/profile");
          }
        });
    } catch (error: any) {
      console.log(JSON.stringify(error, null, 2));
      setError(error.errors[0].message);
      setBtnLoad(true);
    }
  };

  const {
    sForm,
    signup,
    title,
    inputs,
    submitB,
    bxlp,
    bxlpActive,
    verifyCode,
    bxl,
    btnLoader,
    errMsgCode,
    input,
    placeholder,
  } = styles;

  return (
    <Suspense fallback={<Loading />}>
      <form className={sForm}>
        {!pendingVerification ? (
          <div className={signup}>
            <div className={title}>
              <h1>فراموشی رمز عبور</h1>
              <p>برای ارسال کد «تغییر رمز»، ایمیل‌تون رو وارد کنین...</p>
            </div>
            <div className={inputs}>
              <div className={input}>
                <span className={placeholder}></span>
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
            </div>
            <span className={errMsgCode}>{error && error}</span>
            <div className={submitB}>
              <button onClick={ResetAction} type="submit">
                {btnLoad ? <span className={btnLoader}></span> : "ارسال کد"}
              </button>
            </div>
          </div>
        ) : (
          <div className={signup}>
            <div className={title}>
              <h1>تغییر رمز عبور</h1>
              <p>
                کد تائیدی که برات ایمیل کردیم و رمز جدیدت رو اینجا وارد کن...
              </p>
            </div>
            <div className={inputs}>
              <div className={input}>
                <span className={placeholder}>رمز عبور جدید:</span>
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
              <div className={input}>
                <span className={placeholder}>کد تائید:</span>
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
              <button onClick={DoneAction} type="submit">
                {btnLoad ? (
                  "تائید اطلاعات"
                ) : (
                  <span className={btnLoader}></span>
                )}
              </button>
            </div>
          </div>
        )}
      </form>
    </Suspense>
  );
};

export default ForgotPassword;

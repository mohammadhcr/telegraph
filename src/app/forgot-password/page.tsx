/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useSignIn } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Suspense, useState } from "react";
import Loading from "@/app/loading";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";

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
      const result = await signIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code,
        password,
      });

      if (result.status !== "complete") {
        console.log(JSON.stringify(result, null, 2));
      } else if (result.status === "complete") {
        await setActive({
          session: result.createdSessionId,
          navigate: async () => {
            await fetch("/api/users/sync", { method: "POST" }).catch(() => null);
            router.replace("/profile");
          },
        });
      }
    } catch (error: any) {
      console.log(JSON.stringify(error, null, 2));
      setError(error.errors[0].message);
      setBtnLoad(true);
    }
  };

  return (
    <Suspense fallback={<Loading />}>
      <main className="apple-page flex items-center justify-center px-4 py-8">
        <Card className="w-full max-w-md">
          {!pendingVerification ? (
            <>
              <CardHeader className="space-y-1 px-5 py-4 text-center">
                <CardTitle className="text-2xl">Forgot password</CardTitle>
                <CardDescription>
                  Enter your email and we will send a verification code.
                </CardDescription>
              </CardHeader>
              <CardContent className="px-5 pb-5 pt-0">
                <form onSubmit={ResetAction} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      name="email"
                      value={emailAddress}
                      onChange={(e) => setEmailAddress(e.target.value)}
                      placeholder="example@email.com"
                    />
                  </div>

                  {error && (
                    <p className="text-sm text-destructive" role="alert">
                      {error}
                    </p>
                  )}

                  <Button type="submit" className="w-full" disabled={btnLoad}>
                    {btnLoad ? <Spinner className="size-4" /> : "Send code"}
                  </Button>
                </form>
              </CardContent>
            </>
          ) : (
            <>
              <CardHeader className="space-y-1 px-5 py-4 text-center">
                <CardTitle className="text-2xl">Reset password</CardTitle>
                <CardDescription>
                  Enter the code and your new password to continue.
                </CardDescription>
              </CardHeader>
              <CardContent className="px-5 pb-5 pt-0">
                <form onSubmit={DoneAction} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">New password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        name="password"
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="********"
                        className="pl-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute top-1/2 left-1 h-7 w-7 -translate-y-1/2"
                        onClick={() => setshowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="code">Verification code</Label>
                    <Input
                      id="code"
                      type="text"
                      name="verify"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="123456"
                    />
                  </div>

                  {error && (
                    <p className="text-sm text-destructive" role="alert">
                      {error}
                    </p>
                  )}

                  <Button type="submit" className="w-full">
                    {btnLoad ? <Spinner className="size-4" /> : "Confirm reset"}
                  </Button>
                </form>
              </CardContent>
            </>
          )}
        </Card>
      </main>
    </Suspense>
  );
};

export default ForgotPassword;


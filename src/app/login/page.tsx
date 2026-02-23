/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Link from "next/link";
import { Chrome, Eye, EyeOff, Github } from "lucide-react";
import { useSignIn } from "@clerk/nextjs";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Loading from "@/app/loading";
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
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";

const Login = () => {
  const { isLoaded, signIn, setActive } = useSignIn();
  const router = useRouter();
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
        await setActive({
          session: result.createdSessionId,
          navigate: async () => {
            await fetch("/api/users/sync", { method: "POST" }).catch(() => null);
            router.replace("/chats");
          },
        });
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
        redirectUrl: "/sso-callback",
        redirectUrlComplete: `/chats`,
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
        redirectUrl: "/sso-callback",
        redirectUrlComplete: `/chats`,
      });
    } catch (error: any) {
      console.log(JSON.stringify(error, null, 2));
      setError(error.errors[0].message);
      setBtnGoogle(false);
    }
  };

  return (
    <main className="apple-page flex items-center justify-center px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 px-5 py-4 text-center">
          <CardTitle className="text-2xl">Welcome back</CardTitle>
          <CardDescription>
            Sign in with your account details to continue.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 px-5 pb-5 pt-0">
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="identifier">Email or username</Label>
              <Input
                id="identifier"
                type="text"
                name="email"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="example@email.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
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
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </Button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={btnLoad}>
              {btnLoad ? <Spinner className="size-4" /> : "Sign in"}
            </Button>
          </form>

          <div className="flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground">Or continue with</span>
            <Separator className="flex-1" />
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <Button onClick={googleLogin} variant="outline" disabled={btnGoogle}>
              <Chrome className="size-4" />
              {btnGoogle ? <Spinner className="size-4" /> : "Google"}
            </Button>
            <Button onClick={gitHubLogin} variant="outline" disabled={btnGitHub}>
              <Github className="size-4" />
              {btnGitHub ? <Spinner className="size-4" /> : "GitHub"}
            </Button>
          </div>

          <div className="space-y-2 text-center text-sm text-muted-foreground">
            <p>
              Do not have an account?{" "}
              <Link href="/signup" className="font-medium text-foreground hover:underline">
                Sign up
              </Link>
            </p>
            <p>
              Forgot your password?{" "}
              <Link
                href="/forgot-password"
                className="font-medium text-foreground hover:underline"
              >
                Reset it
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </main>
  );
};

export default Login;


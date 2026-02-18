import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

const Home = async () => {
  const { userId } = await auth();

  if (userId) {
    redirect("/chats");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-8">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl">Telegraph</CardTitle>
          <CardDescription>
            A simple messenger experience for direct conversations and fast communication.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <Button asChild className="w-full">
            <Link href="/login">Login</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/signup">Sign up</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
};

export default Home;

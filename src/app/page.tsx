import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

const Home = async () => {
  const { userId } = await auth();

  if (userId) {
    redirect("/chats");
  }

  return (
    <main className="apple-page flex items-center justify-center px-4 py-8">
      <section className="w-full max-w-2xl">
        <div className="text-center flex flex-col items-center justify-center gap-5">
          <h1 className="text-5xl md:text-6xl font-semibold tracking-tight">
            Telegraph
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl">
            A simple messenger experience for direct conversations and fast
            communication.
          </p>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          <Button asChild className="w-full p-6 text-lg font-normal">
            <Link href="/login">Login</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="w-full p-6 text-lg font-normal"
          >
            <Link href="/signup">Sign up</Link>
          </Button>
        </div>
      </section>
    </main>
  );
};

export default Home;

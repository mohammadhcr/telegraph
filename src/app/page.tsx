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
    <main className="apple-page flex items-center justify-center px-4 py-10">
      <section className="w-full max-w-3xl rounded-[2rem] border border-white/10 bg-slate-950/35 p-6 text-center backdrop-blur-2xl md:p-10">
        <div className="flex flex-col items-center justify-center gap-5">
          <span className="rounded-full border border-primary/35 bg-primary/10 px-3 py-1 text-xs text-primary">
            Fast, Secure & Free Messenger
          </span>
          <h1 className="text-5xl md:text-6xl font-semibold tracking-tight">
            Telegraph
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground md:text-xl">
            A simple messenger experience for direct conversations and fast
            communication.
          </p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
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

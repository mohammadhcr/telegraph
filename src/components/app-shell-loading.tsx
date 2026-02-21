import { Spinner } from "@/components/ui/spinner";

export const AppShellLoading = () => {
  return (
    <main className="apple-page flex h-[calc(100dvh-5.5rem)] items-center justify-center px-4 py-3 md:h-[100dvh]">
      <div className="apple-surface flex flex-col items-center gap-2 rounded-2xl px-5 py-4">
        <Spinner className="size-8 text-primary" />
        <span className="text-sm text-muted-foreground">Loading...</span>
      </div>
    </main>
  );
};

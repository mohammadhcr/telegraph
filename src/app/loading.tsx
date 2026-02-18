import { Spinner } from "@/components/ui/spinner";

const Loading = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div
        className="flex flex-col
       items-center gap-2 rounded-lg border bg-card px-4 py-3 shadow-sm"
      >
        <Spinner className="size-8" />
        <span className="text-sm text-muted-foreground">Loading...</span>
      </div>
    </div>
  );
};

export default Loading;

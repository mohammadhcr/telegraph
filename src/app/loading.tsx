import { Spinner } from "@/components/ui/spinner";

const Loading = () => {
  return (
    <div className="apple-page flex items-center justify-center px-4">
      <div className="apple-surface flex flex-col items-center gap-2 rounded-2xl px-5 py-4">
        <Spinner className="size-8 text-primary" />
        <span className="text-sm text-muted-foreground">Loading...</span>
      </div>
    </div>
  );
};

export default Loading;

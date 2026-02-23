import { Spinner } from "@/components/ui/spinner";

const Loading = () => {
  return (
    <div className="apple-page flex items-center justify-center px-4">
      <div className="border-none bg-none flex flex-col items-center gap-2 rounded-lg px-5 py-4">
        <Spinner className="size-10 text-primary" />
        <span className="text-md text-muted-foreground">Loading...</span>
      </div>
    </div>
  );
};

export default Loading;

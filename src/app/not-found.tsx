import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const NotFound = () => {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-8">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <p className="text-6xl font-bold tracking-tight">404</p>
          <CardTitle>Page not found</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            The page you requested does not exist or may have been moved.
          </p>
          <Button asChild className="w-full">
            <Link href="/">Back to home</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
};

export default NotFound;

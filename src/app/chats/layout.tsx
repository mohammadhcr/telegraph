import { AppShell } from "@/components/app-shell";

type ChatsLayoutProps = {
  children: React.ReactNode;
};

const ChatsLayout = ({ children }: ChatsLayoutProps) => {
  return <AppShell>{children}</AppShell>;
};

export default ChatsLayout;


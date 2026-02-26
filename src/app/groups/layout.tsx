import { AppShell } from "@/components/app-shell";

type GroupsLayoutProps = {
  children: React.ReactNode;
};

const GroupsLayout = ({ children }: GroupsLayoutProps) => {
  return <AppShell>{children}</AppShell>;
};

export default GroupsLayout;

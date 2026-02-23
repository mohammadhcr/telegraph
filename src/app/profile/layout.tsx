import { AppShell } from "@/components/app-shell";

type ProfileLayoutProps = {
  children: React.ReactNode;
};

const ProfileLayout = ({ children }: ProfileLayoutProps) => {
  return <AppShell>{children}</AppShell>;
};

export default ProfileLayout;


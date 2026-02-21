import { AppShell } from "@/components/app-shell";

type ContactsLayoutProps = {
  children: React.ReactNode;
};

const ContactsLayout = ({ children }: ContactsLayoutProps) => {
  return <AppShell>{children}</AppShell>;
};

export default ContactsLayout;

import SidebarLayout from '@/components/layout/SidebarLayout';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <SidebarLayout>{children}</SidebarLayout>;
}

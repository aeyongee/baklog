import AppHeader from "@/components/AppHeader";

export default async function TodayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <AppHeader />
      {children}
    </div>
  );
}

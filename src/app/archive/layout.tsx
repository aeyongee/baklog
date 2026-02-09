import AppHeader from "@/components/AppHeader";

export default async function ArchiveLayout({
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

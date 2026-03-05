/**
 * Estates Compliance Module Layout
 * Note: Dashboard layout handles the sidebar and main container
 * We just provide max-width constraint for content readability
 */

export default function EstatesComplianceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full max-w-7xl mx-auto">
      {children}
    </div>
  );
}

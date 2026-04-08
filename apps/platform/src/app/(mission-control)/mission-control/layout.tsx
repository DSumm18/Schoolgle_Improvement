import { MCAdminGate } from "./MCAdminGate";
import MCSidebar from "./MCSidebar";

export default function MissionControlLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MCAdminGate>
      <MCSidebar>{children}</MCSidebar>
    </MCAdminGate>
  );
}

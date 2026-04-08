import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mission Control — Schoolgle",
  description: "Schoolgle operational command centre",
};

export default function MissionControlRouteGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

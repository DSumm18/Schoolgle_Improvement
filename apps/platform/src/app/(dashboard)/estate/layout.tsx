import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Estate Management | Schoolgle",
  description: "Statutory compliance, asset management, and facilities operations",
};

export default function EstateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {children}
    </div>
  );
}

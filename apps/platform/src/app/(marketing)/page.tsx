import type { Metadata } from "next";
import SchoolgleHome from "@/components/website/SchoolgleHome";
export const metadata: Metadata = {
  title: "Schoolgle | More time for what matters",
  description:
    "School improvement, estates, SEND, finance and governance. Practical tools for the people who keep schools running.",
  alternates: { canonical: "https://www.schoolgle.co.uk/" },
  openGraph: {
    title: "Schoolgle | More time for what matters",
    description: "Practical tools for the people who keep schools running.",
    url: "https://www.schoolgle.co.uk/",
  },
};
export default function HomePage() {
  return <main><SchoolgleHome /></main>;
}

import { Metadata } from "next";
import Link from "next/link";

import { schoolgleCompanyDetails } from "@/lib/company-details";

export const metadata: Metadata = {
  title: "Cookie Policy | Schoolgle",
  description:
    "Schoolgle Cookie Policy. Information about the cookies we use and how to manage your preferences.",
};

export default function CookiePolicyPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="max-w-4xl mx-auto px-6 py-24">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            Cookie Policy
          </h1>
          <p className="text-muted-foreground">Last updated: May 2026</p>
        </div>

        {/* What are cookies */}
        <h2 className="text-2xl font-bold text-foreground mt-12 mb-4">
          What are cookies?
        </h2>
        <p className="text-muted-foreground leading-relaxed mb-4">
          Cookies are small text files that are placed on your device when you
          visit a website. They are widely used to make websites work
          efficiently, provide information to site owners, and improve the user
          experience.
        </p>
        <p className="text-muted-foreground leading-relaxed mb-4">
          Schoolgle uses a minimal number of cookies. We believe in collecting
          only what is necessary to provide a secure, functional service.
        </p>
        <p className="text-muted-foreground leading-relaxed mb-4">
          PECR also covers similar storage and access technologies, including
          local storage, scripts, tags and tracking pixels. We treat those
          technologies in the same cautious way as cookies.
        </p>

        {/* Essential cookies */}
        <h2 className="text-2xl font-bold text-foreground mt-12 mb-4">
          Essential cookies
        </h2>
        <p className="text-muted-foreground leading-relaxed mb-4">
          These cookies are strictly necessary for the platform to function.
          They cannot be switched off. They are set in response to actions you
          take, such as logging in or setting your privacy preferences.
        </p>
        <div className="overflow-x-auto mb-6">
          <table className="w-full text-sm border border-border rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left p-3 font-semibold border-b border-border">
                  Cookie name
                </th>
                <th className="text-left p-3 font-semibold border-b border-border">
                  Provider
                </th>
                <th className="text-left p-3 font-semibold border-b border-border">
                  Purpose
                </th>
                <th className="text-left p-3 font-semibold border-b border-border">
                  Duration
                </th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              <tr className="border-b border-border">
                <td className="p-3 font-mono text-foreground">
                  sb-*-auth-token
                </td>
                <td className="p-3">Supabase</td>
                <td className="p-3">
                  Authentication session. Keeps you logged in securely across
                  page loads.
                </td>
                <td className="p-3">Session / 7 days</td>
              </tr>
              <tr>
                <td className="p-3 font-mono text-foreground">__Host-csrf</td>
                <td className="p-3">Schoolgle</td>
                <td className="p-3">
                  CSRF protection. Prevents cross-site request forgery attacks
                  by validating that form submissions originate from our site.
                </td>
                <td className="p-3">Session</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-muted-foreground leading-relaxed mb-4">
          Under UK GDPR and the Privacy and Electronic Communications
          Regulations (PECR), strictly necessary cookies do not require consent.
        </p>

        <h2 className="text-2xl font-bold text-foreground mt-12 mb-4">
          Local storage and similar technologies
        </h2>
        <p className="text-muted-foreground leading-relaxed mb-4">
          The Schoolgle platform may use essential browser storage for secure
          sessions, user preferences, fraud prevention, form protection or
          remembering privacy choices. We do not use local storage or similar
          technologies for advertising tracking.
        </p>
        <p className="text-muted-foreground leading-relaxed mb-4">
          Any non-essential storage or access technology, including analytics
          tags or tracking pixels, should only be introduced after this policy
          is updated and valid consent is requested where required.
        </p>

        {/* Analytics cookies */}
        <h2 className="text-2xl font-bold text-foreground mt-12 mb-4">
          Analytics cookies
        </h2>
        <p className="text-muted-foreground leading-relaxed mb-4">
          Schoolgle does not currently use third-party analytics cookies on the
          marketing website. We do not use advertising cookies, tracking pixels,
          or cross-site advertising identifiers.
        </p>
        <div className="p-6 rounded-2xl border border-border bg-muted/30 mb-6">
          <h3 className="font-semibold text-foreground mb-2">
            If analytics are introduced later
          </h3>
          <p className="text-sm text-muted-foreground mt-3">
            If we introduce non-essential analytics cookies in future, we will
            update this policy and ask for consent before setting them.
          </p>
        </div>

        {/* How to control cookies */}
        <h2 className="text-2xl font-bold text-foreground mt-12 mb-4">
          How to control cookies
        </h2>
        <p className="text-muted-foreground leading-relaxed mb-4">
          Because Schoolgle currently uses only essential cookies, there are no
          optional analytics or advertising cookies to switch on or off.
        </p>

        <h3 className="text-lg font-semibold text-foreground mb-2">
          Browser settings
        </h3>
        <p className="text-muted-foreground leading-relaxed mb-4">
          Most web browsers allow you to control cookies through their settings.
          You can typically find these options in the &quot;Settings&quot;,
          &quot;Preferences&quot;, or &quot;Privacy&quot; section of your
          browser. Common options include:
        </p>
        <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
          <li>Viewing what cookies are currently stored</li>
          <li>Deleting some or all cookies</li>
          <li>Blocking all cookies or only third-party cookies</li>
          <li>Setting your browser to notify you when a cookie is set</li>
        </ul>
        <p className="text-muted-foreground leading-relaxed mb-4">
          Please note that blocking essential cookies will prevent you from
          logging in to the Schoolgle platform.
        </p>

        {/* Third-party cookies */}
        <h2 className="text-2xl font-bold text-foreground mt-12 mb-4">
          Third-party cookies
        </h2>
        <p className="text-muted-foreground leading-relaxed mb-4">
          Schoolgle does not use third-party advertising cookies. We do not sell
          or share your data with advertisers.
        </p>

        {/* Related policies */}
        <h2 className="text-2xl font-bold text-foreground mt-12 mb-4">
          Related policies
        </h2>
        <p className="text-muted-foreground leading-relaxed mb-4">
          For more information about how we handle personal data, please see our{" "}
          <Link href="/privacy" className="text-primary underline">
            Privacy Policy
          </Link>
          .
        </p>

        {/* Contact */}
        <h2 className="text-2xl font-bold text-foreground mt-12 mb-4">
          Contact
        </h2>
        <p className="text-muted-foreground leading-relaxed mb-4">
          If you have questions about our use of cookies or similar
          technologies, contact our privacy team:
        </p>
        <div className="p-6 rounded-2xl border border-border bg-muted/30">
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">Privacy contact</strong>
            <br />
            Email:{" "}
            <a
              href={`mailto:${schoolgleCompanyDetails.privacyEmail}`}
              className="text-primary underline"
            >
              {schoolgleCompanyDetails.privacyEmail}
            </a>
            <br />
            DPO/data protection:{" "}
            <a
              href={`mailto:${schoolgleCompanyDetails.dpoEmail}`}
              className="text-primary underline"
            >
              {schoolgleCompanyDetails.dpoEmail}
            </a>
            <br />
            Website:{" "}
            <a
              href="https://schoolgle.co.uk"
              className="text-primary underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              schoolgle.co.uk
            </a>
          </p>
        </div>

        {/* Footer note */}
        <p className="text-xs text-muted-foreground mt-12 pt-8 border-t border-border">
          This cookie policy was last reviewed in May 2026 and will be updated
          if our use of cookies changes.
        </p>
      </div>
    </main>
  );
}

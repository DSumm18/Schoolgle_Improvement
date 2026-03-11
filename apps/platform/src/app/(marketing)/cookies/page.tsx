import { Metadata } from "next";
import Link from "next/link";

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
          <p className="text-muted-foreground">Last updated: March 2026</p>
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

        {/* Analytics cookies */}
        <h2 className="text-2xl font-bold text-foreground mt-12 mb-4">
          Analytics cookies
        </h2>
        <p className="text-muted-foreground leading-relaxed mb-4">
          We may use analytics cookies to understand how visitors interact with
          our website. These cookies are{" "}
          <strong className="text-foreground">
            only set with your explicit consent
          </strong>{" "}
          via our cookie consent banner.
        </p>
        <div className="p-6 rounded-2xl border border-border bg-muted/30 mb-6">
          <h3 className="font-semibold text-foreground mb-2">
            What analytics data is collected
          </h3>
          <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
            <li>Pages visited and time spent on each page</li>
            <li>Browser type and device category (desktop, mobile, tablet)</li>
            <li>Approximate geographic region (country level only)</li>
            <li>Referral source (how you found us)</li>
          </ul>
          <p className="text-sm text-muted-foreground mt-3">
            Analytics data is fully anonymised and cannot be used to identify
            individual users. We use this data solely to improve the service.
          </p>
        </div>

        {/* How to control cookies */}
        <h2 className="text-2xl font-bold text-foreground mt-12 mb-4">
          How to control cookies
        </h2>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Our cookie consent banner
        </h3>
        <p className="text-muted-foreground leading-relaxed mb-4">
          When you first visit Schoolgle, you will see a cookie consent banner.
          You can choose to accept or decline analytics cookies. You can change
          your preference at any time by clearing your cookies and revisiting
          the site.
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
          If you have questions about our use of cookies, contact our Data
          Protection Officer:
        </p>
        <div className="p-6 rounded-2xl border border-border bg-muted/30">
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">Data Protection Officer</strong>
            <br />
            Email:{" "}
            <a
              href="mailto:dpo@schoolgle.co.uk"
              className="text-primary underline"
            >
              dpo@schoolgle.co.uk
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
          This cookie policy was last reviewed in March 2026 and will be updated
          if our use of cookies changes.
        </p>
      </div>
    </main>
  );
}

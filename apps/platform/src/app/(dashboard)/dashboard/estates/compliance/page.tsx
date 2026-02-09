import { redirect } from 'next/navigation';

/**
 * Redirect old compliance page to new comprehensive Estates Compliance system
 *
 * OLD: /dashboard/estates/compliance
 * NEW: /estates-compliance
 */
export default function CompliancePageRedirect() {
  // Redirect to the new comprehensive Estates Compliance system
  redirect('/estates-compliance');
}

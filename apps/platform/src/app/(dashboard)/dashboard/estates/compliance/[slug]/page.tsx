import { redirect } from 'next/navigation';

/**
 * Redirect old compliance slug page to new comprehensive Estates Compliance system
 */
export default function ComplianceSlugRedirect() {
  redirect('/estates-compliance');
}

import { redirect } from 'next/navigation';

/**
 * Redirect old compliance manage page to new comprehensive Estates Compliance system
 */
export default function ComplianceManageRedirect() {
  redirect('/estates-compliance');
}

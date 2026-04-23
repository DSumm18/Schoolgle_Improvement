/**
 * Contract PDF Generator
 *
 * Generates professional contract PDFs for Schoolgle subscriptions.
 * Includes all terms, pricing breakdown, and signature blocks.
 *
 * Uses PDFKit for PDF generation.
 * Stores PDFs in Supabase Storage.
 */

import { createClient } from "./supabase-server";

export interface ContractData {
  organization: any;
  selectedSchools: any[];
  pricing: {
    subtotal: number;
    total: number;
    discount?: any;
  };
  invoicingOption: string;
  startDate: string;
  endDate: string;
  contractNumber: string;
  createdDate: string;
}

/**
 * Generate contract PDF
 * Returns URL to stored PDF in Supabase Storage
 */
export async function generateContractPDF(data: ContractData) {
  try {
    // For now, generate a simple text-based contract
    // In production, use PDFKit or similar for proper formatting

    const contractText = `
SCHOOLGLE LIMITED

Subscription Services Agreement

Contract Number: ${data.contractNumber}
Date: ${new Date(data.createdDate).toLocaleDateString("en-GB")}

BETWEEN:

Schoolgle Limited ("Schoolgle")
And
${data.organization.name} ("Customer")

1. PARTIES
1.1 Schoolgle Limited is a company registered in England and Wales.
1.2 Customer is ${data.organization.name}${data.organization.address ? `, located at ${JSON.stringify(data.organization.address)}` : ""}.

2. SERVICES
2.1 Schoolgle agrees to provide the following modules to the Customer:

${data.selectedSchools.map((school: any, index: number) => `
${index + 1}. ${school.name} (URN: ${school.urn})
   Modules: ${school.modules.join(", ")}
   Annual subscription: £${school.subtotal || "TBD"}
`).join("")}

2.2 Total Value: £${data.pricing.total}${data.pricing.discount ? ` (includes ${data.pricing.discount.percentage}% discount)` : ""}

3. SUBSCRIPTION PERIOD
3.1 Start Date: ${new Date(data.startDate).toLocaleDateString("en-GB")}
3.2 End Date: ${new Date(data.endDate).toLocaleDateString("en-GB")}
3.3 Auto-renewal: This contract will automatically renew for 12 months unless either party gives 30 days' notice.

4. PAYMENT TERMS
4.1 Invoicing: ${data.invoicingOption === "trust" ? "Single invoice to Trust" : data.invoicingOption === "individual" ? "Separate invoices per school" : "Mixed invoicing as specified"}
4.2 Payment is due within 30 days of invoice date.
4.3 Late payments may incur interest at 8% per annum above Bank of England base rate.

5. LICENCE & USAGE
5.1 Schoolgle grants Customer a non-exclusive, non-transferable licence to use the software.
5.2 Customer agrees to use the software in accordance with Schoolgle's acceptable use policy.
5.3 Customer is responsible for maintaining the security of user accounts.

6. DATA PROTECTION
6.1 Both parties agree to comply with GDPR and data protection laws.
6.2 Schoolgle will act as data processor for Customer's personal data.
6.3 Full details in Schoolgle's Data Processing Agreement (available separately).

7. SUPPORT & MAINTENANCE
7.1 Schoolgle provides technical support via email and online help centre.
7.2 Planned maintenance: Schoolgle may schedule maintenance with reasonable notice.
7.3 Uptime guarantee: 99.5% availability (excluding planned maintenance).

8. LIMITATION OF LIABILITY
8.1 Schoolgle's total liability is limited to 12 months' fees paid by Customer.
8.2 Schoolgle is not liable for indirect or consequential losses.

9. TERMINATION
9.1 Either party may terminate with 30 days' written notice.
9.2 Schoolgle may terminate immediately if Customer breaches these terms.
9.3 Upon termination, Customer will cease using the software and pay any outstanding fees.

10. GOVERNING LAW
10.1 This contract is governed by English law.
10.2 Both parties submit to the exclusive jurisdiction of English courts.

SIGNED:

For Schoolgle Limited:
_________________________
Name:
Date:

For Customer:
_________________________
Name:
Date:
_________________________
Name:
Date:

Invoice Details:
Payment Reference: ${generatePaymentReference(data.organization.name, data.selectedSchools[0]?.urn || "")}
Bank: Schoolgle Limited
Account: [To be added]
Sort Code: [To be added]
    `.trim();

    // Store in Supabase Storage
    const supabase = createClient();
    const fileName = `contracts/${data.contractNumber}.txt`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("documents")
      .upload(fileName, new TextEncoder().encode(contractText), {
        contentType: "text/plain",
        upsert: false
      });

    if (uploadError) {
      console.error("Failed to upload contract:", uploadError);
      return {
        success: false,
        error: "Failed to store contract PDF"
      };
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from("documents")
      .getPublicUrl(fileName);

    return {
      success: true,
      url: publicUrl,
      fileName: data.contractNumber
    };

  } catch (error) {
    console.error("Contract generation error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate contract"
    };
  }
}

function generatePaymentReference(orgName: string, urn: string): string {
  const cleanName = orgName.toUpperCase().replace(/[^A-Z0-9]/g, "").substring(0, 10);
  return `SG-${cleanName}-${urn}`;
}

/**
 * TODO: Upgrade to PDFKit for proper PDF generation
 *
 * Example using PDFKit:
 *
 * import PDFDocument from 'pdfkit';
 * import { Blob } from 'buffer';
 *
 * const doc = new PDFDocument();
 * const chunks: Buffer[] = [];
 *
 * doc.on('data', (chunk) => chunks.push(chunk));
 * doc.on('end', () => {
 *   const pdfBuffer = Buffer.concat(chunks);
 *   // Upload to Supabase Storage
 * });
 *
 * doc.fontSize(20).text('SCHOOLGLE CONTRACT', { align: 'center' });
 * doc.moveDown();
 * doc.fontSize(12).text(`Contract Number: ${contractNumber}`);
 * // ... more content
 *
 * doc.end();
 */

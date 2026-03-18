"use client";

import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  Shield,
  GraduationCap,
  BookOpen,
  Heart,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Briefcase,
  Calendar,
  Building2,
  BadgeCheck,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/SupabaseAuthContext";
import { fetcher } from "@/lib/fetchers";

function Section({
  title,
  icon: Icon,
  children,
  color = "bg-slate-100 text-slate-600",
}: {
  title: string;
  icon: any;
  children: React.ReactNode;
  color?: string;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}
            >
              <Icon className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white">
              {title}
            </h3>
          </div>
          {children}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function Field({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-semibold">
        {label}
      </p>
      <p className="text-sm text-slate-900 dark:text-white mt-0.5">
        {value || "—"}
      </p>
    </div>
  );
}

function Badge({
  text,
  variant = "default",
}: {
  text: string;
  variant?: "default" | "success" | "warning" | "danger";
}) {
  const styles = {
    default:
      "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
    success:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400",
    warning:
      "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400",
    danger: "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${styles[variant]}`}
    >
      {text}
    </span>
  );
}

function formatDate(d: string | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatCurrency(n: number | null | undefined): string {
  if (n == null) return "—";
  return `£${n.toLocaleString("en-GB")}`;
}

export default function StaffPersonnelPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { organization } = useAuth();
  const organizationId = organization?.id || "";

  const { data, isLoading } = useSWR(
    organizationId
      ? `/api/staff/${id}/personnel?organizationId=${organizationId}`
      : null,
    fetcher,
  );

  const staff = data?.staff;
  const contract = data?.contract;
  const emergencyContacts = data?.emergency_contacts || [];
  const dbs = data?.dbs;
  const qualifications = data?.qualifications || [];
  const training = data?.training || [];
  const rightToWork = data?.right_to_work;
  const medical = data?.medical;

  if (isLoading) {
    return (
      <div className="p-6 md:p-8 min-h-screen max-w-[1200px] mx-auto animate-pulse space-y-4">
        <div className="h-8 w-32 bg-slate-200 dark:bg-slate-700 rounded" />
        <div className="h-24 bg-slate-100 dark:bg-slate-800 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-48 bg-slate-100 dark:bg-slate-800 rounded-xl"
            />
          ))}
        </div>
      </div>
    );
  }

  if (!staff) {
    return (
      <div className="p-6 md:p-8 min-h-screen max-w-[1200px] mx-auto">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div className="text-center py-20">
          <h3 className="text-lg font-semibold">Staff member not found</h3>
        </div>
      </div>
    );
  }

  const now = new Date();
  const dbsOverdue = dbs?.next_check_due && new Date(dbs.next_check_due) < now;

  return (
    <div className="p-6 md:p-8 space-y-6 min-h-screen max-w-[1200px] mx-auto">
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="text-slate-600 dark:text-slate-400"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl bg-[#ADD8E6]/20 flex items-center justify-center text-[#ADD8E6]">
                <User className="w-8 h-8" />
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-black text-slate-900 dark:text-white">
                  {staff.first_name} {staff.last_name}
                </h1>
                <p className="text-slate-500 dark:text-slate-400">
                  {staff.job_title}
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge text={staff.role_category?.replace(/_/g, " ")} />
                  {staff.payroll_number && (
                    <Badge text={`Payroll: ${staff.payroll_number}`} />
                  )}
                  {staff.teacher_reference_number && (
                    <Badge text={`TRN: ${staff.teacher_reference_number}`} />
                  )}
                  {contract && (
                    <Badge
                      text={`${contract.contract_type} · ${contract.fte} FTE`}
                    />
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Personal Details */}
        <Section
          title="Personal Details"
          icon={User}
          color="bg-[#ADD8E6]/20 text-[#ADD8E6]"
        >
          <div className="grid grid-cols-2 gap-4">
            <Field
              label="Date of Birth"
              value={formatDate(staff.date_of_birth)}
            />
            <Field label="Gender" value={staff.gender?.replace(/_/g, " ")} />
            <Field label="Email (Work)" value={staff.email} />
            <Field label="Email (Personal)" value={staff.personal_email} />
            <Field label="Phone (Work)" value={staff.phone} />
            <Field label="Phone (Personal)" value={staff.personal_phone} />
            <Field
              label="Address"
              value={[
                staff.address_line_1,
                staff.address_line_2,
                staff.city,
                staff.postcode,
              ]
                .filter(Boolean)
                .join(", ")}
            />
            <Field label="Start Date" value={formatDate(staff.start_date)} />
            <Field
              label="NI Number"
              value={
                staff.national_insurance_number
                  ? "••••••" + staff.national_insurance_number.slice(-2)
                  : null
              }
            />
            <Field
              label="Pension"
              value={staff.pension_scheme?.replace(/_/g, " ")}
            />
          </div>
        </Section>

        {/* Contract */}
        <Section
          title="Current Contract"
          icon={Briefcase}
          color="bg-[#FFAA4C]/20 text-[#FFAA4C]"
        >
          {contract ? (
            <div className="grid grid-cols-2 gap-4">
              <Field
                label="Type"
                value={contract.contract_type?.replace(/_/g, " ")}
              />
              <Field
                label="Employment"
                value={contract.employment_type?.replace(/_/g, " ")}
              />
              <Field label="FTE" value={String(contract.fte)} />
              <Field
                label="Pay Scale"
                value={`${contract.pay_scale || "—"} ${contract.pay_point || ""}`}
              />
              <Field
                label="Salary (FTE)"
                value={formatCurrency(contract.salary_fte)}
              />
              <Field
                label="Salary (Actual)"
                value={formatCurrency(contract.salary_actual)}
              />
              <Field
                label="TLR"
                value={contract.tlr ? formatCurrency(contract.tlr) : null}
              />
              <Field
                label="SEN Allowance"
                value={
                  contract.sen_allowance
                    ? formatCurrency(contract.sen_allowance)
                    : null
                }
              />
              <Field
                label="Start Date"
                value={formatDate(contract.start_date)}
              />
              <Field
                label="Notice Period"
                value={
                  contract.notice_period_weeks
                    ? `${contract.notice_period_weeks} weeks`
                    : null
                }
              />
            </div>
          ) : (
            <p className="text-sm text-slate-500">No contract record found</p>
          )}
        </Section>

        {/* Emergency Contacts */}
        <Section
          title="Emergency Contacts"
          icon={Phone}
          color="bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400"
        >
          {emergencyContacts.length > 0 ? (
            <div className="space-y-3">
              {emergencyContacts.map((c: any) => (
                <div
                  key={c.id}
                  className="flex items-start justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50"
                >
                  <div>
                    <p className="font-semibold text-sm text-slate-900 dark:text-white">
                      {c.contact_name}
                      {c.is_next_of_kin && (
                        <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 font-bold">
                          NEXT OF KIN
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-slate-500 capitalize">
                      {c.relationship}
                    </p>
                  </div>
                  <p className="text-sm font-mono text-slate-600 dark:text-slate-300">
                    {c.phone_primary}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-4 h-4" />
              <p className="text-sm">No emergency contacts recorded</p>
            </div>
          )}
        </Section>

        {/* DBS */}
        <Section
          title="DBS Record"
          icon={Shield}
          color="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400"
        >
          {dbs ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Type" value={dbs.dbs_type?.replace(/_/g, " ")} />
                <Field label="Status" value={dbs.status} />
                <Field label="Certificate No" value={dbs.certificate_number} />
                <Field label="Issue Date" value={formatDate(dbs.issue_date)} />
                <Field
                  label="Last Checked"
                  value={formatDate(dbs.last_checked_date)}
                />
                <Field
                  label="Next Check Due"
                  value={formatDate(dbs.next_check_due)}
                />
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                {dbs.barred_list_checked && (
                  <Badge text="Barred List Checked" variant="success" />
                )}
                {dbs.children_barred_list && (
                  <Badge text="Children List" variant="success" />
                )}
                {dbs.update_service_registered && (
                  <Badge text="Update Service" variant="success" />
                )}
                {dbsOverdue && <Badge text="CHECK OVERDUE" variant="danger" />}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertTriangle className="w-4 h-4" />
              <p className="text-sm font-semibold">
                No DBS record — KCSIE non-compliant
              </p>
            </div>
          )}
        </Section>

        {/* Right to Work */}
        <Section
          title="Right to Work"
          icon={BadgeCheck}
          color="bg-indigo-100 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400"
        >
          {rightToWork ? (
            <div className="grid grid-cols-2 gap-4">
              <Field
                label="Type"
                value={rightToWork.right_to_work_type?.replace(/_/g, " ")}
              />
              <Field label="Document" value={rightToWork.document_type} />
              <Field
                label="Check Date"
                value={formatDate(rightToWork.check_date)}
              />
              <Field label="Checked By" value={rightToWork.checked_by} />
              <Field
                label="Expiry"
                value={
                  rightToWork.expiry_date
                    ? formatDate(rightToWork.expiry_date)
                    : "No expiry"
                }
              />
            </div>
          ) : (
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertTriangle className="w-4 h-4" />
              <p className="text-sm font-semibold">
                No right to work check recorded
              </p>
            </div>
          )}
        </Section>

        {/* Medical */}
        <Section
          title="Medical Information"
          icon={Heart}
          color="bg-pink-100 text-pink-600 dark:bg-pink-900/20 dark:text-pink-400"
        >
          {medical ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <Field
                  label="Conditions"
                  value={medical.conditions_summary || "None recorded"}
                />
                <Field
                  label="Allergies"
                  value={medical.allergies || "None known"}
                />
                {medical.medication_on_site && (
                  <Field
                    label="Medication Location"
                    value={medical.medication_location}
                  />
                )}
                <Field
                  label="Last Reviewed"
                  value={formatDate(medical.last_reviewed_date)}
                />
              </div>
              {medical.reasonable_adjustments && (
                <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-900/10">
                  <p className="text-xs font-semibold text-purple-700 dark:text-purple-400">
                    Reasonable Adjustments
                  </p>
                  <p className="text-sm text-purple-600 dark:text-purple-300 mt-1">
                    {medical.reasonable_adjustments}
                  </p>
                </div>
              )}
              {medical.consent_to_share_with_first_aiders && (
                <Badge text="Shared with first aiders" variant="success" />
              )}
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              No medical information recorded
            </p>
          )}
        </Section>
      </div>

      {/* Qualifications — full width */}
      <Section
        title="Qualifications"
        icon={GraduationCap}
        color="bg-violet-100 text-violet-600 dark:bg-violet-900/20 dark:text-violet-400"
      >
        {qualifications.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left py-2 px-2 text-xs font-semibold text-slate-500">
                    Qualification
                  </th>
                  <th className="text-left py-2 px-2 text-xs font-semibold text-slate-500">
                    Type
                  </th>
                  <th className="text-left py-2 px-2 text-xs font-semibold text-slate-500">
                    Awarding Body
                  </th>
                  <th className="text-left py-2 px-2 text-xs font-semibold text-slate-500">
                    Date
                  </th>
                  <th className="text-left py-2 px-2 text-xs font-semibold text-slate-500">
                    Expiry
                  </th>
                  <th className="text-center py-2 px-2 text-xs font-semibold text-slate-500">
                    Verified
                  </th>
                </tr>
              </thead>
              <tbody>
                {qualifications.map((q: any) => {
                  const expired =
                    q.expiry_date && new Date(q.expiry_date) < now;
                  return (
                    <tr
                      key={q.id}
                      className="border-b border-slate-100 dark:border-slate-800"
                    >
                      <td className="py-2 px-2 font-medium">
                        {q.qualification_name}
                      </td>
                      <td className="py-2 px-2">
                        <span className="text-xs px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 uppercase">
                          {q.qualification_type}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-slate-500">
                        {q.awarding_body || "—"}
                      </td>
                      <td className="py-2 px-2">
                        {formatDate(q.date_achieved)}
                      </td>
                      <td className="py-2 px-2">
                        {q.expiry_date ? (
                          <span
                            className={
                              expired ? "text-red-600 font-semibold" : ""
                            }
                          >
                            {formatDate(q.expiry_date)}
                            {expired && " EXPIRED"}
                          </span>
                        ) : (
                          <span className="text-slate-400">No expiry</span>
                        )}
                      </td>
                      <td className="py-2 px-2 text-center">
                        {q.is_verified ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />
                        ) : (
                          <Clock className="w-4 h-4 text-slate-300 mx-auto" />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-slate-500">No qualifications recorded</p>
        )}
      </Section>

      {/* Training Records — full width */}
      <Section
        title="Training Records"
        icon={BookOpen}
        color="bg-teal-100 text-teal-600 dark:bg-teal-900/20 dark:text-teal-400"
      >
        {training.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left py-2 px-2 text-xs font-semibold text-slate-500">
                    Training
                  </th>
                  <th className="text-left py-2 px-2 text-xs font-semibold text-slate-500">
                    Category
                  </th>
                  <th className="text-left py-2 px-2 text-xs font-semibold text-slate-500">
                    Provider
                  </th>
                  <th className="text-left py-2 px-2 text-xs font-semibold text-slate-500">
                    Completed
                  </th>
                  <th className="text-left py-2 px-2 text-xs font-semibold text-slate-500">
                    Expiry
                  </th>
                  <th className="text-center py-2 px-2 text-xs font-semibold text-slate-500">
                    Mandatory
                  </th>
                </tr>
              </thead>
              <tbody>
                {training.map((t: any) => {
                  const expired =
                    t.expiry_date && new Date(t.expiry_date) < now;
                  return (
                    <tr
                      key={t.id}
                      className={`border-b border-slate-100 dark:border-slate-800 ${
                        expired && t.is_mandatory
                          ? "bg-red-50/30 dark:bg-red-900/5"
                          : ""
                      }`}
                    >
                      <td className="py-2 px-2 font-medium">
                        {t.training_name}
                      </td>
                      <td className="py-2 px-2">
                        <span className="text-xs px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                          {t.training_category?.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-slate-500">
                        {t.provider || "—"}
                      </td>
                      <td className="py-2 px-2">
                        {formatDate(t.completion_date)}
                      </td>
                      <td className="py-2 px-2">
                        {t.expiry_date ? (
                          <span
                            className={
                              expired ? "text-red-600 font-semibold" : ""
                            }
                          >
                            {formatDate(t.expiry_date)}
                            {expired && " EXPIRED"}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-2 px-2 text-center">
                        {t.is_mandatory ? (
                          <Badge text="Required" variant="warning" />
                        ) : (
                          <span className="text-xs text-slate-400">
                            Optional
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-slate-500">No training records found</p>
        )}
      </Section>
    </div>
  );
}

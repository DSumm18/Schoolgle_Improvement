"""
Aggregate DfE Ofsted data into JSON for Signal tools.

Usage: python3 scripts/aggregate-dfe-data.py

Generates:
  content/data/ofsted-by-region.json   - Regional breakdown with phase + year trends
  content/data/ofsted-by-la.json       - LA-level with trends, sub-grades, deprivation, safeguarding
  content/data/la-list.json            - All LAs with region
  content/data/ofsted-national.json    - National KPIs and headline stats
"""

import csv
import json
import os
from collections import defaultdict

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OFSTED_CSV = os.path.join(ROOT, "five-year-ofsted-inspection-data_state-funded-schools.csv")
OUTPUT_DIR = os.path.join(ROOT, "content", "data")

GRADE_LABELS = {"1": "outstanding", "2": "good", "3": "requires_improvement", "4": "inadequate"}
TREND_YEARS = ["2019", "2020", "2021", "2022", "2023", "2024"]
RECENT_YEARS = ["2022", "2023", "2024"]

REGION_MAP = {
    "Yorkshire and The Humber": "Yorkshire and the Humber",
}


def parse_ofsted():
    records = []
    with open(OFSTED_CSV, "r", encoding="utf-8-sig") as f:
        reader = csv.reader(f)
        next(reader)
        next(reader)
        for row in reader:
            if len(row) < 22:
                continue
            region = REGION_MAP.get(row[7], row[7])
            if region in ("Government office region", ""):
                continue
            grade = row[15]
            if grade not in GRADE_LABELS:
                continue
            pub_date = row[6]
            year = pub_date.split("/")[-1] if "/" in pub_date else ""

            records.append({
                "urn": row[0],
                "name": row[1],
                "region": region,
                "la": row[8] if row[8] != "Local authority area" else "",
                "phase": row[13] if row[13] != "Phase" else "",
                "deprivation": row[14] if row[14] != "Deprivation band" else "",
                "grade": grade,
                "year": year,
                "leadership": row[17] if row[17] in ("1", "2", "3", "4") else "",
                "quality_of_ed": row[18] if row[18] in ("1", "2", "3", "4") else "",
                "personal_dev": row[19] if row[19] in ("1", "2", "3", "4") else "",
                "behaviour": row[20] if row[20] in ("1", "2", "3", "4") else "",
                "safeguarding": row[21] if row[21] in ("Yes", "No") else "",
            })
    return records


def pcts(counts, total):
    """Calculate grade percentages from a counts dict."""
    if total == 0:
        return {}
    return {
        "total": total,
        "outstanding": counts.get("1", 0),
        "outstanding_pct": round(counts.get("1", 0) / total * 100, 1),
        "good": counts.get("2", 0),
        "good_pct": round(counts.get("2", 0) / total * 100, 1),
        "requires_improvement": counts.get("3", 0),
        "ri_pct": round(counts.get("3", 0) / total * 100, 1),
        "inadequate": counts.get("4", 0),
        "inadequate_pct": round(counts.get("4", 0) / total * 100, 1),
        "good_or_outstanding_pct": round(
            (counts.get("1", 0) + counts.get("2", 0)) / total * 100, 1
        ),
    }


def sub_grade_pcts(records_subset, field):
    """Calculate sub-grade distribution for a specific field."""
    counts = defaultdict(int)
    total = 0
    for r in records_subset:
        if r[field]:
            counts[r[field]] += 1
            total += 1
    return pcts(counts, total)


def build_trends(records_subset):
    """Build year-on-year trend data."""
    by_year = defaultdict(lambda: defaultdict(int))
    for r in records_subset:
        if r["year"] in TREND_YEARS:
            by_year[r["year"]][r["grade"]] += 1
            by_year[r["year"]]["total"] = by_year[r["year"]].get("total", 0) + 1

    trend = {}
    for year in TREND_YEARS:
        if year in by_year:
            d = by_year[year]
            total = sum(d[g] for g in ("1", "2", "3", "4") if g in d)
            if total > 0:
                trend[year] = {
                    "total": total,
                    "good_plus_pct": round((d.get("1", 0) + d.get("2", 0)) / total * 100, 1),
                    "outstanding_pct": round(d.get("1", 0) / total * 100, 1),
                    "ri_pct": round(d.get("3", 0) / total * 100, 1),
                    "inadequate_pct": round(d.get("4", 0) / total * 100, 1),
                }
    return trend


def build_deprivation_breakdown(records_subset):
    """Grade distribution by deprivation band."""
    by_dep = defaultdict(lambda: defaultdict(int))
    for r in records_subset:
        dep = r["deprivation"]
        if dep and dep != "Unknown":
            by_dep[dep][r["grade"]] += 1

    result = {}
    for dep, counts in sorted(by_dep.items()):
        total = sum(counts.values())
        if total > 0:
            result[dep] = pcts(counts, total)
    return result


def safeguarding_rate(records_subset):
    """% of inspections where safeguarding is effective."""
    yes = sum(1 for r in records_subset if r["safeguarding"] == "Yes")
    no = sum(1 for r in records_subset if r["safeguarding"] == "No")
    total = yes + no
    if total == 0:
        return None
    return {"effective": yes, "not_effective": no, "total": total, "effective_pct": round(yes / total * 100, 1)}


def aggregate_by_region(records):
    by_region = defaultdict(list)
    for r in records:
        by_region["national"].append(r)
        by_region[r["region"]].append(r)

    result = {}
    for region, recs in by_region.items():
        # Overall
        counts = defaultdict(int)
        for r in recs:
            counts[r["grade"]] += 1
        total = sum(counts.values())

        # By phase
        by_phase = defaultdict(lambda: defaultdict(int))
        for r in recs:
            if r["phase"]:
                by_phase[r["phase"]][r["grade"]] += 1

        phases = {}
        for phase, pcounts in sorted(by_phase.items()):
            ptotal = sum(pcounts.values())
            if ptotal > 0:
                phases[phase] = pcts(pcounts, ptotal)

        result[region] = {
            **pcts(counts, total),
            "phases": phases,
            "trends": build_trends(recs),
        }
    return result


def aggregate_by_la(records):
    by_la = defaultdict(list)
    for r in records:
        if r["la"]:
            by_la[r["la"]].append(r)

    result = {}
    for la, recs in sorted(by_la.items()):
        counts = defaultdict(int)
        for r in recs:
            counts[r["grade"]] += 1
        total = sum(counts.values())
        if total == 0:
            continue

        region = recs[0]["region"]

        # Phase breakdown
        by_phase = defaultdict(lambda: defaultdict(int))
        for r in recs:
            if r["phase"]:
                by_phase[r["phase"]][r["grade"]] += 1
        phases = {}
        for phase, pcounts in sorted(by_phase.items()):
            ptotal = sum(pcounts.values())
            if ptotal > 0:
                phases[phase] = pcts(pcounts, ptotal)

        result[la] = {
            **pcts(counts, total),
            "region": region,
            "phases": phases,
            "trends": build_trends(recs),
            "sub_grades": {
                "leadership": sub_grade_pcts(recs, "leadership"),
                "quality_of_education": sub_grade_pcts(recs, "quality_of_ed"),
                "personal_development": sub_grade_pcts(recs, "personal_dev"),
                "behaviour": sub_grade_pcts(recs, "behaviour"),
            },
            "deprivation": build_deprivation_breakdown(recs),
            "safeguarding": safeguarding_rate(recs),
        }
    return result


def build_national_kpis(records):
    """National headline KPIs for the dashboard."""
    total = len(records)
    counts = defaultdict(int)
    for r in records:
        counts[r["grade"]] += 1

    recent = [r for r in records if r["year"] in RECENT_YEARS]
    recent_total = len(recent)
    recent_counts = defaultdict(int)
    for r in recent:
        recent_counts[r["grade"]] += 1

    # Safeguarding
    safe = safeguarding_rate(records)
    recent_safe = safeguarding_rate(recent)

    return {
        "all_time": pcts(counts, total),
        "recent": pcts(recent_counts, recent_total),
        "recent_years": RECENT_YEARS,
        "trends": build_trends(records),
        "deprivation": build_deprivation_breakdown(records),
        "safeguarding": {
            "all_time": safe,
            "recent": recent_safe,
        },
        "sub_grades": {
            "leadership": sub_grade_pcts(records, "leadership"),
            "quality_of_education": sub_grade_pcts(records, "quality_of_ed"),
            "personal_development": sub_grade_pcts(records, "personal_dev"),
            "behaviour": sub_grade_pcts(records, "behaviour"),
        },
        "la_count": len(set(r["la"] for r in records if r["la"])),
        "school_count": len(set(r["urn"] for r in records)),
    }


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    print("Parsing Ofsted CSV...")
    records = parse_ofsted()
    print(f"  {len(records)} valid inspection records")

    print("\nBuilding national KPIs...")
    national = build_national_kpis(records)
    path = os.path.join(OUTPUT_DIR, "ofsted-national.json")
    with open(path, "w") as f:
        json.dump(national, f, indent=2)
    print(f"  Saved to {path}")
    print(f"  Recent (2022-24): {national['recent']['total']:,} inspections, "
          f"{national['recent']['good_or_outstanding_pct']}% Good+")

    print("\nAggregating by region...")
    by_region = aggregate_by_region(records)
    path = os.path.join(OUTPUT_DIR, "ofsted-by-region.json")
    with open(path, "w") as f:
        json.dump(by_region, f, indent=2)
    print(f"  Saved {len(by_region)} regions")

    print("\nAggregating by LA...")
    by_la = aggregate_by_la(records)
    path = os.path.join(OUTPUT_DIR, "ofsted-by-la.json")
    with open(path, "w") as f:
        json.dump(by_la, f, indent=2)
    print(f"  Saved {len(by_la)} LAs")

    # LA list
    la_list = [{"name": la, "region": data["region"]} for la, data in by_la.items()]
    path = os.path.join(OUTPUT_DIR, "la-list.json")
    with open(path, "w") as f:
        json.dump(la_list, f, indent=2)

    # Print trend summary
    print(f"\n--- Year-on-Year Trends (National) ---")
    for year, t in sorted(national["trends"].items()):
        print(f"  {year}: {t['total']:>5,} inspections | "
              f"{t['good_plus_pct']:>5.1f}% Good+ | "
              f"{t['outstanding_pct']:>5.1f}% Outstanding | "
              f"{t['ri_pct']:>4.1f}% RI | "
              f"{t['inadequate_pct']:>4.1f}% Inad")

    print(f"\n--- Deprivation Context ---")
    for dep, d in national["deprivation"].items():
        print(f"  {dep:>15}: {d['good_or_outstanding_pct']}% Good+ ({d['total']:,} inspections)")

    print(f"\n--- Safeguarding (Recent) ---")
    if national["safeguarding"]["recent"]:
        s = national["safeguarding"]["recent"]
        print(f"  {s['effective_pct']}% effective ({s['not_effective']} schools failed)")


if __name__ == "__main__":
    main()

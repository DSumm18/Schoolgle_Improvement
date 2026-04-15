#!/usr/bin/env python3
"""
Import DfE school performance data (KS2, KS1, EYFSP, Phonics) from CSV downloads
into the Supabase dfe_data schema.

Source: https://www.find-school-performance-data.service.gov.uk/download-data

Usage:
    python3 scripts/import-dfe-performance-data.py --file ~/Downloads/2022-2023_england_ks2final.csv --type ks2 --year 2023
    python3 scripts/import-dfe-performance-data.py --file ~/Downloads/2022-2023_england_ks1.csv --type ks1 --year 2023
    python3 scripts/import-dfe-performance-data.py --file ~/Downloads/2022-2023_england_eyfs.csv --type eyfsp --year 2023
    python3 scripts/import-dfe-performance-data.py --file ~/Downloads/2022-2023_england_phonics.csv --type phonics --year 2023
"""

import argparse
import csv
import json
import os
import sys
from pathlib import Path

# Supabase connection
SUPABASE_URL = os.environ.get('NEXT_PUBLIC_SUPABASE_URL', '')
SUPABASE_KEY = os.environ.get('SUPABASE_SERVICE_ROLE_KEY', '')

def load_env():
    """Load environment variables from .env.local"""
    global SUPABASE_URL, SUPABASE_KEY
    env_file = Path(__file__).parent.parent / 'apps' / 'platform' / '.env.local'
    if env_file.exists():
        with open(env_file) as f:
            for line in f:
                line = line.strip()
                if '=' in line and not line.startswith('#'):
                    key, val = line.split('=', 1)
                    if key == 'NEXT_PUBLIC_SUPABASE_URL':
                        SUPABASE_URL = val
                    elif key == 'SUPABASE_SERVICE_ROLE_KEY':
                        SUPABASE_KEY = val

def safe_float(val):
    """Convert a DfE CSV value to float or None"""
    if not val or val in ('SUPP', 'NE', 'NP', 'LOWCOV', 'NA', 'NEW', 'DNS', 'x', 'z'):
        return None
    try:
        # Remove % sign if present
        val = val.replace('%', '').strip()
        return float(val)
    except (ValueError, TypeError):
        return None

def safe_int(val):
    """Convert to int or None"""
    if not val or val in ('SUPP', 'NE', 'NP', 'LOWCOV', 'NA', 'NEW', 'DNS', 'x', 'z'):
        return None
    try:
        return int(val)
    except (ValueError, TypeError):
        return None

def parse_ks2_row(row, academic_year_end):
    """Parse a KS2 CSV row into multiple ks2_results records (one per subject per breakdown)"""
    urn = safe_int(row.get('URN'))
    if not urn:
        return []

    rectype = row.get('RECTYPE', '')
    if rectype != '1':  # Only school records
        return []

    records = []
    year_start = academic_year_end - 1

    # All pupils breakdown
    subjects = [
        {
            'subject': 'Reading',
            'expected': safe_float(row.get('PTREAD_EXP')),
            'higher': safe_float(row.get('PTREAD_HIGH')),
            'scaled': safe_float(row.get('READ_AVERAGE')),
            'progress': safe_float(row.get('READPROG')),
        },
        {
            'subject': 'Writing',
            'expected': safe_float(row.get('PTWRITTA_EXP')),
            'higher': safe_float(row.get('PTWRITTA_HIGH')),
            'scaled': None,  # Writing doesn't have scaled scores
            'progress': safe_float(row.get('WRITPROG')),
        },
        {
            'subject': 'Maths',
            'expected': safe_float(row.get('PTMAT_EXP')),
            'higher': safe_float(row.get('PTMAT_HIGH')),
            'scaled': safe_float(row.get('MAT_AVERAGE')),
            'progress': safe_float(row.get('MATPROG')),
        },
        {
            'subject': 'Grammar, punctuation and spelling',
            'expected': safe_float(row.get('PTGPS_EXP')),
            'higher': safe_float(row.get('PTGPS_HIGH')),
            'scaled': safe_float(row.get('GPS_AVERAGE')),
            'progress': None,
        },
        {
            'subject': 'Reading, writing and maths',
            'expected': safe_float(row.get('PTRWM_EXP')),
            'higher': safe_float(row.get('PTRWM_HIGH')),
            'scaled': None,
            'progress': None,
        },
        {
            'subject': 'Science',
            'expected': safe_float(row.get('PTSCITA_EXP')),
            'higher': None,
            'scaled': None,
            'progress': None,
        },
    ]

    for subj in subjects:
        if any(v is not None for v in [subj['expected'], subj['higher'], subj['scaled'], subj['progress']]):
            records.append({
                'urn': urn,
                'academic_year_start': year_start,
                'academic_year_end': academic_year_end,
                'time_period': f'{year_start}/{str(academic_year_end)[-2:]}',
                'subject': subj['subject'],
                'breakdown_topic': 'All pupils',
                'breakdown': 'Total',
                'expected_standard_pct': subj['expected'],
                'higher_standard_pct': subj['higher'],
                'average_scaled_score': subj['scaled'],
                'progress_measure_score': subj['progress'],
            })

    # Disadvantaged breakdown for RWM
    for breakdown_label, suffix in [('Disadvantaged', 'FSM6CLA1A'), ('Not known to be disadvantaged', 'NotFSM6CLA1A')]:
        disadv_subjects = [
            ('Reading', f'PTREAD_EXP_{suffix}', f'PTREAD_HIGH_{suffix}'),
            ('Writing', f'PTWRITTA_EXP_{suffix}', f'PTWRITTA_HIGH_{suffix}'),
            ('Maths', f'PTMAT_EXP_{suffix}', f'PTMAT_HIGH_{suffix}'),
            ('Reading, writing and maths', f'PTRWM_EXP_{suffix}', f'PTRWM_HIGH_{suffix}'),
        ]
        for subj_name, exp_col, high_col in disadv_subjects:
            exp = safe_float(row.get(exp_col))
            high = safe_float(row.get(high_col))
            if exp is not None or high is not None:
                records.append({
                    'urn': urn,
                    'academic_year_start': year_start,
                    'academic_year_end': academic_year_end,
                    'time_period': f'{year_start}/{str(academic_year_end)[-2:]}',
                    'subject': subj_name,
                    'breakdown_topic': 'Disadvantaged status',
                    'breakdown': breakdown_label,
                    'expected_standard_pct': exp,
                    'higher_standard_pct': high,
                    'average_scaled_score': None,
                    'progress_measure_score': None,
                })

    return records

def parse_ks1_row(row, academic_year_end):
    """Parse a KS1 CSV row into ks1_results records"""
    urn = safe_int(row.get('URN'))
    if not urn:
        return []

    rectype = row.get('RECTYPE', '')
    if rectype != '1':
        return []

    year_start = academic_year_end - 1

    record = {
        'urn': urn,
        'academic_year_start': year_start,
        'academic_year_end': academic_year_end,
        'time_period': f'{year_start}/{str(academic_year_end)[-2:]}',
        'assessment_type': 'KS1',
        'breakdown_topic': 'All pupils',
        'breakdown': 'Total',
        'phonics_pass_pct': safe_float(row.get('PTPHON', row.get('PTPHONICS_PASS'))),
        'gld_pct': None,  # GLD is EYFSP, not KS1
        'reading_pct': safe_float(row.get('PTREAD_EXP', row.get('PTREADTA_EXP'))),
        'writing_pct': safe_float(row.get('PTWRITTA_EXP', row.get('PTWRIT_EXP'))),
        'maths_pct': safe_float(row.get('PTMAT_EXP', row.get('PTMATTA_EXP'))),
        'science_pct': safe_float(row.get('PTSCITA_EXP', row.get('PTSCI_EXP'))),
    }

    # Only include if we have any data
    if any(v is not None for v in [record['phonics_pass_pct'], record['reading_pct'], record['writing_pct'], record['maths_pct']]):
        return [record]
    return []

def parse_eyfsp_row(row, academic_year_end):
    """Parse an EYFSP CSV row"""
    urn = safe_int(row.get('URN'))
    if not urn:
        return []

    rectype = row.get('RECTYPE', '')
    if rectype != '1':
        return []

    year_start = academic_year_end - 1
    gld = safe_float(row.get('PTGLD', row.get('PTGLD_EXP')))

    if gld is None:
        return []

    return [{
        'urn': urn,
        'academic_year_start': year_start,
        'academic_year_end': academic_year_end,
        'time_period': f'{year_start}/{str(academic_year_end)[-2:]}',
        'assessment_type': 'EYFSP',
        'breakdown_topic': 'All pupils',
        'breakdown': 'Total',
        'phonics_pass_pct': None,
        'gld_pct': gld,
        'reading_pct': None,
        'writing_pct': None,
        'maths_pct': None,
        'science_pct': None,
    }]

def parse_phonics_row(row, academic_year_end):
    """Parse a Phonics CSV row"""
    urn = safe_int(row.get('URN'))
    if not urn:
        return []

    rectype = row.get('RECTYPE', '')
    if rectype != '1':
        return []

    year_start = academic_year_end - 1
    phonics = safe_float(row.get('PTPHON', row.get('PTPHONICS_PASS', row.get('PTMEETPSS'))))

    if phonics is None:
        return []

    return [{
        'urn': urn,
        'academic_year_start': year_start,
        'academic_year_end': academic_year_end,
        'time_period': f'{year_start}/{str(academic_year_end)[-2:]}',
        'assessment_type': 'Phonics',
        'breakdown_topic': 'All pupils',
        'breakdown': 'Total',
        'phonics_pass_pct': phonics,
        'gld_pct': None,
        'reading_pct': None,
        'writing_pct': None,
        'maths_pct': None,
        'science_pct': None,
    }]

def upload_to_supabase(records, table, batch_size=500):
    """Upload records to Supabase in batches"""
    import urllib.request

    total = len(records)
    uploaded = 0
    errors = 0

    for i in range(0, total, batch_size):
        batch = records[i:i + batch_size]

        url = f'{SUPABASE_URL}/rest/v1/{table}'
        headers = {
            'apikey': SUPABASE_KEY,
            'Authorization': f'Bearer {SUPABASE_KEY}',
            'Content-Type': 'application/json',
            'Prefer': 'resolution=merge-duplicates,return=minimal',
        }

        data = json.dumps(batch).encode('utf-8')
        req = urllib.request.Request(url, data=data, headers=headers, method='POST')

        try:
            resp = urllib.request.urlopen(req)
            uploaded += len(batch)
            print(f'  Uploaded {uploaded}/{total} records...', end='\r')
        except urllib.error.HTTPError as e:
            error_body = e.read().decode()
            errors += len(batch)
            print(f'\n  Error batch {i//batch_size}: {e.code} — {error_body[:200]}')

    print(f'\n  Done: {uploaded} uploaded, {errors} errors out of {total} total')
    return uploaded, errors

def main():
    parser = argparse.ArgumentParser(description='Import DfE performance data to Supabase')
    parser.add_argument('--file', required=True, help='Path to CSV file')
    parser.add_argument('--type', required=True, choices=['ks2', 'ks1', 'eyfsp', 'phonics'], help='Data type')
    parser.add_argument('--year', required=True, type=int, help='Academic year end (e.g. 2023 for 2022/23)')
    parser.add_argument('--dry-run', action='store_true', help='Parse only, do not upload')
    args = parser.parse_args()

    load_env()

    if not SUPABASE_URL or not SUPABASE_KEY:
        print('ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set')
        sys.exit(1)

    print(f'Importing {args.type} data from {args.file} for year {args.year}...')

    # Select parser and target table
    parsers = {
        'ks2': (parse_ks2_row, 'ks2_results'),
        'ks1': (parse_ks1_row, 'ks1_results'),
        'eyfsp': (parse_eyfsp_row, 'ks1_results'),  # EYFSP goes into ks1_results with assessment_type='EYFSP'
        'phonics': (parse_phonics_row, 'ks1_results'),  # Phonics goes into ks1_results with assessment_type='Phonics'
    }

    parse_fn, table = parsers[args.type]

    # Parse the CSV
    all_records = []
    row_count = 0

    with open(args.file, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        for row in reader:
            row_count += 1
            records = parse_fn(row, args.year)
            all_records.extend(records)

    print(f'Parsed {row_count} CSV rows → {len(all_records)} records for {table}')

    # Show Pennine schools preview
    pennine_urns = {148869, 146581, 144862, 148201, 144860, 144861, 150016, 107212}
    pennine_records = [r for r in all_records if r['urn'] in pennine_urns]
    print(f'Pennine schools: {len(pennine_records)} records')
    for r in pennine_records[:5]:
        print(f'  URN {r["urn"]}: {r.get("subject", r.get("assessment_type", "?"))} = {r.get("expected_standard_pct", r.get("reading_pct", r.get("gld_pct", "?")))}')

    if args.dry_run:
        print('DRY RUN — not uploading')
        return

    # Upload
    print(f'\nUploading to {table}...')
    uploaded, errors = upload_to_supabase(all_records, table)

    print(f'\nComplete: {uploaded} records uploaded to {table}')

if __name__ == '__main__':
    main()

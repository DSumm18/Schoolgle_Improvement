#!/usr/bin/env node
/**
 * Import GIAS change history into dfe_data.school_history.
 *
 * Sources (downloaded from https://get-information-schools.service.gov.uk/Downloads):
 *   - /tmp/gias_work/extracted/edubasealldata<DATE>.csv        (current snapshot, ~52k schools)
 *   - /tmp/gias_work/extracted/academiesmatmembership<DATE>.csv (~15.5k rows: MAT membership history)
 *   - /tmp/gias_work/extracted/links_edubasealldata<DATE>.csv   (~35k rows: predecessor/successor links)
 *
 * GIAS does NOT publish a row-by-row change log for every field. What we DO capture here:
 *   - establishment_opened      (OpenDate, ReasonEstablishmentOpened)
 *   - establishment_closed      (CloseDate, ReasonEstablishmentClosed)
 *   - predecessor_link          (school X replaced school Y, with date)
 *   - successor_link            (school Y became school X, with date)
 *   - trust_joined              (Date Joined Group -> Group Name)
 *   - trust_left                (Date Left Group -> Group Name)
 *   - head_current              (current Head from snapshot — old_value=NULL, new_value=current)
 *   - establishment_name_current(current name from snapshot — baseline)
 *   - trust_current             (current Trust from snapshot)
 *   - establishment_status_current
 *
 * For finer-grained field-level change tracking (headteacher changes over the years, name
 * changes, status flips without re-URN) GIAS does not publish the data publicly. Those are
 * only available by diffing weekly snapshots over time — so the weekly delta job we run
 * against this same table will accumulate that history going forward.
 *
 * Output table schema: dfe_data.school_history
 *   (id uuid, urn int, snapshot_date date, field_name varchar, old_value text, new_value text, created_at timestamptz)
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import Papa from 'papaparse';
import pg from 'pg';
import dotenv from 'dotenv';

const { Client } = pg;
const __dirname = dirname(fileURLToPath(import.meta.url));

// Try multiple candidate paths so this works whether invoked from repo root, apps/platform, or via symlink
for (const p of [
  join(__dirname, '.env.local'),
  join(__dirname, '..', 'apps', 'platform', '.env.local'),
  join(__dirname, '..', '..', 'apps', 'platform', '.env.local'),
  join(process.cwd(), 'apps', 'platform', '.env.local'),
  join(process.cwd(), '.env.local'),
]) {
  dotenv.config({ path: p, override: false });
  if (process.env.DATABASE_URL) break;
}

const DATA_DIR = '/tmp/gias_work/extracted';
const EDUBASE = join(DATA_DIR, 'edubasealldata20260418.csv');
const MAT = join(DATA_DIR, 'academiesmatmembership20260418.csv');
const LINKS = join(DATA_DIR, 'links_edubasealldata20260418.csv');
const SNAPSHOT_DATE = '2026-04-18';

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL missing from apps/platform/.env.local');
  process.exit(1);
}

const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);

/** Parse a UK/ISO date like "2020-11-01" or "31-10-2020" into YYYY-MM-DD or null */
function toISODate(s) {
  if (!s) return null;
  const t = String(s).trim();
  if (!t) return null;
  // ISO already
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t;
  // DD-MM-YYYY
  const m = t.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  // DD/MM/YYYY
  const m2 = t.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m2) return `${m2[3]}-${m2[2]}-${m2[1]}`;
  return null;
}

function parseCSV(path) {
  const raw = readFileSync(path, 'utf8');
  const parsed = Papa.parse(raw, { header: true, skipEmptyLines: true });
  if (parsed.errors.length) {
    log(`  CSV parse had ${parsed.errors.length} non-fatal errors (first: ${parsed.errors[0].message})`);
  }
  return parsed.data;
}

async function main() {
  log('Connecting to Postgres…');
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    // Prepare staging: truncate if --replace passed, otherwise just insert
    const replace = process.argv.includes('--replace');
    if (replace) {
      log('--replace: truncating dfe_data.school_history first');
      await client.query('TRUNCATE TABLE dfe_data.school_history');
    }

    /** @type {{urn:number, snapshot_date:string, field_name:string, old_value:string|null, new_value:string|null}[]} */
    const events = [];
    const push = (urn, snapshotDate, field, oldVal, newVal) => {
      if (!urn || !Number.isFinite(urn) || urn <= 0) return;
      if (!snapshotDate) return;
      events.push({ urn, snapshot_date: snapshotDate, field_name: field, old_value: oldVal ?? null, new_value: newVal ?? null });
    };

    // --- 1. Establishment links (predecessor/successor) ---
    log('Reading establishment links…', LINKS);
    const links = parseCSV(LINKS);
    log(`  ${links.length.toLocaleString()} link rows`);
    for (const r of links) {
      const urn = parseInt(r['URN'], 10);
      const linkUrn = r['LinkURN'] ? String(r['LinkURN']).trim() : null;
      const linkName = r['LinkName'] ? String(r['LinkName']).trim() : null;
      const linkType = r['LinkType'] ? String(r['LinkType']).trim() : null;
      const date = toISODate(r['LinkEstablishedDate']);
      if (!Number.isFinite(urn) || !date || !linkType) continue;
      const field = linkType.toLowerCase().startsWith('predecessor') ? 'predecessor_link'
                  : linkType.toLowerCase().startsWith('successor') ? 'successor_link'
                  : 'establishment_link';
      const value = `${linkType}: ${linkName || '?'} (URN ${linkUrn || '?'})`;
      push(urn, date, field, null, value);
    }
    log(`  -> ${events.length.toLocaleString()} events so far`);

    // --- 2. MAT membership history ---
    log('Reading MAT membership history…', MAT);
    const mat = parseCSV(MAT);
    log(`  ${mat.length.toLocaleString()} MAT rows`);
    let matEvents = 0;
    for (const r of mat) {
      const urn = parseInt(r['URN'], 10);
      if (!Number.isFinite(urn)) continue;
      const groupName = r['Group Name'] ? String(r['Group Name']).trim() : null;
      const groupId = r['Group ID'] ? String(r['Group ID']).trim() : null;
      const joined = toISODate(r['Date Joined Group']);
      const left = toISODate(r['Date Left Group']);
      const estOpen = toISODate(r['Establishment OpenDate']);
      const estClose = toISODate(r['Establishment CloseDate']);
      const reasonOpen = r['ReasonEstablishmentOpened (name)'];
      const reasonClose = r['ReasonEstablishmentClosed (name)'];
      const estName = r['EstablishmentName'];
      const estStatus = r['EstablishmentStatus (name)'];
      const groupLabel = groupName ? `${groupName}${groupId ? ` (${groupId})` : ''}` : null;

      if (joined && groupLabel) {
        push(urn, joined, 'trust_joined', null, groupLabel);
        matEvents++;
      }
      if (left && groupLabel) {
        push(urn, left, 'trust_left', groupLabel, null);
        matEvents++;
      }
      if (estOpen) {
        const v = reasonOpen ? `${estName || ''} (${reasonOpen})`.trim() : (estName || 'Established');
        push(urn, estOpen, 'establishment_opened', null, v);
        matEvents++;
      }
      if (estClose) {
        const v = reasonClose ? `${estName || ''} (${reasonClose})`.trim() : (estName || 'Closed');
        push(urn, estClose, 'establishment_closed', estName || null, v);
        matEvents++;
      }
      // Also record current head (from MAT file)
      const headFirst = r['HeadFirstName'];
      const headLast = r['HeadLastName'];
      const headTitle = r['HeadTitle (name)'];
      if ((headFirst || headLast) && (joined || estOpen)) {
        const headLabel = [headTitle, headFirst, headLast].filter(Boolean).join(' ').trim();
        if (headLabel) {
          // Use the most recent of joined/open as the "current as-of" date
          const asOf = (joined && estOpen) ? (joined > estOpen ? joined : estOpen) : (joined || estOpen);
          push(urn, asOf, 'head_current', null, headLabel);
          matEvents++;
        }
      }
      // Status at snapshot
      if (estStatus) {
        push(urn, SNAPSHOT_DATE, 'establishment_status_current', null, estStatus);
        matEvents++;
      }
    }
    log(`  -> +${matEvents.toLocaleString()} MAT events`);

    // --- 3. Current edubase snapshot (baseline) ---
    log('Reading edubase current snapshot…', EDUBASE);
    const base = parseCSV(EDUBASE);
    log(`  ${base.length.toLocaleString()} school rows`);
    let baseEvents = 0;
    for (const r of base) {
      const urn = parseInt(r['URN'], 10);
      if (!Number.isFinite(urn)) continue;
      const snap = toISODate(r['LastChangedDate']) || SNAPSHOT_DATE;
      const openDate = toISODate(r['OpenDate']);
      const closeDate = toISODate(r['CloseDate']);
      const reasonOpen = r['ReasonEstablishmentOpened (name)'];
      const reasonClose = r['ReasonEstablishmentClosed (name)'];
      const name = r['EstablishmentName'];
      const status = r['EstablishmentStatus (name)'];
      const phase = r['PhaseOfEducation (name)'];
      const type = r['TypeOfEstablishment (name)'];
      const religious = r['ReligiousCharacter (name)'];
      const trustFlag = r['TrustSchoolFlag (name)'];
      const trustName = r['Trusts (name)'];
      const headFirst = r['HeadFirstName'];
      const headLast = r['HeadLastName'];
      const headTitle = r['HeadTitle (name)'];
      const headJob = r['HeadPreferredJobTitle'];

      if (openDate) {
        const v = reasonOpen ? `${name || ''} (${reasonOpen})`.trim() : (name || 'Established');
        push(urn, openDate, 'establishment_opened', null, v); baseEvents++;
      }
      if (closeDate) {
        const v = reasonClose ? `${name || ''} (${reasonClose})`.trim() : (name || 'Closed');
        push(urn, closeDate, 'establishment_closed', name || null, v); baseEvents++;
      }
      // Current-state baselines (snapshot date)
      if (name) { push(urn, snap, 'establishment_name_current', null, name); baseEvents++; }
      if (status) { push(urn, snap, 'establishment_status_current', null, status); baseEvents++; }
      if (phase) { push(urn, snap, 'phase_of_education_current', null, phase); baseEvents++; }
      if (type) { push(urn, snap, 'type_of_establishment_current', null, type); baseEvents++; }
      if (religious && religious !== 'Does not apply') { push(urn, snap, 'religious_character_current', null, religious); baseEvents++; }
      if (trustFlag) { push(urn, snap, 'trust_flag_current', null, trustFlag); baseEvents++; }
      if (trustName) { push(urn, snap, 'trust_name_current', null, trustName); baseEvents++; }
      if (headFirst || headLast) {
        const label = [headTitle, headFirst, headLast].filter(Boolean).join(' ').trim();
        if (label) { push(urn, snap, 'head_current', null, label); baseEvents++; }
      }
      if (headJob) { push(urn, snap, 'head_job_title_current', null, headJob); baseEvents++; }
    }
    log(`  -> +${baseEvents.toLocaleString()} edubase baseline events`);

    log(`Total events before URN filter: ${events.length.toLocaleString()}`);

    // Filter to URNs that exist in dfe_data.schools (FK constraint)
    log('Loading valid URNs from dfe_data.schools…');
    const { rows: validUrnRows } = await client.query('SELECT urn FROM dfe_data.schools');
    const validUrns = new Set(validUrnRows.map((r) => Number(r.urn)));
    log(`  ${validUrns.size.toLocaleString()} valid URNs`);
    const before = events.length;
    const droppedUrns = new Set();
    // Filter in-place
    let w = 0;
    for (let i = 0; i < events.length; i++) {
      const e = events[i];
      if (validUrns.has(e.urn)) {
        events[w++] = e;
      } else {
        droppedUrns.add(e.urn);
      }
    }
    events.length = w;
    log(`  Dropped ${(before - events.length).toLocaleString()} events for ${droppedUrns.size.toLocaleString()} URNs not present in dfe_data.schools`);
    log(`Total events to insert: ${events.length.toLocaleString()}`);

    // --- Dedupe on DB unique key (urn, snapshot_date, field_name).
    // When multiple events collide on the same key, we concatenate unique new_values with a separator
    // so no data is silently lost (e.g. two predecessor links established the same day).
    /** @type {Map<string, {urn:number,snapshot_date:string,field_name:string,old_value:string|null,new_value:string|null}>} */
    const byKey = new Map();
    for (const e of events) {
      const key = `${e.urn}|${e.snapshot_date}|${e.field_name}`;
      const existing = byKey.get(key);
      if (!existing) { byKey.set(key, e); continue; }
      // Merge: combine new_values if both set & differ
      if (e.new_value && existing.new_value && existing.new_value !== e.new_value) {
        if (!existing.new_value.includes(e.new_value)) {
          existing.new_value = `${existing.new_value}; ${e.new_value}`;
        }
      } else if (e.new_value && !existing.new_value) {
        existing.new_value = e.new_value;
      }
      if (e.old_value && existing.old_value && existing.old_value !== e.old_value) {
        if (!existing.old_value.includes(e.old_value)) {
          existing.old_value = `${existing.old_value}; ${e.old_value}`;
        }
      } else if (e.old_value && !existing.old_value) {
        existing.old_value = e.old_value;
      }
    }
    const deduped = Array.from(byKey.values());
    log(`After dedup on unique key: ${deduped.length.toLocaleString()} unique events (from ${events.length.toLocaleString()})`);

    // --- Batch insert ---
    log('Inserting…');
    const BATCH = 1000;
    let inserted = 0;
    for (let i = 0; i < deduped.length; i += BATCH) {
      const chunk = deduped.slice(i, i + BATCH);
      const values = [];
      const placeholders = [];
      chunk.forEach((e, idx) => {
        const base = idx * 5;
        placeholders.push(`($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5})`);
        values.push(e.urn, e.snapshot_date, e.field_name, e.old_value, e.new_value);
      });
      const sql = `INSERT INTO dfe_data.school_history (urn, snapshot_date, field_name, old_value, new_value) VALUES ${placeholders.join(', ')} ON CONFLICT (urn, snapshot_date, field_name) DO NOTHING`;
      await client.query(sql, values);
      inserted += chunk.length;
      if (inserted % 10000 === 0 || inserted === deduped.length) {
        log(`  inserted ${inserted.toLocaleString()} / ${deduped.length.toLocaleString()}`);
      }
    }

    log('Creating indexes (if not exist)…');
    await client.query('CREATE INDEX IF NOT EXISTS school_history_urn_date ON dfe_data.school_history (urn, snapshot_date DESC)');
    await client.query('CREATE INDEX IF NOT EXISTS school_history_field ON dfe_data.school_history (field_name)');
    await client.query('CREATE INDEX IF NOT EXISTS school_history_urn_field ON dfe_data.school_history (urn, field_name)');

    log('Verifying row count…');
    const { rows: [{ c }] } = await client.query('SELECT COUNT(*)::bigint AS c FROM dfe_data.school_history');
    log(`school_history now has ${Number(c).toLocaleString()} rows`);

    log('Grove House (URN 148201 + 107242) sample:');
    const { rows: grove } = await client.query(
      `SELECT urn, snapshot_date, field_name, old_value, new_value
         FROM dfe_data.school_history
        WHERE urn IN (148201, 107242)
        ORDER BY snapshot_date DESC, field_name`
    );
    for (const g of grove) {
      console.log(`  ${g.urn} ${g.snapshot_date} ${g.field_name}: ${g.old_value || '∅'} -> ${g.new_value || '∅'}`);
    }

    log('Per-field counts:');
    const { rows: byField } = await client.query(
      `SELECT field_name, COUNT(*)::bigint AS n
         FROM dfe_data.school_history
        GROUP BY field_name
        ORDER BY n DESC`
    );
    for (const f of byField) console.log(`  ${f.field_name.padEnd(35)} ${Number(f.n).toLocaleString()}`);

    log('Done.');
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

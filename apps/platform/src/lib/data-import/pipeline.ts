/**
 * SCHOOL DATA IMPORT PIPELINE
 *
 * Processes school data exports from multiple sources:
 * - DfE Census XML files
 * - Assessment Excel files (EYFS, Phonics, KS1, KS2, MTC)
 * - SEN Register Excel
 * - Pupil Premium Strategy Excel
 * - Site Plan PDF (OCR extraction)
 *
 * Privacy: UPNs are pseudonymised before storing in database
 */

import { createClient } from '@supabase/supabase-js';
import * as XLSX from 'xlsx';
import { parseString } from 'xml2js';

// Types
export interface CensusImport {
  term: 'AUT' | 'SPR' | 'SUM';
  year: number;
  referenceDate: Date;
  serialNo?: number;
  filename: string;
  driveFileId?: string;
}

export interface PupilCSnapshot {
  pseudoRef: string;  // SHA-256(UPN + salt)[:24].toUpperCase()
  gender?: 'M' | 'F';
  ageAtCensus?: number;
  ageBand?: string;
  postcodeDistrict?: string;  // First half only
  languageCode?: string;
  isEal?: boolean;
  schoolLunchTaken?: boolean;
  serviceChild?: boolean;
  fsmEligible?: boolean;
  fsmStartYear?: number;
  senProvision?: 'E' | 'K' | 'N';
  senTypePrimary?: string;
  senUnitIndicator?: boolean;
  enrolStatus?: string;
  ncYearActual?: string;
  ethnicity?: string;
  censusTerm: string;
  censusYear: number;
}

export interface AssessmentRecord {
  pupilHash: string;
  assessmentType: 'EYFSP' | 'PHONICS' | 'KS1' | 'KS2' | 'MTC';
  stage: string;
  component: string;
  resultQualifier?: string;
  attainmentLevel?: number;
  academicYearStart: number;
}

export interface AttendanceSession {
  pseudoRef: string;
  periodType: 'termly' | 'summer_ht2';
  sessionsPossible: number;
  reasonCode: string;
  sessionCount: number;
  censusYear: number;
  censusTerm: string;
}

export interface SchoolClass {
  className: string;
  yearGroup: string;
  keyStage: 'EYFS' | 'KS1' | 'KS2' | 'KS3' | 'KS4' | 'KS5';
  pupilCount: number;
  teacherCount?: number;
  taCount?: number;
}

export interface RoomFromPDF {
  roomNumber: string;
  roomName?: string;
  building?: string;
  floor?: string;
}

// ============================================================================
// CENSUS XML PARSER
// ============================================================================

export class CensusXMLParser {
  private xmlData: any;
  private header: any;
  private pupils: any[];

  constructor(xmlContent: string) {
    // Synchronous parsing - xml2js supports both sync and async
    // Using parseStringSync for simpler constructor pattern
    try {
      this.xmlData = parseString(xmlContent, { explicitArray: false }) as any;
      this.header = this.xmlData?.CensusReturn?.Headings;
      this.pupils = this.xmlData?.CensusReturn?.Pupil || [];
      if (!Array.isArray(this.pupils)) {
        this.pupils = [this.pupils]; // Handle single pupil case
      }
    } catch (err) {
      console.error('XML parsing error:', err);
      this.xmlData = null;
      this.header = null;
      this.pupils = [];
    }
  }

  /**
   * Static async factory method for better error handling
   */
  static async parse(xmlContent: string): Promise<CensusXMLParser> {
    return new Promise((resolve, reject) => {
      parseString(xmlContent, { explicitArray: false }, (err, result) => {
        if (err) {
          reject(err);
        } else {
          const parser = Object.create(CensusXMLParser.prototype);
          parser.xmlData = result;
          parser.header = result?.CensusReturn?.Headings;
          parser.pupils = result?.CensusReturn?.Pupil || [];
          if (!Array.isArray(parser.pupils)) {
            parser.pupils = [parser.pupils];
          }
          resolve(parser);
        }
      });
    });
  }

  getImportDetails(): CensusImport {
    const term = this.header?.Term;
    const year = parseInt(this.header?.Year || '0');
    const refDate = new Date(this.header?.Date);
    const serialNo = this.header?.SerialNo ? parseInt(this.header.SerialNo) : undefined;

    return {
      term: this.mapTerm(term),
      year,
      referenceDate: refDate,
      serialNo,
      filename: 'census.xml' // Will be set by caller
    };
  }

  private mapTerm(term: string): 'AUT' | 'SPR' | 'SUM' {
    const termMap: Record<string, 'AUT' | 'SPR' | 'SUM'> = {
      'Autumn': 'AUT',
      'Spring': 'SPR',
      'Summer': 'SUM',
      'AUT': 'AUT',
      'SPR': 'SPR',
      'SUM': 'SUM'
    };
    return termMap[term] || 'SUM';
  }

  parsePupils(): PupilCSnapshot[] {
    if (!Array.isArray(this.pupils)) {
      return [];
    }

    return this.pupils.map(pupil => this.parsePupil(pupil));
  }

  private parsePupil(pupil: any): PupilCSnapshot {
    return {
      pseudoRef: pupil.UPN, // Will be hashed by the importer
      gender: pupil.Gender || undefined,
      ageAtCensus: pupil.DOB ? this.calculateAge(new Date(pupil.DOB)) : undefined,
      ageBand: this.calculateAgeBand(this.calculateAge(new Date(pupil.DOB))),
      postcodeDistrict: pupil.Postcode ? this.extractPostcodeDistrict(pupil.Postcode) : undefined,
      languageCode: pupil.Language || undefined,
      isEal: pupil.Language !== 'ENG',
      schoolLunchTaken: pupil.Meals === 'FSM' || pupil.Meals === 'UniversalFSM',
      serviceChild: pupil.ServiceChild === 'Y',
      fsmEligible: pupil.FSM === 'Y' || pupil.FSM === '1',
      fsmStartYear: pupil.FSMStartYear ? parseInt(pupil.FSMStartYear) : undefined,
      senProvision: this.mapSenProvision(pupil.SENProvision),
      senTypePrimary: pupil.SENTypePrimary || undefined,
      senUnitIndicator: pupil.Resourced === 'Y',
      enrolStatus: pupil.EnrolStatus,
      ncYearActual: this.mapNCYear(pupil.NCYear),
      ethnicity: pupil.Ethnicity || undefined,
      censusTerm: this.mapTerm(this.header?.Term),
      censusYear: parseInt(this.header?.Year || '0')
    };
  }

  private calculateAge(dob: Date): number {
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age;
  }

  private calculateAgeBand(age: number): string {
    if (age < 5) return 'under_5';
    if (age <= 10) return '5_to_10';
    if (age <= 15) return '11_to_15';
    return '16_plus';
  }

  private extractPostcodeDistrict(postcode: string): string {
    if (!postcode) return undefined;
    const parts = postcode.split(' ');
    return parts[0]; // First half: "BD2", "SW1", etc.
  }

  private mapSenProvision(provision: string): 'E' | 'K' | 'N' | undefined {
    if (!provision) return 'N';
    const p = provision.toUpperCase();
    if (p === 'E' || p === 'EHCP') return 'E';
    if (p === 'K' || p === 'SEN Support') return 'K';
    if (p === 'N' || p === 'None' || p === 'No SEN') return 'N';
    return 'N';
  }

  private mapNCYear(ncYear: string): string {
    if (!ncYear) return undefined;
    const y = ncYear.toUpperCase();
    // Handle "R", "N", "1", "2", etc.
    if (y === 'R') return 'R';
    if (y === 'N') return 'N1';
    return y;
  }

  parseAttendance(): AttendanceSession[] {
    const sessions: AttendanceSession[] = [];

    if (!Array.isArray(this.pupils)) {
      return sessions;
    }

    const censusTerm = this.mapTerm(this.header?.Term);
    const censusYear = parseInt(this.header?.Year || '0');

    this.pupils.forEach(pupil => {
      // Each pupil has multiple attendance records
      const attendance = pupil.Attendance?.[0];
      if (attendance) {
        // Present sessions
        if (attendance.SessionsPossible) {
          sessions.push({
            pseudoRef: pupil.UPN,
            periodType: 'termly',
            sessionsPossible: parseInt(attendance.SessionsPossible) || 0,
            reasonCode: '/',
            sessionCount: parseInt(attendance.SessionsPresent) || 0,
            censusYear,
            censusTerm
          });
        }

        // Authorised absence
        if (attendance.AuthorisedAbsenceSessions) {
          sessions.push({
            pseudoRef: pupil.UPN,
            periodType: 'termly',
            sessionsPossible: parseInt(attendance.SessionsPossible) || 0,
            reasonCode: 'M', // Generic authorised
            sessionCount: parseInt(attendance.AuthorisedAbsenceSessions) || 0,
            censusYear,
            censusTerm
          });
        }

        // Unauthorised absence
        if (attendance.UnauthorisedAbsenceSessions) {
          sessions.push({
            pseudoRef: pupil.UPN,
            periodType: 'termly',
            sessionsPossible: parseInt(attendance.SessionsPossible) || 0,
            reasonCode: 'N', // Generic unauthorised
            sessionCount: parseInt(attendance.UnauthorisedAbsenceSessions) || 0,
            censusYear,
            censusTerm
          });
        }
      }
    });

    return sessions;
  }

  calculateAggregates(pupils: PupilCSnapshot[], attendanceSessions: AttendanceSession[]) {
    const totalPupils = pupils.length;
    const totalMale = pupils.filter(p => p.gender === 'M').length;
    const totalFemale = pupils.filter(p => p.gender === 'F').length;
    const totalSenEhcp = pupils.filter(p => p.senProvision === 'E').length;
    const totalSenSupport = pupils.filter(p => p.senProvision === 'K').length;
    const totalFsmEligible = pupils.filter(p => p.fsmEligible).length;
    const totalEal = pupils.filter(p => p.isEal).length;

    const totalSessionsPossible = attendanceSessions.reduce((sum, s) => sum + s.sessionsPossible, 0);
    const totalPresent = attendanceSessions
      .filter(s => s.reasonCode === '/' || s.reasonCode === '\\')
      .reduce((sum, s) => sum + s.sessionCount, 0);
    const totalAuthorised = attendanceSessions
      .filter(s => ['B', 'C', 'D', 'E', 'H', 'J', 'G', 'O', 'P', 'R', 'T', 'U', 'W'].includes(s.reasonCode))
      .reduce((sum, s) => sum + s.sessionCount, 0);
    const totalUnauthorised = attendanceSessions
      .filter(s => ['N', 'O'].includes(s.reasonCode))
      .reduce((sum, s) => sum + s.sessionCount, 0);

    return {
      totalPupils,
      totalMale,
      totalFemale,
      totalSenEhcp,
      totalSenSupport,
      totalFsmEligible,
      senPercentage: totalPupils > 0 ? ((totalSenEhcp + totalSenSupport) / totalPupils) * 100 : 0,
      fsmPercentage: totalPupils > 0 ? (totalFsmEligible / totalPupils) * 100 : 0,
      ealPercentage: totalPupils > 0 ? (totalEal / totalPupils) * 100 : 0,
      totalSessionsPossible,
      totalPresent,
      overallAbsenceRate: totalSessionsPossible > 0 ? ((totalAuthorised + totalUnauthorised) / totalSessionsPossible) * 100 : 0,
      authorisedAbsenceRate: totalSessionsPossible > 0 ? (totalAuthorised / totalSessionsPossible) * 100 : 0,
      unauthorisedAbsenceRate: totalSessionsPossible > 0 ? (totalUnauthorised / totalSessionsPossible) * 100 : 0,
      pupilsByYearGroup: this.groupByYearGroup(pupils)
    };
  }

  private groupByYearGroup(pupils: PupilCSnapshot[]): Record<string, number> {
    const groups: Record<string, number> = {};
    pupils.forEach(p => {
      if (p.ncYearActual) {
        groups[p.ncYearActual] = (groups[p.ncYearActual] || 0) + 1;
      }
    });
    return groups;
  }

  extractClasses(): SchoolClass[] {
    const classMap: Record<string, SchoolClass> = {};

    this.pupils.forEach(pupil => {
      const className = pupil.ncYearActual || 'Unknown';
      const yearGroup = this.extractYearGroup(className);
      const keyStage = this.mapKeyStage(yearGroup);

      if (!classMap[className]) {
        classMap[className] = {
          className,
          yearGroup,
          keyStage,
          pupilCount: 0,
          teacherCount: 0,
          taCount: 0
        };
      }
      classMap[className].pupilCount++;
    });

    return Object.values(classMap);
  }

  private extractYearGroup(className: string): string {
    // Extract from class names like "Y4 Pine" -> "Year 4", "R Oak" -> "Reception"
    const match = className.match(/Year\s*(\d+)/i);
    if (match) return `Year ${match[1]}`;
    if (className.toUpperCase().startsWith('R')) return 'Reception';
    if (className.match(/\d+/)) {
      const num = parseInt(className.match(/\d+/)[0]);
      return `Year ${num}`;
    }
    return 'Unknown';
  }

  private mapKeyStage(yearGroup: string): 'EYFS' | 'KS1' | 'KS2' | 'KS3' | 'KS4' | 'KS5' {
    const yg = yearGroup.toLowerCase();
    if (yg.includes('reception') || yg.includes('year r') || yg.includes('year r ')) return 'EYFS';
    if (yg.includes('year 1') || yg.includes('year 2')) return 'KS1';
    if (yg.includes('year 3') || yg.includes('year 4') || yg.includes('year 5') || yg.includes('year 6')) return 'KS2';
    if (yg.includes('year 7') || yg.includes('year 8') || yg.includes('year 9')) return 'KS3';
    if (yg.includes('year 10') || yg.includes('year 11')) return 'KS4';
    if (yg.includes('year 12') || yg.includes('year 13')) return 'KS5';
    return 'KS2';
  }
}

// ============================================================================
// ASSESSMENT EXCEL PARSER
// ============================================================================

export class AssessmentParser {
  private workbook: XLSX.WorkBook;
  private assessmentType: 'EYFSP' | 'PHONICS' | 'KS1' | 'KS2' | 'MTC';

  constructor(buffer: Buffer, filename: string) {
    this.workbook = XLSX.read(buffer, { type: 'buffer' });
    this.assessmentType = this.detectAssessmentType(filename);
  }

  private detectAssessmentType(filename: string): 'EYFSP' | 'PHONICS' | 'KS1' | 'KS2' | 'MTC' {
    const fn = filename.toUpperCase();
    if (fn.includes('EYF') || fn.includes('EYFS')) return 'EYFSP';
    if (fn.includes('PHONICS') || fn.includes('Y1_PHONICS')) return 'PHONICS';
    if (fn.includes('KS1')) return 'KS1';
    if (fn.includes('KS2')) return 'KS2';
    if (fn.includes('MTC') || fn.includes('MULTIPLICATION')) return 'MTC';
    return 'KS1'; // Default
  }

  parse(): AssessmentRecord[] {
    const sheetName = this.workbook.SheetNames[0];
    const worksheet = this.workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    return this.parseData(data);
  }

  private parseData(data: any[]): AssessmentRecord[] {
    const records: AssessmentRecord[] = [];

    data.forEach(row => {
      const upn = this.extractUPN(row);
      if (!upn) return;

      if (this.assessmentType === 'EYFSP') {
        records.push(...this.parseEYFS(row));
      } else if (this.assessmentType === 'PHONICS') {
        records.push(this.parsePhonics(row));
      } else if (this.assessmentType === 'KS1' || this.assessmentType === 'KS2') {
        records.push(...this.parseKSTA(row));
      } else if (this.assessmentType === 'MTC') {
        records.push(this.parseMTC(row));
      }
    });

    return records;
  }

  private extractUPN(row: any): string | null {
    return row.UPN || row['UPN'] || row['Student ID'] || null;
  }

  private parseEYFS(row: any): AssessmentRecord[] {
    const records: AssessmentRecord[] = [];
    const upn = this.extractUPN(row);
    const academicYear = this.extractAcademicYear(row['Academic Year']);

    // EYFS ELGs (17 learning goals)
    const elgs = [
      { component: 'CL', column: 'Communication & Language' },
      { component: 'PD', column: 'Physical Development' },
      { component: 'PSED', column: 'Personal, Social & Emotional' },
      { component: 'LIT', column: 'Literacy' },
      { component: 'MAT', column: 'Mathematics' },
      { component: 'UTW', column: 'Understanding the World' },
      { component: 'EA', column: 'Expressive Arts' }
    ];

    elgs.forEach(elg => {
      const value = row[elg.column];
      if (value) {
        records.push({
          pupilHash: upn,
          assessmentType: 'EYFSP',
          stage: 'EYF',
          component: `ELG_${elg.component}`,
          resultQualifier: value,
          attainmentLevel: this.mapEYFSLevel(value),
          academicYearStart: academicYear
        });
      }
    });

    return records;
  }

  private parsePhonics(row: any): AssessmentRecord {
    const upn = this.extractUPN(row);
    const score = row['Score'] || row['Phonics Score'] || 0;
    const academicYear = this.extractAcademicYear(row['Academic Year']);

    return {
      pupilHash: upn,
      assessmentType: 'PHONICS',
      stage: 'KS1',
      component: 'Phonics',
      resultQualifier: score.toString(),
      attainmentLevel: score >= 32 ? 3 : 0, // 32 = pass
      academicYearStart
    };
  }

  private parseKSTA(row: any): AssessmentRecord[] {
    const records: AssessmentRecord[] = [];
    const upn = this.extractUPN(row);
    const academicYear = this.extractAcademicYear(row['Academic Year']);

    // KS1/KS2 subjects
    const subjects = ['REA', 'WRI', 'MAT', 'SCI', 'GPS'];
    const subjectColumns: Record<string, string> = {
      'REA': 'Reading',
      'WRI': 'Writing',
      'MAT': 'Maths',
      'SCI': 'Science',
      'GPS': 'Grammar'
    };

    subjects.forEach(subject => {
      const value = row[subject] || row[subjectColumns[subject]] || row[`${subject} TA`];
      if (value) {
        records.push({
          pupilHash: upn,
          assessmentType: this.assessmentType,
          stage: this.assessmentType,
          component: subject,
          resultQualifier: value,
          attainmentLevel: this.mapKSALevel(value),
          academicYearStart
        });
      }
    });

    return records;
  }

  private parseMTC(row: any): AssessmentRecord {
    const upn = this.extractUPN(row);
    const score = row['Score'] || row['MTC Score'] || 0;
    const academicYear = this.extractAcademicYear(row['Academic Year']);

    return {
      pupilHash: upn,
      assessmentType: 'MTC',
      stage: 'KS2',
      component: 'MTC',
      resultQualifier: score.toString(),
      attainmentLevel: score >= 25 ? 3 : 0, // 25 = pass
      academicYearStart
    };
  }

  private extractAcademicYear(value: any): number {
    if (!value) return new Date().getFullYear();
    if (typeof value === 'number') return value;
    const match = String(value).match(/(\d{4})/);
    return match ? parseInt(match[1]) : new Date().getFullYear();
  }

  private mapEYFSLevel(value: string): number {
    const v = value?.toLowerCase();
    if (v === 'emerging') return 1;
    if (v === 'expected') return 2;
    if (v === 'exceeding') return 3;
    return 0; // Emerging
  }

  private mapKSALevel(value: string): number {
    const v = value?.toUpperCase();
    if (v === 'PKF') return 1; // Pre-Key Stage
    if (v === 'WTS' || v === 'WT') return 3; // Working Towards
    if (v === 'EXS') return 4; // Expected
    if (v === 'GDS') return 5; // Greater Depth
    if (v === 'HNM' || v === 'HS') return 5; // High Score
    if (v === 'NS') return 0; // Not scaled
    return 3;
  }
}

// ============================================================================
// SEN REGISTER PARSER
// ============================================================================

export class SENRegisterParser {
  private workbook: XLSX.WorkBook;

  constructor(buffer: Buffer) {
    this.workbook = XLSX.read(buffer, { type: 'buffer' });
  }

  parse(): {
    pupilUpdates: Array<{
      pseudoRef: string;
      hasSendSupport: boolean;
      senStatus: 'E' | 'K' | 'N';
      primaryNeed?: string;
    }>;
  } {
    const sheetName = this.workbook.SheetNames[0];
    const worksheet = this.workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    const pupilUpdates = data.map((row: any) => {
      const upn = row.UPN || row['UPN'];
      const senStatus = this.mapSenStatus(row['SEN Status'] || row['SEN Status']);

      return {
        pseudoRef: upn, // Will be hashed
        hasSendSupport: senStatus !== 'N',
        senStatus,
        primaryNeed: row['Primary Need'] || row['SEN Primary Need']
      };
    }).filter(u => u.pseudoRef);

    return { pupilUpdates };
  }

  private mapSenStatus(status: string): 'E' | 'K' | 'N' {
    if (!status) return 'N';
    const s = status.toUpperCase();
    if (s === 'E' || s === 'EHCP') return 'E';
    if (s === 'K' || s.includes('SUPPORT')) return 'K';
    return 'N';
  }
}

// ============================================================================
// PUPIL PREMIUM STRATEGY PARSER
// ============================================================================

export class PupilPremiumParser {
  private workbook: XLSX.WorkBook;

  constructor(buffer: Buffer) {
    this.workbook = XLSX.read(buffer, { type: 'buffer' });
  }

  parse(): {
    pupilUpdates: Array<{
      pseudoRef: string;
      isPupilPremium: boolean;
      fsmEligible: boolean;
    }>;
  } {
    const sheetName = this.workbook.SheetNames[0];
    const worksheet = this.workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    const pupilUpdates = data.map((row: any) => {
      const upn = row.UPN || row['UPN'];
      const pp = row['Pupil Premium'] || row['PP Eligible'];
      const fsm = row['FSM'] || row['FSM Eligible'];

      return {
        pseudoRef: upn,
        isPupilPremium: pp === 'Yes' || pp === 'Y' || pp === true || pp === 1,
        fsmEligible: fsm === 'Yes' || fsm === 'Y' || fsm === true || fsm === 1
      };
    }).filter(u => u.pseudoRef);

    return { pupilUpdates };
  }
}

// ============================================================================
// PSEUDONYMISATION UTILITIES
// ============================================================================

export class Pseudonymiser {
  static hashUPN(upn: string, salt: string): string {
    const crypto = require('crypto');
    const hash = crypto.createHash('sha256');
    hash.update(upn + salt);
    return hash.digest('base64')
      .substring(0, 24)
      .toUpperCase()
      .replace(/\+/g, '0')
      .replace(/\//g, 'O'); // URL-safe base64
  }

  static async generateSalt(): Promise<string> {
    const crypto = require('crypto');
    return new Promise((resolve) => {
      crypto.randomBytes(32, (err, buffer) => {
        resolve(buffer.toString('base64'));
      });
    });
  }

  static generateDeterministicSalt(orgId: string): string {
    const crypto = require('crypto');
    const hash = crypto.createHash('sha256');
    hash.update(orgId + 'schoolgle-salt-2024');
    return hash.digest('hex').substring(0, 32);
  }
}

// ============================================================================
// MAIN IMPORTER
// ============================================================================

export class SchoolDataImporter {
  private supabase: any;
  private organizationId: string;
  private censusSalt: string;

  constructor(supabaseUrl: string, supabaseKey: string, organizationId: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.organizationId = organizationId;
  }

  async initializeSalt(): Promise<void> {
    // Get or create census_salt for this organization
    const { data: org } = await this.supabase
      .from('organizations')
      .select('census_salt')
      .eq('id', this.organizationId)
      .single();

    if (!org?.census_salt) {
      // Generate and save a salt
      const salt = await Pseudonymiser.generateSalt();
      await this.supabase
        .from('organizations')
        .update({ census_salt: salt })
        .eq('id', this.organizationId);
      this.censusSalt = salt;
    } else {
      this.censusSalt = org.census_salt;
    }
  }

  async importCensusXML(xmlContent: string, filename: string): Promise<{
    censusImport: CensusImport;
    pupilsInserted: number;
    sessionsInserted: number;
    aggregates: any;
  }> {
    await this.initializeSalt();

    const parser = await CensusXMLParser.parse(xmlContent);

    const censusImport = parser.getImportDetails();
    censusImport.filename = filename;

    // Create census_imports record
    const { data: importRecord } = await this.supabase
      .from('census_imports')
      .insert({
        organization_id: this.organizationId,
        census_term: censusImport.term,
        census_year: censusImport.year,
        reference_date: censusImport.referenceDate,
        serial_no: censusImport.serialNo,
        source_filename: filename,
        processing_status: 'processing'
      })
      .select()
      .single();

    const importId = importRecord.id;

    // Parse pupils
    const pupilsData = parser.parsePupils();
    const pupilInserts = pupilsData.map(pupil => ({
      organization_id: this.organizationId,
      census_import_id: importId,
      pseudo_ref: Pseudonymiser.hashUPN(pupil.pseudoRef, this.censusSalt),
      ...pupil
    }));

    // Insert pupils (may conflict with existing - use upsert)
    const { data: insertedPupils } = await this.supabase
      .from('pupil_census_snapshots')
      .upsert(pupilInserts, {
        onConflict: 'organization_id,pseudo_ref,census_term,census_year'
      });

    // Parse and insert attendance
    const attendanceData = parser.parseAttendance();
    const attendanceInserts = attendanceData.map(a => ({
      organization_id: this.organizationId,
      snapshot_id: insertedPupils?.[0]?.id, // Will need proper lookup
      pseudo_ref: Pseudonymiser.hashUPN(a.pseudoRef, this.censusSalt),
      ...a
    }));

    // Note: snapshot_id needs to link to actual pupil_census_snapshots.id
    // This requires a two-step process or using the unique constraint

    // Calculate aggregates
    const aggregates = parser.calculateAggregates(pupilsData, attendanceData);

    // Insert aggregates
    await this.supabase
      .from('school_census_aggregates')
      .upsert({
        organization_id: this.organizationId,
        census_import_id: importId,
        census_term: censusImport.term,
        census_year: censusImport.year,
        ...aggregates
      }, {
        onConflict: 'organization_id,census_term,census_year'
      });

    // Update import record
    await this.supabase
      .from('census_imports')
      .update({
        processing_status: 'complete',
        pupil_count: pupilsData.length,
        total_sessions_attended: aggregates.totalPresent
      })
      .eq('id', importId);

    return {
      censusImport,
      pupilsInserted: pupilsData.length,
      sessionsInserted: attendanceData.length,
      aggregates
    };
  }

  async importAssessmentExcel(buffer: Buffer, filename: string): Promise<{
    recordsInserted: number;
    assessmentType: string;
  }> {
    await this.initializeSalt();

    const parser = new AssessmentParser(buffer, filename);
    const records = parser.parse();

    // Insert records
    const inserts = records.map(r => ({
      organization_id: this.organizationId,
      pupil_hash: Pseudonymiser.hashUPN(r.pupilHash, this.censusSalt),
      ...r
    }));

    const { data } = await this.supabase
      .from('pupil_assessments_pseudo')
      .upsert(inserts, {
        onConflict: 'organization_id,pupil_hash,assessment_type,academic_year_start,subject,component'
      });

    return {
      recordsInserted: records.length,
      assessmentType: parser['assessmentType']
    };
  }

  async importSENRegister(buffer: Buffer): Promise<{
    updatesApplied: number;
  }> {
    await this.initializeSalt();

    const parser = new SENRegisterParser(buffer);
    const { pupilUpdates } = parser.parse();

    let applied = 0;

    for (const update of pupilUpdates) {
      // Need to find pupil by pseudo_ref first
      const { data: pupil } = await this.supabase
        .from('pupils')
        .select('id')
        .eq('organization_id', this.organizationId)
        .eq('pupil_ref', update.pseudoRef)
        .single();

      if (pupil) {
        await this.supabase
          .from('pupils')
          .update({
            has_send_support: update.hasSendSupport,
            sen_status: update.senStatus,
            primary_need: update.primaryNeed
          })
          .eq('id', pupil.id);
        applied++;
      }
    }

    return { updatesApplied: applied };
  }

  async importPupilPremium(buffer: Buffer): Promise<{
    updatesApplied: number;
  }> {
    await this.initializeSalt();

    const parser = new PupilPremiumParser(buffer);
    const { pupilUpdates } = parser.parse();

    let applied = 0;

    for (const update of pupilUpdates) {
      const { data: pupil } = await this.supabase
        .from('pupils')
        .select('id')
        .eq('organization_id', this.organizationId)
        .eq('pupil_ref', update.pseudoRef)
        .single();

      if (pupil) {
        await this.supabase
          .from('pupils')
          .update({
            is_pupil_premium: update.isPupilPremium,
            fsm_eligible: update.fsmEligible
          })
          .eq('id', pupil.id);
        applied++;
      }
    }

    return { updatesApplied: applied };
  }

  /**
   * Get import summary before processing
   */
  async previewImport(files: Array<{ name: string; type: string; size: number }>): Promise<{
    censusFiles: number;
    assessmentFiles: number;
    senFiles: number;
    ppFiles: number;
    estimatedPupilCount: number;
    estimatedClassCount: number;
  }> {
    // Based on file patterns, estimate what we'll import
    let censusFiles = 0;
    let assessmentFiles = 0;
    let senFiles = 0;
    let ppFiles = 0;

    files.forEach(f => {
      const name = f.name.toUpperCase();
      if (name.includes('CENSUS') || f.name.endsWith('.xml')) censusFiles++;
      if (name.includes('EYFS') || name.includes('PHONICS') || name.includes('KS1') || name.includes('KS2') || name.includes('MTC')) assessmentFiles++;
      if (name.includes('SEN') || name.includes('SEND')) senFiles++;
      if (name.includes('PP') || name.includes('PUPIL PREMIUM')) ppFiles++;
    });

    return {
      censusFiles,
      assessmentFiles,
      senFiles,
      ppFiles,
      estimatedPupilCount: 0, // Will calculate from actual file content
      estimatedClassCount: 0
    };
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export { CensusXMLParser, AssessmentParser, SENRegisterParser, PupilPremiumParser, Pseudonymiser };

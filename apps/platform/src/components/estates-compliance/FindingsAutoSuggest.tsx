'use client';

/**
 * FindingsAutoSuggest Component
 *
 * Provides AI-powered auto-suggestions for findings based on:
 * - Statutory requirements for the compliance domain
 * - Good practice guidance
 * - Common issues found in similar checks
 *
 * Features:
 * - Real-time suggestions as user types
 * - Categorization by severity and classification
 * - Reference links to statutory guidance
 * - Quick-add to findings list
 */

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lightbulb, AlertTriangle, CheckCircle2, ExternalLink, Plus } from 'lucide-react';
import { Finding, ComplianceDomain } from '@/types/estates-compliance';
import { STATUTORY_CHECKS, ComplianceDomain as StatutoryDomain } from '@/lib/estates-compliance/statutory-checks';

interface FindingsAutoSuggestProps {
  domain: ComplianceDomain;
  taskTitle?: string;
  onAddFinding: (finding: Finding) => void;
  existingFindings: Finding[];
}

interface SuggestedFinding {
  id: string;
  title: string;
  description: string;
  action_required: string;
  severity: Finding['severity'];
  classification: Finding['classification'];
  source?: string;
  source_url?: string;
  keywords: string[];
}

// Domain-specific common findings database
const DOMAIN_FINDINGS: Record<string, SuggestedFinding[]> = {
  legionella: [
    {
      id: 'leg_cold_water_high',
      title: 'Cold water temperature above 20°C',
      description: 'Cold water outlet measured above the recommended 20°C limit',
      action_required: 'Investigate cause of high temperature, check calorifier performance and pipe insulation',
      severity: 'high',
      classification: 'statutory',
      source: 'HSE L8 para 157',
      source_url: 'https://www.hse.gov.uk/pubns/books/l8.htm',
      keywords: ['cold', 'hot', 'temperature', 'high', '20c', '20°c', 'limit', 'exceeded'],
    },
    {
      id: 'leg_hot_water_low',
      title: 'Hot water temperature below 50°C',
      description: 'Hot water outlet measured below the recommended 50°C distribution temperature',
      action_required: 'Check calorifier thermostat and settings, inspect for pipework heat loss',
      severity: 'high',
      classification: 'statutory',
      source: 'HSE L8 para 158',
      source_url: 'https://www.hse.gov.uk/pubns/books/l8.htm',
      keywords: ['hot', 'water', 'low', 'temperature', '50c', '50°c', 'below', 'distribution'],
    },
    {
      id: 'leg_shower_hose',
      title: 'Shower hose requires cleaning/descaling',
      description: 'Shower head and hose show signs of scale buildup or contamination',
      action_required: 'Clean and descale shower head and hose, record in maintenance log',
      severity: 'medium',
      classification: 'good_practice',
      source: 'HSE HSG274',
      source_url: 'https://www.hse.gov.uk/pubns/priced/hsg274part2.pdf',
      keywords: ['shower', 'hose', 'scale', 'clean', 'descale', 'buildup', 'mold'],
    },
    {
      id: 'leg_infrequent_outlet',
      title: 'Infrequently used outlet identified',
      description: 'Outlet found not used within the last 7 days',
      action_required: 'Flush outlet for minimum 2 minutes, record in flushing log',
      severity: 'low',
      classification: 'statutory',
      source: 'HSE L8 para 155',
      source_url: 'https://www.hse.gov.uk/pubns/books/l8.htm',
      keywords: ['infrequent', 'unused', 'flush', 'weekly', '7 days', 'stagnant'],
    },
    {
      id: 'leg_calorifier_stratification',
      title: 'Calorifier showing signs of stratification',
      description: 'Temperature difference noted within calorifier indicating potential stratification',
      action_required: 'Check circulation pump operation, consider destratification measures',
      severity: 'medium',
      classification: 'good_practice',
      source: 'HSE HSG274 Part 2',
      source_url: 'https://www.hse.gov.uk/pubns/priced/hsg274part2.pdf',
      keywords: ['calorifier', 'stratification', 'temperature', 'difference', 'circulation'],
    },
  ],
  fire: [
    {
      id: 'fire_alarm_fault',
      title: 'Fire alarm panel showing fault indication',
      description: 'Fire alarm control panel displaying fault warning',
      action_required: 'Contact fire alarm engineer within 24 hours, record in logbook',
      severity: 'critical',
      classification: 'statutory',
      source: 'RRO 2005, BS5839',
      source_url: 'https://www.legislation.gov.uk/ukdsi/2005/1541/contents/made',
      keywords: ['alarm', 'fault', 'panel', 'warning', 'indicator', 'bs5839'],
    },
    {
      id: 'fire_extinguisher_obstructed',
      title: 'Fire extinguisher obstructed',
      description: 'Fire extinguisher not accessible due to obstruction',
      action_required: 'Remove obstruction and ensure clear access maintained',
      severity: 'medium',
      classification: 'statutory',
      source: 'RRO 2005',
      source_url: 'https://www.legislation.gov.uk/ukdsi/2005/1541/contents/made',
      keywords: ['extinguisher', 'obstructed', 'blocked', 'access', 'visible'],
    },
    {
      id: 'fire_exit_blocked',
      title: 'Fire exit route obstructed',
      description: 'Escape route partially blocked or obstructed',
      action_required: 'Clear obstruction immediately, ensure routes kept clear at all times',
      severity: 'critical',
      classification: 'statutory',
      source: 'RRO 2005',
      source_url: 'https://www.legislation.gov.uk/ukdsi/2005/1541/contents/made',
      keywords: ['exit', 'blocked', 'obstructed', 'escape', 'route', 'clear'],
    },
    {
      id: 'fire_emergency_light',
      title: 'Emergency light not functioning',
      description: 'One or more emergency luminaires failed test',
      action_required: 'Replace faulty unit, arrange repair by qualified electrician',
      severity: 'high',
      classification: 'statutory',
      source: 'RRO 2005, BS5266',
      source_url: 'https://www.legislation.gov.uk/ukdsi/2005/1541/contents/made',
      keywords: ['emergency', 'light', 'luminaire', 'failed', 'not working', 'bs5266'],
    },
    {
      id: 'fire_door_damage',
      title: 'Fire door damaged or not closing properly',
      description: 'Fire door showing damage or failing to close fully',
      action_required: 'Arrange repair by competent person, check intumescent seals',
      severity: 'high',
      classification: 'statutory',
      source: 'RRO 2005',
      source_url: 'https://www.legislation.gov.uk/ukdsi/2005/1541/contents/made',
      keywords: ['door', 'fire', 'damaged', 'closing', 'seal', 'gap', 'intumescent'],
    },
  ],
  electrical: [
    {
      id: 'elec_rcd_trip',
      title: 'RCD not testing correctly',
      description: 'Residual Current Device failed to trip on test',
      action_required: 'Investigate by qualified electrician, do not use affected circuit',
      severity: 'critical',
      classification: 'statutory',
      source: 'BS7671',
      source_url: 'https://www.bsi.group.com/en/standards/british-standards',
      keywords: ['rcd', 'trip', 'test', 'fail', 'residual', 'current', 'device'],
    },
    {
      id: 'elec_visual_damage',
      title: 'Visual damage to electrical installation',
      description: 'Distribution board or equipment showing signs of damage/burn marks',
      action_required: 'Isolate circuit if safe, arrange immediate inspection by qualified electrician',
      severity: 'critical',
      classification: 'statutory',
      source: 'EAWR 1989',
      source_url: 'https://www.legislation.gov.uk/ukdsi/1989/635/contents/made',
      keywords: ['damage', 'burn', 'marks', 'scorch', 'smell', 'hot', 'overheating'],
    },
    {
      id: 'elec_pat_fail',
      title: 'Portable appliance failed visual inspection',
      description: 'Class 1 or Class 2 equipment showing damage or defect',
      action_required: 'Remove from service, label as failed, arrange repair or replacement',
      severity: 'medium',
      classification: 'statutory',
      source: 'EAWR 1989',
      source_url: 'https://www.legislation.gov.uk/ukdsi/1989/635/contents/made',
      keywords: ['pat', 'portable', 'appliance', 'damage', 'cable', 'plug', 'fail'],
    },
  ],
  gas: [
    {
      id: 'gas_smell',
      title: 'Gas smell detected',
      description: 'Odour of gas detected in the vicinity of gas appliances',
      action_required: 'EVACUATE IMMEDIATELY, call Gas Emergency Service on 0800 111 999',
      severity: 'critical',
      classification: 'statutory',
      source: 'GFPA 1995',
      source_url: 'https://www.legislation.gov.uk/ukpga/1995/23/contents',
      keywords: ['smell', 'gas', 'odor', 'leak', 'emergency', 'evacuate', '0800 111 999'],
    },
    {
      id: 'gas ventilation_blocked',
      title: 'Gas appliance ventilation inadequate/blocked',
      description: 'Air vents or ventilation for gas appliance obstructed',
      action_required: 'Clear obstruction immediately, ensure adequate ventilation maintained',
      severity: 'high',
      classification: 'statutory',
      source: 'GFPA 1995',
      source_url: 'https://www.legislation.gov.uk/ukpga/1995/23/contents',
      keywords: ['ventilation', 'blocked', 'obstructed', 'air', 'vent', 'inadequate'],
    },
    {
      id: 'gas_flame_yellow',
      title: 'Gas appliance flame yellow/orange instead of blue',
      description: 'Burner flame showing incorrect colour indicating combustion issue',
      action_required: 'Do not use appliance, contact Gas Safe engineer for inspection',
      severity: 'high',
      classification: 'statutory',
      source: 'GFPA 1995',
      source_url: 'https://www.legislation.gov.uk/ukpga/1995/23/contents',
      keywords: ['flame', 'yellow', 'orange', 'blue', 'combustion', 'burner'],
    },
  ],
  asbestos: [
    {
      id: 'asb_damage_suspected',
      title: 'Potential ACM damage identified',
      description: 'Material suspected of containing asbestos appears damaged or disturbed',
      action_required: 'DO NOT DISTURB, cordon off area, contact asbestos surveyor immediately',
      severity: 'critical',
      classification: 'statutory',
      source: 'CAR 2012',
      source_url: 'https://www.legislation.gov.uk/ukdsi/2012/2307/contents/made',
      keywords: ['asbestos', 'acm', 'damage', 'disturbed', 'broken', 'fibers', 'dust'],
    },
    {
      id: 'asb_register_missing',
      title: 'Asbestos register incomplete/out of date',
      description: 'Location or item not recorded in asbestos register',
      action_required: 'Update asbestos register, consider arranging survey',
      severity: 'medium',
      classification: 'statutory',
      source: 'CAR 2012',
      source_url: 'https://www.legislation.gov.uk/ukdsi/2012/2307/contents/made',
      keywords: ['register', 'missing', 'incomplete', 'update', 'location'],
    },
    {
      id: 'asb_label_missing',
      title: 'Asbestos warning label missing/damaged',
      description: 'ACM lacks appropriate warning label or label is damaged',
      action_required: 'Apply new asbestos warning label',
      severity: 'low',
      classification: 'good_practice',
      source: 'CAR 2012',
      source_url: 'https://www.legislation.gov.uk/ukdsi/2012/2307/contents/made',
      keywords: ['label', 'warning', 'missing', 'damaged', 'sign'],
    },
  ],
  water: [
    {
      id: 'water_tank_lid',
      title: 'Cold water tank lid loose/damaged',
      description: 'Cold water storage tank lid not secure or damaged',
      action_required: 'Secure or replace lid to prevent contamination',
      severity: 'medium',
      classification: 'statutory',
      source: 'Water Supply Regulations 1999',
      source_url: 'https://www.legislation.gov.uk/uksi/1999/1148/contents/made',
      keywords: ['tank', 'lid', 'cover', 'secure', 'loose', 'damaged', 'contamination'],
    },
    {
      id: 'water_tank_inspection',
      title: 'Water tank requires cleaning',
      description: 'Cold water storage tank shows signs of sediment or contamination',
      action_required: 'Arrange tank cleaning by competent person',
      severity: 'medium',
      classification: 'good_practice',
      source: 'Water Supply Regulations 1999',
      source_url: 'https://www.legislation.gov.uk/uksi/1999/1148/contents/made',
      keywords: ['tank', 'cleaning', 'sediment', 'dirty', 'contamination', 'debris'],
    },
  ],
  mechanical: [
    {
      id: 'mech_boiler_pressure',
      title: 'Boiler pressure outside normal range',
      description: 'Heating boiler pressure too high or too low',
      action_required: 'Check for leaks, repressurize if low, contact engineer if high',
      severity: 'medium',
      classification: 'good_practice',
      keywords: ['boiler', 'pressure', 'high', 'low', 'heating'],
    },
    {
      id: 'mech_ventilation_blocked',
      title: 'Mechanical ventilation intake/outlet blocked',
      description: 'Air intake or discharge obstructed',
      action_required: 'Clear obstruction, check fan operation',
      severity: 'medium',
      classification: 'good_practice',
      keywords: ['ventilation', 'blocked', 'intake', 'outlet', 'fan', 'ahu'],
    },
  ],
  lifts: [
    {
      id: 'lift_emergency_phone',
      title: 'Lift emergency phone not working',
      description: 'Emergency telephone in lift not functioning',
      action_required: 'Report to lift company immediately, display alternative contact number',
      severity: 'high',
      classification: 'statutory',
      source: 'LOLER 1998',
      source_url: 'https://www.legislation.gov.uk/ukpga/1998/23/contents',
      keywords: ['lift', 'emergency', 'phone', 'telephone', 'not working', 'loler'],
    },
    {
      id: 'lift_operation_rough',
      title: 'Lift operating roughly/noisily',
      description: 'Lift showing signs of mechanical issues during operation',
      action_required: 'Take out of service if unsafe, contact lift engineer',
      severity: 'high',
      classification: 'good_practice',
      source: 'PUWER 1998',
      source_url: 'https://www.legislation.gov.uk/ukpga/1998/37/contents',
      keywords: ['lift', 'noise', 'rough', 'vibration', 'mechanical', 'unsafe'],
    },
  ],
  playground: [
    {
      id: 'play_equipment_damage',
      title: 'Playground equipment damaged',
      description: 'Play equipment showing damage or wear',
      action_required: 'Take out of use if unsafe, arrange repair',
      severity: 'high',
      classification: 'statutory',
      source: 'PUWER 1998',
      source_url: 'https://www.legislation.gov.uk/ukpga/1998/37/contents',
      keywords: ['equipment', 'damage', 'broken', 'unsafe', 'rust', 'sharp'],
    },
    {
      id: 'play_surfacing_worn',
      title: 'Playground surfacing worn/damaged',
      description: 'Safety surfacing showing signs of wear or damage',
      action_required: 'Arrange inspection, consider impact testing',
      severity: 'medium',
      classification: 'statutory',
      source: 'EN 1177',
      source_url: 'https://www.bsi.group.com/en-standards/british-standards',
      keywords: ['surfacing', 'worn', 'damage', 'impact', 'safety', 'fall'],
    },
  ],
  accessibility: [
    {
      id: 'access_route_blocked',
      title: 'Accessible route obstructed',
      description: 'Accessible route or facility blocked or obstructed',
      action_required: 'Clear obstruction immediately, ensure route kept clear',
      severity: 'high',
      classification: 'statutory',
      source: 'Equality Act 2010',
      source_url: 'https://www.legislation.gov.uk/ukpga/2010/15/contents',
      keywords: ['access', 'accessible', 'blocked', 'obstructed', 'route', 'wheelchair'],
    },
    {
      id: 'access_lift_fault',
      title: 'Platform/stair lift not working',
      description: 'Accessibility lift out of order',
      action_required: 'Arrange repair, provide alternative access arrangements',
      severity: 'medium',
      classification: 'statutory',
      source: 'Equality Act 2010',
      source_url: 'https://www.legislation.gov.uk/ukpga/2010/15/contents',
      keywords: ['lift', 'platform', 'stair', 'not working', 'fault', 'repair'],
    },
  ],
};

export function FindingsAutoSuggest({
  domain,
  taskTitle,
  onAddFinding,
  existingFindings,
}: FindingsAutoSuggestProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(true);

  // Get findings for current domain
  const domainFindings = useMemo(() => {
    return DOMAIN_FINDINGS[domain] || [];
  }, [domain]);

  // Filter findings based on search query and existing findings
  const filteredFindings = useMemo(() => {
    let findings = domainFindings;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      findings = findings.filter((finding) => {
        return (
          finding.title.toLowerCase().includes(query) ||
          finding.description.toLowerCase().includes(query) ||
          finding.keywords.some((keyword) => keyword.includes(query))
        );
      });
    }

    // Filter out already added findings
    const existingTitles = new Set(existingFindings.map((f) => f.description));
    findings = findings.filter((finding) => !existingTitles.has(finding.description));

    return findings;
  }, [domainFindings, searchQuery, existingFindings]);

  // Show suggestions automatically when user starts typing
  useEffect(() => {
    if (searchQuery.length > 2 && filteredFindings.length > 0) {
      setShowSuggestions(true);
    }
  }, [searchQuery, filteredFindings.length]);

  const handleAddSuggestedFinding = (suggestedFinding: SuggestedFinding) => {
    onAddFinding({
      severity: suggestedFinding.severity,
      description: suggestedFinding.description,
      action_required: suggestedFinding.action_required,
      classification: suggestedFinding.classification,
      source: suggestedFinding.source,
      source_url: suggestedFinding.source_url,
    });
    setSearchQuery('');
  };

  const getSeverityColor = (severity: Finding['severity']) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getClassificationColor = (classification: Finding['classification']) => {
    switch (classification) {
      case 'statutory':
        return 'bg-purple-100 text-purple-800';
      case 'good_practice':
        return 'bg-green-100 text-green-800';
      case 'contractor_suggestion':
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (domainFindings.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Input
          placeholder="Describe the issue or search for common findings..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          className="pr-10"
        />
        <Lightbulb className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      </div>

      {/* Suggestions Panel */}
      {showSuggestions && (searchQuery.length > 0 || filteredFindings.length > 0) && (
        <Card className="border-2 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-amber-500" />
                Suggested Findings
              </h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSuggestions(false)}
              >
                Hide
              </Button>
            </div>

            {searchQuery.length > 0 && filteredFindings.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No matching findings found. Try different keywords or enter your finding manually.
                </AlertDescription>
              </Alert>
            ) : (
              <ScrollArea className="max-h-80">
                <div className="space-y-3">
                  {filteredFindings.map((finding) => (
                    <Card
                      key={finding.id}
                      className="border-l-4 border-l-primary hover:shadow-md transition-shadow"
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge className={getSeverityColor(finding.severity)}>
                                {finding.severity}
                              </Badge>
                              <Badge
                                variant="outline"
                                className={getClassificationColor(finding.classification)}
                              >
                                {finding.classification === 'statutory'
                                  ? 'Statutory'
                                  : finding.classification === 'good_practice'
                                    ? 'Good Practice'
                                    : 'Contractor Suggestion'}
                              </Badge>
                            </div>

                            <h5 className="font-medium text-sm">{finding.title}</h5>
                            <p className="text-xs text-muted-foreground">{finding.description}</p>

                            <div className="p-2 bg-muted rounded text-xs">
                              <span className="font-medium">Action required:</span> {finding.action_required}
                            </div>

                            {finding.source && (
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span>Ref: {finding.source}</span>
                                {finding.source_url && (
                                  <a
                                    href={finding.source_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-primary hover:underline"
                                  >
                                    View guidance
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                )}
                              </div>
                            )}
                          </div>

                          <Button
                            size="sm"
                            onClick={() => handleAddSuggestedFinding(finding)}
                            className="shrink-0"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quick tips */}
      {searchQuery.length === 0 && showSuggestions && (
        <Alert>
          <Lightbulb className="h-4 w-4" />
          <AlertDescription>
            Start typing to see suggested findings based on statutory requirements and common issues for{' '}
            <strong>{domain}</strong> compliance.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

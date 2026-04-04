import { BaseExtractor } from './base';
import { GenericExtractor } from './generic';
import { CultPensExtractor } from './cult-pens';
import { AmazonExtractor } from './amazon';
import { TTSGroupExtractor } from './tts-group';
import { GompelsExtractor } from './gompels';

const extractors: BaseExtractor[] = [
  new CultPensExtractor(),
  new AmazonExtractor(),
  new TTSGroupExtractor(),
  new GompelsExtractor(),
  // Generic must be last - it handles everything
  new GenericExtractor(),
];

export function findExtractor(url: string): BaseExtractor {
  return extractors.find((e) => e.canHandle(url)) || extractors[extractors.length - 1];
}

export function getExtractorByKey(key: string): BaseExtractor | undefined {
  return extractors.find((e) => e.key === key);
}

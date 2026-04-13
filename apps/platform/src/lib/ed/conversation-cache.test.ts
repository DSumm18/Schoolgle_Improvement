import { describe, it, expect } from 'vitest';
import {
  scrubAndPrepareMessage,
  formatRecentContext,
  shouldExcludeDomain,
  type CachedMessage,
} from './conversation-cache';

describe('scrubAndPrepareMessage', () => {
  it('scrubs email addresses from messages', () => {
    const result = scrubAndPrepareMessage(
      'Contact sarah.jones@school.org about the meeting',
      'user',
      'general',
    );
    expect(result.scrubbed_content).not.toContain('sarah.jones@school.org');
    expect(result.was_scrubbed).toBe(true);
    expect(result.guardian_categories).toContain('email');
  });

  it('scrubs UK phone numbers', () => {
    const result = scrubAndPrepareMessage(
      'Call the parent on 07712345678',
      'user',
      'estates',
    );
    expect(result.scrubbed_content).not.toContain('07712345678');
    expect(result.was_scrubbed).toBe(true);
  });

  it('scrubs postcodes', () => {
    const result = scrubAndPrepareMessage(
      'The family lives at BD2 4ED',
      'user',
      'general',
    );
    expect(result.scrubbed_content).not.toContain('BD2 4ED');
    expect(result.was_scrubbed).toBe(true);
  });

  it('returns clean for messages without PII', () => {
    const result = scrubAndPrepareMessage(
      'When is the next fire drill?',
      'user',
      'estates',
    );
    expect(result.scrubbed_content).toBe('When is the next fire drill?');
    expect(result.was_scrubbed).toBe(false);
    expect(result.guardian_categories).toEqual([]);
  });

  it('preserves the role and domain', () => {
    const result = scrubAndPrepareMessage('hello', 'assistant', 'hr');
    expect(result.role).toBe('assistant');
    expect(result.domain).toBe('hr');
  });
});

describe('shouldExcludeDomain', () => {
  it('excludes safeguarding when setting is true', () => {
    expect(shouldExcludeDomain('safeguarding', {
      exclude_safeguarding: true,
      exclude_hr: false,
    })).toBe(true);
  });

  it('excludes HR when setting is true', () => {
    expect(shouldExcludeDomain('hr', {
      exclude_safeguarding: false,
      exclude_hr: true,
    })).toBe(true);
  });

  it('does not exclude estates', () => {
    expect(shouldExcludeDomain('estates', {
      exclude_safeguarding: true,
      exclude_hr: true,
    })).toBe(false);
  });

  it('does not exclude when all settings are false', () => {
    expect(shouldExcludeDomain('safeguarding', {
      exclude_safeguarding: false,
      exclude_hr: false,
    })).toBe(false);
  });

  it('handles null domain', () => {
    expect(shouldExcludeDomain(null, {
      exclude_safeguarding: true,
      exclude_hr: true,
    })).toBe(false);
  });
});

describe('formatRecentContext', () => {
  it('formats cached messages into a context block', () => {
    const messages: CachedMessage[] = [
      {
        role: 'user',
        scrubbed_content: 'Is the fire alarm test up to date?',
        domain: 'estates',
        created_at: new Date().toISOString(),
      },
      {
        role: 'assistant',
        scrubbed_content: 'Your last fire alarm test was 3 April. Next one is due 10 April.',
        domain: 'estates',
        created_at: new Date().toISOString(),
      },
    ];

    const result = formatRecentContext(messages);
    expect(result).toContain('Recent conversation context');
    expect(result).toContain('fire alarm test');
    expect(result).toContain('estates');
  });

  it('returns empty string for no messages', () => {
    expect(formatRecentContext([])).toBe('');
  });

  it('truncates individual messages to 200 chars', () => {
    const longMessage: CachedMessage = {
      role: 'assistant',
      scrubbed_content: 'A'.repeat(300),
      domain: 'general',
      created_at: new Date().toISOString(),
    };
    const result = formatRecentContext([longMessage]);
    expect(result).not.toContain('A'.repeat(300));
  });
});

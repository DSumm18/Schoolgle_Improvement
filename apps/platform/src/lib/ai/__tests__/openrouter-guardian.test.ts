import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { callOpenRouterWithGuardian } from '../openrouter-guardian';

describe('openrouter-guardian', () => {
  const originalFetch = global.fetch;
  const originalKey = process.env.OPENROUTER_API_KEY;

  beforeEach(() => {
    process.env.OPENROUTER_API_KEY = 'test-key';
  });

  afterEach(() => {
    global.fetch = originalFetch;
    if (originalKey === undefined) {
      delete process.env.OPENROUTER_API_KEY;
    } else {
      process.env.OPENROUTER_API_KEY = originalKey;
    }
  });

  it('throws when OPENROUTER_API_KEY is missing', async () => {
    delete process.env.OPENROUTER_API_KEY;
    await expect(
      callOpenRouterWithGuardian({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'user', content: 'hello' }],
        orgId: 'org-1',
        callerName: 'test',
      }),
    ).rejects.toThrow('OPENROUTER_API_KEY');
  });

  it('scrubs input messages before sending to openrouter', async () => {
    let capturedBody: Record<string, unknown> | null = null;
    global.fetch = vi.fn(async (_url, init) => {
      capturedBody = JSON.parse((init?.body as string) ?? '{}');
      return new Response(
        JSON.stringify({
          choices: [{ message: { content: 'The response is clean' } }],
          usage: { total_tokens: 42 },
        }),
        { status: 200 },
      );
    }) as unknown as typeof fetch;

    const result = await callOpenRouterWithGuardian({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'user', content: 'Contact alex@school.uk about BD2 4ED' },
      ],
      orgId: 'org-1',
      callerName: 'test',
    });

    expect(capturedBody).not.toBeNull();
    const body = capturedBody as { messages: Array<{ content: string }> };
    expect(body.messages[0].content).not.toContain('alex@school.uk');
    expect(body.messages[0].content).not.toContain('BD2 4ED');
    expect(result.guardianResult.categoriesDetected).toContain('email');
    expect(result.guardianResult.categoriesDetected).toContain('postcode');
    expect(result.tokensUsed).toBe(42);
  });

  it('rehydrates token references in the response', async () => {
    global.fetch = vi.fn(async () =>
      new Response(
        JSON.stringify({
          choices: [{ message: { content: 'Contact [EMAIL_1] for info' } }],
          usage: { total_tokens: 10 },
        }),
        { status: 200 },
      ),
    ) as unknown as typeof fetch;

    const result = await callOpenRouterWithGuardian({
      model: 'google/gemini-2.5-flash',
      messages: [{ role: 'user', content: 'Email alex@school.uk please' }],
      orgId: 'org-1',
      callerName: 'test',
    });

    expect(result.content).toContain('alex@school.uk');
    expect(result.rawContent).toContain('[EMAIL_1]');
  });

  it('respects allowlist for public school name', async () => {
    let capturedBody: Record<string, unknown> | null = null;
    global.fetch = vi.fn(async (_url, init) => {
      capturedBody = JSON.parse((init?.body as string) ?? '{}');
      return new Response(
        JSON.stringify({
          choices: [{ message: { content: 'ok' } }],
          usage: { total_tokens: 1 },
        }),
        { status: 200 },
      );
    }) as unknown as typeof fetch;

    await callOpenRouterWithGuardian({
      model: 'google/gemini-2.5-flash',
      messages: [{ role: 'user', content: 'Mrs Alex Summerscales is head' }],
      orgId: 'org-1',
      callerName: 'test',
      allowlist: ['Mrs Alex Summerscales'],
    });

    const body = capturedBody as { messages: Array<{ content: string }> };
    expect(body.messages[0].content).toContain('Mrs Alex Summerscales');
  });

  it('throws informative error on openrouter failure', async () => {
    global.fetch = vi.fn(async () => new Response('Invalid API key', { status: 401 })) as unknown as typeof fetch;

    await expect(
      callOpenRouterWithGuardian({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'user', content: 'hi' }],
        orgId: 'org-1',
        callerName: 'test',
      }),
    ).rejects.toThrow(/OpenRouter error 401/);
  });
});

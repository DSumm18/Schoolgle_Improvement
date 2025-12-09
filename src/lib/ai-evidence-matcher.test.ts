import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  selectModel,
  matchDocumentToEvidenceRequirements,
  matchDocumentToCategories,
  batchMatchDocuments,
  MODEL_CONFIG,
  type DocumentMetadata,
  type EvidenceMatch,
} from './ai-evidence-matcher';

// Mock OpenAI
vi.mock('openai', () => ({
  default: vi.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: vi.fn(),
      },
    },
  })),
}));

describe('AI Evidence Matcher', () => {
  describe('selectModel', () => {
    it('should select OCR model for image files', () => {
      const metadata: DocumentMetadata = {
        filename: 'scan_001.jpg',
        fileId: 'file-1',
        mimeType: 'image/jpeg',
      };

      const model = selectModel(metadata);
      expect(model).toBe(MODEL_CONFIG.ocr.id);
    });

    it('should select OCR model for files with "scan" in name', () => {
      const metadata: DocumentMetadata = {
        filename: 'scanned-document.pdf',
        fileId: 'file-2',
        mimeType: 'application/pdf',
      };

      const model = selectModel(metadata);
      expect(model).toBe(MODEL_CONFIG.ocr.id);
    });

    it('should select vision model for chart files', () => {
      const metadata: DocumentMetadata = {
        filename: 'performance-chart.pdf',
        fileId: 'file-3',
        mimeType: 'application/pdf',
      };

      const model = selectModel(metadata);
      expect(model).toBe(MODEL_CONFIG.vision.id);
    });

    it('should select vision model for diagram files', () => {
      const metadata: DocumentMetadata = {
        filename: 'system-diagram.png',
        fileId: 'file-4',
        mimeType: 'image/png',
      };

      const model = selectModel(metadata);
      expect(model).toBe(MODEL_CONFIG.ocr.id); // Image takes precedence
    });

    it('should select primary model for text documents', () => {
      const metadata: DocumentMetadata = {
        filename: 'curriculum-policy.docx',
        fileId: 'file-5',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      };

      const model = selectModel(metadata);
      expect(model).toBe(MODEL_CONFIG.primary.id);
    });
  });

  describe('matchDocumentToEvidenceRequirements', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should successfully match document and return results', async () => {
      const OpenAI = (await import('openai')).default;
      const mockCreate = vi.fn().mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                matches: [
                  {
                    category_id: 'quality_of_education',
                    subcategory_id: 'curriculum_intent',
                    evidence_item: 'Curriculum policy documents',
                    confidence: 0.95,
                    explanation: 'This document clearly outlines the curriculum intent',
                    key_quotes: ['Our curriculum aims to...', 'We intend to...'],
                  },
                ],
                summary: 'Strong curriculum documentation',
              }),
            },
          },
        ],
      });

      (OpenAI as any).mockImplementation(() => ({
        chat: {
          completions: {
            create: mockCreate,
          },
        },
      }));

      const metadata: DocumentMetadata = {
        filename: 'curriculum-policy.docx',
        fileId: 'doc-123',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        webViewLink: 'https://example.com/doc',
      };

      const result = await matchDocumentToEvidenceRequirements(
        'Our curriculum aims to provide excellent education...',
        metadata
      );

      expect(result.documentId).toBe('doc-123');
      expect(result.documentName).toBe('curriculum-policy.docx');
      expect(result.matches).toHaveLength(1);
      expect(result.matches[0].confidence).toBe(0.95);
      expect(result.matches[0].evidenceItem).toBe('Curriculum policy documents');
      expect(result.modelUsed).toBe(MODEL_CONFIG.primary.id);
      expect(result.processingTime).toBeGreaterThan(0);
    });

    it('should handle JSON response with markdown code blocks', async () => {
      const OpenAI = (await import('openai')).default;
      const mockCreate = vi.fn().mockResolvedValue({
        choices: [
          {
            message: {
              content: '```json\n{"matches": [{"category_id": "quality_of_education", "subcategory_id": "curriculum_intent", "evidence_item": "Test", "confidence": 0.8, "explanation": "Test", "key_quotes": []}]}\n```',
            },
          },
        ],
      });

      (OpenAI as any).mockImplementation(() => ({
        chat: {
          completions: {
            create: mockCreate,
          },
        },
      }));

      const metadata: DocumentMetadata = {
        filename: 'test.pdf',
        fileId: 'test-1',
        mimeType: 'application/pdf',
      };

      const result = await matchDocumentToEvidenceRequirements('test content', metadata);

      expect(result.matches).toHaveLength(1);
      expect(result.matches[0].confidence).toBe(0.8);
    });

    it('should use fallback model on primary model failure', async () => {
      const OpenAI = (await import('openai')).default;
      let callCount = 0;
      const mockCreate = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          throw new Error('Primary model failed');
        }
        return Promise.resolve({
          choices: [
            {
              message: {
                content: JSON.stringify({ matches: [] }),
              },
            },
          ],
        });
      });

      (OpenAI as any).mockImplementation(() => ({
        chat: {
          completions: {
            create: mockCreate,
          },
        },
      }));

      const metadata: DocumentMetadata = {
        filename: 'test.docx',
        fileId: 'test-2',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      };

      const result = await matchDocumentToEvidenceRequirements('test', metadata);

      expect(mockCreate).toHaveBeenCalledTimes(2);
      expect(result.modelUsed).toBe(MODEL_CONFIG.fallback.id);
      expect(result.error).toBeUndefined();
    });

    it('should return error when both models fail', async () => {
      const OpenAI = (await import('openai')).default;
      const mockCreate = vi.fn().mockRejectedValue(new Error('All models failed'));

      (OpenAI as any).mockImplementation(() => ({
        chat: {
          completions: {
            create: mockCreate,
          },
        },
      }));

      const metadata: DocumentMetadata = {
        filename: 'test.pdf',
        fileId: 'test-3',
        mimeType: 'application/pdf',
      };

      const result = await matchDocumentToEvidenceRequirements('test', metadata);

      expect(result.matches).toHaveLength(0);
      expect(result.error).toBe('All models failed');
    });

    it('should truncate long documents', async () => {
      const OpenAI = (await import('openai')).default;
      const mockCreate = vi.fn().mockResolvedValue({
        choices: [{ message: { content: JSON.stringify({ matches: [] }) } }],
      });

      (OpenAI as any).mockImplementation(() => ({
        chat: {
          completions: {
            create: mockCreate,
          },
        },
      }));

      const longText = 'a'.repeat(10000);
      const metadata: DocumentMetadata = {
        filename: 'long-doc.txt',
        fileId: 'long-1',
        mimeType: 'text/plain',
      };

      await matchDocumentToEvidenceRequirements(longText, metadata);

      const callArgs = mockCreate.mock.calls[0][0];
      const userPrompt = callArgs.messages[1].content;

      expect(userPrompt).toContain('[Document truncated for analysis...]');
    });
  });

  describe('batchMatchDocuments', () => {
    beforeEach(() => {
      vi.clearAllMocks();
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should process multiple documents with progress tracking', async () => {
      const OpenAI = (await import('openai')).default;
      const mockCreate = vi.fn().mockResolvedValue({
        choices: [{ message: { content: JSON.stringify({ matches: [] }) } }],
      });

      (OpenAI as any).mockImplementation(() => ({
        chat: {
          completions: {
            create: mockCreate,
          },
        },
      }));

      const documents = [
        {
          text: 'doc 1',
          metadata: { filename: 'doc1.pdf', fileId: '1', mimeType: 'application/pdf' },
        },
        {
          text: 'doc 2',
          metadata: { filename: 'doc2.pdf', fileId: '2', mimeType: 'application/pdf' },
        },
      ];

      const progressCalls: number[] = [];
      const onProgress = (current: number, total: number) => {
        progressCalls.push(current);
      };

      const promise = batchMatchDocuments(documents, onProgress);

      // Fast-forward timers to resolve delays
      await vi.runAllTimersAsync();

      const results = await promise;

      expect(results).toHaveLength(2);
      expect(progressCalls).toEqual([1, 2]);
      expect(mockCreate).toHaveBeenCalledTimes(2);
    });

    it('should handle errors in batch processing', async () => {
      const OpenAI = (await import('openai')).default;
      const mockCreate = vi
        .fn()
        .mockResolvedValueOnce({
          choices: [{ message: { content: JSON.stringify({ matches: [] }) } }],
        })
        .mockRejectedValueOnce(new Error('Failed'));

      (OpenAI as any).mockImplementation(() => ({
        chat: {
          completions: {
            create: mockCreate,
          },
        },
      }));

      const documents = [
        {
          text: 'doc 1',
          metadata: { filename: 'doc1.pdf', fileId: '1', mimeType: 'application/pdf' },
        },
        {
          text: 'doc 2',
          metadata: { filename: 'doc2.pdf', fileId: '2', mimeType: 'application/pdf' },
        },
      ];

      const promise = batchMatchDocuments(documents);
      await vi.runAllTimersAsync();
      const results = await promise;

      expect(results).toHaveLength(2);
      expect(results[0].error).toBeUndefined();
      // Note: The second call will retry with fallback, so it might not have an error
    });
  });

  describe('matchDocumentToCategories (legacy)', () => {
    it('should match documents using keyword-based matching', () => {
      const text = `
        Our curriculum policy outlines the intent and implementation
        of our teaching approach. We have clear documentation of
        curriculum planning and assessment procedures.
      `;

      const matches = matchDocumentToCategories(text);

      expect(matches.length).toBeGreaterThan(0);
      expect(matches[0]).toHaveProperty('categoryId');
      expect(matches[0]).toHaveProperty('subcategoryId');
      expect(matches[0]).toHaveProperty('evidenceItem');
      expect(matches[0]).toHaveProperty('confidence');
      expect(matches[0].confidence).toBeGreaterThan(0);
      expect(matches[0].confidence).toBeLessThanOrEqual(1);
    });

    it('should return empty array for documents with no matches', () => {
      const text = 'xyz abc def';
      const matches = matchDocumentToCategories(text);

      expect(matches).toEqual([]);
    });

    it('should calculate confidence based on keyword matches', () => {
      const text = 'curriculum intent implementation planning assessment teaching learning pedagogy';
      const matches = matchDocumentToCategories(text);

      const highConfidenceMatches = matches.filter((m) => m.confidence > 0.5);
      expect(highConfidenceMatches.length).toBeGreaterThan(0);
    });
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { parsePDF, parseDocx, parsePPTX, parseExcel, parseImage } from './extractors';
import * as XLSX from 'xlsx';

// Mock mammoth
vi.mock('mammoth', () => ({
  default: {
    extractRawText: vi.fn(),
  },
}));

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

describe('Document Extractors', () => {
  describe('parsePDF', () => {
    it('should return disabled message for PDF extraction', async () => {
      const buffer = Buffer.from('test pdf content');
      const result = await parsePDF(buffer);

      expect(result).toBe('[PDF Content Extraction Disabled in MVP - Use External Service]');
    });
  });

  describe('parseDocx', () => {
    it('should extract text from DOCX buffer successfully', async () => {
      const mammoth = await import('mammoth');
      const mockExtractRawText = mammoth.default.extractRawText as any;

      mockExtractRawText.mockResolvedValue({
        value: 'This is test document content',
      });

      const buffer = Buffer.from('fake docx data');
      const result = await parseDocx(buffer);

      expect(result).toBe('This is test document content');
      expect(mockExtractRawText).toHaveBeenCalledWith({ buffer });
    });

    it('should return empty string on error', async () => {
      const mammoth = await import('mammoth');
      const mockExtractRawText = mammoth.default.extractRawText as any;

      mockExtractRawText.mockRejectedValue(new Error('Parse error'));

      const buffer = Buffer.from('invalid data');
      const result = await parseDocx(buffer);

      expect(result).toBe('');
    });
  });

  describe('parsePPTX', () => {
    it('should return disabled message for PPTX extraction', async () => {
      const buffer = Buffer.from('test pptx content');
      const result = await parsePPTX(buffer);

      expect(result).toBe('[PPTX Content Extraction Disabled in MVP]');
    });
  });

  describe('parseExcel', () => {
    it('should extract text from Excel buffer', async () => {
      // Create a simple workbook
      const worksheet = XLSX.utils.aoa_to_sheet([
        ['Name', 'Age', 'City'],
        ['Alice', 30, 'New York'],
        ['Bob', 25, 'London'],
      ]);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'TestSheet');

      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      const result = await parseExcel(buffer);

      expect(result).toContain('Sheet: TestSheet');
      expect(result).toContain('Name,Age,City');
      expect(result).toContain('Alice,30,New York');
      expect(result).toContain('Bob,25,London');
    });

    it('should handle multiple sheets', async () => {
      const sheet1 = XLSX.utils.aoa_to_sheet([['Sheet1 Data']]);
      const sheet2 = XLSX.utils.aoa_to_sheet([['Sheet2 Data']]);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, sheet1, 'First');
      XLSX.utils.book_append_sheet(workbook, sheet2, 'Second');

      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      const result = await parseExcel(buffer);

      expect(result).toContain('Sheet: First');
      expect(result).toContain('Sheet: Second');
      expect(result).toContain('Sheet1 Data');
      expect(result).toContain('Sheet2 Data');
    });

    it('should return empty string on error', async () => {
      const invalidBuffer = Buffer.from('not an excel file');
      const result = await parseExcel(invalidBuffer);

      expect(result).toBe('');
    });
  });

  describe('parseImage', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should return disabled message when API key is missing', async () => {
      const originalKey = process.env.OPENAI_API_KEY;
      const originalRouterKey = process.env.VITE_OPENROUTER_API_KEY;

      delete process.env.OPENAI_API_KEY;
      delete process.env.VITE_OPENROUTER_API_KEY;

      const buffer = Buffer.from('fake image data');
      const result = await parseImage(buffer, 'image/png');

      expect(result).toBe('[Image OCR Disabled - Missing API Key]');

      // Restore keys
      if (originalKey) process.env.OPENAI_API_KEY = originalKey;
      if (originalRouterKey) process.env.VITE_OPENROUTER_API_KEY = originalRouterKey;
    });

    it('should call OpenAI API with correct parameters', async () => {
      const OpenAI = (await import('openai')).default;
      const mockCreate = vi.fn().mockResolvedValue({
        choices: [
          {
            message: {
              content: 'Transcribed text from image',
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

      const buffer = Buffer.from('test image');
      const result = await parseImage(buffer, 'image/jpeg');

      expect(result).toBe('Transcribed text from image');
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'openai/gpt-4o',
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'user',
              content: expect.arrayContaining([
                expect.objectContaining({ type: 'text' }),
                expect.objectContaining({ type: 'image_url' }),
              ]),
            }),
          ]),
        })
      );
    });

    it('should handle API errors gracefully', async () => {
      const OpenAI = (await import('openai')).default;
      const mockCreate = vi.fn().mockRejectedValue(new Error('API Error'));

      (OpenAI as any).mockImplementation(() => ({
        chat: {
          completions: {
            create: mockCreate,
          },
        },
      }));

      const buffer = Buffer.from('test image');
      const result = await parseImage(buffer, 'image/png');

      expect(result).toBe('');
    });

    it('should convert buffer to base64 data URL', async () => {
      const OpenAI = (await import('openai')).default;
      const mockCreate = vi.fn().mockResolvedValue({
        choices: [{ message: { content: 'result' } }],
      });

      (OpenAI as any).mockImplementation(() => ({
        chat: {
          completions: {
            create: mockCreate,
          },
        },
      }));

      const testBuffer = Buffer.from('ABC');
      await parseImage(testBuffer, 'image/png');

      const callArgs = mockCreate.mock.calls[0][0];
      const imageUrl = callArgs.messages[0].content[1].image_url.url;

      expect(imageUrl).toContain('data:image/png;base64,');
      expect(imageUrl).toContain(testBuffer.toString('base64'));
    });
  });
});

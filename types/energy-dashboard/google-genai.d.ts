declare module '@google/generative-ai' {
  export const SchemaType: any;
  export class GoogleGenerativeAI {
    constructor(apiKey: string);
    getGenerativeModel(options: any): {
      generateContent: (parts: any[]) => Promise<{ response?: { text: () => string | undefined } }>;
    };
  }
}

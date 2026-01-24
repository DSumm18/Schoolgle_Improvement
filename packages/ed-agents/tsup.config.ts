import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'agents/index': 'src/agents/index.ts',
    'orchestrator/index': 'src/orchestrator/index.ts',
    'guardrails/index': 'src/guardrails/index.ts',
    'perspectives/index': 'src/perspectives/index.ts',
    'skills/index': 'src/skills/index.ts',
    'knowledge-base/index': 'src/knowledge-base/index.ts',
    'models/index': 'src/models/index.ts',
    'credit/index': 'src/credit/index.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
  external: ['@schoolgle/shared'],
});

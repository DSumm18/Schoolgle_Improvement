# Insights Content

This directory contains the full content for Schoolgle insights/articles.

## Structure

Each insight should have:
- A markdown file matching the slug from `apps/platform/src/data/insights.ts`
- Frontmatter matching the insight metadata
- Full article content in markdown

## Example

```markdown
---
slug: ai-replacing-expert-work
title: When AI Starts Replacing Expert Work (and Why Schools Should Pay Attention)
date: 2025-01-15
status: published
featured: true
---

Article content goes here...
```

## Workflow

1. Create/edit markdown file in this directory
2. Update the corresponding entry in `apps/platform/src/data/insights.ts`
3. Set status to `published` when ready to go live
4. The insights system will automatically display it









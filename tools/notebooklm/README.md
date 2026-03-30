# NotebookLM Automation for Schoolgle

This folder contains automation scripts for Google NotebookLM integration.

## Setup

Install required packages:
```bash
python -m pip install notebooklm-py[browser] yt-dlp edge-tts
```

Authenticate with NotebookLM:
```bash
python -m notebooklm login
```

## Scripts

| Script | Purpose |
|--------|---------|
| `youtube_fetcher.py` | Pull latest videos from YouTube channels |
| `notebook_manager.py` | Create/manage notebooks and sources |
| `podcast_generator.py` | Generate podcasts from NotebookLM content |

## Notebooks

| Notebook | ID | Purpose |
|----------|-----|---------|
| AI News - YouTube Sources | 9be1115e | AI/tech video research |
| Education Research | f3db1de5 | EEF early years evidence |

## Scheduled Tasks

Use Claude Code's `/schedule` command to set up automated tasks:
- Daily YouTube video fetching
- Weekly report generation
- Monthly content synthesis

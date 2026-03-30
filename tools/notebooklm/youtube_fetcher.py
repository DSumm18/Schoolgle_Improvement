"""
YouTube → NotebookLM Auto-Importer

Fetches latest videos from configured YouTube channels
and adds them to a NotebookLM notebook automatically.

Usage:
    python youtube_fetcher.py

Config: Add your channels and notebook ID below.
"""

import subprocess
import json
import time
from datetime import datetime

# ============ CONFIGURATION ============

CHANNELS = [
    {"name": "@Mark_Kashef", "url": "https://www.youtube.com/@Mark_Kashef"},
    {"name": "@MetalSole", "url": "https://www.youtube.com/@MetalSole"},
    {"name": "@Itssssss_Jack", "url": "https://www.youtube.com/@Itssssss_Jack"},
    {"name": "@Chase-H-AI", "url": "https://www.youtube.com/@Chase-H-AI"},
    {"name": "@RobShocks", "url": "https://www.youtube.com/@RobShocks"},
    {"name": "@NateBJones", "url": "https://www.youtube.com/@NateBJones"},
]

NOTEBOOK_ID = "9be1115e-ff65-41f0-9c06-5425f576c9df"  # AI News - YouTube Sources
VIDEOS_PER_CHANNEL = 10  # How many recent videos to fetch

# =========================================


def get_recent_videos(channel_url, count=10):
    """Get recent video URLs from a YouTube channel"""
    result = subprocess.run([
        "python", "-m", "yt_dlp",
        "--flat-playlist",
        "--print", "%(url)s",
        "--playlist-end", str(count),
        channel_url
    ], capture_output=True, text=True, timeout=60)

    if result.returncode != 0:
        print(f"Error fetching from {channel_url}: {result.stderr}")
        return []

    return [line.strip() for line in result.stdout.strip().split('\n') if line.strip()]


def add_source_to_notebook(video_url, notebook_id):
    """Add a video as a source to NotebookLM"""
    result = subprocess.run([
        "python", "-m", "notebooklm",
        "source", "add", video_url,
        "-n", notebook_id
    ], capture_output=True, text=True, timeout=30)

    return result.returncode == 0


def main():
    print("="*60)
    print("YOUTUBE → NOTEBOOKLM AUTO-IMPORTER")
    print("="*60)
    print(f"Notebook: {NOTEBOOK_ID}")
    print(f"Channels: {len(CHANNELS)}")
    print(f"Videos per channel: {VIDEOS_PER_CHANNEL}")
    print(f"Started: {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    print("-"*60)

    total_added = 0
    total_failed = 0

    for channel in CHANNELS:
        print(f"\nFetching {channel['name']}...")

        videos = get_recent_videos(channel['url'], VIDEOS_PER_CHANNEL)

        if not videos:
            print(f"  No videos found")
            continue

        for i, url in enumerate(videos, 1):
            video_id = url.split('watch?v=')[-1][:8]
            print(f"  [{i}/{len(videos)}] Adding {video_id}...", end=" ", flush=True)

            success = add_source_to_notebook(url, NOTEBOOK_ID)

            if success:
                print("✓")
                total_added += 1
            else:
                print("✗")
                total_failed += 1

            # Rate limiting delay
            time.sleep(2)

    print("\n" + "="*60)
    print(f"DONE! Added: {total_added} | Failed: {total_failed}")
    print("="*60)


if __name__ == "__main__":
    main()

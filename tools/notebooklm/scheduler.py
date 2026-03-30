"""
NotebookLM Scheduled Tasks Runner

This script is designed to be run by Claude Code's scheduler (/schedule command).

Available commands:
    python scheduler.py fetch-youtube    # Fetch latest videos
    python scheduler.py list-notebooks   # List all notebooks
    python scheduler.py status           # Show notebook status
"""

import sys
import subprocess

NOTEBOOK_ID = "9be1115e-ff65-41f0-9c06-5425f576c9df"


def fetch_youtube():
    """Fetch latest YouTube videos and add to notebook"""
    import os
    script_dir = os.path.dirname(__file__)
    fetcher = os.path.join(script_dir, "youtube_fetcher.py")

    result = subprocess.run([sys.executable, fetcher], capture_output=False)
    return result.returncode == 0


def list_notebooks():
    """List all NotebookLM notebooks"""
    result = subprocess.run([
        "python", "-m", "notebooklm", "list", "--json"
    ], capture_output=True, text=True)

    # Parse and display
    try:
        data = json.loads(result.stdout)
        print("\n" + "="*60)
        print("NOTEBOOKLM NOTEBOOKS")
        print("="*60)
        for nb in data.get('notebooks', []):
            print(f"  {nb['title'][:40]} ({nb['id'][:8]}...)")
        print("="*60)
        return True
    except:
        print(result.stdout)
        return result.returncode == 0


def show_status():
    """Show current notebook status"""
    result = subprocess.run([
        "python", "-m", "notebooklm",
        "-n", NOTEBOOK_ID,
        "source", "list", "--json"
    ], capture_output=True, text=True)

    try:
        data = json.loads(result.stdout)
        print(f"\nNotebook: {data['notebook_title']}")
        print(f"Total sources: {data['count']}")
        print(f"Last updated: {datetime.now().strftime('%Y-%m-%d %H:%M')}")

        # Show recent sources
        print("\nRecent sources:")
        for s in data.get('sources', [])[:5]:
            print(f"  - {s['title'][:50]}...")

        return True
    except Exception as e:
        print(f"Error: {e}")
        return False


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        print("\nUsage: python scheduler.py <command>")
        return

    command = sys.argv[1]

    if command == "fetch-youtube":
        fetch_youtube()
    elif command == "list-notebooks":
        list_notebooks()
    elif command == "status":
        show_status()
    else:
        print(f"Unknown command: {command}")
        print(__doc__)


if __name__ == "__main__":
    main()

"""
Backup all event files in storage/events to a timestamped ZIP archive and clear storage/events.

Usage:
    python backup_and_clear_events.py
    or inside Docker:
    docker exec ems_backend python backup_and_clear_events.py
"""
import os
import shutil
import zipfile
from datetime import datetime

# Paths relative to script location
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
EVENTS_DIR = os.path.join(BASE_DIR, "storage", "events")
BACKUPS_DIR = os.path.join(BASE_DIR, "storage", "backups")

def main():
    if not os.path.exists(EVENTS_DIR):
        print(f"⚠️ Events directory not found: {EVENTS_DIR}")
        return

    # Ensure backups directory exists
    os.makedirs(BACKUPS_DIR, exist_ok=True)

    # Generate timestamped zip filename
    timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    zip_filename = f"events_backup_{timestamp}.zip"
    zip_filepath = os.path.join(BACKUPS_DIR, zip_filename)

    print(f"📦 Starting backup of event files from: {EVENTS_DIR}")

    file_count = 0
    with zipfile.ZipFile(zip_filepath, 'w', zipfile.ZIP_DEFLATED) as zip_file:
        for root, dirs, files in os.walk(EVENTS_DIR):
            for file in files:
                full_path = os.path.join(root, file)
                # Compute relative arcname inside zip
                arcname = os.path.relpath(full_path, EVENTS_DIR)
                zip_file.write(full_path, arcname)
                file_count += 1

    zip_size_mb = os.path.getsize(zip_filepath) / (1024 * 1024)
    print(f"  ✓ Created ZIP archive: {zip_filepath}")
    print(f"  ✓ Total files backed up: {file_count} ({zip_size_mb:.2f} MB)")

    # Delete all items inside EVENTS_DIR
    print(f"\n🧹 Clearing all contents of: {EVENTS_DIR}")
    cleared_count = 0
    for item in os.listdir(EVENTS_DIR):
        item_path = os.path.join(EVENTS_DIR, item)
        if os.path.isfile(item_path) or os.path.islink(item_path):
            os.unlink(item_path)
            cleared_count += 1
        elif os.path.isdir(item_path):
            shutil.rmtree(item_path)
            cleared_count += 1

    print(f"  ✓ Successfully deleted {cleared_count} item(s) from storage/events.")
    print(f"\n✨ Backup complete! File saved at: {zip_filepath}")

if __name__ == "__main__":
    main()

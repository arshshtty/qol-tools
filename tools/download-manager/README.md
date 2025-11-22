# Download Manager/Sorter

Automatically watches your Downloads folder and categorizes files by type.

## Features

- 📁 **Auto-categorization** - Files sorted by type (images, documents, videos, etc.)
- 🔍 **Duplicate detection** - Finds duplicates across folders using file hashing
- 🌐 **Web UI** - See what got sorted where
- 👀 **Quick preview** - View and delete files from the web interface

## How It Works

1. Watches your Downloads folder for new files
2. Categorizes them based on file extension
3. Moves files to categorized subfolders
4. Detects duplicates using SHA-256 hashing
5. Exposes a web API for the UI

## Configuration

Edit `config.json` to customize:

```json
{
  "watchPath": "/path/to/Downloads",
  "sortedPath": "/path/to/Downloads/sorted",
  "categories": {
    "images": [".jpg", ".png", ".gif", ".svg", ".webp"],
    "documents": [".pdf", ".doc", ".docx", ".txt", ".md"],
    "videos": [".mp4", ".avi", ".mkv", ".mov"],
    "audio": [".mp3", ".wav", ".flac", ".m4a"],
    "archives": [".zip", ".tar", ".gz", ".rar", ".7z"],
    "code": [".js", ".py", ".java", ".cpp", ".go", ".rs"]
  },
  "port": 3001
}
```

## Usage

```bash
cd tools/download-manager
npm install
npm run dev
```

Then open the web UI at http://localhost:3001

## API Endpoints

- `GET /api/status` - Get current status and statistics
- `GET /api/files` - List all sorted files
- `GET /api/duplicates` - Find duplicate files
- `DELETE /api/files/:path` - Delete a file
- `GET /api/history` - Get sorting history

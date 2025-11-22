# Git Branch Cleaner

Easily identify which local git branches are fully merged and can be safely deleted.

## Features

- 🔍 **Scan all local branches** - Find branches across all repos in a directory
- ✅ **Merged detection** - See which branches are fully merged into main/master
- 📅 **Branch metadata** - Last commit date, author, and message
- 🗑️ **Bulk delete** - Select multiple branches and delete with one click
- 🔒 **Safety features** - Protect current branch and main/master
- ⚠️ **Unmerged warnings** - Clear indication of branches with unmerged changes
- 🔄 **Real-time refresh** - Update branch status on demand

## How It Works

1. Scans git repositories in configured directories
2. Lists all local branches
3. Checks merge status against main/master
4. Shows last commit info for each branch
5. Allows safe deletion of merged branches

## Configuration

Edit `config.json` to customize:

```json
{
  "gitRepos": [
    "/path/to/your/projects",
    "/path/to/specific/repo"
  ],
  "baseBranches": ["main", "master", "develop"],
  "protectedBranches": ["main", "master", "develop", "staging", "production"],
  "port": 3003,
  "autoRefresh": true,
  "refreshInterval": 30000
}
```

## Usage

```bash
cd tools/git-branch-cleaner
npm install
npm run dev
```

Then open the web UI at http://localhost:3003

## Safety Features

- **Protected branches** - Cannot delete main/master/develop by default
- **Current branch protection** - Cannot delete the branch you're currently on
- **Confirmation required** - Double-check before deleting
- **Merged-only by default** - Unmerged branches require explicit confirmation
- **Dry-run preview** - See what will be deleted before committing

## API Endpoints

- `GET /api/repos` - List all configured git repositories
- `GET /api/branches/:repo` - Get branches for a specific repo
- `GET /api/branches/:repo/merged` - Get only merged branches
- `POST /api/branches/:repo/delete` - Delete branches (with confirmation)
- `GET /api/status/:repo` - Get repository status
- `POST /api/refresh/:repo` - Force refresh branch data

## Use Cases

- **Post-PR cleanup** - Remove branches after PRs are merged
- **Project maintenance** - Clean up old feature branches
- **Repo hygiene** - Keep your local git repos tidy
- **Batch operations** - Delete multiple merged branches at once

## Tips

- Configure `gitRepos` to scan your entire projects folder
- Add custom `protectedBranches` for your workflow
- Use the filter to quickly find old branches
- Check the last commit date to identify stale branches

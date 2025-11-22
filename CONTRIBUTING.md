# Contributing to QOL Tools

Thanks for your interest in contributing! This document provides guidelines for adding new tools and improving existing ones.

## Before You Start

1. **Check ALTERNATIVES.md** - Make sure there isn't already an excellent tool that solves the problem
2. **Have a real use case** - The best tools solve your own pain points
3. **Keep it simple** - Focus on doing one thing well

## Project Philosophy

- **Practical over perfect** - Solve real problems, don't over-engineer
- **Lightweight** - No heavy frameworks unless absolutely necessary
- **Independent** - Each tool should run standalone
- **Clear UI** - Every tool needs a web interface
- **Well documented** - Include clear setup and usage instructions

## Adding a New Tool

### 1. Tool Structure

Create your tool following this structure:

```
tools/your-tool-name/
├── src/
│   ├── index.js          # Entry point
│   ├── config.js         # Configuration loading
│   └── ...               # Other modules
├── public/
│   └── index.html        # Web UI
├── package.json
├── config.default.json   # Default configuration
└── README.md             # Tool documentation
```

### 2. Package.json Requirements

```json
{
  "name": "@qol-tools/your-tool-name",
  "version": "1.0.0",
  "description": "Brief description",
  "main": "src/index.js",
  "type": "module",
  "scripts": {
    "dev": "node src/index.js",
    "start": "node src/index.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5"
  }
}
```

### 3. README Requirements

Every tool must include:

- **Clear description** of what it does
- **Features list** with emojis for scanability
- **How it works** section
- **Configuration** examples
- **Usage** instructions
- **API endpoints** documentation

### 4. Web UI Guidelines

- Use vanilla JavaScript (no build step)
- Modern, clean CSS (follow existing tool styles)
- Mobile-responsive design
- Auto-refresh for real-time data
- Clear loading and empty states
- Helpful error messages

### 5. Configuration

- Provide `config.default.json` with sensible defaults
- Document all configuration options in README
- Use relative paths that work out of the box
- Support environment variable overrides when appropriate

### 6. API Design

- Use Express with CORS enabled
- RESTful endpoints where possible
- Return JSON responses
- Include error handling
- Document all endpoints

Example:
```javascript
app.get('/api/status', (req, res) => {
  res.json({ status: 'ok', data: ... });
});

app.get('/api/items', (req, res) => {
  // Return list of items
});

app.post('/api/items', (req, res) => {
  // Create item
});

app.delete('/api/items/:id', (req, res) => {
  // Delete item
});
```

## Code Style

- Use ES modules (`import`/`export`)
- Use `async`/`await` for async operations
- Include error handling
- Use meaningful variable names
- Add comments for complex logic
- Keep functions focused and small

## Testing

Before submitting:

1. Test the tool independently
2. Test configuration options
3. Test error cases
4. Test the web UI in different browsers
5. Check that it works on different platforms (if applicable)

## Documentation

Update these files when adding a tool:

1. **Your tool's README.md** - Complete documentation
2. **Root README.md** - Add your tool to the list
3. **ALTERNATIVES.md** - Add similar tools and why yours is different
4. **Root package.json** - Add npm scripts if needed

## Pull Request Process

1. Create a feature branch
2. Implement your tool following the guidelines
3. Test thoroughly
4. Update documentation
5. Submit a PR with:
   - Clear description of what the tool does
   - Why it's needed
   - Screenshots of the UI
   - Any special setup requirements

## Ideas for New Tools

Before implementing, check if there's a great existing alternative.

Some ideas that might be worth building:

- **Session Manager** - Save and restore terminal/IDE sessions
- **Snippet Runner** - Quick access to commonly used code snippets
- **Local Database Browser** - View SQLite/other local databases
- **Quick Notes** - Lightweight note-taking with search
- **Config Differ** - Compare config files across projects

But remember: only build if you have a unique angle or specific need!

## Questions?

Open an issue for discussion before starting work on a major new tool.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

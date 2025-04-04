# Tailwindcss Configuration Issue
Issue: Tailwind CSS Not Working with Next.js (v4 Integration Problem)
Symptoms:
- @tailwind directives throw Unknown at rule in VS Code.
- npx tailwindcss init -p fails with "could not determine executable to run".
- Dev server throws: Error: you're trying to use tailwindcss directly as a PostCSS plugin...

Cause:
- Tailwind CSS v4 moved its CLI and PostCSS plugin to separate packages. 
- Using the old setup causes compatibility issues with next dev (especially with Turbopack).

Solution:

1. Install Tailwind's CLI and PostCSS plugin:
   ```bash
   npm install -D @tailwindcss/cli @tailwindcss/postcss postcss autoprefixer
   ```

2. Fix VS Code warning:
   Install the **PostCSS Language Support** in VSCode extension for IDE recognition of Tailwind’s syntax.



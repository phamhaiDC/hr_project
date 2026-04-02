<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->
Define AI behavior:

- When generating frontend code:
  - Always check auth flow
  - Always ensure axios is used correctly
  - Always include loading + error state

- When debugging:
  - Check API endpoint
  - Check token
  - Check interceptor
  - Check response status

- When building UI:
  - Separate UI and logic
  - Use reusable components

3. Add section:

## Common Bugs and Fixes

- 404 → wrong endpoint
- 401 → missing token
- infinite loading → missing state handling
- redirect loop → wrong auth guard

4. Add best practice:

- Use useEffect for browser-only logic
- Always console.log API response during debug
- Always validate API response structure

5. Output:

- Full updated CLAUDE.md
- Full updated AGENTS.md
- Clean, structured, easy to read
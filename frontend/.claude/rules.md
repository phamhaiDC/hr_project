# Frontend Runtime Rules

## API Calls

- Always use axios instance from /lib/axios
- Never call fetch directly
- Always log API errors in dev mode

## Auth

- Token must be retrieved via helper function
- Never access localStorage directly in SSR
- Always wrap in useEffect

## State

- Always define:
  - isLoading
  - error

- Never leave component without fallback UI

## Navigation

- Use router.replace instead of push for auth redirect
- Prevent redirect loop:
  - check current pathname

## UI

- Always show:
  - loading spinner
  - empty state
  - error state
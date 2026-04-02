## Runtime Rules (Critical)

### Authentication

- JWT must be attached in every request
- Never call API without token
- Token must be read only on client side (useEffect)

### Axios

- Always use centralized axios instance
- Must include interceptor:
  - attach Authorization header
  - handle 401 globally

### Frontend Behavior

- Never trigger API before token is ready
- Always handle:
  - loading state
  - error state

- Prevent infinite redirect:
  - do not redirect repeatedly
  - check current route before redirect

### Debug Rules

When error happens:

1. Check API endpoint
2. Check token existence
3. Check response status
4. Check frontend state (loading / error)

Never assume backend is correct.
Always validate API response.
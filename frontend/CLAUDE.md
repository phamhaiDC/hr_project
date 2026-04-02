Define clear frontend architecture:

- Tech stack:
  - Next.js (App Router)
  - Axios
  - TailwindCSS

- Rules:

  1. Authentication:
    - Always store JWT in localStorage
    - Always attach token via axios interceptor
    - Never call API without token

  2. API calls:
    - Must use centralized axios instance
    - Must handle loading + error
    - Must log API errors

  3. State:
    - Use React hooks properly
    - Avoid calling localStorage outside useEffect

  4. Routing:
    - Protect routes using auth guard
    - Avoid redirect loops

  5. Code quality:
    - No hardcode API URLs
    - Use service layer
    - Reusable components
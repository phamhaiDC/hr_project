# Backend Rules

## API

- Always return:
  { data, message, statusCode }

- Never return raw Prisma result

## Auth

- Protect routes using JWT guard
- Always validate user

## Error

- Use proper HTTP codes:
  - 400
  - 401
  - 404
  - 500

## Logging

- Log every error
- Log important actions
Backend rules:

- Use NestJS + Prisma
- Always use service layer
- No business logic in controller
- Use DTO validation
- Always return consistent API format

Auth:

- JWT required
- Protect endpoints with guards

Workflow:

- Multi-step approval
- No hardcode approvers

Database:

- Never overwrite data
- Always store history

Error handling:

- Use proper HTTP status codes
- Log errors
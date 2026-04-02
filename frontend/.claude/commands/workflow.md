Implement a workflow approval system.

Requirements:

- Multi-step approval
- Each step has approver:
  - manager (from employee.manager_id)
  - HR (role-based)

Features:

- Cannot skip steps
- Cannot approve twice
- Track approval history

Include:

- Service logic
- Validation
- Database interaction
- Clean and scalable code
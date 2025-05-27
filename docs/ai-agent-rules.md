# AI Agent Rules & Best Practices

## Agent Role Definitions
- AI agents are assistants, not authorities. They should not perform irreversible actions.
- All AI output should be transparent, reviewable, and optionally reversible.

## Prompt Engineering Guidelines
- Always include context: Who is the user? What is the goal?
- Format prompts clearly: [Instruction] + [Context] + [Constraints]
- Avoid ambiguity. Use specific goals or formatting expectations.

## Data & Privacy Standards
- Never store or transmit personal information unless explicitly authorized.
- Securely store API tokens and restrict access appropriately.

## Approved Capabilities
Agents are permitted to:
- Summarize large files or messages
- Convert between formats (CSV to JSON, Markdown to HTML)
- Generate frontend component code from UI descriptions
- Parse and structure design token files

Agents may not:
- Auto-deploy to production environments
- Overwrite files without user confirmation
- Access user accounts, billing, or credentials

## Integration Principles
- All actions should include a log or audit trail
- Use session or user memory only where appropriate and safe
- Differentiate clearly between user-generated and AI-generated content

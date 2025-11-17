# be-asoka
be-asoka

# asoka
asoka fe

**READ THIS CAREFULLY
STRUCTURE BRANCH, this repo using Feature Branch Rules**

main
develop
feature/*



**1. Naming Convention**
Use a consistent format so everyone knows what the branch is for.
Common formats:
feature/<short-description>

Examples:
feature/login-page

**2. When to Create a Feature Branch**

Create a feature branch when you start working on:
A new feature
A bug fix (sometimes use fix/)
An improvement or refactor
A large experiment or POC
Base it from develop or main, depending on your workflow:
Git Flow: branch from develop
Trunk-based: branch from main

**3. What Goes into a Feature Branch**
Only include work related to one feature.
Avoid:
❌ Mixing multiple tasks
❌ Adding unrelated refactors
❌ Committing secret keys or environment configs

Keep it clean.

**4. Commit Rules**
Follow readable commit messages:

Format:
type: short summary
(optional) description


Types:
feat: new feature
fix: bug fix
refactor: code restructure
docs: documentation
chore: dev tasks

Examples:
feat: add login UI
fix: handle null pointer in payment service

**5. Keep Your Branch Updated**
Before sending a pull request:

git fetch
git pull origin develop   # or main
git merge develop          # or main


This reduces merge conflicts.

**6. Pull Request Rules**
When opening a PR:
Use clear PR titles
Include description, screenshots, or tests
Link to issue or ticket
Ask for reviewer(s) (if any)
Ensure CI/CD checks pass (if any)

PR Example:
Title: Add login page UI and authentication flow
Description:
- Created login form
- Added validation
- Integrated with backend API

**7. When to Delete a Feature Branch**
After PR is merged and deployed or confirmed stable.

This keeps repo clean.
# Feature Request & Update Checklist

> **How to use this document:**
>
> This checklist is for stepwise feature delivery and tracking. **All coding, architecture, naming, and workflow standards are defined in `.github/copilot-instructions.md`.**
>
> Whenever you are unsure about implementation, style, or project conventions, consult `.github/copilot-instructions.md`.


---

## Feature Request Summary

_Describe the feature or update here. Update this section as new information or clarifications are provided._

---

## Live Checklist

- [ ] **1. Understand User Intent**
  - [ ] Clarify requirements and ask questions if needed.
  - [ ] Determine if this is a new feature, update, or bugfix.
  - [ ] Check for overlap with existing features.
  - [ ] Update the summary above with the latest details.
- [ ] **2. Develop a Plan**
  - [ ] Review the existing codebase and documentation for both content and style consistency before planning changes. Refer to `.github/copilot-instructions.md` for all standards and conventions.
  - [ ] Outline the approach and steps to implement the request.
  - [ ] Identify which files or modules will be affected. If you realize that a large number of changes are required, pause and think of a new approach or provide feedback to the user. Then work with the user to break down the problem into smaller more manageable chunks.
- [ ] **3. Implement Stepwise**
  - [ ] Make changes in small, logical increments.
  - [ ] After each step, verify correctness and update the checklist.
  - [ ] Avoid introducing new patterns, APIs or structures that don't match the patterns established within the code base.
- [ ] **4. Test and Validate**
  - [ ] Prompt the user manually test the newly implemented feature
  - [ ] Check for errors and ensure responsiveness.
- [ ] **5. Final Review**
  - [ ] Ensure all steps and standards in `.github/copilot-instructions.md` are followed.
  - [ ] Update documentation appropriately.
  - [ ] Confirm with the user that the request is fully resolved.
  - [ ] Git commit with appropriate commit message.

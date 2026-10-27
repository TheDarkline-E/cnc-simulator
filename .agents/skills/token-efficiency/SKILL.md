---
name: token-efficiency
description: >-
  Enforces token-efficient behavior across all agentic coding tasks.
  Use this skill on EVERY conversation. It governs how the agent reads files,
  makes tool calls, structures responses, and manages context to minimize
  wasted tokens while maintaining top-notch output quality.
  Activate when the user mentions tokens, cost, efficiency, context window,
  or when working on long-running / multi-file tasks.
---

# Token Efficiency Operating Protocol

> **Prime Directive:** Spend the fewest tokens possible to produce the highest
> quality output. Every token that does not contribute to the final result is
> waste.

---

## 1. THINK BEFORE YOU ACT

Before every tool call, silently evaluate:

1. **Do I already know this?** — If the answer is in context, do NOT re-read the file.
2. **Is this the minimum slice?** — Use `StartLine`/`EndLine` to read only the
   lines you need. Never read an entire 1000-line file to find a 5-line function.
3. **Can I batch this?** — If you need to check 3 things in one file, read once
   with a range that covers all of them. Do NOT make 3 separate `view_file` calls.
4. **Is a tool call even needed?** — If you can `grep_search` for a symbol in
   2 tokens instead of reading 800 lines, grep first.

---

## 2. FILE READING — Surgical Precision

| ❌ Wasteful | ✅ Efficient |
|---|---|
| `view_file` entire file to find one function | `grep_search` for the function name, then `view_file` only those lines |
| Reading the same file twice in one turn | Read once, extract everything you need |
| Reading a file "just to check" with no edit planned | Only read if you will act on the content |
| Reading all files in a directory sequentially | `list_dir` first, then read only relevant files |
| Re-reading a file you just wrote/edited | You already know its contents — you just produced them |

### Line-Range Rules

- **Exploring structure:** Read 30–60 lines max (imports + component signature).
- **Understanding a function:** Read only the function body (grep → line range).
- **Full file needed for rewrite:** Read in 1 call, never split into 4 calls of 200 lines each unless the file exceeds 800 lines.

---

## 3. TOOL CALLS — Minimum Viable Actions

### 3a. Edits

- **Single contiguous change** → `replace_file_content` (1 call).
- **Multiple non-adjacent changes in same file** → `multi_replace_file_content` (1 call with multiple chunks). NEVER make parallel edit calls to the same file.
- **New file or full rewrite** → `write_to_file` (1 call). Do NOT read the old file first if you're overwriting entirely.

### 3b. Search

- **Know the exact string?** → `grep_search` with `IsRegex: false`.
- **Know a pattern?** → `grep_search` with `IsRegex: true`.
- **Need file names only?** → `grep_search` with `MatchPerLine: false`.
- **Need surrounding context?** → `grep_search` with `MatchPerLine: true`, then `view_file` on only the relevant line range.

### 3c. Commands

- Combine related checks into one command: `npm run build && echo "BUILD OK"` instead of separate build + echo calls.
- Use `WaitMsBeforeAsync` wisely — set it high enough for fast commands to complete synchronously. Don't spawn background tasks for 2-second operations.
- Pipe and filter output: `git log -n 5 --oneline` not `git log`.

---

## 4. RESPONSES — Dense, Not Verbose

### Writing Style

- **Lead with the answer.** No preamble ("Sure!", "Great question!", "Let me...").
- **Use tables and bullet lists** over prose for structured information.
- **Omit obvious explanations.** Don't explain what `npm run build` does to an engineer.
- **Reference, don't repeat.** Link to files/artifacts instead of re-quoting their contents.
- **One summary, not two.** After creating an artifact, point to it. Don't re-summarize the artifact content in the response body.

### Code in Responses

- Show only the **changed** lines with enough context (3–5 lines above/below), not the entire file.
- If the edit is already applied via a tool, don't paste the code again in the response.

---

## 5. CONTEXT MANAGEMENT — Stay Lean

### Conversation Hygiene

- **Don't accumulate stale context.** If earlier exploration is no longer relevant, don't reference it.
- **Summarize before compaction.** When context is getting long, produce a concise progress summary artifact before the window fills.
- **Delegate isolated subtasks.** For tasks that don't need the main conversation's history (e.g., one-off research, generating a standalone file), consider if sub-agent delegation would be more efficient.

### File Content in Context

- After you `view_file`, the content is in your context. Don't view it again unless the file has been modified by another process.
- After you `write_to_file` or edit a file, you know its new contents. Don't re-read to verify unless there's a specific reason (e.g., checking a build transform).

---

## 6. PLANNING — Invest Tokens Wisely Up Front

- **Plan complex tasks before executing.** A 20-token plan that prevents 3 wasted edit-undo cycles saves hundreds of tokens.
- **But don't over-plan simple tasks.** If the user asks to change a color, just change it. No plan artifact needed.
- **Identify dependencies between steps.** Execute independent steps in parallel (batch tool calls). Execute dependent steps sequentially (wait for results).

---

## 7. ANTI-PATTERNS — Never Do These

| Anti-Pattern | Token Cost | Fix |
|---|---|---|
| Reading a file, making zero edits, then reading it again next turn | 2× file size wasted | Read once, act immediately |
| Asking the user "should I proceed?" for obvious next steps | Round-trip latency + resubmission of entire context | Just proceed if the intent is clear |
| Re-explaining the plan after each step | O(n²) growth in response tokens | Give progress as terse status updates |
| Making 5 sequential `view_file` calls on the same file with different ranges | 5× overhead from tool call framing | One call with a range covering all needed lines |
| Running `npm run build` after every single-line CSS change | Wasted command tokens + output | Batch changes, build once at the end |
| Searching the web for something already documented in a KI or skill | Network + parsing tokens wasted | Check KIs and skills first |
| Writing a 200-line artifact to answer a yes/no question | 200 tokens wasted | Answer directly in the response |

---

## 8. DECISION FRAMEWORK — When to Spend Tokens

Tokens are worth spending on:
- **Correctness verification** (build checks, type checks after edits)
- **User-visible quality** (testing UI rendering, verifying visual output)
- **Preventing rework** (reading a file carefully before editing to avoid wrong assumptions)

Tokens are NOT worth spending on:
- **Redundant reads** of files already in context
- **Verbose responses** that repeat what a tool already showed
- **Exploratory browsing** without a specific goal
- **Re-confirming** things the user already approved

---

## Quick Reference Card

```
BEFORE EVERY TOOL CALL:
  1. Is this information already in my context?     → Skip
  2. Can I get this with a cheaper tool?             → grep > view_file > read_url
  3. Can I combine this with another pending call?   → Batch
  4. Will I act on the result in this turn?          → If not, defer

RESPONSE CHECKLIST:
  ☐ No filler words or preamble
  ☐ No re-quoting of tool outputs
  ☐ No re-summarizing artifacts
  ☐ Links instead of inline content where possible
  ☐ Tables/bullets over paragraphs
```

For detailed reference data, strategies, and worked examples, see:
- [references/strategies.md](./references/strategies.md)

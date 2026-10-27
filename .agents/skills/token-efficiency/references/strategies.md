# Comprehensive Token Optimization Strategies & Engineering Guidelines

This reference guide details industry-proven strategies, mathematical token trade-offs, and concrete workflows for maximizing output quality while minimizing token consumption in agentic coding systems.

---

## 1. The Economics of Agentic Context Windows

In modern LLM agent architectures (Claude 3.5/3.7, GPT-4o, Gemini 1.5/2.0), token consumption scales quadratically across a multi-turn conversation if context is not managed diligently:

$$\text{Total Tokens Billed} = \sum_{t=1}^{N} (\text{Prompt}_{t} + \text{Completion}_{t})$$

Where $\text{Prompt}_{t}$ accumulates all prior conversation history, system instructions, and tool outputs:

$$\text{Prompt}_{t} = \text{System} + \sum_{i=1}^{t-1} (\text{User}_i + \text{Assistant}_i + \text{ToolResult}_i)$$

### Cost Impact Table
| Action | Immediate Cost | Compounded Turn Cost (across next 10 turns) | Alternative |
|---|---|---|---|
| Reading an entire 1,200-line file (~6,000 tokens) | 6,000 tokens | **60,000 tokens** | `grep_search` + slice read of 40 lines (200 tokens) |
| Running `npm test` with verbose reporter (4,000 tokens) | 4,000 tokens | **40,000 tokens** | Targeted test command `npm test -- --reporter=dot` (150 tokens) |
| Rewriting an entire 500-line file instead of targeted diff | 2,500 output tokens | **25,000 tokens** | `replace_file_content` targeting 10 lines (50 tokens) |
| Preamble & echoed code in response (300 tokens) | 300 output tokens | **3,000 tokens** | Direct 2-line answer + link (30 tokens) |

---

## 2. Codebase Navigation: Grep-First Protocol

The single largest source of token waste in agentic coding is reading files to find information that is already indexable.

### The 3-Tier Exploration Hierarchy
```
Tier 1: Symbol Search (CHEAPEST)
  └─ grep_search (MatchPerLine: false) -> reveals exact matching files (~10-20 tokens)
Tier 2: Location Pinpointing
  └─ grep_search (MatchPerLine: true, Includes: targeted file) -> reveals line numbers (~30-50 tokens)
Tier 3: Targeted Line Slice (HIGHEST DENSITY)
  └─ view_file (StartLine, EndLine with +/- 5 padding lines) -> reads ONLY relevant code (~100-300 tokens)
```

### ❌ Anti-Pattern: Exploratory File Dumping
```
Turn 1: view_file(SimulationEngine.js) -> 800 lines read (4,200 tokens)
Turn 2: view_file(CenterViewportCard.jsx) -> 650 lines read (3,500 tokens)
Turn 3: view_file(RightTelemetryCard.jsx) -> 500 lines read (2,800 tokens)
Result: Context window bloated by 10,500 tokens per subsequent turn!
```

### ✅ Best Practice: Surgical Targeting
```
Turn 1: grep_search("handleEmergencyStop", SearchPath: "src") 
        -> 1 hit at SimulationEngine.js:142 (35 tokens)
Turn 2: view_file(SimulationEngine.js, StartLine: 135, EndLine: 155) 
        -> 21 lines read (120 tokens)
Result: 155 tokens total. 98.5% token reduction with higher accuracy!
```

---

## 3. Editing Strategy Matrix

| Scenario | Recommended Tool | Why It Saves Tokens |
|---|---|---|
| Modifying a single function or block | `replace_file_content` | Produces only the target chunk in tool args. Leaves rest of file untouched. |
| Modifying 2–5 isolated blocks in one file | `multi_replace_file_content` | Batches all modifications into a single turn and single tool call. Eliminates multi-turn re-prompting. |
| Generating an entirely new component or script | `write_to_file` (Overwrite: false) | Generates clean new code in 1 step without reading surrounding directories first. |
| Overhauling > 70% of a small file (< 100 lines) | `write_to_file` (Overwrite: true) | More token-efficient than writing multiple large replacement chunks. |

### Edit Rule of Thumb
- Never verify an edit by re-reading the whole file with `view_file`. You already have the code in context.
- Verify through automated checks: TypeScript compile check, lint, or targeted test execution.

---

## 4. Maximizing KV Cache & Prefix Hits

Modern LLMs (Anthropic Claude, Gemini, OpenAI) use KV caching for static prompt prefixes. Changing earlier parts of the prompt invalidates the KV cache, driving latency and token costs up.

### Key Practices for Cache Friendliness
1. **Stable System & Skill Instructions**: Keep core rules structured, static, and top-level.
2. **Order of Operations**:
   - Perform read/investigative steps in logical sequence.
   - Batch edits in single actions rather than interleaving edit $\rightarrow$ read $\rightarrow$ edit $\rightarrow$ read.
3. **Avoid Spurious Retries**:
   - Double-check line numbers and exact whitespace before submitting `replace_file_content` to prevent match failures and error turns.

---

## 5. Response Token Density & Communication Protocol

Tokens emitted by the model during generation (completion tokens) are typically 3× to 5× more expensive and computationally heavy than prompt tokens.

### Principles of Output Compression:
1. **Zero-Preamble Rule**:
   - ❌ "Sure! I'd be happy to help with that. Let's look into the motion planner..."
   - ✅ "Identified issue in `MotionPlanner.js:142`. Applying fix:"
2. **Don't Echo Tool Outputs**:
   - If a build succeeded, state `Build passed (0 errors)` instead of pasting 50 lines of Vite output.
   - If a file was edited, provide the github-style file link `[SimulationEngine.js](file:///path/to/file#L142-L160)` rather than re-printing the entire component.
3. **Structured Tables over Paragraphs**:
   - Tables convey multidimensional technical data in 40% fewer tokens than explanatory English sentences.
4. **Artifact Management**:
   - When writing a detailed artifact (`.md`), write the artifact, then provide a 1–2 sentence pointer with file link. Do not duplicate artifact contents into the chat stream.

---

## 6. Real-World Engineering Workflows

### Workflow A: Adding a Feature to a React / Three.js Component
1. `grep_search` to find relevant component entry point.
2. `view_file` specifying `StartLine` and `EndLine` for the specific hook / render branch.
3. `replace_file_content` with exact modification.
4. Run validation command (e.g. `npm run build` or dev check) synchronously with reasonable timeout.
5. Report result with link to updated file and test outcome.

### Workflow B: Debugging a Runtime or Build Error
1. Extract exact error message and symbol from logs.
2. `grep_search` for the exact error symbol or function.
3. Read the relevant 20–40 line slice.
4. Fix using `replace_file_content`.
5. Re-run targeted build check.

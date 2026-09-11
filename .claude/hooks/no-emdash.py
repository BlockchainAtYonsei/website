#!/usr/bin/env python3
"""PreToolUse guard: block Write/Edit/MultiEdit that ADD an em dash (U+2014).

Site copy in this repo never uses em dashes (see the team's no-em-dash rule).
Only the newly-added content is inspected (new_string / content /
edits[].new_string), so editing a file that already contains an em dash is
fine as long as the edit itself introduces none.
"""
import json
import sys

EM_DASH = "—"

try:
    payload = json.load(sys.stdin)
except Exception:
    sys.exit(0)  # never break a tool call over a parse hiccup

ti = payload.get("tool_input") or {}
parts = []
for key in ("new_string", "content"):
    val = ti.get(key)
    if isinstance(val, str):
        parts.append(val)
for edit in ti.get("edits") or []:
    if isinstance(edit, dict) and isinstance(edit.get("new_string"), str):
        parts.append(edit["new_string"])

if EM_DASH in "".join(parts):
    print(json.dumps({
        "hookSpecificOutput": {
            "hookEventName": "PreToolUse",
            "permissionDecision": "deny",
            "permissionDecisionReason": (
                "Em dash (—) is banned in this repo. "
                "Use ·, a colon, or a period instead."
            ),
        }
    }))

sys.exit(0)

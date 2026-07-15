"""Prompt registry for the MICRO harness.

RULES:
- SYSTEM_V1 and build_user_v1 MUST be byte-faithful ports of the production
  prompt (copy from the production source file, preserve whitespace and
  trailing newlines). Name the source file in a comment.
- If production changes, re-port here FIRST and note it in NOTEBOOK.md.
- Variants are experiments, keyed by the names used in QUESTIONS.md batteries.
  One variant per hypothesis; change one thing at a time.
"""

# Ported from: {{PRODUCTION_SOURCE_FILE}}
SYSTEM_V1 = """{{PASTE THE PRODUCTION SYSTEM PROMPT HERE, BYTE-FAITHFUL}}
"""


def build_user_v1(case):
    """Ported from: {{PRODUCTION_USER_PROMPT_BUILDER}}.

    Receives one case dict from fixtures/cases.jsonl and must reproduce the
    production user prompt byte for byte from the case fields.
    """
    raise NotImplementedError("port the production user prompt builder")


SYSTEM_VARIANTS = {
    "v1": SYSTEM_V1,
}

USER_VARIANTS = {
    "v1": build_user_v1,
}

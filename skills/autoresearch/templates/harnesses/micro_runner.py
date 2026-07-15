#!/usr/bin/env python3
"""MICRO-tier battery runner: labeled cases x prompt variants x reps vs an LLM.

Stdlib only. Two seams are meant to be edited per domain, both marked
"EDIT SEAM" below:
  1. parse_verdict()  - how a raw completion becomes a scoreable answer
  2. summarize()      - domain metrics beyond accuracy and unanimity
The prompt registry lives in the sibling prompts.py (SYSTEM_VARIANTS,
USER_VARIANTS). Keep v1 byte-faithful to production; see README caveats.

Case schema (fixtures/cases.jsonl, one JSON object per line, # comments ok):
  {"id": "case-01", "tags": ["dataset-a"], "expected": <answer>,
   "accepted": [<answer>, ...],   # optional, defaults to [expected]
   ...any fields your USER_VARIANTS builders need...}
Answers must be hashable (int or string) so majority voting works.

Examples:
  python3 harnesses/micro_runner.py --dry-run
  python3 harnesses/micro_runner.py --system v1 --user v1 --reps 3 \\
      --out campaigns/q1-control/control.json
  python3 harnesses/micro_runner.py --system v2 --tags dataset-a
"""

import argparse
import json
import os
import statistics
import subprocess
import sys
import time
import urllib.error
import urllib.request

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from prompts import SYSTEM_VARIANTS, USER_VARIANTS  # noqa: E402

# EDIT SEAM (transport): OpenAI chat completions by default. If production
# uses another provider, replace call_llm() and this URL, and keep request
# config (model snapshot, temperature, response format) as close to
# production as possible. Record every divergence in the README caveats.
OPENAI_URL = "https://api.openai.com/v1/chat/completions"
API_KEY_ENV = "OPENAI_API_KEY"
DEFAULT_MODEL = os.environ.get("AUTORESEARCH_MODEL", "gpt-5.4")
HERE = os.path.dirname(os.path.abspath(__file__))
DEFAULT_CASES = os.path.join(HERE, "..", "fixtures", "cases.jsonl")


def _post_via_curl(body_bytes, api_key, timeout):
    """Transport fallback for Python 3.13+ strict X509 environments.

    On dev machines behind a TLS-inspecting corporate proxy, Python's default
    VERIFY_X509_STRICT can reject the proxy CA (missing keyUsage extension)
    and every stdlib HTTPS call fails. curl verifies the same chain against
    the same trust bundle with its standard (non-strict) rules and succeeds
    with NO insecure flags, so verification stays fully enabled here.
    """
    command = [
        "curl", "-sS", "--fail-with-body", "--max-time", str(timeout),
        "-H", "Content-Type: application/json",
        "-H", f"Authorization: Bearer {api_key}",
        "--data-binary", "@-", OPENAI_URL,
    ]
    proc = subprocess.run(
        command, input=body_bytes, capture_output=True, timeout=timeout + 10
    )
    if proc.returncode != 0:
        detail = proc.stderr.decode("utf-8", errors="replace")[:300]
        raise urllib.error.URLError(f"curl exit {proc.returncode}: {detail}")
    return json.loads(proc.stdout)


def load_cases(path, tags):
    cases = []
    with open(path, encoding="utf-8") as handle:
        for line in handle:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            case = json.loads(line)
            if tags and not (set(tags) & set(case.get("tags", []))):
                continue
            cases.append(case)
    return cases


def call_llm(system_prompt, user_prompt, model, temperature, api_key):
    body = {
        "model": model,
        "temperature": temperature,
        "response_format": {"type": "json_object"},
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
    }
    body_bytes = json.dumps(body).encode("utf-8")
    request = urllib.request.Request(
        OPENAI_URL,
        data=body_bytes,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
    )
    started = time.monotonic()
    try:
        with urllib.request.urlopen(request, timeout=120) as response:
            payload = json.load(response)
    except urllib.error.URLError as error:
        if "CERTIFICATE_VERIFY_FAILED" not in str(error):
            raise
        payload = _post_via_curl(body_bytes, api_key, 120)
    latency_ms = int((time.monotonic() - started) * 1000)
    content = payload["choices"][0]["message"]["content"]
    usage = payload.get("usage", {})
    return content, usage, latency_ms


def parse_verdict(content, case):
    """EDIT SEAM 1: convert a raw completion into a scoreable answer.

    Default contract: the prompt asks for JSON like
    {"answer": <value>, "rationale": "..."} and this returns
    {"status", "answer", "rationale"}. Port your production response parsing
    here so scoring matches production semantics. Example: the SignalIQ judge
    parsed {"selectedCandidate": int, "rationale": str}, coerced digit
    strings to int, and range-checked the index against
    len(case["candidates"]) with statuses unparseable/empty/out-of-range.
    """
    try:
        data = json.loads(content)
    except json.JSONDecodeError:
        return {"status": "unparseable", "answer": None, "rationale": None}
    answer = data.get("answer")
    if isinstance(answer, str) and answer.strip().lstrip("-").isdigit():
        answer = int(answer.strip())
    if answer is None:
        return {"status": "empty", "answer": None, "rationale": data.get("rationale")}
    return {"status": "ok", "answer": answer, "rationale": data.get("rationale")}


def run_case(case, system_prompt, build_user, args, api_key):
    user_prompt = build_user(case)
    reps = []
    for _ in range(args.reps):
        try:
            content, usage, latency_ms = call_llm(
                system_prompt, user_prompt, args.model, args.temperature, api_key
            )
        except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError) as error:
            reps.append({"status": "api-error", "error": str(error)})
            time.sleep(2)
            continue
        verdict = parse_verdict(content, case)
        verdict["raw"] = content
        verdict["usage"] = usage
        verdict["latency_ms"] = latency_ms
        reps.append(verdict)
        time.sleep(args.sleep)
    answers = [r["answer"] for r in reps if r.get("status") == "ok"]
    majority = statistics.mode(answers) if answers else None
    # Cases scored on an any-member basis may accept several answers;
    # "accepted" defaults to [expected].
    accepted = case.get("accepted", [case["expected"]])
    return {
        "case_id": case["id"],
        "tags": case.get("tags", []),
        "expected": case["expected"],
        "accepted": accepted,
        "majority": majority,
        "correct": majority in accepted if answers else False,
        "unanimous": len(set(answers)) == 1 if answers else False,
        "reps": reps,
    }


def summarize(results):
    """EDIT SEAM 2: add domain metrics next to the generic ones.

    Example: the SignalIQ judge added none_recall (accuracy on the subset
    where expected == 0) because wrong nones were its dominant failure mode.
    """
    scored = [r for r in results if r["majority"] is not None]
    total = len(results)
    correct = sum(1 for r in results if r["correct"])
    flips = [r["case_id"] for r in scored if not r["unanimous"]]
    by_tag = {}
    for result in results:
        for tag in result["tags"]:
            bucket = by_tag.setdefault(tag, [0, 0])
            bucket[1] += 1
            bucket[0] += 1 if result["correct"] else 0
    return {
        "cases": total,
        "answered": len(scored),
        "accuracy": round(correct / total, 3) if total else None,
        "non_unanimous_cases": flips,
        "by_tag": {tag: f"{hit}/{n}" for tag, (hit, n) in sorted(by_tag.items())},
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--cases", default=DEFAULT_CASES)
    parser.add_argument("--system", default="v1", choices=sorted(SYSTEM_VARIANTS))
    parser.add_argument("--user", default="v1", choices=sorted(USER_VARIANTS))
    parser.add_argument("--reps", type=int, default=3)
    parser.add_argument("--model", default=DEFAULT_MODEL)
    parser.add_argument("--temperature", type=float, default=0.0)
    parser.add_argument("--tags", nargs="*", default=None, help="only cases with any of these tags")
    parser.add_argument("--sleep", type=float, default=0.5, help="seconds between API calls")
    parser.add_argument("--max-calls", type=int, default=60, help="hard budget guard")
    parser.add_argument("--out", default=None, help="write full JSON results here")
    parser.add_argument("--dry-run", action="store_true", help="print prompts, no API calls")
    args = parser.parse_args()

    cases = load_cases(args.cases, args.tags)
    if not cases:
        sys.exit("no cases matched")
    system_prompt = SYSTEM_VARIANTS[args.system]
    build_user = USER_VARIANTS[args.user]

    if args.dry_run:
        print(f"# battery system={args.system} user={args.user} cases={len(cases)}")
        print("=== SYSTEM ===")
        print(system_prompt)
        for case in cases:
            print(f"=== USER ({case['id']}, expected={case['expected']}) ===")
            print(build_user(case))
        return

    planned = len(cases) * args.reps
    if planned > args.max_calls:
        sys.exit(f"battery would make {planned} calls, over --max-calls {args.max_calls}; narrow --tags or lower --reps")
    api_key = os.environ.get(API_KEY_ENV)
    if not api_key:
        sys.exit(f"{API_KEY_ENV} not set")

    results = [run_case(case, system_prompt, build_user, args, api_key) for case in cases]
    summary = summarize(results)
    battery = {
        "battery": {"system": args.system, "user": args.user, "model": args.model,
                    "temperature": args.temperature, "reps": args.reps, "tags": args.tags,
                    "ran_at": time.strftime("%Y-%m-%dT%H:%M:%S%z")},
        "summary": summary,
        "results": results,
    }
    print(json.dumps({"battery": battery["battery"], "summary": summary}, indent=2))
    if args.out:
        os.makedirs(os.path.dirname(args.out) or ".", exist_ok=True)
        with open(args.out, "w", encoding="utf-8") as handle:
            json.dump(battery, handle, indent=2)
        print(f"full results -> {args.out}", file=sys.stderr)


if __name__ == "__main__":
    main()

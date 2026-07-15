# Open research questions

Status values: OPEN | IN_PROGRESS | RESOLVED | BLOCKED. One question per
experiment iteration. Cheapest viable tier is listed first. When resolving,
link the notebook entry and the dated log.

## Q0. Are the fixtures realistic? [OPEN] (MINE)

Pull 10+ real inputs from {{REAL_INPUT_SOURCE: e.g. the trace table, real
traffic logs}} and compare structure, length, and content style against
`fixtures/cases.jsonl`. Fix fixtures where they diverge. Verify the harness
prompt is byte-identical to production. Gate: no MICRO conclusion is trusted
until this is done once.

## Q1. {{What actually fails today?}} [OPEN] (MINE)

{{Before testing any fix, measure the baseline failure rate and dominant
failure modes on real data, with a falsifiable numeric prediction. Real
traffic often refutes the premise a planned fix rests on; measure first.}}

## Q2. {{Does variant X beat v1 on metric M?}} [OPEN] (MICRO)

{{One hypothesis per question. Name the variant, the metric, the case filter
(tags), and what number counts as success. Always run against the v1/v1
control in the same iteration.}}

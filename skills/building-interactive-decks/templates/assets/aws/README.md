# AWS architecture icons

Drop the SVG icons this deck uses into this folder, named lowercase with no spaces
(e.g. `fargate.svg`, `sqs.svg`, `aurora.svg`, `s3.svg`, `cloudfront.svg`).

Download them from https://aws-icons.com/ (official AWS Architecture Icons):
1. Search the service name.
2. Download the SVG.
3. Save it here under a short, stable name.

Reference them in slides via `awsIcon('fargate')` / `serviceNode('fargate', 'ECS Fargate')`
from `../modules/shared.js`. Keep this folder self-contained: the deck loads these files
locally when served. Do not recolor full-color AWS icons.

This folder is intentionally empty in the skill template (no AWS SVGs are shipped with the
skill for licensing and size reasons). Each deck bundles only the icons it needs.

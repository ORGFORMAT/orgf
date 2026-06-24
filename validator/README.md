# ORGF reference validator

This is a small Node.js reference validator for **ORGF 1.0.0**.

It validates raw source files against the published ORGF 1.0.0 reference. It does not
normalise, rewrite, or mutate a model.

## Install

```bash
npm ci
```

## Validate a model

```bash
npm run validate -- ../examples/minimal-self-contained.orgf
```

Use `--json` for structured output:

```bash
npm run validate -- --json ../examples/minimal-self-contained.orgf
```

## Result levels

- **error** — invalid YAML, invalid structure, missing required sections, or an unsupported declared version.
- **remark** — a normalisable deviation under ORGF 1.0.0, such as an unknown field, an over-limit string, an invalid scalar value, a hidden-branch inconsistency, or a non-canonical embedded reference.

The validator compares an embedded `reference`, when present, with the canonical ORGF 1.0.0 reference in `../specification/`. It does not assert that a model came from an official publisher; it checks format conformance only.

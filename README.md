# ORGF

**ORGF** is an open, versioned format for portable hierarchical models.

A model is stored as readable YAML rather than as a static diagram. ORGF is designed for
organisational structures, work-breakdown structures, taxonomies, catalogues, registries,
and other hierarchical models.

## ORGF 1.0.0

The canonical reference for this release is:

- [`specification/ORGF_1.0.0_reference.yaml`](specification/ORGF_1.0.0_reference.yaml)

Official versioned releases are published at:

- https://github.com/orgformat/orgf/releases

A model declares its target format in the top-level `orgformat` field. The optional
embedded `reference` section is useful when a model must remain self-contained for manual
or AI-assisted work. When present, it must be a complete, unmodified canonical copy of
the reference published for the declared version.

## Contents

- [`specification/`](specification/) — canonical format reference.
- [`examples/`](examples/) — minimal ORGF 1.0.0 examples, with and without an embedded reference.
- [`demo-packs/`](demo-packs/) — public DemoPacks in RU, EN, and zh-Hans where available.
- [`validator/`](validator/) — reference Node.js validator for ORGF 1.0.0.
- [`integrations/`](integrations/) — public import, export, and bidirectional integration projects.

## Quick start

Open `examples/minimal-self-contained.orgf` in a YAML editor, an ORGF-compatible tool,
or an AI workflow. It contains the model and the canonical ORGF 1.0.0 reference together.

To validate a file locally:

```bash
cd validator
npm ci
npm run validate -- ../examples/minimal-self-contained.orgf
```

The validator reports structural errors and non-fatal remarks. It does not normalise or
modify source files.

## Licences

- The ORGF reference, reference validator, and materials not otherwise marked are released under the [MIT License](LICENSE).
- DemoPack model content in [`demo-packs/`](demo-packs/) is dedicated under [CC0 1.0 Universal](demo-packs/LICENSE-CC0.md).
- The ORGFORMAT and ORGF names, logos, visual identity, and Studio interface are not granted by those licences. See [Brand use](BRAND_USE.md).

## Scope

This repository contains the public ORGF format contour only. It does not contain
ORGFORMAT Studio, website source code, proprietary product materials, or private project data.

# Contributing

Use English and ASCII in source files, commands and research notes.
Keep changes focused and run `npm test` when modifying the client.

Every protocol claim should state its evidence: hardware verified, static
analysis, or open hypothesis. For hardware reports, include model, firmware
version, transport path, exact request, sanitized reply and observed robot state.
For static findings, include binary SHA-256, symbol/function and offset when
available. Do not turn a discovered handler into a claim of working support.

Remove device IDs (`did`), serials, account identifiers, tokens, keys, certificates,
Wi-Fi credentials and household maps from public reports. Preserve JSON types
when redacting. Do not upload proprietary firmware or vendor binaries; describe
how to reproduce the finding on a locally owned copy instead.

The bundled probe only reads state. Keep default examples read-only. New actions
need explicit model-specific documentation and hardware observations; avoid
automatic retries when completion is unknown.

Original contributions are provided under the repository's MIT license.

# Research roadmap

## 1. Establish reproducible state reads

- Run `node probe.js --adb` on the R2505 and record a sanitized result.
- Record firmware version and SHA-256 fingerprints of the analyzed binaries.
- Repeat reads across idle, charging and cleaning states; document enum mappings
  from observations rather than copying another model's constants.
- Measure request latency, connection churn and vendor receive fragmentation.

## 2. Discover capabilities

- Inventory registered property and action handlers from the local binaries.
- Initial constructor inventory is available in
  [the static research notes](research/registration-inventory.md); runtime
  availability, argument semantics and handler side effects still need review.
- Maintain separate evidence for handler presence and successful hardware use.
- List X50-specific settings and station features, including unsupported items.
- Investigate subscription/event paths before selecting a polling strategy.

## 3. Commands and map transport

- Validate one explicit action at a time with observable before/after state.
- Determine map sources, compression, coordinates and room identifiers.
- Investigate map updates, room operations and error handling.
- Establish which startup/provisioning functions still depend on cloud services.

## 4. Local agent and integrations

- Select an embedded runtime after measuring actual robot resources.
- Define a versioned local API, access control, lifecycle and reconnect behavior.
- Adapt an existing Home Assistant integration where practical.
- Keep protocol documentation reusable for independent clients and Valetudo ports.

There is no production agent, HA integration or Valetudo port in this repository
yet. The next device experiment is the included read-only Node.js probe.

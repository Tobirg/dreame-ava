# dreame-ava

Researching local communication with Dreame's AVA robot software, starting
with a rooted Dreame X50 / R2505.

The goal is to document the protocol and build a small reusable transport
for local integrations, with Home Assistant as the first intended consumer.
The protocol findings may also help future Valetudo ports. This project is
independent of Dreame, Home Assistant and Valetudo.

**Current result:** four state properties can be read directly through
`/tmp/avacmd.socket`, without pairing the reset test robot to the app.
Hardware verification used the vendor `avacmd` tool and a Python socket client.
The included Node.js client still needs its first hardware confirmation.

This is a research prototype, not a complete integration or cloud replacement.
Cleaning commands, maps, events, Wi-Fi provisioning and persistent autonomous
operation have not been verified. Only R2505 has been tested.

## Start here

- [Protocol and message formats](docs/protocol.md)
- [R2505 observations and property table](docs/devices/r2505.md)
- [Research roadmap](docs/roadmap.md)
- [Transport API and limitations](docs/transport.md)
- [Contributing research](CONTRIBUTING.md)

## Read-only probe from a Raspberry Pi

Requirements: Node.js 18+, ADB, and an already rooted robot connected over USB.
Rooting is outside this repository's scope. No npm dependencies are required.

```bash
git clone https://github.com/Tobirg/dreame-ava.git
cd dreame-ava
node probe.js --adb
```

If several ADB devices are connected, set `ANDROID_SERIAL` first. The probe
creates a temporary forward, reads four properties once and removes the forward.
It does not install software or change robot settings. Device IDs are omitted
from its output. A successful run ends with:

```text
PASS: all four properties returned code 0
```

## Development

```bash
npm test
```

Tests use local mock servers; they do not require a robot or send robot commands.
The GitHub Actions workflow is manually dispatched. Passing mock tests does not
establish support for a new model or firmware.

## Scope and license

Original source code and documentation are MIT licensed. Vendor binaries,
firmware dumps, credentials, certificates and household maps are not included.
Compatibility is recorded per device and observation; similar model names are
not evidence of protocol compatibility.

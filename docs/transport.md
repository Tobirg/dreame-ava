# Experimental Node.js transport

`AvaTransport.js` is a dependency-free CommonJS client using `node:net`.
Node.js 18+ is needed wherever it runs; no Node runtime is installed on the robot
by this project. The `--adb` probe runs on the host.

```javascript
const {AvaTransport} = require('./AvaTransport');
const transport = new AvaTransport(); // /tmp/avacmd.socket
try {
    const result = await transport.sendCommand('get_properties', [
        {siid: 3, piid: 1}
    ]);
    console.log(result);
} finally {
    await transport.shutdown();
}
```

For an already forwarded local TCP endpoint, supply
`{endpoint: {host: '127.0.0.1', port: 12345}}` to the constructor.

- `sendCommand(method, params, {timeout})` returns `response.result`.
- Default overall deadline: 5000 ms, including connection and response time.
- One connection and one write per command; no automatic retries.
- IDs must match. Top-level firmware errors reject with `AvaTransportError`.
- Per-property codes are preserved for the caller to evaluate.
- Partial JSON and split UTF-8 responses are buffered, up to 4 MiB by default.
- Invalid/incomplete JSON fails at connection end or deadline.
- Requests exceeding 4095 bytes are rejected before opening a connection.
- `shutdown()` cancels pending commands and prevents new requests.

The low-level transport accepts arbitrary method names; it is not an API
allowlist. Only `get_properties` is hardware verified. Future agents must
explicitly choose which methods to expose. A timeout leaves command completion
unknown, which is why commands are never retried automatically.

Tests cover typed values, partial responses, UTF-8 fragmentation, property errors,
firmware errors, ID mismatch, empty responses, truncation, deadline, size limits
and shutdown. Unix-listener tests skip if the execution environment denies
listeners. These tests simulate the peer; they do not validate vendor firmware.

The result-returning API was initially shaped for a possible Valetudo adapter.
It does not require Valetudo. A future adapter needs more than replacing
`sendCommand`: the existing Dreame base class also initializes MiIO and related
services. No adapter or compatibility with an upstream release is claimed here.

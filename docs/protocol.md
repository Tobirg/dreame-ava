# Local protocol

Evidence labels used throughout this repository:

- **Hardware verified:** a request and reply were observed on the R2505.
- **Static analysis:** a finding from the supplied vendor executables/libraries;
  it may depend on build options or runtime state.
- **Open:** requires further investigation or a device test.

## AVA command socket (hardware verified)

Endpoint: Unix stream socket `/tmp/avacmd.socket`.

The tested request consists of the ASCII node name `msg_cvt` immediately
followed by compact JSON. No length header, newline or trailing NUL was sent
in the successful direct-socket test:

```text
msg_cvt{"id":1236,"method":"get_properties","params":[{"siid":3,"piid":1},{"siid":3,"piid":2},{"siid":2,"piid":1},{"siid":2,"piid":2}]}
```

The response is plain JSON with a matching ID. Device-specific `did` fields
are omitted from this sanitized example:

```json
{"id":1236,"result":[{"siid":3,"piid":1,"value":70,"code":0},{"siid":3,"piid":2,"value":2,"code":0},{"siid":2,"piid":1,"value":2,"code":0},{"siid":2,"piid":2,"value":0,"code":0}]}
```

One request per connection has been verified through ADB forwarding:

```bash
adb forward tcp:0 localfilesystem:/tmp/avacmd.socket
```

The returned port is local to the host. Remove the forward after use with
`adb forward --remove tcp:PORT`. The included probe handles this automatically.
Read a stream incrementally: one socket read need not contain one JSON response.
Persistent connections, pipelining and unsolicited events remain open questions.

### Vendor CLI: named properties (hardware verified)

```bash
adb shell "avacmd 'msg_cvt{\"type\":\"msgCvt\",\"cmd\":\"get_prop\",\"prop\":[\"battery\",\"charge_state\",\"work_mode\",\"clean_time\",\"clean_size\"]}'"
```

Observed reply:

```json
{"value":["71","not charge","14","0","0"],"ret":"ok"}
```

The values correspond to the requested names in order and are strings. Using
`type: get_prop`, or omitting the required `type: msgCvt` dispatch shape, did
not reach this getter in the earlier tests (reply: `{}`). Do not treat `{}` as
successful property retrieval.

### Vendor CLI: MIOT-style properties (hardware verified)

```bash
adb shell "avacmd 'msg_cvt{\"id\":1235,\"method\":\"get_properties\",\"params\":[{\"siid\":3,\"piid\":1},{\"siid\":3,\"piid\":2},{\"siid\":2,\"piid\":1},{\"siid\":2,\"piid\":2}]}'"
```

This uses the separate `method` dispatch path. See the [device table](devices/r2505.md)
for the tested properties. Preserve individual `code` fields and numeric types.

### Receive constraints (static analysis)

The analyzed `node_cmd` implementation uses a 4096-byte receive buffer and a
single receive call. The client limits the entire request to 4095 bytes and
sends it in one write. A stream may still split that write; this is not a
guarantee that the vendor handler receives the whole request at once.

## dmiot status socket

This is a different endpoint and must not be confused with the AVA command socket.

- Endpoint tested: TCP `127.0.0.1:64320` on the robot.
- Tested request framing: `C0` byte, JSON byte length as uint16 little-endian,
  JSON bytes, then `00` byte. The length excludes the framing and final NUL.
- Tested JSON: `{"id":1234,"method":"local.query_status"}`.
- Observed unframed JSON reply:
  `{"id":1234,"method":"local.status","params":"wifi_connecting"}`.

The robot was reset and awaiting Wi-Fi provisioning. This is IoT connection
status, not a cleaning-state response. The downlink framing depends on
`SWITCH_DOWN_FLOW_TYPE` in the analyzed build (static analysis); do not require
a `C0` header in every reply. The analyzed server has capacity for nine clients;
multi-client behavior and its interaction with AVA have not been stress-tested.

Static analysis indicates ordinary methods on this endpoint are routed toward
the cloud. The successful local `get_properties` tests used AVA instead.

## Provenance

Initial analysis used locally supplied `x50-iot-analysis.tar` and
`x50-ava-analysis.tar`, followed by the owner's hardware tests on 2026-10-24.
Archives and proprietary binaries are not redistributed. The firmware version
is still unknown; binary fingerprints and further dispatch analysis are in the
[static analysis notes](research/ava-dispatch.md).

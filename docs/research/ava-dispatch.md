# AVA dispatch, reports and maps

These findings are **static analysis**, not new hardware confirmations.
Addresses are ELF virtual addresses for the exact input below, not process
addresses. The full firmware version is still unknown.

| Binary | SHA-256 |
| --- | --- |
| `node_msg_cvt.so` | `1394b26ba6d865994290e071b8414fcc72c3a2bdaa3ae49e120c7873cce8ce3b` |
| `node_cmd.so` | `c119a219ef1e932b14d5b4d1914d3fd96e51116d6a879a41ebb6958d4889be54` |
| `node_iot.so` | `dd5bf5b3da2ab44d14224dbb0aa4137c5ce21ca6987132b00fb553eae94fec82` |
| `ava` | `8c6e42ad9aa5dfb80f075df972b1fbc2488d4033a0f5c902372b1f076411f83c` |

These hashes identify the local files analyzed; they are not firmware authenticity
checks. No proprietary binaries are included.

## Dispatch structure

`AvaNodeMsgCvt::MethodProcess` at `0x778e0` distinguishes `get_properties`,
`set_properties` and `action`. Property requests use an array of parameter objects.
The action path uses a parameter object and is handled separately.

`ProcessParamFromProperties` at `0x6e8a0` handles property requests;
`ProcessParamFromAction` at `0x71ec0` handles action parameters, including the
response's `out` member. `ProcessParamSiid` at `0x6e3c0` selects `piid` or `aiid`
and dispatches through the service handler. Constructors register separate
read, write, action and report callbacks via `MsgHandler::Add*Handler`.

The four previously hardware-verified properties correspond to the expected
constructor bindings: `2:1 GetWorkMode`, `2:2 GetFault`, `3:1 GetLevel`,
and `3:2 GetState`. The larger [inventory](registration-inventory.md) remains
static evidence only, including conditionally executed registration sites.

An action's structural shape is therefore a candidate for future testing:

```json
{"id":2000,"method":"action","params":{"siid":2,"aiid":1,"in":[]}}
```

This is not a recommended test command: arguments and completion semantics must
be traced for each action. The included probe still only reads four properties.

## A registered handler can be a stub

| Binding | Handler VA | Actual body in this build |
| --- | --- | --- |
| Write `6:2` | `MsgMap::SetMapFrameInfo`, `0xede30` | Returns zero immediately; no state update |
| Write `4:10` | `MsgClean::SetExtendData`, `0xddc50` | Extracts a string, discards it; returns zero on successful extraction, minus one on failure |

A successful dispatch code can mean the input was accepted without applying any
setting. Handler names and registrations alone are insufficient. Real support
needs body analysis and an observable before/after hardware check.

## Capability property: useful, but limited

Read `4:83` is registered to `MsgClean::GetCleanCapability` (`0xdf7e0`). It calls
`Capability()` (`0xdf690`) and returns an integer.

`InitCleanCapability()` at `0xdf680` initializes the stored mask to `0x1f`.
`Capability()` may clear bits 0 and 2 (`mask & ~0x5`) on a model lookup path.
The meanings of these bits have not been established. This is not evidence that
five bits describe every X50 feature, or that all those features are available.

Read `4:50`, `MsgClean::GetSwitchSet` (`0xdce30`), returns a cached string;
its writer `SetSwitchSet` (`0xdddc0`) requires a string and calls
`AvaNodeMsgCvt::SetSwitchMsg` (`0x98490`). Its payload format is still open.
Do not assume this property is an integer bitfield or send guessed values.

## Reports do not yet provide a local subscription

`ProcessReportSiid()` (`0x69a00`) looks up the service and invokes its report
serializer. `ProcessReportMsg()` constructs two outgoing message families:

```json
{"id":2001,"method":"properties_changed","params":[{"did":"REDACTED","siid":3,"piid":1,"value":70}]}
```

```json
{"id":2002,"method":"event_occured","params":{"did":"REDACTED","siid":2,"eiid":1,"arguments":[]}}
```

These are sanitized structural illustrations, not captured events. The spelling
`event_occured` is intentional and matches the vendor format string.

In `ProcessReportMsg`, the property format is loaded at `0x6b9bc`, and the
event format at `0x6bc78`. Both paths call `AvaSendIotMsg()` (`0x6b5b0`), which
forwards the string through `AvaSendSimpleString` with destination `iot`.

This establishes an internal reporting path, not an event stream delivered to
clients connected to `/tmp/avacmd.socket`. Intercepting or subscribing to the
internal path needs more analysis. Polling the verified local getter remains
the established access method; a second dmiot connection is not yet known to
receive these reports.

## Map transport is asynchronous

`MsgMap` registers service 6. In particular:

| Binding | Static meaning |
| --- | --- |
| Report `6:1` | `RptMapView`, not a registered getter for raw map bytes |
| Read `6:7` | `GetMultMapState` |
| Read `6:8` | `GetMultMapInfo` |
| Read `6:9` | `GetBackupMapInfo` |
| Read `6:15` | `GetWifiMap` |
| Action `6:1` | `ActMapReq` |

`ActMapReq` (`0xf5840`) examines action input items with `piid` and `value` and
contains logic for `req_type`, `frame_type`, `force_type`, `map_id`, `frame_id`
and `time`. The function contains an explicit `{"frame_type":"I"}` request.
The complete mapping of action input IDs to semantics is still being traced.

`SendMapDataReq` (`0xf0fb0`) publishes an internal `ava_msg_device_action` with
action field 5 and the request string. It does not itself return the raw map.
The code has optional elapsed-time suppression checks; the time units and all
call-site choices are not yet established.

`RptMapView` (`0xedf10`) serializes a cached string as property `6:1`.
Its cache is assigned by `SetMapView` (`0xf05a0`), which queues a report for
property 1 and records the frame via `AddFrameInfo`.

The producer path is `PropStringMsgProcess` (`0x94e10`), handling internal
`ava_msg_device_prop_string` type 2. For frame tags `I` and `P`, it compares the
string length against the field at `AvaNodeMsgCvt + 0xc50`:

- Below the threshold: calls `SetMapView` at `0x95180`.
- At or above the threshold: calls `SetMapViewFds` at `0x95208`.

`SetMapViewFds` (`0xf08c0`) obtains a reserved FDS destination, writes the
buffer through `WriteBufferToFile`, then calls `DoFdsTmpFileUpload`. Frame/object
metadata is tracked separately. Thus this build has distinct inline and file
upload paths. The threshold's configured value, payload encoding, and completed
upload reporting still need tracing. An important next target for cloud-free
map access is the buffer before FDS upload, not just a property getter.

`GetWifiMap` (`0xee110`) returns a separate cached string. Its format and producer
still need tracing. The names `I` and `P` are frame tags observed in code; the
precise full-frame/delta encoding has not yet been established.

The constructor defaults the multimap metadata path to
`/data/config/ava/mult_map.json`. Additional map-related paths are present in
the binary, but their presence alone does not establish which one supplies live
map data. Map decoding and local retrieval remain unfinished.

## Work mode is computed from multiple fields

`MsgRobot::CalculateWorkMode()` at `0xc7c20` reads several state fields and, on
some branches, `GetIotType()`. It is not a single raw-mode lookup table.
Therefore a raw named `work_mode` cannot safely be translated to the MIOT-style
status without considering the other inputs. Numeric output meanings still
require correlation with observed hardware states.

## Next analysis targets

1. Follow the upstream producer of internal string property type 2 and the data
   path after internal map action 5. Decode the payload and locate the FDS size
   threshold and temporary file lifecycle.
2. Trace each action's `in` arguments and separate acknowledgement from completion.
3. Locate the internal reporting transport and determine whether an additional
   local consumer can receive reports without replacing the vendor process.
4. Decode `4:50` and correlate X50-specific functions with their actual handlers.

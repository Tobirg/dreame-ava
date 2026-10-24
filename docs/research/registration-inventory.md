# Constructor registration sites

Static analysis of the fingerprinted R2505 `node_msg_cvt.so`. These are registration
sites present in code, including conditional paths; they are not a runtime capability
list. The CSV includes candidates, call-site virtual addresses and constructor addresses.

[CSV inventory](r2505-registration-sites.csv) contains 411 sites:

| Operation | Sites |
| --- | ---: |
| Read | 149 |
| Write | 84 |
| Action | 52 |
| Report | 126 |

Nine sites belong to generic `MsgConsumable` constructors with a runtime service
ID. Blank IDs mean unresolved; do not replace them with guessed constants.
There are 402 sites with a literal service ID in this build. Conditional registrations
and aliases remain separate rows. An `rpt` ID is a property report serializer ID,
not an action ID or evidence of a socket subscription API.

## Services with literal IDs

| siid | Handler class | Read | Write | Action | Report |
| ---: | --- | ---: | ---: | ---: | ---: |
| 1 | `MsgDevice` | 4 | 0 | 0 | 0 |
| 2 | `MsgRobot` | 6 | 3 | 16 | 5 |
| 3 | `MsgBattery` | 3 | 1 | 1 | 3 |
| 4 | `MsgClean` | 55 | 31 | 8 | 52 |
| 5 | `MsgAnnoy` | 4 | 4 | 1 | 4 |
| 6 | `MsgMap` | 7 | 5 | 4 | 8 |
| 7 | `MsgAudio` | 14 | 15 | 2 | 14 |
| 8 | `MsgTimer` | 4 | 2 | 2 | 2 |
| 12 | `MsgCleanLog` | 6 | 0 | 0 | 6 |
| 13 | `MsgVslamExtend` | 1 | 1 | 0 | 1 |
| 14 | `MsgConfig` | 4 | 2 | 0 | 3 |
| 15 | `MsgCollectDust` | 4 | 2 | 1 | 4 |
| 23 | `MsgIdentify` | 0 | 0 | 1 | 0 |
| 99 | `MsgCalibration` | 29 | 17 | 8 | 20 |
| 10001 | `MsgCameraStreamer` | 5 | 0 | 7 | 0 |

## MsgRobot: read, write and action candidates

Names below are vendor symbols, not verified user-facing semantics. Writes and
actions have not been exercised on the robot. See the analysis notes for stubs.

| siid | Operation | piid / aiid | Handler | Registration VA |
| ---: | --- | ---: | --- | --- |
| 2 | get | 2 | `GetFault` | `0xc6f3c` |
| 2 | get | 1 | `GetWorkMode` | `0xc6f94` |
| 2 | get | 3 | `GetMode` | `0xc6fec` |
| 2 | get | 5 | `GetDryLeftTime` | `0xc7044` |
| 2 | set | 3 | `SetMode` | `0xc709c` |
| 2 | act | 1 | `ActStartClean` | `0xc70f4` |
| 2 | act | 2 | `ActStopClean` | `0xc714c` |
| 2 | act | 3 | `ActStartRoomClean` | `0xc71a4` |
| 2 | act | 4 | `ActStartCollect` | `0xc71fc` |
| 2 | act | 5 | `ActStopCollect` | `0xc7254` |
| 2 | act | 6 | `ActStartWashMop` | `0xc72ac` |
| 2 | act | 7 | `ActStopWashMop` | `0xc7304` |
| 2 | act | 8 | `ActStartDryMop` | `0xc735c` |
| 2 | act | 9 | `ActStopDryMop` | `0xc73b4` |
| 2 | act | 10 | `ActStartEject` | `0xc740c` |
| 2 | act | 11 | `ActStartCallClean` | `0xc7464` |
| 2 | act | 12 | `ActStartAreaClean` | `0xc74bc` |
| 2 | act | 13 | `ActStartBuildMap` | `0xc7514` |
| 2 | act | 14 | `ActPauseBuildMap` | `0xc756c` |
| 2 | act | 15 | `ActContinueBuildMap` | `0xc75c4` |
| 2 | act | 16 | `ActStopBuildMap` | `0xc761c` |
| 2 | get | 6 | `GetSweepMode` | `0xc7784` |
| 2 | get | 8 | `GetMopHumidity` | `0xc77dc` |
| 2 | set | 6 | `SetSweepMode` | `0xc7834` |
| 2 | set | 8 | `SetMopHumidity` | `0xc788c` |

## MsgBattery: read, write and action candidates

Names below are vendor symbols, not verified user-facing semantics. Writes and
actions have not been exercised on the robot. See the analysis notes for stubs.

| siid | Operation | piid / aiid | Handler | Registration VA |
| ---: | --- | ---: | --- | --- |
| 3 | get | 1 | `GetLevel` | `0xcbd38` |
| 3 | get | 2 | `GetState` | `0xcbd90` |
| 3 | get | 3 | `GetChargeConfig` | `0xcbde8` |
| 3 | set | 3 | `SetChargeConfig` | `0xcbe40` |
| 3 | act | 1 | `ActCharge` | `0xcbe98` |

## MsgClean: read, write and action candidates

Names below are vendor symbols, not verified user-facing semantics. Writes and
actions have not been exercised on the robot. See the analysis notes for stubs.

| siid | Operation | piid / aiid | Handler | Registration VA |
| ---: | --- | ---: | --- | --- |
| 4 | get | 1 | `GetWorkMode` | `0xe19bc` |
| 4 | get | 2 | `GetTime` | `0xe1a00` |
| 4 | get | 3 | `GetSize` | `0xe1a44` |
| 4 | get | 4 | `GetMode` | `0xe1a88` |
| 4 | get | 5 | `GetMop` | `0xe1acc` |
| 4 | get | 6 | `GetWaterBoxState` | `0xe1b10` |
| 4 | get | 7 | `GetTaskDone` | `0xe1b54` |
| 4 | get | 11 | `GetBreakpointStart` | `0xe1b98` |
| 4 | get | 12 | `GetCarpetPress` | `0xe1bdc` |
| 4 | get | 14 | `GetSerialNumber` | `0xe1c20` |
| 4 | get | 16 | `GetWashMopTime` | `0xe1c64` |
| 4 | get | 17 | `GetBreakpointShow` | `0xe1ca8` |
| 4 | get | 18 | `GetWarnList` | `0xe1cec` |
| 4 | get | 19 | `GetNationMatched` | `0xe1d30` |
| 4 | get | 20 | `GetRelocationState` | `0xe1d74` |
| 4 | get | 24 | `GetUploadMap` | `0xe1db8` |
| 4 | get | 47 | `GetUnableChangeMode` | `0xe1dfc` |
| 4 | get | 48 | `GetQuickInstruction` | `0xe1e40` |
| 4 | get | 49 | `GetMultiMapRelocSwitch` | `0xe1e84` |
| 4 | get | 50 | `GetSwitchSet` | `0xe1ec8` |
| 4 | get | 60 | `GetDrainage` | `0xe1f0c` |
| 4 | set | 4 | `SetMode` | `0xe1f50` |
| 4 | set | 5 | `SetMop` | `0xe1f94` |
| 4 | set | 10 | `SetExtendData` | `0xe1fd8` |
| 4 | set | 11 | `SetBreakpointStart` | `0xe201c` |
| 4 | set | 12 | `SetCarpetPress` | `0xe2060` |
| 4 | set | 15 | `SetRemoteRobot` | `0xe20a4` |
| 4 | set | 16 | `SetWashMopTime` | `0xe20e8` |
| 4 | set | 24 | `SetUploadMap` | `0xe212c` |
| 4 | set | 49 | `SetMultiMapRelocSwitch` | `0xe2170` |
| 4 | set | 50 | `SetSwitchSet` | `0xe21b4` |
| 4 | set | 60 | `SetDrainage` | `0xe21f8` |
| 4 | act | 1 | `ActStartClean` | `0xe2704` |
| 4 | act | 7 | `ActStartClean` | `0xe2744` |
| 4 | act | 2 | `ActStopClean` | `0xe2788` |
| 4 | act | 3 | `ActClearWarn` | `0xe27cc` |
| 4 | act | 5 | `ActStopMapping` | `0xe2810` |
| 4 | act | 8 | `ActEditQuickInstruction` | `0xe2854` |
| 4 | get | 56 | `GetWeakHintInform` | `0xe2898` |
| 4 | get | 57 | `GetWeakHintEcho` | `0xe2920` |
| 4 | set | 57 | `SetWeakHintEcho` | `0xe2964` |
| 4 | get | 58 | `GetSpecTaskStatus` | `0xe29ec` |
| 4 | get | 21 | `GetLaserSwitch` | `0xe2a74` |
| 4 | set | 21 | `SetLaserSwitch` | `0xe2ab8` |
| 4 | get | 22 | `GetStreamerSwitch` | `0xe2b40` |
| 4 | set | 22 | `SetStreamerSwitch` | `0xe2b84` |
| 4 | act | 6 | `ActUploadAiPic` | `0xe2c0c` |
| 4 | get | 59 | `GetAiPetObject` | `0xe2c50` |
| 4 | get | 26 | `GetCustomeCleanSwitch` | `0xe2cd8` |
| 4 | set | 26 | `SetCustomeCleanSwitch` | `0xe2d1c` |
| 4 | get | 27 | `GetChildLock` | `0xe2da4` |
| 4 | set | 27 | `SetChildLock` | `0xe2de8` |
| 4 | get | 29 | `GetMopMode` | `0xe2e70` |
| 4 | set | 29 | `SetMopMode` | `0xe2eb4` |
| 4 | get | 23 | `GetMopSwitch` | `0xe2f3c` |
| 4 | set | 23 | `SetMopSwitch` | `0xe2f80` |
| 4 | get | 25 | `GetMopStatus` | `0xe3244` |
| 4 | get | 34 | `GetSmartWashSwitch` | `0xe3278` |
| 4 | get | 35 | `GetStationError` | `0xe32ac` |
| 4 | get | 51 | `GetAutoWaterStatus` | `0xe32e0` |
| 4 | set | 34 | `SetSmartWashSwitch` | `0xe3314` |
| 4 | act | 4 | `ActWashMop` | `0xe33f4` |
| 4 | get | 37 | `GetCleanfluidSwitch` | `0xe345c` |
| 4 | set | 37 | `SetCleanfluidSwitch` | `0xe34a0` |
| 4 | get | 39 | `GetWaterSavingInfo` | `0xe3508` |
| 4 | set | 39 | `SetWaterSavingInfo` | `0xe353c` |
| 4 | get | 40 | `GetDryingTime` | `0xe35a4` |
| 4 | set | 40 | `SetDryingTime` | `0xe35d8` |
| 4 | get | 41 | `GetBuoyNoWaterInfo` | `0xe3640` |
| 4 | set | 41 | `SetBuoyNoWaterInfo` | `0xe3674` |
| 4 | get | 45 | `GetAutoInstallMopSwitch` | `0xe36dc` |
| 4 | set | 45 | `SetAutoInstallMopSwitch` | `0xe3710` |
| 4 | get | 46 | `GetMopWashMode` | `0xe3788` |
| 4 | set | 46 | `SetMopWashMode` | `0xe37bc` |
| 4 | get | 52 | `GetAutoMopWarn` | `0xe3844` |
| 4 | set | 52 | `SetAutoMopWarn` | `0xe3888` |
| 4 | get | 53 | `GetMopInstalledStatus` | `0xe38f0` |
| 4 | get | 55 | `GetDryingTimeWarn` | `0xe3958` |
| 4 | set | 55 | `SetDryingTimeWarn` | `0xe399c` |
| 4 | get | 30 | `GetNormalEventReason` | `0xe3a04` |
| 4 | get | 61 | `GetStationAutoWashState` | `0xe3a6c` |
| 4 | get | 62 | `GetHomepageCleanModeShow` | `0xe3ae4` |
| 4 | get | 63 | `GetCleanPercentage` | `0xe3b6c` |
| 4 | get | 64 | `GetDryingPercentage` | `0xe3be4` |
| 4 | set | 31 | `SetYModeSwitch` | `0xe3c5c` |
| 4 | get | 31 | `GetYModeSwitch` | `0xe3ca0` |
| 4 | get | 28 | `GetCarpetPressState` | `0xe3d18` |
| 4 | set | 28 | `SetCarpetPressState` | `0xe3d5c` |
| 4 | get | 33 | `GetCarpetRecognition` | `0xe3de4` |
| 4 | set | 33 | `SetCarpetRecognition` | `0xe3e18` |
| 4 | get | 36 | `GetCarpetEscape` | `0xe3e90` |
| 4 | set | 36 | `SetCarpetEscape` | `0xe3ed4` |
| 4 | get | 38 | `GetVideoCapability` | `0xe3f3c` |
| 4 | get | 83 | `GetCleanCapability` | `0xe3fa4` |

## MsgMap: read, write and action candidates

Names below are vendor symbols, not verified user-facing semantics. Writes and
actions have not been exercised on the robot. See the analysis notes for stubs.

| siid | Operation | piid / aiid | Handler | Registration VA |
| ---: | --- | ---: | --- | --- |
| 6 | get | 7 | `GetMultMapState` | `0xf41fc` |
| 6 | get | 8 | `GetMultMapInfo` | `0xf4230` |
| 6 | get | 9 | `GetBackupMapInfo` | `0xf4264` |
| 6 | get | 11 | `GetRestoreMapState` | `0xf4298` |
| 6 | get | 12 | `GetRestoreMapTimestamp` | `0xf42cc` |
| 6 | get | 14 | `GetBackupMapState` | `0xf4300` |
| 6 | get | 15 | `GetWifiMap` | `0xf4334` |
| 6 | set | 2 | `SetMapFrameInfo` | `0xf4368` |
| 6 | set | 4 | `SetMapAdvanced` | `0xf439c` |
| 6 | set | 7 | `SetMultMapState` | `0xf43d0` |
| 6 | set | 10 | `SetRestoreMapInfo` | `0xf4404` |
| 6 | set | 16 | `SetRestoreMaps` | `0xf4438` |
| 6 | act | 1 | `ActMapReq` | `0xf446c` |
| 6 | act | 2 | `ActMapAdv` | `0xf44a0` |
| 6 | act | 3 | `ActMapBackup` | `0xf44d4` |
| 6 | act | 4 | `ActMapWifi` | `0xf4508` |

## Reproduce

Use Python 3.11+ and a local copy of the same ELF:

```bash
python3 -m venv .venv
.venv/bin/pip install pyelftools capstone
.venv/bin/python tools/extract_registrations.py /path/to/node_msg_cvt.so > registration-sites.csv
```

The extractor reports the input SHA-256 on stderr. It scans exported constructor
symbols, resolves GOT relocations, and associates member-function loads and literal
IDs with subsequent `AddGet/Set/Act/RptHandler` calls. It uses linear instruction order,
does not execute branches or model all AArch64 register effects, and is specific to
this compiler pattern. Every inferred binding is a candidate for manual review.
A count of one candidate does not establish reachability or functional behavior.
Other firmware builds can require a different extractor. No binary is uploaded.

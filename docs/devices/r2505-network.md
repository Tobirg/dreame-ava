# R2505 manual network bootstrap

Experimental boot setup for the already rooted R2505 used in this research.
Wi-Fi association and manually assigned IPv4 were verified by the owner.
The persistent bootstrap still requires a hardware reboot test.

The stock `adbd_auth_service` starts authenticated network ADB on TCP **4567**.
Static analysis of `libawadbauth.so::aw_adbd_start` found `ADB_AUTH_ENABLE=1`,
default `ADB_TRANSPORT_PORT=4567`, and the configured external key path.
Port 5037 is the separate ADB smart-socket endpoint in this build.
No daemon replacement or authentication change is needed for this setup.

## Requirements

- Working root USB ADB and the established `/data/test/ava.sh` root hook.
- Previously tested `/data/test/r2505-wifi.conf` for the intended Wi-Fi network.
- The host's public key is already trusted through `/data/test/adb_keys`.
- A working current IPv4 address on `wlan0`, used to verify TCP ADB.
- For static mode, choose an unused address and reserve/exclude it in the router.
- A router-side DHCP reservation is compatible with DHCP mode; it does not require
  a static IP in the robot or a hardcoded address in this repository.

```bash
python3 tools/install_network.py
```

The installer prompts for `dhcp` (default) or `static`. Static mode prompts for
an IPv4 address with prefix length. For unattended use:

```bash
python3 tools/install_network.py --mode dhcp
python3 tools/install_network.py --mode static --address "$ROBOT_CIDR"
```

Set `ROBOT_CIDR` to your chosen address/prefix for the second command. No personal
network address is included in the installer. The selected mode and address stay
in the helper installed on your robot.

The installer discovers the current address over USB and verifies root access
over both USB and TCP before altering startup. This preflight address is separate
from the DHCP/static configuration being prepared for the next boot.
It backs up the existing hook and helper under `/data/test/network-backups/`,
stages and syntax-checks the new scripts, then adds one background helper call
before AVA launch. The AVA and delayed ADB authorization restart code are preserved.
Credentials are read from the existing robot file; they are not downloaded or
printed by this installer. The installer does not restart current networking or reboot. The selected
network settings take effect on the next boot, preserving the active session
while installing or switching modes.

The helper waits for `wlan0` and starts `wpa_supplicant` when absent. After
association, DHCP mode starts `udhcpc` with its native default lease script,
allowing DHCP to configure address, routes and DNS. It keeps the DHCP client
running for lease renewal. Static mode applies the user-supplied address and
prefix; it does not add a default gateway or DNS settings. The helper checks
every five seconds and does not restart an existing supplicant. This manual setup is for the reset research robot; app provisioning
or another Wi-Fi manager may conflict and needs separate handling.

## Verify after reboot

Persistent DHCP/static startup still needs hardware verification. The earlier
manual DHCP attempt timed out on the research robot; DHCP mode must be tested
before relying on it. A router reservation determines the expected lease but
does not itself fix a DHCP exchange failure.

Keep USB attached during the first reboot. Wait about one minute, find the
address using `adb -d shell "ip -4 addr show dev wlan0"` or the router, and set
`ROBOT_IP` accordingly. Then use:

```bash
adb connect "$ROBOT_IP:4567"
adb -s "$ROBOT_IP:4567" shell id
adb -s "$ROBOT_IP:4567" shell 'cat /data/log/r2505-network.log; cat /data/log/adb-bootstrap.log'
```

If network access fails, inspect those logs using `adb -d shell` through USB.
Do not consider persistence verified until TCP root access works after boot.
Keep ADB limited to a trusted LAN; the authorized shell runs as root.

## Host-only checks

```bash
python3 -m unittest discover -s test -p '*_test.py'
```

These check mode selection, address validation and generated shell syntax.
They do not establish DHCP or boot behavior on hardware.

## Roll back

Using the exact backup directory printed by the installer, restore its `ava.sh`
to `/data/test/ava.sh`, preserve its executable permission and run `sync`.
The restored hook takes effect on reboot. If a prior `network.sh` exists in that
backup, restore it too. Do not delete the tested Wi-Fi configuration or ADB keys.

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
- `192.168.2.11/24` is already reachable and available for this robot.
- Reserve/exclude the address in the router's DHCP configuration.

```bash
python3 tools/install_network.py --address 192.168.2.11/24
```

The installer verifies root access over both USB and TCP before altering startup.
It backs up the existing hook and helper under `/data/test/network-backups/`,
stages and syntax-checks the new scripts, then adds one background helper call
before AVA launch. The AVA and delayed ADB authorization restart code are preserved.
Credentials are read from the existing robot file; they are not downloaded or
printed by this installer. The installer does not reboot.

The helper waits for `wlan0`, starts `wpa_supplicant` when absent, and applies
the static address after association. It checks every five seconds. It does not
run DHCP, add a default gateway or change DNS. It does not restart an existing
supplicant. This manual setup is for the reset research robot; app provisioning
or another Wi-Fi manager may conflict and needs separate handling.

## Verify after reboot

Keep USB attached during the first reboot. Wait about one minute, then use:

```bash
adb connect 192.168.2.11:4567
adb -s 192.168.2.11:4567 shell id
adb -s 192.168.2.11:4567 shell 'cat /data/log/r2505-network.log; cat /data/log/adb-bootstrap.log'
```

If network access fails, inspect those logs using `adb -d shell` through USB.
Do not consider persistence verified until TCP root access works after boot.
Keep ADB limited to a trusted LAN; the authorized shell runs as root.

## Roll back

Using the exact backup directory printed by the installer, restore its `ava.sh`
to `/data/test/ava.sh`, preserve its executable permission and run `sync`.
The restored hook takes effect on reboot. If a prior `network.sh` exists in that
backup, restore it too. Do not delete the tested Wi-Fi configuration or ADB keys.

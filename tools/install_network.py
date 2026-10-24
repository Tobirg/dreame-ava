#!/usr/bin/env python3
"""Install the R2505 manual Wi-Fi/static-IP boot helper through root USB ADB.

Requires the previously tested /data/test/r2505-wifi.conf and AVA root hook.
Does not provision Wi-Fi credentials, change ADB authentication or reboot.
"""
import argparse
import ipaddress
from pathlib import Path
import subprocess
import tempfile
import time

HELPER = "/data/test/r2505-network.sh"
HOOK = "/data/test/ava.sh"
MARKER = "# dreame-ava: manual network startup"
ANCHOR = "DEVICE_NAME=$(jsonpath -i /etc/os-release -e '@.product')"
BLOCK = (
    MARKER + "\n"
    "sh /data/test/r2505-network.sh "
    ">/data/log/r2505-network.log 2>&1 </dev/null &\n\n"
)

WORKER = r'''#!/bin/sh
ADDRESS='__ADDRESS__'
CONF=/data/test/r2505-wifi.conf
LOCK=/tmp/r2505-network.lock

mkdir "$LOCK" 2>/dev/null || exit 0
trap 'rmdir "$LOCK" 2>/dev/null' EXIT
trap 'exit 0' HUP INT TERM
umask 077

if [ ! -s "$CONF" ]; then
    echo "ERROR: Wi-Fi configuration is missing"
    exit 1
fi

echo "Manual network worker started: $ADDRESS"
while true; do
    if [ ! -d /sys/class/net/wlan0 ]; then
        sleep 5
        continue
    fi
    ip link set wlan0 up 2>/dev/null
    if ! pidof wpa_supplicant >/dev/null 2>&1; then
        mkdir -p /var/run/wpa_supplicant
        echo "Starting wpa_supplicant"
        wpa_supplicant -B -Dnl80211 -i wlan0 -c "$CONF"
    fi
    if wpa_cli -i wlan0 status 2>/dev/null | grep -qx 'wpa_state=COMPLETED'; then
        if ! ip -4 addr show dev wlan0 | grep -Fq "inet $ADDRESS "; then
            if ip addr replace "$ADDRESS" dev wlan0; then
                echo "Static address applied: $ADDRESS"
            else
                echo "ERROR: static address assignment failed"
            fi
        fi
    fi
    sleep 5
done
'''


def patch_hook(original):
    if original.count(ANCHOR) != 1:
        raise ValueError("Unexpected AVA hook: startup anchor missing or repeated")
    for expected in ['mount --bind /data/test/adb_keys /etc/adb_keys',
                     'ava -f "/ava/conf/${DEVICE_NAME}.conf" force',
                     '/usr/bin/adbd_auth_service']:
        if expected not in original:
            raise ValueError("Unexpected AVA hook: required startup code missing")
    if MARKER in original:
        if original.count(BLOCK) != 1:
            raise ValueError("An unfamiliar network startup block is already present")
        return original
    return original.replace(ANCHOR, BLOCK + ANCHOR, 1)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--address", default="192.168.2.11/24")
    args = parser.parse_args()
    interface = ipaddress.IPv4Interface(args.address)
    if interface.ip.is_unspecified or interface.ip.is_multicast or interface.ip.is_loopback:
        raise ValueError("Invalid LAN address")
    address = str(interface)
    endpoint = str(interface.ip) + ":4567"

    def run(arguments, timeout=20):
        result = subprocess.run(arguments, text=True, capture_output=True, timeout=timeout)
        if result.returncode:
            raise RuntimeError(result.stderr.strip() or result.stdout.strip() or
                               "Command failed: " + arguments[0])
        return result.stdout.strip()

    def shell(command):
        return run(["adb", "-d", "shell", command])

    if shell("id -u") != "0":
        raise RuntimeError("Root USB ADB is required")
    shell("test -s /data/test/r2505-wifi.conf && test -s /data/test/adb_keys")
    print(run(["adb", "connect", endpoint]))
    if run(["adb", "-s", endpoint, "shell", "id -u"]) != "0":
        raise RuntimeError("Network root ADB verification failed; no startup files changed")
    print("PASS: authenticated root ADB over the network")

    with tempfile.TemporaryDirectory(prefix="r2505-network-") as directory:
        local = Path(directory)
        run(["adb", "-d", "pull", HOOK, str(local / "ava.sh")])
        original = (local / "ava.sh").read_text()
        updated = patch_hook(original)
        (local / "ava.sh").write_text(updated)
        (local / "network.sh").write_text(WORKER.replace("__ADDRESS__", address))

        backup = "/data/test/network-backups/" + time.strftime("%Y%m%d-%H%M%S")
        shell("umask 077; mkdir -p '" + backup + "' && cp -p " + HOOK + " '" + backup + "/ava.sh'")
        shell("if [ -f " + HELPER + " ]; then cp -p " + HELPER + " '" + backup + "/network.sh'; fi")
        for name, remote in [("network.sh", HELPER), ("ava.sh", HOOK)]:
            run(["adb", "-d", "push", str(local / name), remote + ".new"])
        shell("chmod 700 " + HELPER + ".new " + HOOK + ".new && "
              "sh -n " + HELPER + ".new && sh -n " + HOOK + ".new && "
              "chmod 600 /data/test/r2505-wifi.conf")
        shell("mv " + HELPER + ".new " + HELPER + " && mv " + HOOK + ".new " + HOOK + " && sync")

    # On first installation this starts the helper. A running instance holds its lock.
    shell("sh " + HELPER + " >/data/log/r2505-network.log 2>&1 </dev/null &")
    print("PASS: boot hook installed; AVA and ADB authentication startup preserved")
    print("BACKUP: " + backup)
    print("ADDRESS: " + address)
    print("ADB: " + endpoint)
    print("No reboot performed. Cold-boot verification is still required.")


if __name__ == "__main__":
    try:
        main()
    except (ValueError, RuntimeError, OSError, subprocess.SubprocessError) as error:
        raise SystemExit("ERROR: " + str(error))

"use strict";

const {execFileSync} = require("node:child_process");
const {performance} = require("node:perf_hooks");
const {AvaTransport} = require("./AvaTransport");

async function main() {
    const args = process.argv.slice(2);
    if (args.some(arg => arg !== "--adb" && arg !== "--help")) {
        throw new Error("Usage: node probe.js [--adb]");
    }
    if (args.includes("--help")) {
        console.log("Usage: node probe.js [--adb]");
        console.log("Read four R2505 properties once. --adb runs from a USB-connected host.");
        return;
    }
    let port;
    let transport;
    try {
        const options = {};
        if (args.includes("--adb")) {
            port = execFileSync("adb", ["forward", "tcp:0",
                "localfilesystem:/tmp/avacmd.socket"], {encoding: "utf8", timeout: 10000}).trim();
            if (!/^\d+$/.test(port) || Number(port) < 1 || Number(port) > 65535) {
                throw new Error("ADB returned an invalid forwarding port");
            }
            options.endpoint = {host: "127.0.0.1", port: Number(port)};
        }
        transport = new AvaTransport(options);
        const start = performance.now();
        const properties = [
            {siid: 3, piid: 1},
            {siid: 3, piid: 2},
            {siid: 2, piid: 1},
            {siid: 2, piid: 2}
        ];
        const result = await transport.sendCommand("get_properties", properties);
        // Print only protocol fields, omitting device identifiers returned by AVA.
        const sanitized = Array.isArray(result) ? result.map(item => ({
            siid: item?.siid, piid: item?.piid, code: item?.code, value: item?.value
        })) : null;
        console.log(JSON.stringify({result: sanitized,
            elapsed_ms: +(performance.now() - start).toFixed(2)}, null, 2));
        if (!Array.isArray(result) || result.length !== properties.length ||
            !properties.every(property => result.filter(item => item &&
                item.siid === property.siid && item.piid === property.piid &&
                item.code === 0 && typeof item.value === "number" &&
                Number.isFinite(item.value)).length === 1)) {
            throw new Error("One or more requested properties failed");
        }
        console.log("PASS: all four properties returned code 0");
    } finally {
        if (transport) await transport.shutdown();
        if (port && /^\d+$/.test(port)) {
            try {
                execFileSync("adb", ["forward", "--remove", `tcp:${port}`], {timeout: 10000});
            } catch {
                console.error(`WARNING: could not remove ADB forward tcp:${port}`);
            }
        }
    }
}

main().catch(error => {
    console.error(`${error.code ?? error.name}: ${error.message}`);
    process.exitCode = 1;
});

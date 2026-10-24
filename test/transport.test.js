"use strict";
const assert = require("node:assert/strict");
const net = require("node:net");
const test = require("node:test");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const {AvaTransport} = require("../AvaTransport");

async function fixture(t, handler, options = {}) {
    const sockets = new Set();
    const server = net.createServer(socket => {
        sockets.add(socket);
        socket.on("error", () => {});
        socket.on("close", () => sockets.delete(socket));
        let buffer = "";
        socket.on("data", chunk => {
            buffer += chunk.toString();
            assert.ok(buffer.startsWith("msg_cvt"));
            let request;
            try { request = JSON.parse(buffer.slice(7)); } catch { return; }
            handler(socket, request);
        });
    });
    await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
    const transport = new AvaTransport({
        endpoint: {host: "127.0.0.1", port: server.address().port}, ...options
    });
    t.after(async () => {
        await transport.shutdown();
        for (const socket of sockets) socket.destroy();
        if (server.listening) await new Promise(resolve => server.close(resolve));
    });
    return transport;
}

test("returns typed MIOT properties and sends the expected request", async t => {
    const params = [{siid: 3, piid: 1}];
    const result = [{siid: 3, piid: 1, value: 70, code: 0}];
    const transport = await fixture(t, (socket, request) => {
        assert.equal(request.method, "get_properties");
        assert.deepEqual(request.params, params);
        socket.end(JSON.stringify({id: request.id, result}));
    });
    assert.deepEqual(await transport.sendCommand("get_properties", params), result);
});

test("connects directly through a Unix socket", async t => {
    const directory = await fs.mkdtemp(path.join(os.tmpdir(), "x50-ava-"));
    const endpoint = {path: path.join(directory, "avacmd.socket")};
    const server = net.createServer(socket => {
        socket.on("error", () => {});
        socket.once("data", data => {
            const request = JSON.parse(data.toString().slice(7));
            socket.end(JSON.stringify({id: request.id, result: [{value: 70, code: 0}]}));
        });
    });
    const transport = new AvaTransport({endpoint});
    t.after(async () => {
        await transport.shutdown();
        await new Promise(resolve => server.close(resolve));
        await fs.rm(directory, {recursive: true, force: true});
    });
    try {
        await new Promise((resolve, reject) => {
            server.once("error", reject);
            server.listen(endpoint, () => {
                server.removeListener("error", reject);
                resolve();
            });
        });
    } catch (error) {
        if (error.code === "EPERM" || error.code === "EACCES") {
            t.skip("Execution environment forbids Unix socket listeners");
            return;
        }
        throw error;
    }
    assert.deepEqual(await transport.sendCommand("get_properties", [{siid: 3, piid: 1}]),
        [{value: 70, code: 0}]);
});

test("buffers fragmented JSON, including a split UTF-8 codepoint", async t => {
    const transport = await fixture(t, (socket, request) => {
        const body = Buffer.from(JSON.stringify({id: request.id, result: "\u2713"}));
        const split = body.indexOf(0xe2) + 1;
        socket.write(body.subarray(0, split));
        setTimeout(() => socket.end(body.subarray(split)), 5);
    });
    assert.equal(await transport.sendCommand("get_properties"), "\u2713");
});

test("preserves individual nonzero property codes", async t => {
    const result = [{siid: 999, piid: 1, code: -1}];
    const transport = await fixture(t, (socket, request) => {
        socket.end(JSON.stringify({id: request.id, result}));
    });
    assert.deepEqual(await transport.sendCommand("get_properties"), result);
});

test("rejects top-level firmware errors", async t => {
    const transport = await fixture(t, (socket, request) => {
        socket.end(JSON.stringify({id: request.id, error: {code: -1}}));
    });
    await assert.rejects(transport.sendCommand("get_properties"), {code: "FIRMWARE_ERROR"});
});

test("rejects a mismatched response ID", async t => {
    const transport = await fixture(t, socket => socket.end('{"id":999,"result":[]}'));
    await assert.rejects(transport.sendCommand("get_properties"), {code: "INVALID_RESPONSE"});
});

test("does not report an empty object as success", async t => {
    const transport = await fixture(t, socket => socket.end("{}"));
    await assert.rejects(transport.sendCommand("get_properties"), {code: "INVALID_RESPONSE"});
});

test("detects a truncated response", async t => {
    const transport = await fixture(t, socket => socket.end('{"id":'));
    await assert.rejects(transport.sendCommand("get_properties"), {code: "INCOMPLETE_RESPONSE"});
});

test("bounds stalled requests without retrying", async t => {
    let count = 0;
    const transport = await fixture(t, () => count++, {timeout: 30});
    await assert.rejects(transport.sendCommand("action", {}), {code: "TIMEOUT"});
    assert.equal(count, 1);
});

test("rejects oversized responses", async t => {
    const transport = await fixture(t, socket => socket.end("x".repeat(100)), {maxResponseBytes: 64});
    await assert.rejects(transport.sendCommand("get_properties"), {code: "RESPONSE_TOO_LARGE"});
});

test("rejects requests larger than the AVA receive buffer", async t => {
    const transport = await fixture(t, () => assert.fail("Request should not be sent"));
    await assert.rejects(transport.sendCommand("action", {value: "x".repeat(4096)}),
        {code: "REQUEST_TOO_LARGE"});
});

test("shutdown cancels pending work and prevents new requests", async t => {
    const transport = await fixture(t, () => {});
    const pending = transport.sendCommand("get_properties");
    const rejected = assert.rejects(pending, {code: "CLOSED"});
    await transport.shutdown();
    await rejected;
    await assert.rejects(transport.sendCommand("get_properties"), {code: "CLOSED"});
});

"use strict";

const net = require("node:net");

class AvaTransportError extends Error {
    constructor(code, message, response) {
        super(message);
        this.name = "AvaTransportError";
        this.code = code;
        if (response !== undefined) this.response = response;
    }
}

/**
 * Experimental AVA command transport for local integrations.
 * One connection and one write per command; no automatic retries of actions.
 */
class AvaTransport {
    constructor({endpoint = {path: "/tmp/avacmd.socket"}, timeout = 5000,
        maxResponseBytes = 4 * 1024 * 1024} = {}) {
        if (!Number.isFinite(timeout) || timeout <= 0) throw new TypeError("Invalid timeout");
        if (!Number.isSafeInteger(maxResponseBytes) || maxResponseBytes <= 0) {
            throw new TypeError("Invalid response limit");
        }
        this.endpoint = {...endpoint};
        this.timeout = timeout;
        this.maxResponseBytes = maxResponseBytes;
        this.nextId = 1;
        this.pending = new Set();
        this.closed = false;
    }

    /** Compatible with the result-returning shape of Valetudo sendCommand(). */
    async sendCommand(method, params = [], options = {}) {
        if (this.closed) throw new AvaTransportError("CLOSED", "Transport is closed");
        if (typeof method !== "string" || !/^[A-Za-z0-9_.]+$/.test(method)) {
            throw new TypeError("Invalid method");
        }
        const timeout = options.timeout ?? this.timeout;
        if (!Number.isFinite(timeout) || timeout <= 0) throw new TypeError("Invalid timeout");
        const id = this.nextId;
        this.nextId = id >= 0x7ffffffe ? 1 : id + 1;
        const request = Buffer.from("msg_cvt" + JSON.stringify({id, method, params}), "utf8");
        // node_cmd uses a zero-filled 4096-byte receive buffer and C strings.
        if (request.length > 4095) {
            throw new AvaTransportError("REQUEST_TOO_LARGE", "Request exceeds the AVA receive buffer");
        }

        return new Promise((resolve, reject) => {
            const socket = new net.Socket();
            let data = Buffer.alloc(0);
            let finished = false;
            const finish = (error, result) => {
                if (finished) return;
                finished = true;
                clearTimeout(timer);
                this.pending.delete(cancel);
                socket.destroy();
                if (error) reject(error);
                else resolve(result);
            };
            const cancel = () => finish(new AvaTransportError("CLOSED", "Transport is closed"));
            const timer = setTimeout(() => finish(new AvaTransportError("TIMEOUT",
                "AVA command timed out; completion is unknown")), timeout);
            this.pending.add(cancel);
            socket.on("error", error => finish(error));
            socket.on("end", () => finish(new AvaTransportError("INCOMPLETE_RESPONSE",
                "AVA closed the connection before a complete JSON response")));
            socket.on("close", () => finish(new AvaTransportError("INCOMPLETE_RESPONSE",
                "AVA connection closed before a complete JSON response")));
            socket.on("data", chunk => {
                if (data.length + chunk.length > this.maxResponseBytes) {
                    finish(new AvaTransportError("RESPONSE_TOO_LARGE", "AVA response exceeds the limit"));
                    return;
                }
                data = Buffer.concat([data, chunk]);
                let response;
                try {
                    response = JSON.parse(data.toString("utf8"));
                } catch {
                    // TCP/Unix stream reads may split JSON, including UTF-8 codepoints.
                    return;
                }
                if (!response || typeof response !== "object" || Array.isArray(response) || response.id !== id) {
                    finish(new AvaTransportError("INVALID_RESPONSE", "AVA response ID mismatch", response));
                } else if (Object.hasOwn(response, "error")) {
                    finish(new AvaTransportError("FIRMWARE_ERROR", "AVA returned a firmware error", response));
                } else if (!Object.hasOwn(response, "result")) {
                    finish(new AvaTransportError("INVALID_RESPONSE", "AVA response has no result", response));
                } else {
                    // Preserve per-property MIOT codes for the caller to interpret.
                    finish(null, response.result);
                }
            });
            try {
                socket.connect(this.endpoint, () => socket.write(request));
            } catch (error) {
                finish(error);
            }
        });
    }

    async shutdown() {
        this.closed = true;
        for (const cancel of [...this.pending]) cancel();
    }
}

module.exports = {AvaTransport, AvaTransportError};

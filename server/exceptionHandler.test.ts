import assert from "node:assert/strict";
import { describe, it } from "node:test";
import exceptionHandler from "./exceptionHandler.ts";

describe("exceptionHandler", () => {
    it("answers a thrown handler with JSON and does not continue routing", async () => {
        let nextCalled = false;
        let status = 0;
        let body: unknown;
        const wrapped = exceptionHandler(async () => {
            throw new Error("viewkey must not leak");
        });
        const res = {
            headersSent: false,
            status(code: number) {
                status = code;
                return this;
            },
            json(payload: unknown) {
                body = payload;
            },
        };

        wrapped({} as never, res as never, () => {
            nextCalled = true;
        });
        await new Promise((resolve) => setImmediate(resolve));

        assert.equal(nextCalled, false);
        assert.equal(status, 500);
        assert.deepEqual(body, { error: "Internal server error" });
        assert.equal(JSON.stringify(body).includes("viewkey"), false);
    });
});

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FlowTraceError = exports.FlowTraceErrorPayloadSchema = exports.FlowTraceErrorCodeSchema = void 0;
const zod_1 = require("zod");
exports.FlowTraceErrorCodeSchema = zod_1.z.enum([
    'UNAUTHENTICATED',
    'FORBIDDEN_ORG_MISMATCH',
    'RESOURCE_NOT_FOUND',
    'CLAIM_CONFLICT',
    'LEASE_EXPIRED',
    'INVALID_PAYLOAD',
    'EXECUTION_CANCELLED',
    'IDEMPOTENCY_CONFLICT',
    'RATE_LIMITED',
    'TOO_MANY_REQUESTS',
    'CALLBACK_REJECTED',
    'INTERNAL_ERROR'
]);
exports.FlowTraceErrorPayloadSchema = zod_1.z.object({
    code: exports.FlowTraceErrorCodeSchema,
    message: zod_1.z.string(),
    details: zod_1.z.record(zod_1.z.any()).optional(),
    timestamp: zod_1.z.string().datetime()
});
class FlowTraceError extends Error {
    code;
    details;
    statusCode;
    constructor(code, message, statusCode = 500, details) {
        super(message);
        this.name = 'FlowTraceError';
        this.code = code;
        this.statusCode = statusCode;
        this.details = details;
        Object.setPrototypeOf(this, FlowTraceError.prototype);
    }
    toJSON() {
        return {
            code: this.code,
            message: this.message,
            details: this.details,
            timestamp: new Date().toISOString()
        };
    }
}
exports.FlowTraceError = FlowTraceError;

import { z } from 'zod';
export declare const FlowTraceErrorCodeSchema: z.ZodEnum<["UNAUTHENTICATED", "FORBIDDEN_ORG_MISMATCH", "RESOURCE_NOT_FOUND", "CLAIM_CONFLICT", "LEASE_EXPIRED", "INVALID_PAYLOAD", "EXECUTION_CANCELLED", "IDEMPOTENCY_CONFLICT", "RATE_LIMITED", "TOO_MANY_REQUESTS", "CALLBACK_REJECTED", "INTERNAL_ERROR"]>;
export type FlowTraceErrorCode = z.infer<typeof FlowTraceErrorCodeSchema>;
export declare const FlowTraceErrorPayloadSchema: z.ZodObject<{
    code: z.ZodEnum<["UNAUTHENTICATED", "FORBIDDEN_ORG_MISMATCH", "RESOURCE_NOT_FOUND", "CLAIM_CONFLICT", "LEASE_EXPIRED", "INVALID_PAYLOAD", "EXECUTION_CANCELLED", "IDEMPOTENCY_CONFLICT", "RATE_LIMITED", "TOO_MANY_REQUESTS", "CALLBACK_REJECTED", "INTERNAL_ERROR"]>;
    message: z.ZodString;
    details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    timestamp: z.ZodString;
}, "strip", z.ZodTypeAny, {
    code: "UNAUTHENTICATED" | "FORBIDDEN_ORG_MISMATCH" | "RESOURCE_NOT_FOUND" | "CLAIM_CONFLICT" | "LEASE_EXPIRED" | "INVALID_PAYLOAD" | "EXECUTION_CANCELLED" | "IDEMPOTENCY_CONFLICT" | "RATE_LIMITED" | "TOO_MANY_REQUESTS" | "CALLBACK_REJECTED" | "INTERNAL_ERROR";
    message: string;
    timestamp: string;
    details?: Record<string, any> | undefined;
}, {
    code: "UNAUTHENTICATED" | "FORBIDDEN_ORG_MISMATCH" | "RESOURCE_NOT_FOUND" | "CLAIM_CONFLICT" | "LEASE_EXPIRED" | "INVALID_PAYLOAD" | "EXECUTION_CANCELLED" | "IDEMPOTENCY_CONFLICT" | "RATE_LIMITED" | "TOO_MANY_REQUESTS" | "CALLBACK_REJECTED" | "INTERNAL_ERROR";
    message: string;
    timestamp: string;
    details?: Record<string, any> | undefined;
}>;
export type FlowTraceErrorPayload = z.infer<typeof FlowTraceErrorPayloadSchema>;
export declare class FlowTraceError extends Error {
    readonly code: FlowTraceErrorCode;
    readonly details?: Record<string, any>;
    readonly statusCode: number;
    constructor(code: FlowTraceErrorCode, message: string, statusCode?: number, details?: Record<string, any>);
    toJSON(): FlowTraceErrorPayload;
}

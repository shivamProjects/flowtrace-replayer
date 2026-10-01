"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateAutomationScheduleSchema = exports.AutomationScheduleSchema = exports.CompleteCallbackPayloadSchema = exports.ErrorCallbackPayloadSchema = exports.OutputsCallbackPayloadSchema = exports.HeartbeatCallbackPayloadSchema = exports.HealSkippedCallbackPayloadSchema = exports.HealCallbackPayloadSchema = exports.StepCallbackPayloadSchema = exports.WorkClaimResponseSchema = exports.WorkClaimRunDetailsSchema = exports.WorkClaimRequestSchema = exports.CapturedOutputSchema = exports.RepairRecordSchema = exports.ExecutionResponseSchema = exports.ExecutionDispatchPayloadSchema = exports.ExecutionStepResultSchema = exports.RecordingSchema = exports.RecordingVersionSchema = exports.RecordingStepSchema = exports.ParameterDefSchema = exports.ParameterTypeSchema = exports.ExecutionStatusSchema = exports.StepStatusSchema = exports.StepActionSchema = void 0;
const zod_1 = require("zod");
// ============================================================================
// FlowTrace Zod Schemas & Domain Contracts (V2.1 Ratified)
// ============================================================================
exports.StepActionSchema = zod_1.z.enum([
    'click',
    'fill',
    'select',
    'check',
    'uncheck',
    'press',
    'hover',
    'navigate',
    'assert',
    'wait',
    'custom'
]);
exports.StepStatusSchema = zod_1.z.enum([
    'success',
    'warn',
    'failed',
    'skipped',
    'PASSED',
    'FAILED',
    'SKIPPED',
    'WARN'
]);
exports.ExecutionStatusSchema = zod_1.z.enum([
    'QUEUED',
    'RUNNING',
    'CANCELLING',
    'PASSED',
    'FAILED',
    'CANCELLED',
    'TIMED_OUT',
    // Backward compatibility aliases
    'PENDING',
    'REPAIRED',
    'ERRORED'
]);
exports.ParameterTypeSchema = zod_1.z.enum([
    'STRING',
    'NUMBER',
    'BOOLEAN',
    'DATE',
    'PASSWORD',
    'SECRET_REF',
    'LOV_SELECT'
]);
exports.ParameterDefSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    label: zod_1.z.string().optional(),
    type: exports.ParameterTypeSchema.default('STRING'),
    required: zod_1.z.boolean().default(false),
    defaultValue: zod_1.z.any().optional(),
    description: zod_1.z.string().optional(),
    stepIndices: zod_1.z.array(zod_1.z.number().int().nonnegative()).default([]),
    lovOptions: zod_1.z.array(zod_1.z.string()).optional()
});
exports.RecordingStepSchema = zod_1.z.object({
    index: zod_1.z.number().int().nonnegative(),
    action: exports.StepActionSchema,
    selector: zod_1.z.string().min(1),
    value: zod_1.z.any().optional(),
    url: zod_1.z.string().optional(),
    label: zod_1.z.string().optional(),
    section: zod_1.z.string().optional(),
    timestamp: zod_1.z.string().optional(),
    screenshotPath: zod_1.z.string().optional(),
    isParameterized: zod_1.z.boolean().default(false),
    parameterName: zod_1.z.string().optional()
});
exports.RecordingVersionSchema = zod_1.z.object({
    id: zod_1.z.string().uuid().optional(),
    recordingId: zod_1.z.string().uuid(),
    versionNumber: zod_1.z.number().int().positive(),
    rawSteps: zod_1.z.array(exports.RecordingStepSchema),
    normalizedSteps: zod_1.z.array(exports.RecordingStepSchema).optional(),
    parameterSchema: zod_1.z.array(exports.ParameterDefSchema).default([]),
    checksum: zod_1.z.string(),
    patchId: zod_1.z.string().default('generic'),
    sourceUrl: zod_1.z.string().optional(),
    stepCount: zod_1.z.number().int().nonnegative(),
    createdBy: zod_1.z.string(),
    createdAt: zod_1.z.string().datetime().optional()
});
exports.RecordingSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    workspaceId: zod_1.z.string().min(1),
    applicationId: zod_1.z.string().min(1),
    name: zod_1.z.string().min(1),
    description: zod_1.z.string().nullable().optional(),
    tags: zod_1.z.array(zod_1.z.string()).default([]),
    currentVersionId: zod_1.z.string().uuid().nullable().optional(),
    status: zod_1.z.enum(['ACTIVE', 'DRAFT', 'ARCHIVED']).default('ACTIVE'),
    createdBy: zod_1.z.string(),
    createdAt: zod_1.z.string().datetime(),
    updatedAt: zod_1.z.string().datetime()
});
exports.ExecutionStepResultSchema = zod_1.z.object({
    id: zod_1.z.string().uuid().optional(),
    executionId: zod_1.z.string().uuid(),
    stepIndex: zod_1.z.number().int().nonnegative(),
    action: zod_1.z.string(),
    description: zod_1.z.string().optional(),
    selector: zod_1.z.string().optional(),
    status: exports.StepStatusSchema,
    durationMs: zod_1.z.number().int().nonnegative().optional(),
    startedAt: zod_1.z.string().datetime().optional(),
    endedAt: zod_1.z.string().datetime().optional(),
    error: zod_1.z.string().optional(),
    recovery: zod_1.z.record(zod_1.z.any()).optional(),
    viaAi: zod_1.z.boolean().default(false),
    errorType: zod_1.z.string().optional(),
    screenshotStorageKey: zod_1.z.string().optional()
});
exports.ExecutionDispatchPayloadSchema = zod_1.z.object({
    workspaceId: zod_1.z.string().min(1),
    recordingId: zod_1.z.string().uuid(),
    versionNumber: zod_1.z.number().int().positive().optional(),
    environmentId: zod_1.z.string().uuid(),
    parameterValues: zod_1.z.record(zod_1.z.any()).default({}),
    triggerSource: zod_1.z.enum(['UI', 'API', 'SCHEDULE', 'PLATFORM_CHAIN', 'RELEASE_TEST']).default('API'),
    captureScreenshots: zod_1.z.boolean().default(true),
    generatePdfReport: zod_1.z.boolean().default(false),
    externalCorrelationId: zod_1.z.string().optional(),
    callbackUrl: zod_1.z.string().url().optional(),
    callbackToken: zod_1.z.string().optional()
});
exports.ExecutionResponseSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    workspaceId: zod_1.z.string(),
    recordingId: zod_1.z.string().uuid(),
    recordingVersionId: zod_1.z.string().uuid().optional(),
    environmentId: zod_1.z.string().uuid().nullable().optional(),
    status: exports.ExecutionStatusSchema,
    healed: zod_1.z.boolean().default(false),
    healCount: zod_1.z.number().int().nonnegative().default(0),
    parameterSnapshot: zod_1.z.record(zod_1.z.any()).default({}),
    durationMs: zod_1.z.number().nullable().optional(),
    errorMessage: zod_1.z.string().nullable().optional(),
    startedAt: zod_1.z.string().datetime().nullable().optional(),
    completedAt: zod_1.z.string().datetime().nullable().optional(),
    externalCorrelationId: zod_1.z.string().nullable().optional(),
    createdAt: zod_1.z.string().datetime()
});
exports.RepairRecordSchema = zod_1.z.object({
    id: zod_1.z.string().uuid().optional(),
    workspaceId: zod_1.z.string(),
    recordingId: zod_1.z.string().uuid(),
    stepIndex: zod_1.z.number().int().nonnegative(),
    brokenSelector: zod_1.z.string(),
    repairedSelector: zod_1.z.string(),
    recoveryStrategy: zod_1.z.string(),
    confidenceScore: zod_1.z.number().min(0).max(1).optional(),
    evidence: zod_1.z.record(zod_1.z.any()).default({}),
    status: zod_1.z.enum(['PENDING_REVIEW', 'APPROVED', 'AUTO_APPLIED', 'REJECTED', 'REVERTED']).default('AUTO_APPLIED'),
    reviewedBy: zod_1.z.string().optional(),
    reviewedAt: zod_1.z.string().datetime().optional(),
    createdAt: zod_1.z.string().datetime().optional()
});
exports.CapturedOutputSchema = zod_1.z.object({
    id: zod_1.z.string().uuid().optional(),
    executionId: zod_1.z.string().uuid(),
    stepIndex: zod_1.z.number().int().nonnegative(),
    outputName: zod_1.z.string().min(1),
    outputValue: zod_1.z.string(),
    dataType: zod_1.z.string().default('STRING'),
    createdAt: zod_1.z.string().datetime().optional()
});
// ============================================================================
// Worker Claim & Dispatch Contracts (Model A: runs as durable queue)
// ============================================================================
exports.WorkClaimRequestSchema = zod_1.z.object({
    workerNodeId: zod_1.z.string().min(1),
    supportedEngines: zod_1.z.array(zod_1.z.string()).default(['playwright']),
    maxConcurrent: zod_1.z.number().int().positive().default(1)
});
exports.WorkClaimRunDetailsSchema = zod_1.z.object({
    runId: zod_1.z.string().uuid(),
    orgId: zod_1.z.string().uuid(),
    recordingId: zod_1.z.string().uuid(),
    recordingVersionId: zod_1.z.string().uuid().optional(),
    environmentId: zod_1.z.string().uuid().nullable().optional(),
    parameterValues: zod_1.z.record(zod_1.z.any()).default({}),
    rawSteps: zod_1.z.array(exports.RecordingStepSchema),
    normalizedSteps: zod_1.z.array(exports.RecordingStepSchema).optional(),
    baseUrl: zod_1.z.string().url().optional(),
    executionToken: zod_1.z.string(),
    leaseExpiresAt: zod_1.z.string().datetime()
});
exports.WorkClaimResponseSchema = zod_1.z.object({
    claimed: zod_1.z.boolean(),
    run: exports.WorkClaimRunDetailsSchema.nullable().optional()
});
// ============================================================================
// Reconciled Callback Contracts (Worker -> Control Plane)
// ============================================================================
exports.StepCallbackPayloadSchema = zod_1.z.object({
    runId: zod_1.z.string().uuid(),
    stepIndex: zod_1.z.number().int().nonnegative(),
    action: zod_1.z.string(),
    status: zod_1.z.enum(['PASSED', 'FAILED', 'SKIPPED', 'WARN', 'passed', 'failed', 'skipped', 'warn']),
    durationMs: zod_1.z.number().int().nonnegative().optional(),
    error: zod_1.z.string().optional(),
    errorType: zod_1.z.string().optional(),
    failureStage: zod_1.z.string().optional(),
    screenshotKey: zod_1.z.string().optional(),
    screenshotBase64: zod_1.z.string().optional()
});
exports.HealCallbackPayloadSchema = zod_1.z.object({
    runId: zod_1.z.string().uuid(),
    stepIndex: zod_1.z.number().int().nonnegative(),
    healApplied: zod_1.z.boolean().default(true),
    healMethod: zod_1.z.string(),
    healConfidence: zod_1.z.union([zod_1.z.number(), zod_1.z.string()]).optional(),
    healFrom: zod_1.z.string(),
    healTo: zod_1.z.string(),
    recoveryJson: zod_1.z.record(zod_1.z.any()).optional()
});
exports.HealSkippedCallbackPayloadSchema = zod_1.z.object({
    runId: zod_1.z.string().uuid(),
    stepIndex: zod_1.z.number().int().nonnegative(),
    healSkippedReason: zod_1.z.string(),
    attemptedMethod: zod_1.z.string().optional()
});
exports.HeartbeatCallbackPayloadSchema = zod_1.z.object({
    runId: zod_1.z.string().uuid(),
    workerNodeId: zod_1.z.string(),
    currentStepIndex: zod_1.z.number().int().nonnegative().optional(),
    timestamp: zod_1.z.string().datetime().optional()
});
exports.OutputsCallbackPayloadSchema = zod_1.z.object({
    runId: zod_1.z.string().uuid(),
    outputs: zod_1.z.union([
        zod_1.z.record(zod_1.z.union([zod_1.z.string(), zod_1.z.number(), zod_1.z.boolean(), zod_1.z.null()])),
        zod_1.z.array(zod_1.z.object({
            name: zod_1.z.string(),
            value: zod_1.z.string().nullable(),
            dataType: zod_1.z.string().optional()
        }))
    ])
});
exports.ErrorCallbackPayloadSchema = zod_1.z.object({
    runId: zod_1.z.string().uuid(),
    error: zod_1.z.string(),
    errorType: zod_1.z.string().optional(),
    stepIndex: zod_1.z.number().int().nonnegative().optional(),
    evidenceKey: zod_1.z.string().optional()
});
exports.CompleteCallbackPayloadSchema = zod_1.z.object({
    runId: zod_1.z.string().uuid(),
    status: zod_1.z.enum(['PASSED', 'FAILED', 'passed', 'failed', 'CANCELLED', 'cancelled']),
    durationMs: zod_1.z.number().int().nonnegative().optional(),
    healed: zod_1.z.boolean().default(false),
    healCount: zod_1.z.number().int().nonnegative().default(0),
    errorMessage: zod_1.z.string().optional()
});
exports.AutomationScheduleSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    orgId: zod_1.z.string().uuid().optional(),
    name: zod_1.z.string().min(1),
    description: zod_1.z.string().optional(),
    suiteId: zod_1.z.string().uuid().nullable().optional(),
    recordingId: zod_1.z.string().uuid().nullable().optional(),
    environmentId: zod_1.z.string().uuid().nullable().optional(),
    cronExpression: zod_1.z.string().min(1),
    timezone: zod_1.z.string().default('UTC'),
    parameters: zod_1.z.record(zod_1.z.any()).default({}),
    enabled: zod_1.z.boolean().default(true),
    nextRunAt: zod_1.z.string().datetime().nullable().optional(),
    lastRunAt: zod_1.z.string().datetime().nullable().optional(),
    lastRunStatus: zod_1.z.string().nullable().optional(),
    createdAt: zod_1.z.string().datetime().optional(),
    updatedAt: zod_1.z.string().datetime().optional()
});
exports.CreateAutomationScheduleSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    description: zod_1.z.string().optional(),
    suiteId: zod_1.z.string().uuid().optional(),
    recordingId: zod_1.z.string().uuid().optional(),
    environmentId: zod_1.z.string().uuid().optional(),
    cronExpression: zod_1.z.string().min(1),
    timezone: zod_1.z.string().default('UTC'),
    parameters: zod_1.z.record(zod_1.z.any()).default({}),
    enabled: zod_1.z.boolean().default(true)
}).refine(data => data.suiteId || data.recordingId, {
    message: 'Either suiteId or recordingId must be provided'
});

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExecutionResultSchema = exports.ExecutionArtifactDescriptorSchema = exports.ExecutionEventSchema = exports.ExecutionRequestSchema = exports.ExecutionEnvironmentSchema = exports.StepExecutionResultSchema = exports.HealRecordSchema = exports.StepExecutionStatusSchema = exports.ReplayVerdictSchema = exports.ReplayErrorCategorySchema = exports.RecordingEnvelopeSchema = exports.AdapterDecisionSchema = exports.SemanticCandidateSchema = exports.SemanticStepV2Schema = exports.AssertSnapshotStepSchema = exports.AssertCheckedStepSchema = exports.AssertValueStepSchema = exports.AssertTextStepSchema = exports.AssertVisibleStepSchema = exports.WaitStepSchema = exports.CopyStepSchema = exports.HoverStepSchema = exports.ScrollStepSchema = exports.SetInputFilesStepSchema = exports.UncheckStepSchema = exports.CheckStepSchema = exports.PressStepSchema = exports.LovSelectStepSchema = exports.SelectOptionStepSchema = exports.FillStepSchema = exports.DblClickStepSchema = exports.ClickStepSchema = exports.NavigateStepSchema = exports.PointerPositionSchema = exports.KeyModifiersSchema = exports.StepEffectSchema = exports.RecordedLocatorSchema = exports.SurfaceInfoSchema = exports.FrameIdentitySchema = exports.FrameLocatorSegmentSchema = exports.RecorderCapabilitySchema = exports.ProducerProvenanceSchema = exports.ProducerKindSchema = exports.ProtocolVersionSchema = void 0;
const zod_1 = require("zod");
// ============================================================================
// @flowtrace/protocol V2 — Canonical Protocol & Capability Envelope (Ratified)
// ============================================================================
exports.ProtocolVersionSchema = zod_1.z.literal('2.0');
exports.ProducerKindSchema = zod_1.z.enum(['extension', 'desktop', 'custom']);
exports.ProducerProvenanceSchema = zod_1.z.object({
    kind: exports.ProducerKindSchema,
    version: zod_1.z.string().min(1),
    platform: zod_1.z.string().optional(),
});
exports.RecorderCapabilitySchema = zod_1.z.enum([
    'multiSurface',
    'nestedFrames',
    'downloads',
    'detachedFileInput',
    'evidenceScreenshots',
    'oracleADF',
    'oracleJET',
    'redwood',
]);
exports.FrameLocatorSegmentSchema = zod_1.z.object({
    selector: zod_1.z.string(),
    name: zod_1.z.string().optional(),
    url: zod_1.z.string().optional(),
    index: zod_1.z.number().int().nonnegative().optional(),
});
exports.FrameIdentitySchema = zod_1.z.object({
    hostFrameId: zod_1.z.string(),
    hostDocumentId: zod_1.z.string().optional(),
    parentHostFrameId: zod_1.z.string().optional(),
    surfaceId: zod_1.z.string(),
    url: zod_1.z.string().optional(),
    name: zod_1.z.string().optional(),
    locatorPath: zod_1.z.array(exports.FrameLocatorSegmentSchema).optional(),
});
exports.SurfaceInfoSchema = zod_1.z.object({
    surfaceId: zod_1.z.string().uuid(),
    hostSurfaceId: zod_1.z.string(),
    type: zod_1.z.enum(['tab', 'popup', 'window', 'webview']),
    openerSurfaceId: zod_1.z.string().optional(),
    url: zod_1.z.string(),
    title: zod_1.z.string().optional(),
});
exports.RecordedLocatorSchema = zod_1.z.object({
    selector: zod_1.z.string().optional(),
    primary: zod_1.z.string().optional(),
    name: zod_1.z.string().optional(),
    label: zod_1.z.string().optional(),
    role: zod_1.z.string().optional(),
    attrSelector: zod_1.z.string().optional(),
    testId: zod_1.z.string().optional(),
    componentId: zod_1.z.string().optional(),
    candidates: zod_1.z.array(zod_1.z.string()).optional(),
    backupSelectors: zod_1.z.array(zod_1.z.string()).optional(),
});
exports.StepEffectSchema = zod_1.z.object({
    type: zod_1.z.string(),
    targetUrl: zod_1.z.string().optional(),
    surfaceId: zod_1.z.string().optional(),
    timestamp: zod_1.z.number().optional(),
    details: zod_1.z.record(zod_1.z.any()).optional(),
});
const BaseStepFields = {
    surfaceId: zod_1.z.string().optional(),
    frame: zod_1.z.union([
        zod_1.z.string(),
        zod_1.z.object({
            url: zod_1.z.string().optional(),
            name: zod_1.z.string().optional(),
            selector: zod_1.z.string().optional(),
            path: zod_1.z.array(zod_1.z.string()).optional(),
        }),
    ]).optional(),
    locator: exports.RecordedLocatorSchema.optional(),
    description: zod_1.z.string().optional(),
    skipInReport: zod_1.z.boolean().default(false),
    required: zod_1.z.boolean().optional(),
    requiredSource: zod_1.z.string().optional(),
    requiredScope: zod_1.z.string().optional(),
    effects: zod_1.z.array(exports.StepEffectSchema).optional(),
    meta: zod_1.z.record(zod_1.z.any()).optional(),
};
exports.KeyModifiersSchema = zod_1.z.object({
    alt: zod_1.z.boolean().optional(),
    control: zod_1.z.boolean().optional(),
    meta: zod_1.z.boolean().optional(),
    shift: zod_1.z.boolean().optional(),
});
exports.PointerPositionSchema = zod_1.z.object({
    x: zod_1.z.number(),
    y: zod_1.z.number(),
});
// Discriminated Action Step Schemas
exports.NavigateStepSchema = zod_1.z.object({
    ...BaseStepFields,
    action: zod_1.z.literal('navigate'),
    value: zod_1.z.string().min(1),
});
exports.ClickStepSchema = zod_1.z.object({
    ...BaseStepFields,
    action: zod_1.z.literal('click'),
    button: zod_1.z.enum(['left', 'right', 'middle']).optional(),
    clickCount: zod_1.z.number().int().positive().optional(),
    modifiers: exports.KeyModifiersSchema.optional(),
    position: exports.PointerPositionSchema.optional(),
});
exports.DblClickStepSchema = zod_1.z.object({
    ...BaseStepFields,
    action: zod_1.z.literal('dblclick'),
    clickCount: zod_1.z.number().int().positive().default(2),
    modifiers: exports.KeyModifiersSchema.optional(),
    position: exports.PointerPositionSchema.optional(),
});
exports.FillStepSchema = zod_1.z.object({
    ...BaseStepFields,
    action: zod_1.z.literal('fill'),
    value: zod_1.z.string().optional(),
    committedValue: zod_1.z.string().optional(),
    credentialRef: zod_1.z.string().optional(),
});
exports.SelectOptionStepSchema = zod_1.z.object({
    ...BaseStepFields,
    action: zod_1.z.literal('selectOption'),
    value: zod_1.z.string().optional(),
    values: zod_1.z.array(zod_1.z.string()).optional(),
    optionIndex: zod_1.z.number().int().nonnegative().optional(),
});
exports.LovSelectStepSchema = zod_1.z.object({
    ...BaseStepFields,
    action: zod_1.z.literal('lovSelect'),
    value: zod_1.z.string().min(1),
    optionIndex: zod_1.z.number().int().nonnegative().optional(),
});
exports.PressStepSchema = zod_1.z.object({
    ...BaseStepFields,
    action: zod_1.z.literal('press'),
    key: zod_1.z.string().min(1),
    modifiers: exports.KeyModifiersSchema.optional(),
});
exports.CheckStepSchema = zod_1.z.object({
    ...BaseStepFields,
    action: zod_1.z.literal('check'),
    checked: zod_1.z.literal(true).default(true),
});
exports.UncheckStepSchema = zod_1.z.object({
    ...BaseStepFields,
    action: zod_1.z.literal('uncheck'),
    checked: zod_1.z.literal(false).default(false),
});
exports.SetInputFilesStepSchema = zod_1.z.object({
    ...BaseStepFields,
    action: zod_1.z.literal('setInputFiles'),
    files: zod_1.z.array(zod_1.z.string()).min(1),
    value: zod_1.z.string().optional(),
});
exports.ScrollStepSchema = zod_1.z.object({
    ...BaseStepFields,
    action: zod_1.z.literal('scroll'),
    deltaX: zod_1.z.number().optional(),
    deltaY: zod_1.z.number().optional(),
});
exports.HoverStepSchema = zod_1.z.object({
    ...BaseStepFields,
    action: zod_1.z.literal('hover'),
    position: exports.PointerPositionSchema.optional(),
});
exports.CopyStepSchema = zod_1.z.object({
    ...BaseStepFields,
    action: zod_1.z.literal('copy'),
    outputName: zod_1.z.string().optional(),
    value: zod_1.z.string().optional(),
});
exports.WaitStepSchema = zod_1.z.object({
    ...BaseStepFields,
    action: zod_1.z.literal('wait'),
    durationMs: zod_1.z.number().positive(),
});
exports.AssertVisibleStepSchema = zod_1.z.object({
    ...BaseStepFields,
    action: zod_1.z.literal('assertVisible'),
});
exports.AssertTextStepSchema = zod_1.z.object({
    ...BaseStepFields,
    action: zod_1.z.literal('assertText'),
    value: zod_1.z.string(),
});
exports.AssertValueStepSchema = zod_1.z.object({
    ...BaseStepFields,
    action: zod_1.z.literal('assertValue'),
    value: zod_1.z.string(),
});
exports.AssertCheckedStepSchema = zod_1.z.object({
    ...BaseStepFields,
    action: zod_1.z.literal('assertChecked'),
    checked: zod_1.z.boolean(),
});
exports.AssertSnapshotStepSchema = zod_1.z.object({
    ...BaseStepFields,
    action: zod_1.z.literal('assertSnapshot'),
    snapshot: zod_1.z.string(),
});
// Canonical Action Discriminated Union
exports.SemanticStepV2Schema = zod_1.z.discriminatedUnion('action', [
    exports.NavigateStepSchema,
    exports.ClickStepSchema,
    exports.DblClickStepSchema,
    exports.FillStepSchema,
    exports.SelectOptionStepSchema,
    exports.LovSelectStepSchema,
    exports.PressStepSchema,
    exports.CheckStepSchema,
    exports.UncheckStepSchema,
    exports.SetInputFilesStepSchema,
    exports.ScrollStepSchema,
    exports.HoverStepSchema,
    exports.CopyStepSchema,
    exports.WaitStepSchema,
    exports.AssertVisibleStepSchema,
    exports.AssertTextStepSchema,
    exports.AssertValueStepSchema,
    exports.AssertCheckedStepSchema,
    exports.AssertSnapshotStepSchema,
]);
// SemanticCandidate represents in-flight uncommitted candidate during enrichment
exports.SemanticCandidateSchema = zod_1.z.object({
    action: zod_1.z.string(),
    surfaceId: zod_1.z.string().optional(),
    frame: zod_1.z.any().optional(),
    locator: exports.RecordedLocatorSchema.optional(),
    value: zod_1.z.any().optional(),
    values: zod_1.z.array(zod_1.z.string()).optional(),
    key: zod_1.z.string().optional(),
    button: zod_1.z.enum(['left', 'right', 'middle']).optional(),
    clickCount: zod_1.z.number().int().positive().optional(),
    modifiers: exports.KeyModifiersSchema.optional(),
    position: exports.PointerPositionSchema.optional(),
    checked: zod_1.z.boolean().optional(),
    files: zod_1.z.array(zod_1.z.string()).optional(),
    committedValue: zod_1.z.string().optional(),
    credentialRef: zod_1.z.string().optional(),
    description: zod_1.z.string().optional(),
    outputName: zod_1.z.string().optional(),
    skipInReport: zod_1.z.boolean().default(false),
    required: zod_1.z.boolean().optional(),
    requiredSource: zod_1.z.string().optional(),
    requiredScope: zod_1.z.string().optional(),
    effects: zod_1.z.array(exports.StepEffectSchema).optional(),
    meta: zod_1.z.record(zod_1.z.any()).optional(),
});
exports.AdapterDecisionSchema = zod_1.z.discriminatedUnion('kind', [
    zod_1.z.object({
        kind: zod_1.z.literal('pass'),
    }),
    zod_1.z.object({
        kind: zod_1.z.literal('claim'),
        candidate: exports.SemanticCandidateSchema,
    }),
    zod_1.z.object({
        kind: zod_1.z.literal('augment'),
        patch: exports.SemanticCandidateSchema.partial(),
    }),
    zod_1.z.object({
        kind: zod_1.z.literal('ignore'),
        reason: zod_1.z.string(),
    }),
]);
exports.RecordingEnvelopeSchema = zod_1.z.object({
    protocolVersion: exports.ProtocolVersionSchema,
    recordingSessionId: zod_1.z.string().uuid(),
    recordedAt: zod_1.z.string().datetime().or(zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}T/)),
    producer: exports.ProducerProvenanceSchema,
    capabilities: zod_1.z.array(exports.RecorderCapabilitySchema).default([]),
    meta: zod_1.z.object({
        name: zod_1.z.string().optional(),
        description: zod_1.z.string().optional(),
        sourceUrl: zod_1.z.string().min(1),
        patchId: zod_1.z.string().default('generic'),
    }),
    steps: zod_1.z.array(exports.SemanticStepV2Schema),
});
// ============================================================================
// Execution Protocol & Replayer Schemas (Ratified Contract)
// ============================================================================
exports.ReplayErrorCategorySchema = zod_1.z.enum([
    'SELECTOR_NOT_FOUND',
    'TIMEOUT',
    'NAVIGATION_FAILED',
    'ASSERTION_FAILED',
    'AUTH_REQUIRED',
    'COMMIT_REFUSAL',
    'FRAME_DETACHED',
    'SURFACE_UNAVAILABLE',
    'UNSUPPORTED_ACTION',
    'INTERNAL_ERROR',
]);
exports.ReplayVerdictSchema = zod_1.z.object({
    category: exports.ReplayErrorCategorySchema,
    message: zod_1.z.string(),
    recoverable: zod_1.z.boolean().default(false),
    details: zod_1.z.record(zod_1.z.any()).optional(),
});
exports.StepExecutionStatusSchema = zod_1.z.enum([
    'success',
    'failed',
    'skipped',
    'warn',
]);
exports.HealRecordSchema = zod_1.z.object({
    attempted: zod_1.z.boolean(),
    applied: zod_1.z.boolean().optional(),
    skipped: zod_1.z.boolean().optional(),
    reason: zod_1.z.string().optional(),
    candidate: zod_1.z.any().optional(),
    fixType: zod_1.z.string().optional(),
});
exports.StepExecutionResultSchema = zod_1.z.object({
    stepIndex: zod_1.z.number().int().nonnegative(),
    status: exports.StepExecutionStatusSchema,
    durationMs: zod_1.z.number().nonnegative(),
    action: zod_1.z.string(),
    error: zod_1.z.string().nullable().optional(),
    verdict: exports.ReplayVerdictSchema.optional(),
    heal: exports.HealRecordSchema.optional(),
    screenshotKey: zod_1.z.string().optional(),
    extractedOutputs: zod_1.z.record(zod_1.z.string().nullable()).optional(),
});
exports.ExecutionEnvironmentSchema = zod_1.z.object({
    baseUrl: zod_1.z.string().optional(),
    credentials: zod_1.z.record(zod_1.z.string()).optional(),
    headers: zod_1.z.record(zod_1.z.string()).optional(),
    viewport: zod_1.z.object({
        width: zod_1.z.number().int().positive(),
        height: zod_1.z.number().int().positive(),
    }).optional(),
});
exports.ExecutionRequestSchema = zod_1.z.object({
    jobExecutionId: zod_1.z.string().min(1),
    runId: zod_1.z.string().uuid().optional(),
    recordingId: zod_1.z.string().uuid().optional(),
    suiteId: zod_1.z.string().uuid().optional(),
    steps: zod_1.z.array(zod_1.z.union([exports.SemanticStepV2Schema, zod_1.z.record(zod_1.z.any())])),
    patchId: zod_1.z.string().default('generic'),
    schemaVersion: zod_1.z.string().default('2.0'),
    parameters: zod_1.z.record(zod_1.z.string()).optional(),
    knownErrorTypes: zod_1.z.array(zod_1.z.string()).optional(),
    captureScreenshots: zod_1.z.boolean().default(false),
    callbackUrl: zod_1.z.string().url().optional(),
    callbackToken: zod_1.z.string().optional(),
    timeoutMs: zod_1.z.number().positive().optional(),
    environment: exports.ExecutionEnvironmentSchema.optional(),
});
exports.ExecutionEventSchema = zod_1.z.discriminatedUnion('type', [
    zod_1.z.object({
        type: zod_1.z.literal('step-started'),
        jobExecutionId: zod_1.z.string(),
        runId: zod_1.z.string().optional(),
        stepIndex: zod_1.z.number().int().nonnegative(),
        action: zod_1.z.string(),
        timestamp: zod_1.z.string().optional(),
    }),
    zod_1.z.object({
        type: zod_1.z.literal('step-completed'),
        jobExecutionId: zod_1.z.string(),
        runId: zod_1.z.string().optional(),
        stepIndex: zod_1.z.number().int().nonnegative(),
        status: exports.StepExecutionStatusSchema,
        durationMs: zod_1.z.number().nonnegative(),
        error: zod_1.z.string().nullable().optional(),
        verdict: exports.ReplayVerdictSchema.optional(),
        heal: exports.HealRecordSchema.optional(),
        timestamp: zod_1.z.string().optional(),
    }),
    zod_1.z.object({
        type: zod_1.z.literal('heal-attempted'),
        jobExecutionId: zod_1.z.string(),
        runId: zod_1.z.string().optional(),
        stepIndex: zod_1.z.number().int().nonnegative(),
        candidate: zod_1.z.any().optional(),
        timestamp: zod_1.z.string().optional(),
    }),
    zod_1.z.object({
        type: zod_1.z.literal('heal-skipped'),
        jobExecutionId: zod_1.z.string(),
        runId: zod_1.z.string().optional(),
        stepIndex: zod_1.z.number().int().nonnegative(),
        reason: zod_1.z.string(),
        candidate: zod_1.z.any().optional(),
        timestamp: zod_1.z.string().optional(),
    }),
    zod_1.z.object({
        type: zod_1.z.literal('heartbeat'),
        jobExecutionId: zod_1.z.string(),
        runId: zod_1.z.string().optional(),
        timestamp: zod_1.z.string().optional(),
    }),
    zod_1.z.object({
        type: zod_1.z.literal('complete'),
        jobExecutionId: zod_1.z.string(),
        runId: zod_1.z.string().optional(),
        success: zod_1.z.boolean(),
        durationMs: zod_1.z.number().nonnegative(),
        stepCount: zod_1.z.number().int().nonnegative(),
        results: zod_1.z.array(exports.StepExecutionResultSchema),
        outputs: zod_1.z.record(zod_1.z.string().nullable()).optional(),
        error: zod_1.z.string().nullable().optional(),
        timestamp: zod_1.z.string().optional(),
    }),
]);
exports.ExecutionArtifactDescriptorSchema = zod_1.z.object({
    kind: zod_1.z.enum(['trace', 'video', 'screenshot', 'har', 'log']),
    storageKey: zod_1.z.string().min(1),
    bytes: zod_1.z.number().int().nonnegative().optional(),
});
exports.ExecutionResultSchema = zod_1.z.object({
    jobExecutionId: zod_1.z.string().min(1),
    runId: zod_1.z.string().uuid().optional(),
    success: zod_1.z.boolean(),
    durationMs: zod_1.z.number().nonnegative(),
    stepCount: zod_1.z.number().int().nonnegative(),
    results: zod_1.z.array(exports.StepExecutionResultSchema),
    outputs: zod_1.z.record(zod_1.z.string().nullable()).default({}),
    error: zod_1.z.string().nullable().optional(),
    verdict: exports.ReplayVerdictSchema.optional(),
    artifacts: zod_1.z.array(exports.ExecutionArtifactDescriptorSchema).optional(),
});

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const index_1 = require("../index");
(0, vitest_1.describe)('@flowtrace/contracts compatibility suite', () => {
    (0, vitest_1.it)('parses valid Platform execution dispatch payload', () => {
        const parsed = index_1.ExecutionDispatchPayloadSchema.parse(index_1.validPlatformDispatchFixture);
        (0, vitest_1.expect)(parsed.triggerSource).toBe('PLATFORM_CHAIN');
        (0, vitest_1.expect)(parsed.parameterValues.invoiceNumber).toBe('INV-2026-9994');
    });
    (0, vitest_1.it)('parses worker claim request and response', () => {
        const req = index_1.WorkClaimRequestSchema.parse(index_1.validWorkClaimRequestFixture);
        (0, vitest_1.expect)(req.workerNodeId).toBe('worker-node-eu-west-1a-04');
        const res = index_1.WorkClaimResponseSchema.parse(index_1.validWorkClaimResponseFixture);
        (0, vitest_1.expect)(res.claimed).toBe(true);
        (0, vitest_1.expect)(res.run?.rawSteps).toHaveLength(2);
    });
    (0, vitest_1.it)('validates worker step and heal callback schemas', () => {
        const step = index_1.StepCallbackPayloadSchema.parse(index_1.validStepCallbackFixture);
        (0, vitest_1.expect)(step.status).toBe('PASSED');
        const heal = index_1.HealCallbackPayloadSchema.parse(index_1.validHealCallbackFixture);
        (0, vitest_1.expect)(heal.healApplied).toBe(true);
        (0, vitest_1.expect)(heal.healConfidence).toBe('0.940');
    });
    (0, vitest_1.it)('validates outputs and complete callback schemas', () => {
        const outputs = index_1.OutputsCallbackPayloadSchema.parse(index_1.validOutputsCallbackFixture);
        (0, vitest_1.expect)(outputs.runId).toBe(index_1.validOutputsCallbackFixture.runId);
        const complete = index_1.CompleteCallbackPayloadSchema.parse(index_1.validCompleteCallbackFixture);
        (0, vitest_1.expect)(complete.status).toBe('PASSED');
        (0, vitest_1.expect)(complete.healed).toBe(true);
        (0, vitest_1.expect)(complete.healCount).toBe(1);
    });
    (0, vitest_1.it)('formats FlowTraceError properly into JSON error payload', () => {
        const error = new index_1.FlowTraceError('CLAIM_CONFLICT', 'Run was already claimed by another worker', 409, {
            conflictingWorkerId: 'worker-node-b'
        });
        (0, vitest_1.expect)(error.code).toBe('CLAIM_CONFLICT');
        (0, vitest_1.expect)(error.statusCode).toBe(409);
        const json = error.toJSON();
        (0, vitest_1.expect)(json.code).toBe('CLAIM_CONFLICT');
        (0, vitest_1.expect)(json.details?.conflictingWorkerId).toBe('worker-node-b');
    });
});

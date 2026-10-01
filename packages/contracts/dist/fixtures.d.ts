import type { ExecutionDispatchPayload, StepCallbackPayload, HealCallbackPayload, OutputsCallbackPayload, CompleteCallbackPayload, WorkClaimRequest, WorkClaimResponse } from './schemas';
/**
 * Canonical test fixtures validating contract compatibility between
 * FlowTrace standalone control plane and Enterprise Platform (ep_platform).
 */
export declare const mockWorkspaceId = "ws-oracle-prod-001";
export declare const mockRecordingId = "a1111111-1111-4111-8111-111111111111";
export declare const mockEnvironmentId = "e2222222-2222-4222-8222-222222222222";
export declare const mockRunId = "33333333-3333-4333-8333-333333333333";
export declare const mockOrgId = "00000000-0000-4000-8000-000000000001";
export declare const mockRecordingVersionId = "44444444-4444-4444-8444-444444444444";
export declare const mockJobExecutionId = "plat-job-exec-999";
export declare const validPlatformDispatchFixture: ExecutionDispatchPayload;
export declare const validWorkClaimRequestFixture: WorkClaimRequest;
export declare const validWorkClaimResponseFixture: WorkClaimResponse;
export declare const validStepCallbackFixture: StepCallbackPayload;
export declare const validHealCallbackFixture: HealCallbackPayload;
export declare const validOutputsCallbackFixture: OutputsCallbackPayload;
export declare const validCompleteCallbackFixture: CompleteCallbackPayload;

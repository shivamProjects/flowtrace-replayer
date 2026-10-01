import { z } from 'zod';
export declare const ProtocolVersionSchema: z.ZodLiteral<"2.0">;
export declare const ProducerKindSchema: z.ZodEnum<["extension", "desktop", "custom"]>;
export declare const ProducerProvenanceSchema: z.ZodObject<{
    kind: z.ZodEnum<["extension", "desktop", "custom"]>;
    version: z.ZodString;
    platform: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    kind: "custom" | "extension" | "desktop";
    version: string;
    platform?: string | undefined;
}, {
    kind: "custom" | "extension" | "desktop";
    version: string;
    platform?: string | undefined;
}>;
export declare const RecorderCapabilitySchema: z.ZodEnum<["multiSurface", "nestedFrames", "downloads", "detachedFileInput", "evidenceScreenshots", "oracleADF", "oracleJET", "redwood"]>;
export declare const FrameLocatorSegmentSchema: z.ZodObject<{
    selector: z.ZodString;
    name: z.ZodOptional<z.ZodString>;
    url: z.ZodOptional<z.ZodString>;
    index: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    selector: string;
    name?: string | undefined;
    index?: number | undefined;
    url?: string | undefined;
}, {
    selector: string;
    name?: string | undefined;
    index?: number | undefined;
    url?: string | undefined;
}>;
export declare const FrameIdentitySchema: z.ZodObject<{
    hostFrameId: z.ZodString;
    hostDocumentId: z.ZodOptional<z.ZodString>;
    parentHostFrameId: z.ZodOptional<z.ZodString>;
    surfaceId: z.ZodString;
    url: z.ZodOptional<z.ZodString>;
    name: z.ZodOptional<z.ZodString>;
    locatorPath: z.ZodOptional<z.ZodArray<z.ZodObject<{
        selector: z.ZodString;
        name: z.ZodOptional<z.ZodString>;
        url: z.ZodOptional<z.ZodString>;
        index: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        selector: string;
        name?: string | undefined;
        index?: number | undefined;
        url?: string | undefined;
    }, {
        selector: string;
        name?: string | undefined;
        index?: number | undefined;
        url?: string | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    hostFrameId: string;
    surfaceId: string;
    name?: string | undefined;
    url?: string | undefined;
    hostDocumentId?: string | undefined;
    parentHostFrameId?: string | undefined;
    locatorPath?: {
        selector: string;
        name?: string | undefined;
        index?: number | undefined;
        url?: string | undefined;
    }[] | undefined;
}, {
    hostFrameId: string;
    surfaceId: string;
    name?: string | undefined;
    url?: string | undefined;
    hostDocumentId?: string | undefined;
    parentHostFrameId?: string | undefined;
    locatorPath?: {
        selector: string;
        name?: string | undefined;
        index?: number | undefined;
        url?: string | undefined;
    }[] | undefined;
}>;
export declare const SurfaceInfoSchema: z.ZodObject<{
    surfaceId: z.ZodString;
    hostSurfaceId: z.ZodString;
    type: z.ZodEnum<["tab", "popup", "window", "webview"]>;
    openerSurfaceId: z.ZodOptional<z.ZodString>;
    url: z.ZodString;
    title: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: "tab" | "popup" | "window" | "webview";
    url: string;
    surfaceId: string;
    hostSurfaceId: string;
    openerSurfaceId?: string | undefined;
    title?: string | undefined;
}, {
    type: "tab" | "popup" | "window" | "webview";
    url: string;
    surfaceId: string;
    hostSurfaceId: string;
    openerSurfaceId?: string | undefined;
    title?: string | undefined;
}>;
export declare const RecordedLocatorSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    selector: z.ZodOptional<z.ZodString>;
    primary: z.ZodOptional<z.ZodString>;
    name: z.ZodOptional<z.ZodString>;
    label: z.ZodOptional<z.ZodString>;
    role: z.ZodOptional<z.ZodString>;
    attrSelector: z.ZodOptional<z.ZodString>;
    testId: z.ZodOptional<z.ZodString>;
    componentId: z.ZodOptional<z.ZodString>;
    candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    id: z.ZodOptional<z.ZodString>;
    selector: z.ZodOptional<z.ZodString>;
    primary: z.ZodOptional<z.ZodString>;
    name: z.ZodOptional<z.ZodString>;
    label: z.ZodOptional<z.ZodString>;
    role: z.ZodOptional<z.ZodString>;
    attrSelector: z.ZodOptional<z.ZodString>;
    testId: z.ZodOptional<z.ZodString>;
    componentId: z.ZodOptional<z.ZodString>;
    candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    id: z.ZodOptional<z.ZodString>;
    selector: z.ZodOptional<z.ZodString>;
    primary: z.ZodOptional<z.ZodString>;
    name: z.ZodOptional<z.ZodString>;
    label: z.ZodOptional<z.ZodString>;
    role: z.ZodOptional<z.ZodString>;
    attrSelector: z.ZodOptional<z.ZodString>;
    testId: z.ZodOptional<z.ZodString>;
    componentId: z.ZodOptional<z.ZodString>;
    candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, z.ZodTypeAny, "passthrough">>;
export declare const StepEffectSchema: z.ZodObject<{
    type: z.ZodString;
    targetUrl: z.ZodOptional<z.ZodString>;
    surfaceId: z.ZodOptional<z.ZodString>;
    timestamp: z.ZodOptional<z.ZodNumber>;
    details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    type: string;
    details?: Record<string, any> | undefined;
    timestamp?: number | undefined;
    surfaceId?: string | undefined;
    targetUrl?: string | undefined;
}, {
    type: string;
    details?: Record<string, any> | undefined;
    timestamp?: number | undefined;
    surfaceId?: string | undefined;
    targetUrl?: string | undefined;
}>;
export declare const KeyModifiersSchema: z.ZodObject<{
    alt: z.ZodOptional<z.ZodBoolean>;
    control: z.ZodOptional<z.ZodBoolean>;
    meta: z.ZodOptional<z.ZodBoolean>;
    shift: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    shift?: boolean | undefined;
    alt?: boolean | undefined;
    control?: boolean | undefined;
    meta?: boolean | undefined;
}, {
    shift?: boolean | undefined;
    alt?: boolean | undefined;
    control?: boolean | undefined;
    meta?: boolean | undefined;
}>;
export declare const PointerPositionSchema: z.ZodObject<{
    x: z.ZodNumber;
    y: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    x: number;
    y: number;
}, {
    x: number;
    y: number;
}>;
export declare const NavigateStepSchema: z.ZodObject<{
    action: z.ZodLiteral<"navigate">;
    value: z.ZodString;
    url: z.ZodOptional<z.ZodString>;
    surfaceId: z.ZodOptional<z.ZodString>;
    frame: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodObject<{
        url: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        path: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    }, {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    }>]>>;
    locator: z.ZodOptional<z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough">>>;
    description: z.ZodOptional<z.ZodString>;
    skipInReport: z.ZodDefault<z.ZodBoolean>;
    required: z.ZodOptional<z.ZodBoolean>;
    requiredSource: z.ZodOptional<z.ZodString>;
    requiredScope: z.ZodOptional<z.ZodString>;
    effects: z.ZodOptional<z.ZodArray<z.ZodObject<{
        type: z.ZodString;
        targetUrl: z.ZodOptional<z.ZodString>;
        surfaceId: z.ZodOptional<z.ZodString>;
        timestamp: z.ZodOptional<z.ZodNumber>;
        details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }, {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }>, "many">>;
    meta: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    value: string;
    action: "navigate";
    skipInReport: boolean;
    required?: boolean | undefined;
    description?: string | undefined;
    url?: string | undefined;
    surfaceId?: string | undefined;
    meta?: Record<string, any> | undefined;
    frame?: string | {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    } | undefined;
    locator?: z.objectOutputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough"> | undefined;
    requiredSource?: string | undefined;
    requiredScope?: string | undefined;
    effects?: {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }[] | undefined;
}, {
    value: string;
    action: "navigate";
    required?: boolean | undefined;
    description?: string | undefined;
    url?: string | undefined;
    surfaceId?: string | undefined;
    meta?: Record<string, any> | undefined;
    frame?: string | {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    } | undefined;
    locator?: z.objectInputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough"> | undefined;
    skipInReport?: boolean | undefined;
    requiredSource?: string | undefined;
    requiredScope?: string | undefined;
    effects?: {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }[] | undefined;
}>;
export declare const ClickStepSchema: z.ZodObject<{
    action: z.ZodLiteral<"click">;
    button: z.ZodOptional<z.ZodEnum<["left", "right", "middle"]>>;
    clickCount: z.ZodOptional<z.ZodNumber>;
    modifiers: z.ZodOptional<z.ZodObject<{
        alt: z.ZodOptional<z.ZodBoolean>;
        control: z.ZodOptional<z.ZodBoolean>;
        meta: z.ZodOptional<z.ZodBoolean>;
        shift: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        shift?: boolean | undefined;
        alt?: boolean | undefined;
        control?: boolean | undefined;
        meta?: boolean | undefined;
    }, {
        shift?: boolean | undefined;
        alt?: boolean | undefined;
        control?: boolean | undefined;
        meta?: boolean | undefined;
    }>>;
    position: z.ZodOptional<z.ZodObject<{
        x: z.ZodNumber;
        y: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        x: number;
        y: number;
    }, {
        x: number;
        y: number;
    }>>;
    surfaceId: z.ZodOptional<z.ZodString>;
    frame: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodObject<{
        url: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        path: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    }, {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    }>]>>;
    locator: z.ZodOptional<z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough">>>;
    description: z.ZodOptional<z.ZodString>;
    skipInReport: z.ZodDefault<z.ZodBoolean>;
    required: z.ZodOptional<z.ZodBoolean>;
    requiredSource: z.ZodOptional<z.ZodString>;
    requiredScope: z.ZodOptional<z.ZodString>;
    effects: z.ZodOptional<z.ZodArray<z.ZodObject<{
        type: z.ZodString;
        targetUrl: z.ZodOptional<z.ZodString>;
        surfaceId: z.ZodOptional<z.ZodString>;
        timestamp: z.ZodOptional<z.ZodNumber>;
        details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }, {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }>, "many">>;
    meta: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    action: "click";
    skipInReport: boolean;
    required?: boolean | undefined;
    description?: string | undefined;
    surfaceId?: string | undefined;
    meta?: Record<string, any> | undefined;
    frame?: string | {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    } | undefined;
    locator?: z.objectOutputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough"> | undefined;
    requiredSource?: string | undefined;
    requiredScope?: string | undefined;
    effects?: {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }[] | undefined;
    button?: "left" | "right" | "middle" | undefined;
    clickCount?: number | undefined;
    modifiers?: {
        shift?: boolean | undefined;
        alt?: boolean | undefined;
        control?: boolean | undefined;
        meta?: boolean | undefined;
    } | undefined;
    position?: {
        x: number;
        y: number;
    } | undefined;
}, {
    action: "click";
    required?: boolean | undefined;
    description?: string | undefined;
    surfaceId?: string | undefined;
    meta?: Record<string, any> | undefined;
    frame?: string | {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    } | undefined;
    locator?: z.objectInputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough"> | undefined;
    skipInReport?: boolean | undefined;
    requiredSource?: string | undefined;
    requiredScope?: string | undefined;
    effects?: {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }[] | undefined;
    button?: "left" | "right" | "middle" | undefined;
    clickCount?: number | undefined;
    modifiers?: {
        shift?: boolean | undefined;
        alt?: boolean | undefined;
        control?: boolean | undefined;
        meta?: boolean | undefined;
    } | undefined;
    position?: {
        x: number;
        y: number;
    } | undefined;
}>;
export declare const DblClickStepSchema: z.ZodObject<{
    action: z.ZodLiteral<"dblclick">;
    clickCount: z.ZodDefault<z.ZodNumber>;
    modifiers: z.ZodOptional<z.ZodObject<{
        alt: z.ZodOptional<z.ZodBoolean>;
        control: z.ZodOptional<z.ZodBoolean>;
        meta: z.ZodOptional<z.ZodBoolean>;
        shift: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        shift?: boolean | undefined;
        alt?: boolean | undefined;
        control?: boolean | undefined;
        meta?: boolean | undefined;
    }, {
        shift?: boolean | undefined;
        alt?: boolean | undefined;
        control?: boolean | undefined;
        meta?: boolean | undefined;
    }>>;
    position: z.ZodOptional<z.ZodObject<{
        x: z.ZodNumber;
        y: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        x: number;
        y: number;
    }, {
        x: number;
        y: number;
    }>>;
    surfaceId: z.ZodOptional<z.ZodString>;
    frame: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodObject<{
        url: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        path: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    }, {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    }>]>>;
    locator: z.ZodOptional<z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough">>>;
    description: z.ZodOptional<z.ZodString>;
    skipInReport: z.ZodDefault<z.ZodBoolean>;
    required: z.ZodOptional<z.ZodBoolean>;
    requiredSource: z.ZodOptional<z.ZodString>;
    requiredScope: z.ZodOptional<z.ZodString>;
    effects: z.ZodOptional<z.ZodArray<z.ZodObject<{
        type: z.ZodString;
        targetUrl: z.ZodOptional<z.ZodString>;
        surfaceId: z.ZodOptional<z.ZodString>;
        timestamp: z.ZodOptional<z.ZodNumber>;
        details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }, {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }>, "many">>;
    meta: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    action: "dblclick";
    skipInReport: boolean;
    clickCount: number;
    required?: boolean | undefined;
    description?: string | undefined;
    surfaceId?: string | undefined;
    meta?: Record<string, any> | undefined;
    frame?: string | {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    } | undefined;
    locator?: z.objectOutputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough"> | undefined;
    requiredSource?: string | undefined;
    requiredScope?: string | undefined;
    effects?: {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }[] | undefined;
    modifiers?: {
        shift?: boolean | undefined;
        alt?: boolean | undefined;
        control?: boolean | undefined;
        meta?: boolean | undefined;
    } | undefined;
    position?: {
        x: number;
        y: number;
    } | undefined;
}, {
    action: "dblclick";
    required?: boolean | undefined;
    description?: string | undefined;
    surfaceId?: string | undefined;
    meta?: Record<string, any> | undefined;
    frame?: string | {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    } | undefined;
    locator?: z.objectInputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough"> | undefined;
    skipInReport?: boolean | undefined;
    requiredSource?: string | undefined;
    requiredScope?: string | undefined;
    effects?: {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }[] | undefined;
    clickCount?: number | undefined;
    modifiers?: {
        shift?: boolean | undefined;
        alt?: boolean | undefined;
        control?: boolean | undefined;
        meta?: boolean | undefined;
    } | undefined;
    position?: {
        x: number;
        y: number;
    } | undefined;
}>;
export declare const FillStepSchema: z.ZodObject<{
    action: z.ZodLiteral<"fill">;
    value: z.ZodOptional<z.ZodString>;
    committedValue: z.ZodOptional<z.ZodString>;
    credentialRef: z.ZodOptional<z.ZodString>;
    surfaceId: z.ZodOptional<z.ZodString>;
    frame: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodObject<{
        url: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        path: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    }, {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    }>]>>;
    locator: z.ZodOptional<z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough">>>;
    description: z.ZodOptional<z.ZodString>;
    skipInReport: z.ZodDefault<z.ZodBoolean>;
    required: z.ZodOptional<z.ZodBoolean>;
    requiredSource: z.ZodOptional<z.ZodString>;
    requiredScope: z.ZodOptional<z.ZodString>;
    effects: z.ZodOptional<z.ZodArray<z.ZodObject<{
        type: z.ZodString;
        targetUrl: z.ZodOptional<z.ZodString>;
        surfaceId: z.ZodOptional<z.ZodString>;
        timestamp: z.ZodOptional<z.ZodNumber>;
        details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }, {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }>, "many">>;
    meta: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    action: "fill";
    skipInReport: boolean;
    value?: string | undefined;
    required?: boolean | undefined;
    description?: string | undefined;
    surfaceId?: string | undefined;
    meta?: Record<string, any> | undefined;
    frame?: string | {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    } | undefined;
    locator?: z.objectOutputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough"> | undefined;
    requiredSource?: string | undefined;
    requiredScope?: string | undefined;
    effects?: {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }[] | undefined;
    committedValue?: string | undefined;
    credentialRef?: string | undefined;
}, {
    action: "fill";
    value?: string | undefined;
    required?: boolean | undefined;
    description?: string | undefined;
    surfaceId?: string | undefined;
    meta?: Record<string, any> | undefined;
    frame?: string | {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    } | undefined;
    locator?: z.objectInputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough"> | undefined;
    skipInReport?: boolean | undefined;
    requiredSource?: string | undefined;
    requiredScope?: string | undefined;
    effects?: {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }[] | undefined;
    committedValue?: string | undefined;
    credentialRef?: string | undefined;
}>;
export declare const SelectOptionStepSchema: z.ZodObject<{
    action: z.ZodLiteral<"selectOption">;
    value: z.ZodOptional<z.ZodString>;
    values: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    optionIndex: z.ZodOptional<z.ZodNumber>;
    surfaceId: z.ZodOptional<z.ZodString>;
    frame: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodObject<{
        url: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        path: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    }, {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    }>]>>;
    locator: z.ZodOptional<z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough">>>;
    description: z.ZodOptional<z.ZodString>;
    skipInReport: z.ZodDefault<z.ZodBoolean>;
    required: z.ZodOptional<z.ZodBoolean>;
    requiredSource: z.ZodOptional<z.ZodString>;
    requiredScope: z.ZodOptional<z.ZodString>;
    effects: z.ZodOptional<z.ZodArray<z.ZodObject<{
        type: z.ZodString;
        targetUrl: z.ZodOptional<z.ZodString>;
        surfaceId: z.ZodOptional<z.ZodString>;
        timestamp: z.ZodOptional<z.ZodNumber>;
        details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }, {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }>, "many">>;
    meta: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    action: "selectOption";
    skipInReport: boolean;
    value?: string | undefined;
    values?: string[] | undefined;
    required?: boolean | undefined;
    description?: string | undefined;
    surfaceId?: string | undefined;
    meta?: Record<string, any> | undefined;
    frame?: string | {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    } | undefined;
    locator?: z.objectOutputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough"> | undefined;
    requiredSource?: string | undefined;
    requiredScope?: string | undefined;
    effects?: {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }[] | undefined;
    optionIndex?: number | undefined;
}, {
    action: "selectOption";
    value?: string | undefined;
    values?: string[] | undefined;
    required?: boolean | undefined;
    description?: string | undefined;
    surfaceId?: string | undefined;
    meta?: Record<string, any> | undefined;
    frame?: string | {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    } | undefined;
    locator?: z.objectInputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough"> | undefined;
    skipInReport?: boolean | undefined;
    requiredSource?: string | undefined;
    requiredScope?: string | undefined;
    effects?: {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }[] | undefined;
    optionIndex?: number | undefined;
}>;
export declare const LovSelectStepSchema: z.ZodObject<{
    action: z.ZodLiteral<"lovSelect">;
    value: z.ZodString;
    optionIndex: z.ZodOptional<z.ZodNumber>;
    surfaceId: z.ZodOptional<z.ZodString>;
    frame: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodObject<{
        url: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        path: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    }, {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    }>]>>;
    locator: z.ZodOptional<z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough">>>;
    description: z.ZodOptional<z.ZodString>;
    skipInReport: z.ZodDefault<z.ZodBoolean>;
    required: z.ZodOptional<z.ZodBoolean>;
    requiredSource: z.ZodOptional<z.ZodString>;
    requiredScope: z.ZodOptional<z.ZodString>;
    effects: z.ZodOptional<z.ZodArray<z.ZodObject<{
        type: z.ZodString;
        targetUrl: z.ZodOptional<z.ZodString>;
        surfaceId: z.ZodOptional<z.ZodString>;
        timestamp: z.ZodOptional<z.ZodNumber>;
        details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }, {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }>, "many">>;
    meta: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    value: string;
    action: "lovSelect";
    skipInReport: boolean;
    required?: boolean | undefined;
    description?: string | undefined;
    surfaceId?: string | undefined;
    meta?: Record<string, any> | undefined;
    frame?: string | {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    } | undefined;
    locator?: z.objectOutputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough"> | undefined;
    requiredSource?: string | undefined;
    requiredScope?: string | undefined;
    effects?: {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }[] | undefined;
    optionIndex?: number | undefined;
}, {
    value: string;
    action: "lovSelect";
    required?: boolean | undefined;
    description?: string | undefined;
    surfaceId?: string | undefined;
    meta?: Record<string, any> | undefined;
    frame?: string | {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    } | undefined;
    locator?: z.objectInputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough"> | undefined;
    skipInReport?: boolean | undefined;
    requiredSource?: string | undefined;
    requiredScope?: string | undefined;
    effects?: {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }[] | undefined;
    optionIndex?: number | undefined;
}>;
export declare const PressStepSchema: z.ZodObject<{
    action: z.ZodLiteral<"press">;
    key: z.ZodString;
    modifiers: z.ZodOptional<z.ZodObject<{
        alt: z.ZodOptional<z.ZodBoolean>;
        control: z.ZodOptional<z.ZodBoolean>;
        meta: z.ZodOptional<z.ZodBoolean>;
        shift: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        shift?: boolean | undefined;
        alt?: boolean | undefined;
        control?: boolean | undefined;
        meta?: boolean | undefined;
    }, {
        shift?: boolean | undefined;
        alt?: boolean | undefined;
        control?: boolean | undefined;
        meta?: boolean | undefined;
    }>>;
    surfaceId: z.ZodOptional<z.ZodString>;
    frame: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodObject<{
        url: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        path: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    }, {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    }>]>>;
    locator: z.ZodOptional<z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough">>>;
    description: z.ZodOptional<z.ZodString>;
    skipInReport: z.ZodDefault<z.ZodBoolean>;
    required: z.ZodOptional<z.ZodBoolean>;
    requiredSource: z.ZodOptional<z.ZodString>;
    requiredScope: z.ZodOptional<z.ZodString>;
    effects: z.ZodOptional<z.ZodArray<z.ZodObject<{
        type: z.ZodString;
        targetUrl: z.ZodOptional<z.ZodString>;
        surfaceId: z.ZodOptional<z.ZodString>;
        timestamp: z.ZodOptional<z.ZodNumber>;
        details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }, {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }>, "many">>;
    meta: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    action: "press";
    skipInReport: boolean;
    key: string;
    required?: boolean | undefined;
    description?: string | undefined;
    surfaceId?: string | undefined;
    meta?: Record<string, any> | undefined;
    frame?: string | {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    } | undefined;
    locator?: z.objectOutputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough"> | undefined;
    requiredSource?: string | undefined;
    requiredScope?: string | undefined;
    effects?: {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }[] | undefined;
    modifiers?: {
        shift?: boolean | undefined;
        alt?: boolean | undefined;
        control?: boolean | undefined;
        meta?: boolean | undefined;
    } | undefined;
}, {
    action: "press";
    key: string;
    required?: boolean | undefined;
    description?: string | undefined;
    surfaceId?: string | undefined;
    meta?: Record<string, any> | undefined;
    frame?: string | {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    } | undefined;
    locator?: z.objectInputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough"> | undefined;
    skipInReport?: boolean | undefined;
    requiredSource?: string | undefined;
    requiredScope?: string | undefined;
    effects?: {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }[] | undefined;
    modifiers?: {
        shift?: boolean | undefined;
        alt?: boolean | undefined;
        control?: boolean | undefined;
        meta?: boolean | undefined;
    } | undefined;
}>;
export declare const CheckStepSchema: z.ZodObject<{
    action: z.ZodLiteral<"check">;
    checked: z.ZodDefault<z.ZodLiteral<true>>;
    surfaceId: z.ZodOptional<z.ZodString>;
    frame: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodObject<{
        url: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        path: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    }, {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    }>]>>;
    locator: z.ZodOptional<z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough">>>;
    description: z.ZodOptional<z.ZodString>;
    skipInReport: z.ZodDefault<z.ZodBoolean>;
    required: z.ZodOptional<z.ZodBoolean>;
    requiredSource: z.ZodOptional<z.ZodString>;
    requiredScope: z.ZodOptional<z.ZodString>;
    effects: z.ZodOptional<z.ZodArray<z.ZodObject<{
        type: z.ZodString;
        targetUrl: z.ZodOptional<z.ZodString>;
        surfaceId: z.ZodOptional<z.ZodString>;
        timestamp: z.ZodOptional<z.ZodNumber>;
        details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }, {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }>, "many">>;
    meta: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    action: "check";
    skipInReport: boolean;
    checked: true;
    required?: boolean | undefined;
    description?: string | undefined;
    surfaceId?: string | undefined;
    meta?: Record<string, any> | undefined;
    frame?: string | {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    } | undefined;
    locator?: z.objectOutputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough"> | undefined;
    requiredSource?: string | undefined;
    requiredScope?: string | undefined;
    effects?: {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }[] | undefined;
}, {
    action: "check";
    required?: boolean | undefined;
    description?: string | undefined;
    surfaceId?: string | undefined;
    meta?: Record<string, any> | undefined;
    frame?: string | {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    } | undefined;
    locator?: z.objectInputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough"> | undefined;
    skipInReport?: boolean | undefined;
    requiredSource?: string | undefined;
    requiredScope?: string | undefined;
    effects?: {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }[] | undefined;
    checked?: true | undefined;
}>;
export declare const UncheckStepSchema: z.ZodObject<{
    action: z.ZodLiteral<"uncheck">;
    checked: z.ZodDefault<z.ZodLiteral<false>>;
    surfaceId: z.ZodOptional<z.ZodString>;
    frame: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodObject<{
        url: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        path: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    }, {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    }>]>>;
    locator: z.ZodOptional<z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough">>>;
    description: z.ZodOptional<z.ZodString>;
    skipInReport: z.ZodDefault<z.ZodBoolean>;
    required: z.ZodOptional<z.ZodBoolean>;
    requiredSource: z.ZodOptional<z.ZodString>;
    requiredScope: z.ZodOptional<z.ZodString>;
    effects: z.ZodOptional<z.ZodArray<z.ZodObject<{
        type: z.ZodString;
        targetUrl: z.ZodOptional<z.ZodString>;
        surfaceId: z.ZodOptional<z.ZodString>;
        timestamp: z.ZodOptional<z.ZodNumber>;
        details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }, {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }>, "many">>;
    meta: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    action: "uncheck";
    skipInReport: boolean;
    checked: false;
    required?: boolean | undefined;
    description?: string | undefined;
    surfaceId?: string | undefined;
    meta?: Record<string, any> | undefined;
    frame?: string | {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    } | undefined;
    locator?: z.objectOutputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough"> | undefined;
    requiredSource?: string | undefined;
    requiredScope?: string | undefined;
    effects?: {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }[] | undefined;
}, {
    action: "uncheck";
    required?: boolean | undefined;
    description?: string | undefined;
    surfaceId?: string | undefined;
    meta?: Record<string, any> | undefined;
    frame?: string | {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    } | undefined;
    locator?: z.objectInputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough"> | undefined;
    skipInReport?: boolean | undefined;
    requiredSource?: string | undefined;
    requiredScope?: string | undefined;
    effects?: {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }[] | undefined;
    checked?: false | undefined;
}>;
export declare const SetInputFilesStepSchema: z.ZodObject<{
    action: z.ZodLiteral<"setInputFiles">;
    files: z.ZodArray<z.ZodString, "many">;
    value: z.ZodOptional<z.ZodString>;
    surfaceId: z.ZodOptional<z.ZodString>;
    frame: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodObject<{
        url: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        path: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    }, {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    }>]>>;
    locator: z.ZodOptional<z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough">>>;
    description: z.ZodOptional<z.ZodString>;
    skipInReport: z.ZodDefault<z.ZodBoolean>;
    required: z.ZodOptional<z.ZodBoolean>;
    requiredSource: z.ZodOptional<z.ZodString>;
    requiredScope: z.ZodOptional<z.ZodString>;
    effects: z.ZodOptional<z.ZodArray<z.ZodObject<{
        type: z.ZodString;
        targetUrl: z.ZodOptional<z.ZodString>;
        surfaceId: z.ZodOptional<z.ZodString>;
        timestamp: z.ZodOptional<z.ZodNumber>;
        details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }, {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }>, "many">>;
    meta: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    action: "setInputFiles";
    skipInReport: boolean;
    files: string[];
    value?: string | undefined;
    required?: boolean | undefined;
    description?: string | undefined;
    surfaceId?: string | undefined;
    meta?: Record<string, any> | undefined;
    frame?: string | {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    } | undefined;
    locator?: z.objectOutputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough"> | undefined;
    requiredSource?: string | undefined;
    requiredScope?: string | undefined;
    effects?: {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }[] | undefined;
}, {
    action: "setInputFiles";
    files: string[];
    value?: string | undefined;
    required?: boolean | undefined;
    description?: string | undefined;
    surfaceId?: string | undefined;
    meta?: Record<string, any> | undefined;
    frame?: string | {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    } | undefined;
    locator?: z.objectInputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough"> | undefined;
    skipInReport?: boolean | undefined;
    requiredSource?: string | undefined;
    requiredScope?: string | undefined;
    effects?: {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }[] | undefined;
}>;
export declare const ScrollStepSchema: z.ZodObject<{
    action: z.ZodLiteral<"scroll">;
    deltaX: z.ZodOptional<z.ZodNumber>;
    deltaY: z.ZodOptional<z.ZodNumber>;
    surfaceId: z.ZodOptional<z.ZodString>;
    frame: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodObject<{
        url: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        path: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    }, {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    }>]>>;
    locator: z.ZodOptional<z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough">>>;
    description: z.ZodOptional<z.ZodString>;
    skipInReport: z.ZodDefault<z.ZodBoolean>;
    required: z.ZodOptional<z.ZodBoolean>;
    requiredSource: z.ZodOptional<z.ZodString>;
    requiredScope: z.ZodOptional<z.ZodString>;
    effects: z.ZodOptional<z.ZodArray<z.ZodObject<{
        type: z.ZodString;
        targetUrl: z.ZodOptional<z.ZodString>;
        surfaceId: z.ZodOptional<z.ZodString>;
        timestamp: z.ZodOptional<z.ZodNumber>;
        details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }, {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }>, "many">>;
    meta: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    action: "scroll";
    skipInReport: boolean;
    required?: boolean | undefined;
    description?: string | undefined;
    surfaceId?: string | undefined;
    meta?: Record<string, any> | undefined;
    frame?: string | {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    } | undefined;
    locator?: z.objectOutputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough"> | undefined;
    requiredSource?: string | undefined;
    requiredScope?: string | undefined;
    effects?: {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }[] | undefined;
    deltaX?: number | undefined;
    deltaY?: number | undefined;
}, {
    action: "scroll";
    required?: boolean | undefined;
    description?: string | undefined;
    surfaceId?: string | undefined;
    meta?: Record<string, any> | undefined;
    frame?: string | {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    } | undefined;
    locator?: z.objectInputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough"> | undefined;
    skipInReport?: boolean | undefined;
    requiredSource?: string | undefined;
    requiredScope?: string | undefined;
    effects?: {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }[] | undefined;
    deltaX?: number | undefined;
    deltaY?: number | undefined;
}>;
export declare const HoverStepSchema: z.ZodObject<{
    action: z.ZodLiteral<"hover">;
    position: z.ZodOptional<z.ZodObject<{
        x: z.ZodNumber;
        y: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        x: number;
        y: number;
    }, {
        x: number;
        y: number;
    }>>;
    surfaceId: z.ZodOptional<z.ZodString>;
    frame: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodObject<{
        url: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        path: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    }, {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    }>]>>;
    locator: z.ZodOptional<z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough">>>;
    description: z.ZodOptional<z.ZodString>;
    skipInReport: z.ZodDefault<z.ZodBoolean>;
    required: z.ZodOptional<z.ZodBoolean>;
    requiredSource: z.ZodOptional<z.ZodString>;
    requiredScope: z.ZodOptional<z.ZodString>;
    effects: z.ZodOptional<z.ZodArray<z.ZodObject<{
        type: z.ZodString;
        targetUrl: z.ZodOptional<z.ZodString>;
        surfaceId: z.ZodOptional<z.ZodString>;
        timestamp: z.ZodOptional<z.ZodNumber>;
        details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }, {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }>, "many">>;
    meta: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    action: "hover";
    skipInReport: boolean;
    required?: boolean | undefined;
    description?: string | undefined;
    surfaceId?: string | undefined;
    meta?: Record<string, any> | undefined;
    frame?: string | {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    } | undefined;
    locator?: z.objectOutputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough"> | undefined;
    requiredSource?: string | undefined;
    requiredScope?: string | undefined;
    effects?: {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }[] | undefined;
    position?: {
        x: number;
        y: number;
    } | undefined;
}, {
    action: "hover";
    required?: boolean | undefined;
    description?: string | undefined;
    surfaceId?: string | undefined;
    meta?: Record<string, any> | undefined;
    frame?: string | {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    } | undefined;
    locator?: z.objectInputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough"> | undefined;
    skipInReport?: boolean | undefined;
    requiredSource?: string | undefined;
    requiredScope?: string | undefined;
    effects?: {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }[] | undefined;
    position?: {
        x: number;
        y: number;
    } | undefined;
}>;
export declare const CopyStepSchema: z.ZodObject<{
    action: z.ZodLiteral<"copy">;
    outputName: z.ZodOptional<z.ZodString>;
    value: z.ZodOptional<z.ZodString>;
    surfaceId: z.ZodOptional<z.ZodString>;
    frame: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodObject<{
        url: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        path: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    }, {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    }>]>>;
    locator: z.ZodOptional<z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough">>>;
    description: z.ZodOptional<z.ZodString>;
    skipInReport: z.ZodDefault<z.ZodBoolean>;
    required: z.ZodOptional<z.ZodBoolean>;
    requiredSource: z.ZodOptional<z.ZodString>;
    requiredScope: z.ZodOptional<z.ZodString>;
    effects: z.ZodOptional<z.ZodArray<z.ZodObject<{
        type: z.ZodString;
        targetUrl: z.ZodOptional<z.ZodString>;
        surfaceId: z.ZodOptional<z.ZodString>;
        timestamp: z.ZodOptional<z.ZodNumber>;
        details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }, {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }>, "many">>;
    meta: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    action: "copy";
    skipInReport: boolean;
    value?: string | undefined;
    required?: boolean | undefined;
    description?: string | undefined;
    outputName?: string | undefined;
    surfaceId?: string | undefined;
    meta?: Record<string, any> | undefined;
    frame?: string | {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    } | undefined;
    locator?: z.objectOutputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough"> | undefined;
    requiredSource?: string | undefined;
    requiredScope?: string | undefined;
    effects?: {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }[] | undefined;
}, {
    action: "copy";
    value?: string | undefined;
    required?: boolean | undefined;
    description?: string | undefined;
    outputName?: string | undefined;
    surfaceId?: string | undefined;
    meta?: Record<string, any> | undefined;
    frame?: string | {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    } | undefined;
    locator?: z.objectInputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough"> | undefined;
    skipInReport?: boolean | undefined;
    requiredSource?: string | undefined;
    requiredScope?: string | undefined;
    effects?: {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }[] | undefined;
}>;
export declare const WaitStepSchema: z.ZodObject<{
    action: z.ZodLiteral<"wait">;
    durationMs: z.ZodNumber;
    surfaceId: z.ZodOptional<z.ZodString>;
    frame: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodObject<{
        url: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        path: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    }, {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    }>]>>;
    locator: z.ZodOptional<z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough">>>;
    description: z.ZodOptional<z.ZodString>;
    skipInReport: z.ZodDefault<z.ZodBoolean>;
    required: z.ZodOptional<z.ZodBoolean>;
    requiredSource: z.ZodOptional<z.ZodString>;
    requiredScope: z.ZodOptional<z.ZodString>;
    effects: z.ZodOptional<z.ZodArray<z.ZodObject<{
        type: z.ZodString;
        targetUrl: z.ZodOptional<z.ZodString>;
        surfaceId: z.ZodOptional<z.ZodString>;
        timestamp: z.ZodOptional<z.ZodNumber>;
        details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }, {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }>, "many">>;
    meta: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    action: "wait";
    durationMs: number;
    skipInReport: boolean;
    required?: boolean | undefined;
    description?: string | undefined;
    surfaceId?: string | undefined;
    meta?: Record<string, any> | undefined;
    frame?: string | {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    } | undefined;
    locator?: z.objectOutputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough"> | undefined;
    requiredSource?: string | undefined;
    requiredScope?: string | undefined;
    effects?: {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }[] | undefined;
}, {
    action: "wait";
    durationMs: number;
    required?: boolean | undefined;
    description?: string | undefined;
    surfaceId?: string | undefined;
    meta?: Record<string, any> | undefined;
    frame?: string | {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    } | undefined;
    locator?: z.objectInputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough"> | undefined;
    skipInReport?: boolean | undefined;
    requiredSource?: string | undefined;
    requiredScope?: string | undefined;
    effects?: {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }[] | undefined;
}>;
export declare const AssertVisibleStepSchema: z.ZodObject<{
    action: z.ZodLiteral<"assertVisible">;
    surfaceId: z.ZodOptional<z.ZodString>;
    frame: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodObject<{
        url: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        path: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    }, {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    }>]>>;
    locator: z.ZodOptional<z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough">>>;
    description: z.ZodOptional<z.ZodString>;
    skipInReport: z.ZodDefault<z.ZodBoolean>;
    required: z.ZodOptional<z.ZodBoolean>;
    requiredSource: z.ZodOptional<z.ZodString>;
    requiredScope: z.ZodOptional<z.ZodString>;
    effects: z.ZodOptional<z.ZodArray<z.ZodObject<{
        type: z.ZodString;
        targetUrl: z.ZodOptional<z.ZodString>;
        surfaceId: z.ZodOptional<z.ZodString>;
        timestamp: z.ZodOptional<z.ZodNumber>;
        details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }, {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }>, "many">>;
    meta: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    action: "assertVisible";
    skipInReport: boolean;
    required?: boolean | undefined;
    description?: string | undefined;
    surfaceId?: string | undefined;
    meta?: Record<string, any> | undefined;
    frame?: string | {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    } | undefined;
    locator?: z.objectOutputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough"> | undefined;
    requiredSource?: string | undefined;
    requiredScope?: string | undefined;
    effects?: {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }[] | undefined;
}, {
    action: "assertVisible";
    required?: boolean | undefined;
    description?: string | undefined;
    surfaceId?: string | undefined;
    meta?: Record<string, any> | undefined;
    frame?: string | {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    } | undefined;
    locator?: z.objectInputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough"> | undefined;
    skipInReport?: boolean | undefined;
    requiredSource?: string | undefined;
    requiredScope?: string | undefined;
    effects?: {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }[] | undefined;
}>;
export declare const AssertTextStepSchema: z.ZodObject<{
    action: z.ZodLiteral<"assertText">;
    value: z.ZodString;
    surfaceId: z.ZodOptional<z.ZodString>;
    frame: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodObject<{
        url: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        path: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    }, {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    }>]>>;
    locator: z.ZodOptional<z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough">>>;
    description: z.ZodOptional<z.ZodString>;
    skipInReport: z.ZodDefault<z.ZodBoolean>;
    required: z.ZodOptional<z.ZodBoolean>;
    requiredSource: z.ZodOptional<z.ZodString>;
    requiredScope: z.ZodOptional<z.ZodString>;
    effects: z.ZodOptional<z.ZodArray<z.ZodObject<{
        type: z.ZodString;
        targetUrl: z.ZodOptional<z.ZodString>;
        surfaceId: z.ZodOptional<z.ZodString>;
        timestamp: z.ZodOptional<z.ZodNumber>;
        details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }, {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }>, "many">>;
    meta: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    value: string;
    action: "assertText";
    skipInReport: boolean;
    required?: boolean | undefined;
    description?: string | undefined;
    surfaceId?: string | undefined;
    meta?: Record<string, any> | undefined;
    frame?: string | {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    } | undefined;
    locator?: z.objectOutputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough"> | undefined;
    requiredSource?: string | undefined;
    requiredScope?: string | undefined;
    effects?: {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }[] | undefined;
}, {
    value: string;
    action: "assertText";
    required?: boolean | undefined;
    description?: string | undefined;
    surfaceId?: string | undefined;
    meta?: Record<string, any> | undefined;
    frame?: string | {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    } | undefined;
    locator?: z.objectInputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough"> | undefined;
    skipInReport?: boolean | undefined;
    requiredSource?: string | undefined;
    requiredScope?: string | undefined;
    effects?: {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }[] | undefined;
}>;
export declare const AssertValueStepSchema: z.ZodObject<{
    action: z.ZodLiteral<"assertValue">;
    value: z.ZodString;
    surfaceId: z.ZodOptional<z.ZodString>;
    frame: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodObject<{
        url: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        path: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    }, {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    }>]>>;
    locator: z.ZodOptional<z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough">>>;
    description: z.ZodOptional<z.ZodString>;
    skipInReport: z.ZodDefault<z.ZodBoolean>;
    required: z.ZodOptional<z.ZodBoolean>;
    requiredSource: z.ZodOptional<z.ZodString>;
    requiredScope: z.ZodOptional<z.ZodString>;
    effects: z.ZodOptional<z.ZodArray<z.ZodObject<{
        type: z.ZodString;
        targetUrl: z.ZodOptional<z.ZodString>;
        surfaceId: z.ZodOptional<z.ZodString>;
        timestamp: z.ZodOptional<z.ZodNumber>;
        details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }, {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }>, "many">>;
    meta: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    value: string;
    action: "assertValue";
    skipInReport: boolean;
    required?: boolean | undefined;
    description?: string | undefined;
    surfaceId?: string | undefined;
    meta?: Record<string, any> | undefined;
    frame?: string | {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    } | undefined;
    locator?: z.objectOutputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough"> | undefined;
    requiredSource?: string | undefined;
    requiredScope?: string | undefined;
    effects?: {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }[] | undefined;
}, {
    value: string;
    action: "assertValue";
    required?: boolean | undefined;
    description?: string | undefined;
    surfaceId?: string | undefined;
    meta?: Record<string, any> | undefined;
    frame?: string | {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    } | undefined;
    locator?: z.objectInputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough"> | undefined;
    skipInReport?: boolean | undefined;
    requiredSource?: string | undefined;
    requiredScope?: string | undefined;
    effects?: {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }[] | undefined;
}>;
export declare const AssertCheckedStepSchema: z.ZodObject<{
    action: z.ZodLiteral<"assertChecked">;
    checked: z.ZodBoolean;
    surfaceId: z.ZodOptional<z.ZodString>;
    frame: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodObject<{
        url: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        path: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    }, {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    }>]>>;
    locator: z.ZodOptional<z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough">>>;
    description: z.ZodOptional<z.ZodString>;
    skipInReport: z.ZodDefault<z.ZodBoolean>;
    required: z.ZodOptional<z.ZodBoolean>;
    requiredSource: z.ZodOptional<z.ZodString>;
    requiredScope: z.ZodOptional<z.ZodString>;
    effects: z.ZodOptional<z.ZodArray<z.ZodObject<{
        type: z.ZodString;
        targetUrl: z.ZodOptional<z.ZodString>;
        surfaceId: z.ZodOptional<z.ZodString>;
        timestamp: z.ZodOptional<z.ZodNumber>;
        details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }, {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }>, "many">>;
    meta: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    action: "assertChecked";
    skipInReport: boolean;
    checked: boolean;
    required?: boolean | undefined;
    description?: string | undefined;
    surfaceId?: string | undefined;
    meta?: Record<string, any> | undefined;
    frame?: string | {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    } | undefined;
    locator?: z.objectOutputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough"> | undefined;
    requiredSource?: string | undefined;
    requiredScope?: string | undefined;
    effects?: {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }[] | undefined;
}, {
    action: "assertChecked";
    checked: boolean;
    required?: boolean | undefined;
    description?: string | undefined;
    surfaceId?: string | undefined;
    meta?: Record<string, any> | undefined;
    frame?: string | {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    } | undefined;
    locator?: z.objectInputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough"> | undefined;
    skipInReport?: boolean | undefined;
    requiredSource?: string | undefined;
    requiredScope?: string | undefined;
    effects?: {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }[] | undefined;
}>;
export declare const AssertSnapshotStepSchema: z.ZodObject<{
    action: z.ZodLiteral<"assertSnapshot">;
    snapshot: z.ZodString;
    surfaceId: z.ZodOptional<z.ZodString>;
    frame: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodObject<{
        url: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        path: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    }, {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    }>]>>;
    locator: z.ZodOptional<z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough">>>;
    description: z.ZodOptional<z.ZodString>;
    skipInReport: z.ZodDefault<z.ZodBoolean>;
    required: z.ZodOptional<z.ZodBoolean>;
    requiredSource: z.ZodOptional<z.ZodString>;
    requiredScope: z.ZodOptional<z.ZodString>;
    effects: z.ZodOptional<z.ZodArray<z.ZodObject<{
        type: z.ZodString;
        targetUrl: z.ZodOptional<z.ZodString>;
        surfaceId: z.ZodOptional<z.ZodString>;
        timestamp: z.ZodOptional<z.ZodNumber>;
        details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }, {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }>, "many">>;
    meta: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    action: "assertSnapshot";
    skipInReport: boolean;
    snapshot: string;
    required?: boolean | undefined;
    description?: string | undefined;
    surfaceId?: string | undefined;
    meta?: Record<string, any> | undefined;
    frame?: string | {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    } | undefined;
    locator?: z.objectOutputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough"> | undefined;
    requiredSource?: string | undefined;
    requiredScope?: string | undefined;
    effects?: {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }[] | undefined;
}, {
    action: "assertSnapshot";
    snapshot: string;
    required?: boolean | undefined;
    description?: string | undefined;
    surfaceId?: string | undefined;
    meta?: Record<string, any> | undefined;
    frame?: string | {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    } | undefined;
    locator?: z.objectInputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough"> | undefined;
    skipInReport?: boolean | undefined;
    requiredSource?: string | undefined;
    requiredScope?: string | undefined;
    effects?: {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }[] | undefined;
}>;
export declare const SemanticStepV2Schema: z.ZodDiscriminatedUnion<"action", [z.ZodObject<{
    action: z.ZodLiteral<"navigate">;
    value: z.ZodString;
    url: z.ZodOptional<z.ZodString>;
    surfaceId: z.ZodOptional<z.ZodString>;
    frame: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodObject<{
        url: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        path: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    }, {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    }>]>>;
    locator: z.ZodOptional<z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough">>>;
    description: z.ZodOptional<z.ZodString>;
    skipInReport: z.ZodDefault<z.ZodBoolean>;
    required: z.ZodOptional<z.ZodBoolean>;
    requiredSource: z.ZodOptional<z.ZodString>;
    requiredScope: z.ZodOptional<z.ZodString>;
    effects: z.ZodOptional<z.ZodArray<z.ZodObject<{
        type: z.ZodString;
        targetUrl: z.ZodOptional<z.ZodString>;
        surfaceId: z.ZodOptional<z.ZodString>;
        timestamp: z.ZodOptional<z.ZodNumber>;
        details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }, {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }>, "many">>;
    meta: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    value: string;
    action: "navigate";
    skipInReport: boolean;
    required?: boolean | undefined;
    description?: string | undefined;
    url?: string | undefined;
    surfaceId?: string | undefined;
    meta?: Record<string, any> | undefined;
    frame?: string | {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    } | undefined;
    locator?: z.objectOutputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough"> | undefined;
    requiredSource?: string | undefined;
    requiredScope?: string | undefined;
    effects?: {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }[] | undefined;
}, {
    value: string;
    action: "navigate";
    required?: boolean | undefined;
    description?: string | undefined;
    url?: string | undefined;
    surfaceId?: string | undefined;
    meta?: Record<string, any> | undefined;
    frame?: string | {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    } | undefined;
    locator?: z.objectInputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough"> | undefined;
    skipInReport?: boolean | undefined;
    requiredSource?: string | undefined;
    requiredScope?: string | undefined;
    effects?: {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }[] | undefined;
}>, z.ZodObject<{
    action: z.ZodLiteral<"click">;
    button: z.ZodOptional<z.ZodEnum<["left", "right", "middle"]>>;
    clickCount: z.ZodOptional<z.ZodNumber>;
    modifiers: z.ZodOptional<z.ZodObject<{
        alt: z.ZodOptional<z.ZodBoolean>;
        control: z.ZodOptional<z.ZodBoolean>;
        meta: z.ZodOptional<z.ZodBoolean>;
        shift: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        shift?: boolean | undefined;
        alt?: boolean | undefined;
        control?: boolean | undefined;
        meta?: boolean | undefined;
    }, {
        shift?: boolean | undefined;
        alt?: boolean | undefined;
        control?: boolean | undefined;
        meta?: boolean | undefined;
    }>>;
    position: z.ZodOptional<z.ZodObject<{
        x: z.ZodNumber;
        y: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        x: number;
        y: number;
    }, {
        x: number;
        y: number;
    }>>;
    surfaceId: z.ZodOptional<z.ZodString>;
    frame: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodObject<{
        url: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        path: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    }, {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    }>]>>;
    locator: z.ZodOptional<z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough">>>;
    description: z.ZodOptional<z.ZodString>;
    skipInReport: z.ZodDefault<z.ZodBoolean>;
    required: z.ZodOptional<z.ZodBoolean>;
    requiredSource: z.ZodOptional<z.ZodString>;
    requiredScope: z.ZodOptional<z.ZodString>;
    effects: z.ZodOptional<z.ZodArray<z.ZodObject<{
        type: z.ZodString;
        targetUrl: z.ZodOptional<z.ZodString>;
        surfaceId: z.ZodOptional<z.ZodString>;
        timestamp: z.ZodOptional<z.ZodNumber>;
        details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }, {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }>, "many">>;
    meta: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    action: "click";
    skipInReport: boolean;
    required?: boolean | undefined;
    description?: string | undefined;
    surfaceId?: string | undefined;
    meta?: Record<string, any> | undefined;
    frame?: string | {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    } | undefined;
    locator?: z.objectOutputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough"> | undefined;
    requiredSource?: string | undefined;
    requiredScope?: string | undefined;
    effects?: {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }[] | undefined;
    button?: "left" | "right" | "middle" | undefined;
    clickCount?: number | undefined;
    modifiers?: {
        shift?: boolean | undefined;
        alt?: boolean | undefined;
        control?: boolean | undefined;
        meta?: boolean | undefined;
    } | undefined;
    position?: {
        x: number;
        y: number;
    } | undefined;
}, {
    action: "click";
    required?: boolean | undefined;
    description?: string | undefined;
    surfaceId?: string | undefined;
    meta?: Record<string, any> | undefined;
    frame?: string | {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    } | undefined;
    locator?: z.objectInputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough"> | undefined;
    skipInReport?: boolean | undefined;
    requiredSource?: string | undefined;
    requiredScope?: string | undefined;
    effects?: {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }[] | undefined;
    button?: "left" | "right" | "middle" | undefined;
    clickCount?: number | undefined;
    modifiers?: {
        shift?: boolean | undefined;
        alt?: boolean | undefined;
        control?: boolean | undefined;
        meta?: boolean | undefined;
    } | undefined;
    position?: {
        x: number;
        y: number;
    } | undefined;
}>, z.ZodObject<{
    action: z.ZodLiteral<"dblclick">;
    clickCount: z.ZodDefault<z.ZodNumber>;
    modifiers: z.ZodOptional<z.ZodObject<{
        alt: z.ZodOptional<z.ZodBoolean>;
        control: z.ZodOptional<z.ZodBoolean>;
        meta: z.ZodOptional<z.ZodBoolean>;
        shift: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        shift?: boolean | undefined;
        alt?: boolean | undefined;
        control?: boolean | undefined;
        meta?: boolean | undefined;
    }, {
        shift?: boolean | undefined;
        alt?: boolean | undefined;
        control?: boolean | undefined;
        meta?: boolean | undefined;
    }>>;
    position: z.ZodOptional<z.ZodObject<{
        x: z.ZodNumber;
        y: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        x: number;
        y: number;
    }, {
        x: number;
        y: number;
    }>>;
    surfaceId: z.ZodOptional<z.ZodString>;
    frame: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodObject<{
        url: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        path: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    }, {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    }>]>>;
    locator: z.ZodOptional<z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough">>>;
    description: z.ZodOptional<z.ZodString>;
    skipInReport: z.ZodDefault<z.ZodBoolean>;
    required: z.ZodOptional<z.ZodBoolean>;
    requiredSource: z.ZodOptional<z.ZodString>;
    requiredScope: z.ZodOptional<z.ZodString>;
    effects: z.ZodOptional<z.ZodArray<z.ZodObject<{
        type: z.ZodString;
        targetUrl: z.ZodOptional<z.ZodString>;
        surfaceId: z.ZodOptional<z.ZodString>;
        timestamp: z.ZodOptional<z.ZodNumber>;
        details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }, {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }>, "many">>;
    meta: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    action: "dblclick";
    skipInReport: boolean;
    clickCount: number;
    required?: boolean | undefined;
    description?: string | undefined;
    surfaceId?: string | undefined;
    meta?: Record<string, any> | undefined;
    frame?: string | {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    } | undefined;
    locator?: z.objectOutputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough"> | undefined;
    requiredSource?: string | undefined;
    requiredScope?: string | undefined;
    effects?: {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }[] | undefined;
    modifiers?: {
        shift?: boolean | undefined;
        alt?: boolean | undefined;
        control?: boolean | undefined;
        meta?: boolean | undefined;
    } | undefined;
    position?: {
        x: number;
        y: number;
    } | undefined;
}, {
    action: "dblclick";
    required?: boolean | undefined;
    description?: string | undefined;
    surfaceId?: string | undefined;
    meta?: Record<string, any> | undefined;
    frame?: string | {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    } | undefined;
    locator?: z.objectInputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough"> | undefined;
    skipInReport?: boolean | undefined;
    requiredSource?: string | undefined;
    requiredScope?: string | undefined;
    effects?: {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }[] | undefined;
    clickCount?: number | undefined;
    modifiers?: {
        shift?: boolean | undefined;
        alt?: boolean | undefined;
        control?: boolean | undefined;
        meta?: boolean | undefined;
    } | undefined;
    position?: {
        x: number;
        y: number;
    } | undefined;
}>, z.ZodObject<{
    action: z.ZodLiteral<"fill">;
    value: z.ZodOptional<z.ZodString>;
    committedValue: z.ZodOptional<z.ZodString>;
    credentialRef: z.ZodOptional<z.ZodString>;
    surfaceId: z.ZodOptional<z.ZodString>;
    frame: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodObject<{
        url: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        path: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    }, {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    }>]>>;
    locator: z.ZodOptional<z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough">>>;
    description: z.ZodOptional<z.ZodString>;
    skipInReport: z.ZodDefault<z.ZodBoolean>;
    required: z.ZodOptional<z.ZodBoolean>;
    requiredSource: z.ZodOptional<z.ZodString>;
    requiredScope: z.ZodOptional<z.ZodString>;
    effects: z.ZodOptional<z.ZodArray<z.ZodObject<{
        type: z.ZodString;
        targetUrl: z.ZodOptional<z.ZodString>;
        surfaceId: z.ZodOptional<z.ZodString>;
        timestamp: z.ZodOptional<z.ZodNumber>;
        details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }, {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }>, "many">>;
    meta: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    action: "fill";
    skipInReport: boolean;
    value?: string | undefined;
    required?: boolean | undefined;
    description?: string | undefined;
    surfaceId?: string | undefined;
    meta?: Record<string, any> | undefined;
    frame?: string | {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    } | undefined;
    locator?: z.objectOutputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough"> | undefined;
    requiredSource?: string | undefined;
    requiredScope?: string | undefined;
    effects?: {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }[] | undefined;
    committedValue?: string | undefined;
    credentialRef?: string | undefined;
}, {
    action: "fill";
    value?: string | undefined;
    required?: boolean | undefined;
    description?: string | undefined;
    surfaceId?: string | undefined;
    meta?: Record<string, any> | undefined;
    frame?: string | {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    } | undefined;
    locator?: z.objectInputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough"> | undefined;
    skipInReport?: boolean | undefined;
    requiredSource?: string | undefined;
    requiredScope?: string | undefined;
    effects?: {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }[] | undefined;
    committedValue?: string | undefined;
    credentialRef?: string | undefined;
}>, z.ZodObject<{
    action: z.ZodLiteral<"selectOption">;
    value: z.ZodOptional<z.ZodString>;
    values: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    optionIndex: z.ZodOptional<z.ZodNumber>;
    surfaceId: z.ZodOptional<z.ZodString>;
    frame: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodObject<{
        url: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        path: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    }, {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    }>]>>;
    locator: z.ZodOptional<z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough">>>;
    description: z.ZodOptional<z.ZodString>;
    skipInReport: z.ZodDefault<z.ZodBoolean>;
    required: z.ZodOptional<z.ZodBoolean>;
    requiredSource: z.ZodOptional<z.ZodString>;
    requiredScope: z.ZodOptional<z.ZodString>;
    effects: z.ZodOptional<z.ZodArray<z.ZodObject<{
        type: z.ZodString;
        targetUrl: z.ZodOptional<z.ZodString>;
        surfaceId: z.ZodOptional<z.ZodString>;
        timestamp: z.ZodOptional<z.ZodNumber>;
        details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }, {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }>, "many">>;
    meta: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    action: "selectOption";
    skipInReport: boolean;
    value?: string | undefined;
    values?: string[] | undefined;
    required?: boolean | undefined;
    description?: string | undefined;
    surfaceId?: string | undefined;
    meta?: Record<string, any> | undefined;
    frame?: string | {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    } | undefined;
    locator?: z.objectOutputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough"> | undefined;
    requiredSource?: string | undefined;
    requiredScope?: string | undefined;
    effects?: {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }[] | undefined;
    optionIndex?: number | undefined;
}, {
    action: "selectOption";
    value?: string | undefined;
    values?: string[] | undefined;
    required?: boolean | undefined;
    description?: string | undefined;
    surfaceId?: string | undefined;
    meta?: Record<string, any> | undefined;
    frame?: string | {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    } | undefined;
    locator?: z.objectInputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough"> | undefined;
    skipInReport?: boolean | undefined;
    requiredSource?: string | undefined;
    requiredScope?: string | undefined;
    effects?: {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }[] | undefined;
    optionIndex?: number | undefined;
}>, z.ZodObject<{
    action: z.ZodLiteral<"lovSelect">;
    value: z.ZodString;
    optionIndex: z.ZodOptional<z.ZodNumber>;
    surfaceId: z.ZodOptional<z.ZodString>;
    frame: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodObject<{
        url: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        path: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    }, {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    }>]>>;
    locator: z.ZodOptional<z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough">>>;
    description: z.ZodOptional<z.ZodString>;
    skipInReport: z.ZodDefault<z.ZodBoolean>;
    required: z.ZodOptional<z.ZodBoolean>;
    requiredSource: z.ZodOptional<z.ZodString>;
    requiredScope: z.ZodOptional<z.ZodString>;
    effects: z.ZodOptional<z.ZodArray<z.ZodObject<{
        type: z.ZodString;
        targetUrl: z.ZodOptional<z.ZodString>;
        surfaceId: z.ZodOptional<z.ZodString>;
        timestamp: z.ZodOptional<z.ZodNumber>;
        details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }, {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }>, "many">>;
    meta: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    value: string;
    action: "lovSelect";
    skipInReport: boolean;
    required?: boolean | undefined;
    description?: string | undefined;
    surfaceId?: string | undefined;
    meta?: Record<string, any> | undefined;
    frame?: string | {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    } | undefined;
    locator?: z.objectOutputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough"> | undefined;
    requiredSource?: string | undefined;
    requiredScope?: string | undefined;
    effects?: {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }[] | undefined;
    optionIndex?: number | undefined;
}, {
    value: string;
    action: "lovSelect";
    required?: boolean | undefined;
    description?: string | undefined;
    surfaceId?: string | undefined;
    meta?: Record<string, any> | undefined;
    frame?: string | {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    } | undefined;
    locator?: z.objectInputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough"> | undefined;
    skipInReport?: boolean | undefined;
    requiredSource?: string | undefined;
    requiredScope?: string | undefined;
    effects?: {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }[] | undefined;
    optionIndex?: number | undefined;
}>, z.ZodObject<{
    action: z.ZodLiteral<"press">;
    key: z.ZodString;
    modifiers: z.ZodOptional<z.ZodObject<{
        alt: z.ZodOptional<z.ZodBoolean>;
        control: z.ZodOptional<z.ZodBoolean>;
        meta: z.ZodOptional<z.ZodBoolean>;
        shift: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        shift?: boolean | undefined;
        alt?: boolean | undefined;
        control?: boolean | undefined;
        meta?: boolean | undefined;
    }, {
        shift?: boolean | undefined;
        alt?: boolean | undefined;
        control?: boolean | undefined;
        meta?: boolean | undefined;
    }>>;
    surfaceId: z.ZodOptional<z.ZodString>;
    frame: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodObject<{
        url: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        path: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    }, {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    }>]>>;
    locator: z.ZodOptional<z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough">>>;
    description: z.ZodOptional<z.ZodString>;
    skipInReport: z.ZodDefault<z.ZodBoolean>;
    required: z.ZodOptional<z.ZodBoolean>;
    requiredSource: z.ZodOptional<z.ZodString>;
    requiredScope: z.ZodOptional<z.ZodString>;
    effects: z.ZodOptional<z.ZodArray<z.ZodObject<{
        type: z.ZodString;
        targetUrl: z.ZodOptional<z.ZodString>;
        surfaceId: z.ZodOptional<z.ZodString>;
        timestamp: z.ZodOptional<z.ZodNumber>;
        details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }, {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }>, "many">>;
    meta: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    action: "press";
    skipInReport: boolean;
    key: string;
    required?: boolean | undefined;
    description?: string | undefined;
    surfaceId?: string | undefined;
    meta?: Record<string, any> | undefined;
    frame?: string | {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    } | undefined;
    locator?: z.objectOutputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough"> | undefined;
    requiredSource?: string | undefined;
    requiredScope?: string | undefined;
    effects?: {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }[] | undefined;
    modifiers?: {
        shift?: boolean | undefined;
        alt?: boolean | undefined;
        control?: boolean | undefined;
        meta?: boolean | undefined;
    } | undefined;
}, {
    action: "press";
    key: string;
    required?: boolean | undefined;
    description?: string | undefined;
    surfaceId?: string | undefined;
    meta?: Record<string, any> | undefined;
    frame?: string | {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    } | undefined;
    locator?: z.objectInputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough"> | undefined;
    skipInReport?: boolean | undefined;
    requiredSource?: string | undefined;
    requiredScope?: string | undefined;
    effects?: {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }[] | undefined;
    modifiers?: {
        shift?: boolean | undefined;
        alt?: boolean | undefined;
        control?: boolean | undefined;
        meta?: boolean | undefined;
    } | undefined;
}>, z.ZodObject<{
    action: z.ZodLiteral<"check">;
    checked: z.ZodDefault<z.ZodLiteral<true>>;
    surfaceId: z.ZodOptional<z.ZodString>;
    frame: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodObject<{
        url: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        path: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    }, {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    }>]>>;
    locator: z.ZodOptional<z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough">>>;
    description: z.ZodOptional<z.ZodString>;
    skipInReport: z.ZodDefault<z.ZodBoolean>;
    required: z.ZodOptional<z.ZodBoolean>;
    requiredSource: z.ZodOptional<z.ZodString>;
    requiredScope: z.ZodOptional<z.ZodString>;
    effects: z.ZodOptional<z.ZodArray<z.ZodObject<{
        type: z.ZodString;
        targetUrl: z.ZodOptional<z.ZodString>;
        surfaceId: z.ZodOptional<z.ZodString>;
        timestamp: z.ZodOptional<z.ZodNumber>;
        details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }, {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }>, "many">>;
    meta: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    action: "check";
    skipInReport: boolean;
    checked: true;
    required?: boolean | undefined;
    description?: string | undefined;
    surfaceId?: string | undefined;
    meta?: Record<string, any> | undefined;
    frame?: string | {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    } | undefined;
    locator?: z.objectOutputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough"> | undefined;
    requiredSource?: string | undefined;
    requiredScope?: string | undefined;
    effects?: {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }[] | undefined;
}, {
    action: "check";
    required?: boolean | undefined;
    description?: string | undefined;
    surfaceId?: string | undefined;
    meta?: Record<string, any> | undefined;
    frame?: string | {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    } | undefined;
    locator?: z.objectInputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough"> | undefined;
    skipInReport?: boolean | undefined;
    requiredSource?: string | undefined;
    requiredScope?: string | undefined;
    effects?: {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }[] | undefined;
    checked?: true | undefined;
}>, z.ZodObject<{
    action: z.ZodLiteral<"uncheck">;
    checked: z.ZodDefault<z.ZodLiteral<false>>;
    surfaceId: z.ZodOptional<z.ZodString>;
    frame: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodObject<{
        url: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        path: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    }, {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    }>]>>;
    locator: z.ZodOptional<z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough">>>;
    description: z.ZodOptional<z.ZodString>;
    skipInReport: z.ZodDefault<z.ZodBoolean>;
    required: z.ZodOptional<z.ZodBoolean>;
    requiredSource: z.ZodOptional<z.ZodString>;
    requiredScope: z.ZodOptional<z.ZodString>;
    effects: z.ZodOptional<z.ZodArray<z.ZodObject<{
        type: z.ZodString;
        targetUrl: z.ZodOptional<z.ZodString>;
        surfaceId: z.ZodOptional<z.ZodString>;
        timestamp: z.ZodOptional<z.ZodNumber>;
        details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }, {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }>, "many">>;
    meta: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    action: "uncheck";
    skipInReport: boolean;
    checked: false;
    required?: boolean | undefined;
    description?: string | undefined;
    surfaceId?: string | undefined;
    meta?: Record<string, any> | undefined;
    frame?: string | {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    } | undefined;
    locator?: z.objectOutputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough"> | undefined;
    requiredSource?: string | undefined;
    requiredScope?: string | undefined;
    effects?: {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }[] | undefined;
}, {
    action: "uncheck";
    required?: boolean | undefined;
    description?: string | undefined;
    surfaceId?: string | undefined;
    meta?: Record<string, any> | undefined;
    frame?: string | {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    } | undefined;
    locator?: z.objectInputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough"> | undefined;
    skipInReport?: boolean | undefined;
    requiredSource?: string | undefined;
    requiredScope?: string | undefined;
    effects?: {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }[] | undefined;
    checked?: false | undefined;
}>, z.ZodObject<{
    action: z.ZodLiteral<"setInputFiles">;
    files: z.ZodArray<z.ZodString, "many">;
    value: z.ZodOptional<z.ZodString>;
    surfaceId: z.ZodOptional<z.ZodString>;
    frame: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodObject<{
        url: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        path: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    }, {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    }>]>>;
    locator: z.ZodOptional<z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough">>>;
    description: z.ZodOptional<z.ZodString>;
    skipInReport: z.ZodDefault<z.ZodBoolean>;
    required: z.ZodOptional<z.ZodBoolean>;
    requiredSource: z.ZodOptional<z.ZodString>;
    requiredScope: z.ZodOptional<z.ZodString>;
    effects: z.ZodOptional<z.ZodArray<z.ZodObject<{
        type: z.ZodString;
        targetUrl: z.ZodOptional<z.ZodString>;
        surfaceId: z.ZodOptional<z.ZodString>;
        timestamp: z.ZodOptional<z.ZodNumber>;
        details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }, {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }>, "many">>;
    meta: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    action: "setInputFiles";
    skipInReport: boolean;
    files: string[];
    value?: string | undefined;
    required?: boolean | undefined;
    description?: string | undefined;
    surfaceId?: string | undefined;
    meta?: Record<string, any> | undefined;
    frame?: string | {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    } | undefined;
    locator?: z.objectOutputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough"> | undefined;
    requiredSource?: string | undefined;
    requiredScope?: string | undefined;
    effects?: {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }[] | undefined;
}, {
    action: "setInputFiles";
    files: string[];
    value?: string | undefined;
    required?: boolean | undefined;
    description?: string | undefined;
    surfaceId?: string | undefined;
    meta?: Record<string, any> | undefined;
    frame?: string | {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    } | undefined;
    locator?: z.objectInputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough"> | undefined;
    skipInReport?: boolean | undefined;
    requiredSource?: string | undefined;
    requiredScope?: string | undefined;
    effects?: {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }[] | undefined;
}>, z.ZodObject<{
    action: z.ZodLiteral<"scroll">;
    deltaX: z.ZodOptional<z.ZodNumber>;
    deltaY: z.ZodOptional<z.ZodNumber>;
    surfaceId: z.ZodOptional<z.ZodString>;
    frame: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodObject<{
        url: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        path: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    }, {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    }>]>>;
    locator: z.ZodOptional<z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough">>>;
    description: z.ZodOptional<z.ZodString>;
    skipInReport: z.ZodDefault<z.ZodBoolean>;
    required: z.ZodOptional<z.ZodBoolean>;
    requiredSource: z.ZodOptional<z.ZodString>;
    requiredScope: z.ZodOptional<z.ZodString>;
    effects: z.ZodOptional<z.ZodArray<z.ZodObject<{
        type: z.ZodString;
        targetUrl: z.ZodOptional<z.ZodString>;
        surfaceId: z.ZodOptional<z.ZodString>;
        timestamp: z.ZodOptional<z.ZodNumber>;
        details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }, {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }>, "many">>;
    meta: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    action: "scroll";
    skipInReport: boolean;
    required?: boolean | undefined;
    description?: string | undefined;
    surfaceId?: string | undefined;
    meta?: Record<string, any> | undefined;
    frame?: string | {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    } | undefined;
    locator?: z.objectOutputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough"> | undefined;
    requiredSource?: string | undefined;
    requiredScope?: string | undefined;
    effects?: {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }[] | undefined;
    deltaX?: number | undefined;
    deltaY?: number | undefined;
}, {
    action: "scroll";
    required?: boolean | undefined;
    description?: string | undefined;
    surfaceId?: string | undefined;
    meta?: Record<string, any> | undefined;
    frame?: string | {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    } | undefined;
    locator?: z.objectInputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough"> | undefined;
    skipInReport?: boolean | undefined;
    requiredSource?: string | undefined;
    requiredScope?: string | undefined;
    effects?: {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }[] | undefined;
    deltaX?: number | undefined;
    deltaY?: number | undefined;
}>, z.ZodObject<{
    action: z.ZodLiteral<"hover">;
    position: z.ZodOptional<z.ZodObject<{
        x: z.ZodNumber;
        y: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        x: number;
        y: number;
    }, {
        x: number;
        y: number;
    }>>;
    surfaceId: z.ZodOptional<z.ZodString>;
    frame: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodObject<{
        url: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        path: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    }, {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    }>]>>;
    locator: z.ZodOptional<z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough">>>;
    description: z.ZodOptional<z.ZodString>;
    skipInReport: z.ZodDefault<z.ZodBoolean>;
    required: z.ZodOptional<z.ZodBoolean>;
    requiredSource: z.ZodOptional<z.ZodString>;
    requiredScope: z.ZodOptional<z.ZodString>;
    effects: z.ZodOptional<z.ZodArray<z.ZodObject<{
        type: z.ZodString;
        targetUrl: z.ZodOptional<z.ZodString>;
        surfaceId: z.ZodOptional<z.ZodString>;
        timestamp: z.ZodOptional<z.ZodNumber>;
        details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }, {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }>, "many">>;
    meta: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    action: "hover";
    skipInReport: boolean;
    required?: boolean | undefined;
    description?: string | undefined;
    surfaceId?: string | undefined;
    meta?: Record<string, any> | undefined;
    frame?: string | {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    } | undefined;
    locator?: z.objectOutputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough"> | undefined;
    requiredSource?: string | undefined;
    requiredScope?: string | undefined;
    effects?: {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }[] | undefined;
    position?: {
        x: number;
        y: number;
    } | undefined;
}, {
    action: "hover";
    required?: boolean | undefined;
    description?: string | undefined;
    surfaceId?: string | undefined;
    meta?: Record<string, any> | undefined;
    frame?: string | {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    } | undefined;
    locator?: z.objectInputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough"> | undefined;
    skipInReport?: boolean | undefined;
    requiredSource?: string | undefined;
    requiredScope?: string | undefined;
    effects?: {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }[] | undefined;
    position?: {
        x: number;
        y: number;
    } | undefined;
}>, z.ZodObject<{
    action: z.ZodLiteral<"copy">;
    outputName: z.ZodOptional<z.ZodString>;
    value: z.ZodOptional<z.ZodString>;
    surfaceId: z.ZodOptional<z.ZodString>;
    frame: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodObject<{
        url: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        path: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    }, {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    }>]>>;
    locator: z.ZodOptional<z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough">>>;
    description: z.ZodOptional<z.ZodString>;
    skipInReport: z.ZodDefault<z.ZodBoolean>;
    required: z.ZodOptional<z.ZodBoolean>;
    requiredSource: z.ZodOptional<z.ZodString>;
    requiredScope: z.ZodOptional<z.ZodString>;
    effects: z.ZodOptional<z.ZodArray<z.ZodObject<{
        type: z.ZodString;
        targetUrl: z.ZodOptional<z.ZodString>;
        surfaceId: z.ZodOptional<z.ZodString>;
        timestamp: z.ZodOptional<z.ZodNumber>;
        details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }, {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }>, "many">>;
    meta: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    action: "copy";
    skipInReport: boolean;
    value?: string | undefined;
    required?: boolean | undefined;
    description?: string | undefined;
    outputName?: string | undefined;
    surfaceId?: string | undefined;
    meta?: Record<string, any> | undefined;
    frame?: string | {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    } | undefined;
    locator?: z.objectOutputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough"> | undefined;
    requiredSource?: string | undefined;
    requiredScope?: string | undefined;
    effects?: {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }[] | undefined;
}, {
    action: "copy";
    value?: string | undefined;
    required?: boolean | undefined;
    description?: string | undefined;
    outputName?: string | undefined;
    surfaceId?: string | undefined;
    meta?: Record<string, any> | undefined;
    frame?: string | {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    } | undefined;
    locator?: z.objectInputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough"> | undefined;
    skipInReport?: boolean | undefined;
    requiredSource?: string | undefined;
    requiredScope?: string | undefined;
    effects?: {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }[] | undefined;
}>, z.ZodObject<{
    action: z.ZodLiteral<"wait">;
    durationMs: z.ZodNumber;
    surfaceId: z.ZodOptional<z.ZodString>;
    frame: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodObject<{
        url: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        path: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    }, {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    }>]>>;
    locator: z.ZodOptional<z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough">>>;
    description: z.ZodOptional<z.ZodString>;
    skipInReport: z.ZodDefault<z.ZodBoolean>;
    required: z.ZodOptional<z.ZodBoolean>;
    requiredSource: z.ZodOptional<z.ZodString>;
    requiredScope: z.ZodOptional<z.ZodString>;
    effects: z.ZodOptional<z.ZodArray<z.ZodObject<{
        type: z.ZodString;
        targetUrl: z.ZodOptional<z.ZodString>;
        surfaceId: z.ZodOptional<z.ZodString>;
        timestamp: z.ZodOptional<z.ZodNumber>;
        details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }, {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }>, "many">>;
    meta: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    action: "wait";
    durationMs: number;
    skipInReport: boolean;
    required?: boolean | undefined;
    description?: string | undefined;
    surfaceId?: string | undefined;
    meta?: Record<string, any> | undefined;
    frame?: string | {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    } | undefined;
    locator?: z.objectOutputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough"> | undefined;
    requiredSource?: string | undefined;
    requiredScope?: string | undefined;
    effects?: {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }[] | undefined;
}, {
    action: "wait";
    durationMs: number;
    required?: boolean | undefined;
    description?: string | undefined;
    surfaceId?: string | undefined;
    meta?: Record<string, any> | undefined;
    frame?: string | {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    } | undefined;
    locator?: z.objectInputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough"> | undefined;
    skipInReport?: boolean | undefined;
    requiredSource?: string | undefined;
    requiredScope?: string | undefined;
    effects?: {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }[] | undefined;
}>, z.ZodObject<{
    action: z.ZodLiteral<"assertVisible">;
    surfaceId: z.ZodOptional<z.ZodString>;
    frame: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodObject<{
        url: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        path: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    }, {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    }>]>>;
    locator: z.ZodOptional<z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough">>>;
    description: z.ZodOptional<z.ZodString>;
    skipInReport: z.ZodDefault<z.ZodBoolean>;
    required: z.ZodOptional<z.ZodBoolean>;
    requiredSource: z.ZodOptional<z.ZodString>;
    requiredScope: z.ZodOptional<z.ZodString>;
    effects: z.ZodOptional<z.ZodArray<z.ZodObject<{
        type: z.ZodString;
        targetUrl: z.ZodOptional<z.ZodString>;
        surfaceId: z.ZodOptional<z.ZodString>;
        timestamp: z.ZodOptional<z.ZodNumber>;
        details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }, {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }>, "many">>;
    meta: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    action: "assertVisible";
    skipInReport: boolean;
    required?: boolean | undefined;
    description?: string | undefined;
    surfaceId?: string | undefined;
    meta?: Record<string, any> | undefined;
    frame?: string | {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    } | undefined;
    locator?: z.objectOutputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough"> | undefined;
    requiredSource?: string | undefined;
    requiredScope?: string | undefined;
    effects?: {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }[] | undefined;
}, {
    action: "assertVisible";
    required?: boolean | undefined;
    description?: string | undefined;
    surfaceId?: string | undefined;
    meta?: Record<string, any> | undefined;
    frame?: string | {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    } | undefined;
    locator?: z.objectInputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough"> | undefined;
    skipInReport?: boolean | undefined;
    requiredSource?: string | undefined;
    requiredScope?: string | undefined;
    effects?: {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }[] | undefined;
}>, z.ZodObject<{
    action: z.ZodLiteral<"assertText">;
    value: z.ZodString;
    surfaceId: z.ZodOptional<z.ZodString>;
    frame: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodObject<{
        url: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        path: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    }, {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    }>]>>;
    locator: z.ZodOptional<z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough">>>;
    description: z.ZodOptional<z.ZodString>;
    skipInReport: z.ZodDefault<z.ZodBoolean>;
    required: z.ZodOptional<z.ZodBoolean>;
    requiredSource: z.ZodOptional<z.ZodString>;
    requiredScope: z.ZodOptional<z.ZodString>;
    effects: z.ZodOptional<z.ZodArray<z.ZodObject<{
        type: z.ZodString;
        targetUrl: z.ZodOptional<z.ZodString>;
        surfaceId: z.ZodOptional<z.ZodString>;
        timestamp: z.ZodOptional<z.ZodNumber>;
        details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }, {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }>, "many">>;
    meta: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    value: string;
    action: "assertText";
    skipInReport: boolean;
    required?: boolean | undefined;
    description?: string | undefined;
    surfaceId?: string | undefined;
    meta?: Record<string, any> | undefined;
    frame?: string | {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    } | undefined;
    locator?: z.objectOutputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough"> | undefined;
    requiredSource?: string | undefined;
    requiredScope?: string | undefined;
    effects?: {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }[] | undefined;
}, {
    value: string;
    action: "assertText";
    required?: boolean | undefined;
    description?: string | undefined;
    surfaceId?: string | undefined;
    meta?: Record<string, any> | undefined;
    frame?: string | {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    } | undefined;
    locator?: z.objectInputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough"> | undefined;
    skipInReport?: boolean | undefined;
    requiredSource?: string | undefined;
    requiredScope?: string | undefined;
    effects?: {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }[] | undefined;
}>, z.ZodObject<{
    action: z.ZodLiteral<"assertValue">;
    value: z.ZodString;
    surfaceId: z.ZodOptional<z.ZodString>;
    frame: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodObject<{
        url: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        path: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    }, {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    }>]>>;
    locator: z.ZodOptional<z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough">>>;
    description: z.ZodOptional<z.ZodString>;
    skipInReport: z.ZodDefault<z.ZodBoolean>;
    required: z.ZodOptional<z.ZodBoolean>;
    requiredSource: z.ZodOptional<z.ZodString>;
    requiredScope: z.ZodOptional<z.ZodString>;
    effects: z.ZodOptional<z.ZodArray<z.ZodObject<{
        type: z.ZodString;
        targetUrl: z.ZodOptional<z.ZodString>;
        surfaceId: z.ZodOptional<z.ZodString>;
        timestamp: z.ZodOptional<z.ZodNumber>;
        details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }, {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }>, "many">>;
    meta: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    value: string;
    action: "assertValue";
    skipInReport: boolean;
    required?: boolean | undefined;
    description?: string | undefined;
    surfaceId?: string | undefined;
    meta?: Record<string, any> | undefined;
    frame?: string | {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    } | undefined;
    locator?: z.objectOutputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough"> | undefined;
    requiredSource?: string | undefined;
    requiredScope?: string | undefined;
    effects?: {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }[] | undefined;
}, {
    value: string;
    action: "assertValue";
    required?: boolean | undefined;
    description?: string | undefined;
    surfaceId?: string | undefined;
    meta?: Record<string, any> | undefined;
    frame?: string | {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    } | undefined;
    locator?: z.objectInputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough"> | undefined;
    skipInReport?: boolean | undefined;
    requiredSource?: string | undefined;
    requiredScope?: string | undefined;
    effects?: {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }[] | undefined;
}>, z.ZodObject<{
    action: z.ZodLiteral<"assertChecked">;
    checked: z.ZodBoolean;
    surfaceId: z.ZodOptional<z.ZodString>;
    frame: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodObject<{
        url: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        path: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    }, {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    }>]>>;
    locator: z.ZodOptional<z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough">>>;
    description: z.ZodOptional<z.ZodString>;
    skipInReport: z.ZodDefault<z.ZodBoolean>;
    required: z.ZodOptional<z.ZodBoolean>;
    requiredSource: z.ZodOptional<z.ZodString>;
    requiredScope: z.ZodOptional<z.ZodString>;
    effects: z.ZodOptional<z.ZodArray<z.ZodObject<{
        type: z.ZodString;
        targetUrl: z.ZodOptional<z.ZodString>;
        surfaceId: z.ZodOptional<z.ZodString>;
        timestamp: z.ZodOptional<z.ZodNumber>;
        details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }, {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }>, "many">>;
    meta: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    action: "assertChecked";
    skipInReport: boolean;
    checked: boolean;
    required?: boolean | undefined;
    description?: string | undefined;
    surfaceId?: string | undefined;
    meta?: Record<string, any> | undefined;
    frame?: string | {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    } | undefined;
    locator?: z.objectOutputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough"> | undefined;
    requiredSource?: string | undefined;
    requiredScope?: string | undefined;
    effects?: {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }[] | undefined;
}, {
    action: "assertChecked";
    checked: boolean;
    required?: boolean | undefined;
    description?: string | undefined;
    surfaceId?: string | undefined;
    meta?: Record<string, any> | undefined;
    frame?: string | {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    } | undefined;
    locator?: z.objectInputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough"> | undefined;
    skipInReport?: boolean | undefined;
    requiredSource?: string | undefined;
    requiredScope?: string | undefined;
    effects?: {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }[] | undefined;
}>, z.ZodObject<{
    action: z.ZodLiteral<"assertSnapshot">;
    snapshot: z.ZodString;
    surfaceId: z.ZodOptional<z.ZodString>;
    frame: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodObject<{
        url: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        path: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    }, {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    }>]>>;
    locator: z.ZodOptional<z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough">>>;
    description: z.ZodOptional<z.ZodString>;
    skipInReport: z.ZodDefault<z.ZodBoolean>;
    required: z.ZodOptional<z.ZodBoolean>;
    requiredSource: z.ZodOptional<z.ZodString>;
    requiredScope: z.ZodOptional<z.ZodString>;
    effects: z.ZodOptional<z.ZodArray<z.ZodObject<{
        type: z.ZodString;
        targetUrl: z.ZodOptional<z.ZodString>;
        surfaceId: z.ZodOptional<z.ZodString>;
        timestamp: z.ZodOptional<z.ZodNumber>;
        details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }, {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }>, "many">>;
    meta: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    action: "assertSnapshot";
    skipInReport: boolean;
    snapshot: string;
    required?: boolean | undefined;
    description?: string | undefined;
    surfaceId?: string | undefined;
    meta?: Record<string, any> | undefined;
    frame?: string | {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    } | undefined;
    locator?: z.objectOutputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough"> | undefined;
    requiredSource?: string | undefined;
    requiredScope?: string | undefined;
    effects?: {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }[] | undefined;
}, {
    action: "assertSnapshot";
    snapshot: string;
    required?: boolean | undefined;
    description?: string | undefined;
    surfaceId?: string | undefined;
    meta?: Record<string, any> | undefined;
    frame?: string | {
        path?: string[] | undefined;
        name?: string | undefined;
        selector?: string | undefined;
        url?: string | undefined;
    } | undefined;
    locator?: z.objectInputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough"> | undefined;
    skipInReport?: boolean | undefined;
    requiredSource?: string | undefined;
    requiredScope?: string | undefined;
    effects?: {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }[] | undefined;
}>]>;
export declare const SemanticCandidateSchema: z.ZodObject<{
    action: z.ZodString;
    surfaceId: z.ZodOptional<z.ZodString>;
    frame: z.ZodOptional<z.ZodAny>;
    locator: z.ZodOptional<z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough">>>;
    value: z.ZodOptional<z.ZodAny>;
    values: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    key: z.ZodOptional<z.ZodString>;
    button: z.ZodOptional<z.ZodEnum<["left", "right", "middle"]>>;
    clickCount: z.ZodOptional<z.ZodNumber>;
    modifiers: z.ZodOptional<z.ZodObject<{
        alt: z.ZodOptional<z.ZodBoolean>;
        control: z.ZodOptional<z.ZodBoolean>;
        meta: z.ZodOptional<z.ZodBoolean>;
        shift: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        shift?: boolean | undefined;
        alt?: boolean | undefined;
        control?: boolean | undefined;
        meta?: boolean | undefined;
    }, {
        shift?: boolean | undefined;
        alt?: boolean | undefined;
        control?: boolean | undefined;
        meta?: boolean | undefined;
    }>>;
    position: z.ZodOptional<z.ZodObject<{
        x: z.ZodNumber;
        y: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        x: number;
        y: number;
    }, {
        x: number;
        y: number;
    }>>;
    checked: z.ZodOptional<z.ZodBoolean>;
    files: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    committedValue: z.ZodOptional<z.ZodString>;
    credentialRef: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    outputName: z.ZodOptional<z.ZodString>;
    skipInReport: z.ZodDefault<z.ZodBoolean>;
    required: z.ZodOptional<z.ZodBoolean>;
    requiredSource: z.ZodOptional<z.ZodString>;
    requiredScope: z.ZodOptional<z.ZodString>;
    effects: z.ZodOptional<z.ZodArray<z.ZodObject<{
        type: z.ZodString;
        targetUrl: z.ZodOptional<z.ZodString>;
        surfaceId: z.ZodOptional<z.ZodString>;
        timestamp: z.ZodOptional<z.ZodNumber>;
        details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }, {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }>, "many">>;
    meta: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    action: string;
    skipInReport: boolean;
    value?: any;
    values?: string[] | undefined;
    required?: boolean | undefined;
    description?: string | undefined;
    outputName?: string | undefined;
    surfaceId?: string | undefined;
    meta?: Record<string, any> | undefined;
    frame?: any;
    locator?: z.objectOutputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough"> | undefined;
    requiredSource?: string | undefined;
    requiredScope?: string | undefined;
    effects?: {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }[] | undefined;
    button?: "left" | "right" | "middle" | undefined;
    clickCount?: number | undefined;
    modifiers?: {
        shift?: boolean | undefined;
        alt?: boolean | undefined;
        control?: boolean | undefined;
        meta?: boolean | undefined;
    } | undefined;
    position?: {
        x: number;
        y: number;
    } | undefined;
    committedValue?: string | undefined;
    credentialRef?: string | undefined;
    key?: string | undefined;
    checked?: boolean | undefined;
    files?: string[] | undefined;
}, {
    action: string;
    value?: any;
    values?: string[] | undefined;
    required?: boolean | undefined;
    description?: string | undefined;
    outputName?: string | undefined;
    surfaceId?: string | undefined;
    meta?: Record<string, any> | undefined;
    frame?: any;
    locator?: z.objectInputType<{
        id: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        attrSelector: z.ZodOptional<z.ZodString>;
        testId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough"> | undefined;
    skipInReport?: boolean | undefined;
    requiredSource?: string | undefined;
    requiredScope?: string | undefined;
    effects?: {
        type: string;
        details?: Record<string, any> | undefined;
        timestamp?: number | undefined;
        surfaceId?: string | undefined;
        targetUrl?: string | undefined;
    }[] | undefined;
    button?: "left" | "right" | "middle" | undefined;
    clickCount?: number | undefined;
    modifiers?: {
        shift?: boolean | undefined;
        alt?: boolean | undefined;
        control?: boolean | undefined;
        meta?: boolean | undefined;
    } | undefined;
    position?: {
        x: number;
        y: number;
    } | undefined;
    committedValue?: string | undefined;
    credentialRef?: string | undefined;
    key?: string | undefined;
    checked?: boolean | undefined;
    files?: string[] | undefined;
}>;
export declare const AdapterDecisionSchema: z.ZodDiscriminatedUnion<"kind", [z.ZodObject<{
    kind: z.ZodLiteral<"pass">;
}, "strip", z.ZodTypeAny, {
    kind: "pass";
}, {
    kind: "pass";
}>, z.ZodObject<{
    kind: z.ZodLiteral<"claim">;
    candidate: z.ZodObject<{
        action: z.ZodString;
        surfaceId: z.ZodOptional<z.ZodString>;
        frame: z.ZodOptional<z.ZodAny>;
        locator: z.ZodOptional<z.ZodObject<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">>>;
        value: z.ZodOptional<z.ZodAny>;
        values: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        key: z.ZodOptional<z.ZodString>;
        button: z.ZodOptional<z.ZodEnum<["left", "right", "middle"]>>;
        clickCount: z.ZodOptional<z.ZodNumber>;
        modifiers: z.ZodOptional<z.ZodObject<{
            alt: z.ZodOptional<z.ZodBoolean>;
            control: z.ZodOptional<z.ZodBoolean>;
            meta: z.ZodOptional<z.ZodBoolean>;
            shift: z.ZodOptional<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            shift?: boolean | undefined;
            alt?: boolean | undefined;
            control?: boolean | undefined;
            meta?: boolean | undefined;
        }, {
            shift?: boolean | undefined;
            alt?: boolean | undefined;
            control?: boolean | undefined;
            meta?: boolean | undefined;
        }>>;
        position: z.ZodOptional<z.ZodObject<{
            x: z.ZodNumber;
            y: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            x: number;
            y: number;
        }, {
            x: number;
            y: number;
        }>>;
        checked: z.ZodOptional<z.ZodBoolean>;
        files: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        committedValue: z.ZodOptional<z.ZodString>;
        credentialRef: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
        outputName: z.ZodOptional<z.ZodString>;
        skipInReport: z.ZodDefault<z.ZodBoolean>;
        required: z.ZodOptional<z.ZodBoolean>;
        requiredSource: z.ZodOptional<z.ZodString>;
        requiredScope: z.ZodOptional<z.ZodString>;
        effects: z.ZodOptional<z.ZodArray<z.ZodObject<{
            type: z.ZodString;
            targetUrl: z.ZodOptional<z.ZodString>;
            surfaceId: z.ZodOptional<z.ZodString>;
            timestamp: z.ZodOptional<z.ZodNumber>;
            details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        }, "strip", z.ZodTypeAny, {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }, {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }>, "many">>;
        meta: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        action: string;
        skipInReport: boolean;
        value?: any;
        values?: string[] | undefined;
        required?: boolean | undefined;
        description?: string | undefined;
        outputName?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: any;
        locator?: z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
        button?: "left" | "right" | "middle" | undefined;
        clickCount?: number | undefined;
        modifiers?: {
            shift?: boolean | undefined;
            alt?: boolean | undefined;
            control?: boolean | undefined;
            meta?: boolean | undefined;
        } | undefined;
        position?: {
            x: number;
            y: number;
        } | undefined;
        committedValue?: string | undefined;
        credentialRef?: string | undefined;
        key?: string | undefined;
        checked?: boolean | undefined;
        files?: string[] | undefined;
    }, {
        action: string;
        value?: any;
        values?: string[] | undefined;
        required?: boolean | undefined;
        description?: string | undefined;
        outputName?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: any;
        locator?: z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        skipInReport?: boolean | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
        button?: "left" | "right" | "middle" | undefined;
        clickCount?: number | undefined;
        modifiers?: {
            shift?: boolean | undefined;
            alt?: boolean | undefined;
            control?: boolean | undefined;
            meta?: boolean | undefined;
        } | undefined;
        position?: {
            x: number;
            y: number;
        } | undefined;
        committedValue?: string | undefined;
        credentialRef?: string | undefined;
        key?: string | undefined;
        checked?: boolean | undefined;
        files?: string[] | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    kind: "claim";
    candidate: {
        action: string;
        skipInReport: boolean;
        value?: any;
        values?: string[] | undefined;
        required?: boolean | undefined;
        description?: string | undefined;
        outputName?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: any;
        locator?: z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
        button?: "left" | "right" | "middle" | undefined;
        clickCount?: number | undefined;
        modifiers?: {
            shift?: boolean | undefined;
            alt?: boolean | undefined;
            control?: boolean | undefined;
            meta?: boolean | undefined;
        } | undefined;
        position?: {
            x: number;
            y: number;
        } | undefined;
        committedValue?: string | undefined;
        credentialRef?: string | undefined;
        key?: string | undefined;
        checked?: boolean | undefined;
        files?: string[] | undefined;
    };
}, {
    kind: "claim";
    candidate: {
        action: string;
        value?: any;
        values?: string[] | undefined;
        required?: boolean | undefined;
        description?: string | undefined;
        outputName?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: any;
        locator?: z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        skipInReport?: boolean | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
        button?: "left" | "right" | "middle" | undefined;
        clickCount?: number | undefined;
        modifiers?: {
            shift?: boolean | undefined;
            alt?: boolean | undefined;
            control?: boolean | undefined;
            meta?: boolean | undefined;
        } | undefined;
        position?: {
            x: number;
            y: number;
        } | undefined;
        committedValue?: string | undefined;
        credentialRef?: string | undefined;
        key?: string | undefined;
        checked?: boolean | undefined;
        files?: string[] | undefined;
    };
}>, z.ZodObject<{
    kind: z.ZodLiteral<"augment">;
    patch: z.ZodObject<{
        action: z.ZodOptional<z.ZodString>;
        surfaceId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
        frame: z.ZodOptional<z.ZodOptional<z.ZodAny>>;
        locator: z.ZodOptional<z.ZodOptional<z.ZodObject<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">>>>;
        value: z.ZodOptional<z.ZodOptional<z.ZodAny>>;
        values: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
        key: z.ZodOptional<z.ZodOptional<z.ZodString>>;
        button: z.ZodOptional<z.ZodOptional<z.ZodEnum<["left", "right", "middle"]>>>;
        clickCount: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
        modifiers: z.ZodOptional<z.ZodOptional<z.ZodObject<{
            alt: z.ZodOptional<z.ZodBoolean>;
            control: z.ZodOptional<z.ZodBoolean>;
            meta: z.ZodOptional<z.ZodBoolean>;
            shift: z.ZodOptional<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            shift?: boolean | undefined;
            alt?: boolean | undefined;
            control?: boolean | undefined;
            meta?: boolean | undefined;
        }, {
            shift?: boolean | undefined;
            alt?: boolean | undefined;
            control?: boolean | undefined;
            meta?: boolean | undefined;
        }>>>;
        position: z.ZodOptional<z.ZodOptional<z.ZodObject<{
            x: z.ZodNumber;
            y: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            x: number;
            y: number;
        }, {
            x: number;
            y: number;
        }>>>;
        checked: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
        files: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
        committedValue: z.ZodOptional<z.ZodOptional<z.ZodString>>;
        credentialRef: z.ZodOptional<z.ZodOptional<z.ZodString>>;
        description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
        outputName: z.ZodOptional<z.ZodOptional<z.ZodString>>;
        skipInReport: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
        required: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
        requiredSource: z.ZodOptional<z.ZodOptional<z.ZodString>>;
        requiredScope: z.ZodOptional<z.ZodOptional<z.ZodString>>;
        effects: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodObject<{
            type: z.ZodString;
            targetUrl: z.ZodOptional<z.ZodString>;
            surfaceId: z.ZodOptional<z.ZodString>;
            timestamp: z.ZodOptional<z.ZodNumber>;
            details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        }, "strip", z.ZodTypeAny, {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }, {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }>, "many">>>;
        meta: z.ZodOptional<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>>;
    }, "strip", z.ZodTypeAny, {
        value?: any;
        values?: string[] | undefined;
        required?: boolean | undefined;
        description?: string | undefined;
        action?: string | undefined;
        outputName?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: any;
        locator?: z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        skipInReport?: boolean | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
        button?: "left" | "right" | "middle" | undefined;
        clickCount?: number | undefined;
        modifiers?: {
            shift?: boolean | undefined;
            alt?: boolean | undefined;
            control?: boolean | undefined;
            meta?: boolean | undefined;
        } | undefined;
        position?: {
            x: number;
            y: number;
        } | undefined;
        committedValue?: string | undefined;
        credentialRef?: string | undefined;
        key?: string | undefined;
        checked?: boolean | undefined;
        files?: string[] | undefined;
    }, {
        value?: any;
        values?: string[] | undefined;
        required?: boolean | undefined;
        description?: string | undefined;
        action?: string | undefined;
        outputName?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: any;
        locator?: z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        skipInReport?: boolean | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
        button?: "left" | "right" | "middle" | undefined;
        clickCount?: number | undefined;
        modifiers?: {
            shift?: boolean | undefined;
            alt?: boolean | undefined;
            control?: boolean | undefined;
            meta?: boolean | undefined;
        } | undefined;
        position?: {
            x: number;
            y: number;
        } | undefined;
        committedValue?: string | undefined;
        credentialRef?: string | undefined;
        key?: string | undefined;
        checked?: boolean | undefined;
        files?: string[] | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    kind: "augment";
    patch: {
        value?: any;
        values?: string[] | undefined;
        required?: boolean | undefined;
        description?: string | undefined;
        action?: string | undefined;
        outputName?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: any;
        locator?: z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        skipInReport?: boolean | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
        button?: "left" | "right" | "middle" | undefined;
        clickCount?: number | undefined;
        modifiers?: {
            shift?: boolean | undefined;
            alt?: boolean | undefined;
            control?: boolean | undefined;
            meta?: boolean | undefined;
        } | undefined;
        position?: {
            x: number;
            y: number;
        } | undefined;
        committedValue?: string | undefined;
        credentialRef?: string | undefined;
        key?: string | undefined;
        checked?: boolean | undefined;
        files?: string[] | undefined;
    };
}, {
    kind: "augment";
    patch: {
        value?: any;
        values?: string[] | undefined;
        required?: boolean | undefined;
        description?: string | undefined;
        action?: string | undefined;
        outputName?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: any;
        locator?: z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        skipInReport?: boolean | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
        button?: "left" | "right" | "middle" | undefined;
        clickCount?: number | undefined;
        modifiers?: {
            shift?: boolean | undefined;
            alt?: boolean | undefined;
            control?: boolean | undefined;
            meta?: boolean | undefined;
        } | undefined;
        position?: {
            x: number;
            y: number;
        } | undefined;
        committedValue?: string | undefined;
        credentialRef?: string | undefined;
        key?: string | undefined;
        checked?: boolean | undefined;
        files?: string[] | undefined;
    };
}>, z.ZodObject<{
    kind: z.ZodLiteral<"ignore">;
    reason: z.ZodString;
}, "strip", z.ZodTypeAny, {
    kind: "ignore";
    reason: string;
}, {
    kind: "ignore";
    reason: string;
}>]>;
export declare const RecordingEnvelopeSchema: z.ZodObject<{
    protocolVersion: z.ZodLiteral<"2.0">;
    recordingSessionId: z.ZodString;
    recordedAt: z.ZodUnion<[z.ZodString, z.ZodString]>;
    producer: z.ZodObject<{
        kind: z.ZodEnum<["extension", "desktop", "custom"]>;
        version: z.ZodString;
        platform: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        kind: "custom" | "extension" | "desktop";
        version: string;
        platform?: string | undefined;
    }, {
        kind: "custom" | "extension" | "desktop";
        version: string;
        platform?: string | undefined;
    }>;
    capabilities: z.ZodDefault<z.ZodArray<z.ZodEnum<["multiSurface", "nestedFrames", "downloads", "detachedFileInput", "evidenceScreenshots", "oracleADF", "oracleJET", "redwood"]>, "many">>;
    meta: z.ZodObject<{
        name: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
        sourceUrl: z.ZodString;
        patchId: z.ZodDefault<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        patchId: string;
        sourceUrl: string;
        name?: string | undefined;
        description?: string | undefined;
    }, {
        sourceUrl: string;
        name?: string | undefined;
        description?: string | undefined;
        patchId?: string | undefined;
    }>;
    steps: z.ZodArray<z.ZodDiscriminatedUnion<"action", [z.ZodObject<{
        action: z.ZodLiteral<"navigate">;
        value: z.ZodString;
        url: z.ZodOptional<z.ZodString>;
        surfaceId: z.ZodOptional<z.ZodString>;
        frame: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodObject<{
            url: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            path: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        }, {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        }>]>>;
        locator: z.ZodOptional<z.ZodObject<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">>>;
        description: z.ZodOptional<z.ZodString>;
        skipInReport: z.ZodDefault<z.ZodBoolean>;
        required: z.ZodOptional<z.ZodBoolean>;
        requiredSource: z.ZodOptional<z.ZodString>;
        requiredScope: z.ZodOptional<z.ZodString>;
        effects: z.ZodOptional<z.ZodArray<z.ZodObject<{
            type: z.ZodString;
            targetUrl: z.ZodOptional<z.ZodString>;
            surfaceId: z.ZodOptional<z.ZodString>;
            timestamp: z.ZodOptional<z.ZodNumber>;
            details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        }, "strip", z.ZodTypeAny, {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }, {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }>, "many">>;
        meta: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        value: string;
        action: "navigate";
        skipInReport: boolean;
        required?: boolean | undefined;
        description?: string | undefined;
        url?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
    }, {
        value: string;
        action: "navigate";
        required?: boolean | undefined;
        description?: string | undefined;
        url?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        skipInReport?: boolean | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
    }>, z.ZodObject<{
        action: z.ZodLiteral<"click">;
        button: z.ZodOptional<z.ZodEnum<["left", "right", "middle"]>>;
        clickCount: z.ZodOptional<z.ZodNumber>;
        modifiers: z.ZodOptional<z.ZodObject<{
            alt: z.ZodOptional<z.ZodBoolean>;
            control: z.ZodOptional<z.ZodBoolean>;
            meta: z.ZodOptional<z.ZodBoolean>;
            shift: z.ZodOptional<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            shift?: boolean | undefined;
            alt?: boolean | undefined;
            control?: boolean | undefined;
            meta?: boolean | undefined;
        }, {
            shift?: boolean | undefined;
            alt?: boolean | undefined;
            control?: boolean | undefined;
            meta?: boolean | undefined;
        }>>;
        position: z.ZodOptional<z.ZodObject<{
            x: z.ZodNumber;
            y: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            x: number;
            y: number;
        }, {
            x: number;
            y: number;
        }>>;
        surfaceId: z.ZodOptional<z.ZodString>;
        frame: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodObject<{
            url: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            path: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        }, {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        }>]>>;
        locator: z.ZodOptional<z.ZodObject<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">>>;
        description: z.ZodOptional<z.ZodString>;
        skipInReport: z.ZodDefault<z.ZodBoolean>;
        required: z.ZodOptional<z.ZodBoolean>;
        requiredSource: z.ZodOptional<z.ZodString>;
        requiredScope: z.ZodOptional<z.ZodString>;
        effects: z.ZodOptional<z.ZodArray<z.ZodObject<{
            type: z.ZodString;
            targetUrl: z.ZodOptional<z.ZodString>;
            surfaceId: z.ZodOptional<z.ZodString>;
            timestamp: z.ZodOptional<z.ZodNumber>;
            details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        }, "strip", z.ZodTypeAny, {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }, {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }>, "many">>;
        meta: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        action: "click";
        skipInReport: boolean;
        required?: boolean | undefined;
        description?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
        button?: "left" | "right" | "middle" | undefined;
        clickCount?: number | undefined;
        modifiers?: {
            shift?: boolean | undefined;
            alt?: boolean | undefined;
            control?: boolean | undefined;
            meta?: boolean | undefined;
        } | undefined;
        position?: {
            x: number;
            y: number;
        } | undefined;
    }, {
        action: "click";
        required?: boolean | undefined;
        description?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        skipInReport?: boolean | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
        button?: "left" | "right" | "middle" | undefined;
        clickCount?: number | undefined;
        modifiers?: {
            shift?: boolean | undefined;
            alt?: boolean | undefined;
            control?: boolean | undefined;
            meta?: boolean | undefined;
        } | undefined;
        position?: {
            x: number;
            y: number;
        } | undefined;
    }>, z.ZodObject<{
        action: z.ZodLiteral<"dblclick">;
        clickCount: z.ZodDefault<z.ZodNumber>;
        modifiers: z.ZodOptional<z.ZodObject<{
            alt: z.ZodOptional<z.ZodBoolean>;
            control: z.ZodOptional<z.ZodBoolean>;
            meta: z.ZodOptional<z.ZodBoolean>;
            shift: z.ZodOptional<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            shift?: boolean | undefined;
            alt?: boolean | undefined;
            control?: boolean | undefined;
            meta?: boolean | undefined;
        }, {
            shift?: boolean | undefined;
            alt?: boolean | undefined;
            control?: boolean | undefined;
            meta?: boolean | undefined;
        }>>;
        position: z.ZodOptional<z.ZodObject<{
            x: z.ZodNumber;
            y: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            x: number;
            y: number;
        }, {
            x: number;
            y: number;
        }>>;
        surfaceId: z.ZodOptional<z.ZodString>;
        frame: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodObject<{
            url: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            path: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        }, {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        }>]>>;
        locator: z.ZodOptional<z.ZodObject<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">>>;
        description: z.ZodOptional<z.ZodString>;
        skipInReport: z.ZodDefault<z.ZodBoolean>;
        required: z.ZodOptional<z.ZodBoolean>;
        requiredSource: z.ZodOptional<z.ZodString>;
        requiredScope: z.ZodOptional<z.ZodString>;
        effects: z.ZodOptional<z.ZodArray<z.ZodObject<{
            type: z.ZodString;
            targetUrl: z.ZodOptional<z.ZodString>;
            surfaceId: z.ZodOptional<z.ZodString>;
            timestamp: z.ZodOptional<z.ZodNumber>;
            details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        }, "strip", z.ZodTypeAny, {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }, {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }>, "many">>;
        meta: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        action: "dblclick";
        skipInReport: boolean;
        clickCount: number;
        required?: boolean | undefined;
        description?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
        modifiers?: {
            shift?: boolean | undefined;
            alt?: boolean | undefined;
            control?: boolean | undefined;
            meta?: boolean | undefined;
        } | undefined;
        position?: {
            x: number;
            y: number;
        } | undefined;
    }, {
        action: "dblclick";
        required?: boolean | undefined;
        description?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        skipInReport?: boolean | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
        clickCount?: number | undefined;
        modifiers?: {
            shift?: boolean | undefined;
            alt?: boolean | undefined;
            control?: boolean | undefined;
            meta?: boolean | undefined;
        } | undefined;
        position?: {
            x: number;
            y: number;
        } | undefined;
    }>, z.ZodObject<{
        action: z.ZodLiteral<"fill">;
        value: z.ZodOptional<z.ZodString>;
        committedValue: z.ZodOptional<z.ZodString>;
        credentialRef: z.ZodOptional<z.ZodString>;
        surfaceId: z.ZodOptional<z.ZodString>;
        frame: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodObject<{
            url: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            path: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        }, {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        }>]>>;
        locator: z.ZodOptional<z.ZodObject<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">>>;
        description: z.ZodOptional<z.ZodString>;
        skipInReport: z.ZodDefault<z.ZodBoolean>;
        required: z.ZodOptional<z.ZodBoolean>;
        requiredSource: z.ZodOptional<z.ZodString>;
        requiredScope: z.ZodOptional<z.ZodString>;
        effects: z.ZodOptional<z.ZodArray<z.ZodObject<{
            type: z.ZodString;
            targetUrl: z.ZodOptional<z.ZodString>;
            surfaceId: z.ZodOptional<z.ZodString>;
            timestamp: z.ZodOptional<z.ZodNumber>;
            details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        }, "strip", z.ZodTypeAny, {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }, {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }>, "many">>;
        meta: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        action: "fill";
        skipInReport: boolean;
        value?: string | undefined;
        required?: boolean | undefined;
        description?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
        committedValue?: string | undefined;
        credentialRef?: string | undefined;
    }, {
        action: "fill";
        value?: string | undefined;
        required?: boolean | undefined;
        description?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        skipInReport?: boolean | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
        committedValue?: string | undefined;
        credentialRef?: string | undefined;
    }>, z.ZodObject<{
        action: z.ZodLiteral<"selectOption">;
        value: z.ZodOptional<z.ZodString>;
        values: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        optionIndex: z.ZodOptional<z.ZodNumber>;
        surfaceId: z.ZodOptional<z.ZodString>;
        frame: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodObject<{
            url: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            path: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        }, {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        }>]>>;
        locator: z.ZodOptional<z.ZodObject<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">>>;
        description: z.ZodOptional<z.ZodString>;
        skipInReport: z.ZodDefault<z.ZodBoolean>;
        required: z.ZodOptional<z.ZodBoolean>;
        requiredSource: z.ZodOptional<z.ZodString>;
        requiredScope: z.ZodOptional<z.ZodString>;
        effects: z.ZodOptional<z.ZodArray<z.ZodObject<{
            type: z.ZodString;
            targetUrl: z.ZodOptional<z.ZodString>;
            surfaceId: z.ZodOptional<z.ZodString>;
            timestamp: z.ZodOptional<z.ZodNumber>;
            details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        }, "strip", z.ZodTypeAny, {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }, {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }>, "many">>;
        meta: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        action: "selectOption";
        skipInReport: boolean;
        value?: string | undefined;
        values?: string[] | undefined;
        required?: boolean | undefined;
        description?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
        optionIndex?: number | undefined;
    }, {
        action: "selectOption";
        value?: string | undefined;
        values?: string[] | undefined;
        required?: boolean | undefined;
        description?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        skipInReport?: boolean | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
        optionIndex?: number | undefined;
    }>, z.ZodObject<{
        action: z.ZodLiteral<"lovSelect">;
        value: z.ZodString;
        optionIndex: z.ZodOptional<z.ZodNumber>;
        surfaceId: z.ZodOptional<z.ZodString>;
        frame: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodObject<{
            url: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            path: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        }, {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        }>]>>;
        locator: z.ZodOptional<z.ZodObject<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">>>;
        description: z.ZodOptional<z.ZodString>;
        skipInReport: z.ZodDefault<z.ZodBoolean>;
        required: z.ZodOptional<z.ZodBoolean>;
        requiredSource: z.ZodOptional<z.ZodString>;
        requiredScope: z.ZodOptional<z.ZodString>;
        effects: z.ZodOptional<z.ZodArray<z.ZodObject<{
            type: z.ZodString;
            targetUrl: z.ZodOptional<z.ZodString>;
            surfaceId: z.ZodOptional<z.ZodString>;
            timestamp: z.ZodOptional<z.ZodNumber>;
            details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        }, "strip", z.ZodTypeAny, {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }, {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }>, "many">>;
        meta: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        value: string;
        action: "lovSelect";
        skipInReport: boolean;
        required?: boolean | undefined;
        description?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
        optionIndex?: number | undefined;
    }, {
        value: string;
        action: "lovSelect";
        required?: boolean | undefined;
        description?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        skipInReport?: boolean | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
        optionIndex?: number | undefined;
    }>, z.ZodObject<{
        action: z.ZodLiteral<"press">;
        key: z.ZodString;
        modifiers: z.ZodOptional<z.ZodObject<{
            alt: z.ZodOptional<z.ZodBoolean>;
            control: z.ZodOptional<z.ZodBoolean>;
            meta: z.ZodOptional<z.ZodBoolean>;
            shift: z.ZodOptional<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            shift?: boolean | undefined;
            alt?: boolean | undefined;
            control?: boolean | undefined;
            meta?: boolean | undefined;
        }, {
            shift?: boolean | undefined;
            alt?: boolean | undefined;
            control?: boolean | undefined;
            meta?: boolean | undefined;
        }>>;
        surfaceId: z.ZodOptional<z.ZodString>;
        frame: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodObject<{
            url: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            path: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        }, {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        }>]>>;
        locator: z.ZodOptional<z.ZodObject<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">>>;
        description: z.ZodOptional<z.ZodString>;
        skipInReport: z.ZodDefault<z.ZodBoolean>;
        required: z.ZodOptional<z.ZodBoolean>;
        requiredSource: z.ZodOptional<z.ZodString>;
        requiredScope: z.ZodOptional<z.ZodString>;
        effects: z.ZodOptional<z.ZodArray<z.ZodObject<{
            type: z.ZodString;
            targetUrl: z.ZodOptional<z.ZodString>;
            surfaceId: z.ZodOptional<z.ZodString>;
            timestamp: z.ZodOptional<z.ZodNumber>;
            details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        }, "strip", z.ZodTypeAny, {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }, {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }>, "many">>;
        meta: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        action: "press";
        skipInReport: boolean;
        key: string;
        required?: boolean | undefined;
        description?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
        modifiers?: {
            shift?: boolean | undefined;
            alt?: boolean | undefined;
            control?: boolean | undefined;
            meta?: boolean | undefined;
        } | undefined;
    }, {
        action: "press";
        key: string;
        required?: boolean | undefined;
        description?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        skipInReport?: boolean | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
        modifiers?: {
            shift?: boolean | undefined;
            alt?: boolean | undefined;
            control?: boolean | undefined;
            meta?: boolean | undefined;
        } | undefined;
    }>, z.ZodObject<{
        action: z.ZodLiteral<"check">;
        checked: z.ZodDefault<z.ZodLiteral<true>>;
        surfaceId: z.ZodOptional<z.ZodString>;
        frame: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodObject<{
            url: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            path: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        }, {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        }>]>>;
        locator: z.ZodOptional<z.ZodObject<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">>>;
        description: z.ZodOptional<z.ZodString>;
        skipInReport: z.ZodDefault<z.ZodBoolean>;
        required: z.ZodOptional<z.ZodBoolean>;
        requiredSource: z.ZodOptional<z.ZodString>;
        requiredScope: z.ZodOptional<z.ZodString>;
        effects: z.ZodOptional<z.ZodArray<z.ZodObject<{
            type: z.ZodString;
            targetUrl: z.ZodOptional<z.ZodString>;
            surfaceId: z.ZodOptional<z.ZodString>;
            timestamp: z.ZodOptional<z.ZodNumber>;
            details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        }, "strip", z.ZodTypeAny, {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }, {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }>, "many">>;
        meta: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        action: "check";
        skipInReport: boolean;
        checked: true;
        required?: boolean | undefined;
        description?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
    }, {
        action: "check";
        required?: boolean | undefined;
        description?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        skipInReport?: boolean | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
        checked?: true | undefined;
    }>, z.ZodObject<{
        action: z.ZodLiteral<"uncheck">;
        checked: z.ZodDefault<z.ZodLiteral<false>>;
        surfaceId: z.ZodOptional<z.ZodString>;
        frame: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodObject<{
            url: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            path: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        }, {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        }>]>>;
        locator: z.ZodOptional<z.ZodObject<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">>>;
        description: z.ZodOptional<z.ZodString>;
        skipInReport: z.ZodDefault<z.ZodBoolean>;
        required: z.ZodOptional<z.ZodBoolean>;
        requiredSource: z.ZodOptional<z.ZodString>;
        requiredScope: z.ZodOptional<z.ZodString>;
        effects: z.ZodOptional<z.ZodArray<z.ZodObject<{
            type: z.ZodString;
            targetUrl: z.ZodOptional<z.ZodString>;
            surfaceId: z.ZodOptional<z.ZodString>;
            timestamp: z.ZodOptional<z.ZodNumber>;
            details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        }, "strip", z.ZodTypeAny, {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }, {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }>, "many">>;
        meta: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        action: "uncheck";
        skipInReport: boolean;
        checked: false;
        required?: boolean | undefined;
        description?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
    }, {
        action: "uncheck";
        required?: boolean | undefined;
        description?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        skipInReport?: boolean | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
        checked?: false | undefined;
    }>, z.ZodObject<{
        action: z.ZodLiteral<"setInputFiles">;
        files: z.ZodArray<z.ZodString, "many">;
        value: z.ZodOptional<z.ZodString>;
        surfaceId: z.ZodOptional<z.ZodString>;
        frame: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodObject<{
            url: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            path: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        }, {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        }>]>>;
        locator: z.ZodOptional<z.ZodObject<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">>>;
        description: z.ZodOptional<z.ZodString>;
        skipInReport: z.ZodDefault<z.ZodBoolean>;
        required: z.ZodOptional<z.ZodBoolean>;
        requiredSource: z.ZodOptional<z.ZodString>;
        requiredScope: z.ZodOptional<z.ZodString>;
        effects: z.ZodOptional<z.ZodArray<z.ZodObject<{
            type: z.ZodString;
            targetUrl: z.ZodOptional<z.ZodString>;
            surfaceId: z.ZodOptional<z.ZodString>;
            timestamp: z.ZodOptional<z.ZodNumber>;
            details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        }, "strip", z.ZodTypeAny, {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }, {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }>, "many">>;
        meta: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        action: "setInputFiles";
        skipInReport: boolean;
        files: string[];
        value?: string | undefined;
        required?: boolean | undefined;
        description?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
    }, {
        action: "setInputFiles";
        files: string[];
        value?: string | undefined;
        required?: boolean | undefined;
        description?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        skipInReport?: boolean | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
    }>, z.ZodObject<{
        action: z.ZodLiteral<"scroll">;
        deltaX: z.ZodOptional<z.ZodNumber>;
        deltaY: z.ZodOptional<z.ZodNumber>;
        surfaceId: z.ZodOptional<z.ZodString>;
        frame: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodObject<{
            url: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            path: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        }, {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        }>]>>;
        locator: z.ZodOptional<z.ZodObject<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">>>;
        description: z.ZodOptional<z.ZodString>;
        skipInReport: z.ZodDefault<z.ZodBoolean>;
        required: z.ZodOptional<z.ZodBoolean>;
        requiredSource: z.ZodOptional<z.ZodString>;
        requiredScope: z.ZodOptional<z.ZodString>;
        effects: z.ZodOptional<z.ZodArray<z.ZodObject<{
            type: z.ZodString;
            targetUrl: z.ZodOptional<z.ZodString>;
            surfaceId: z.ZodOptional<z.ZodString>;
            timestamp: z.ZodOptional<z.ZodNumber>;
            details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        }, "strip", z.ZodTypeAny, {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }, {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }>, "many">>;
        meta: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        action: "scroll";
        skipInReport: boolean;
        required?: boolean | undefined;
        description?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
        deltaX?: number | undefined;
        deltaY?: number | undefined;
    }, {
        action: "scroll";
        required?: boolean | undefined;
        description?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        skipInReport?: boolean | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
        deltaX?: number | undefined;
        deltaY?: number | undefined;
    }>, z.ZodObject<{
        action: z.ZodLiteral<"hover">;
        position: z.ZodOptional<z.ZodObject<{
            x: z.ZodNumber;
            y: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            x: number;
            y: number;
        }, {
            x: number;
            y: number;
        }>>;
        surfaceId: z.ZodOptional<z.ZodString>;
        frame: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodObject<{
            url: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            path: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        }, {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        }>]>>;
        locator: z.ZodOptional<z.ZodObject<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">>>;
        description: z.ZodOptional<z.ZodString>;
        skipInReport: z.ZodDefault<z.ZodBoolean>;
        required: z.ZodOptional<z.ZodBoolean>;
        requiredSource: z.ZodOptional<z.ZodString>;
        requiredScope: z.ZodOptional<z.ZodString>;
        effects: z.ZodOptional<z.ZodArray<z.ZodObject<{
            type: z.ZodString;
            targetUrl: z.ZodOptional<z.ZodString>;
            surfaceId: z.ZodOptional<z.ZodString>;
            timestamp: z.ZodOptional<z.ZodNumber>;
            details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        }, "strip", z.ZodTypeAny, {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }, {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }>, "many">>;
        meta: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        action: "hover";
        skipInReport: boolean;
        required?: boolean | undefined;
        description?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
        position?: {
            x: number;
            y: number;
        } | undefined;
    }, {
        action: "hover";
        required?: boolean | undefined;
        description?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        skipInReport?: boolean | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
        position?: {
            x: number;
            y: number;
        } | undefined;
    }>, z.ZodObject<{
        action: z.ZodLiteral<"copy">;
        outputName: z.ZodOptional<z.ZodString>;
        value: z.ZodOptional<z.ZodString>;
        surfaceId: z.ZodOptional<z.ZodString>;
        frame: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodObject<{
            url: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            path: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        }, {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        }>]>>;
        locator: z.ZodOptional<z.ZodObject<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">>>;
        description: z.ZodOptional<z.ZodString>;
        skipInReport: z.ZodDefault<z.ZodBoolean>;
        required: z.ZodOptional<z.ZodBoolean>;
        requiredSource: z.ZodOptional<z.ZodString>;
        requiredScope: z.ZodOptional<z.ZodString>;
        effects: z.ZodOptional<z.ZodArray<z.ZodObject<{
            type: z.ZodString;
            targetUrl: z.ZodOptional<z.ZodString>;
            surfaceId: z.ZodOptional<z.ZodString>;
            timestamp: z.ZodOptional<z.ZodNumber>;
            details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        }, "strip", z.ZodTypeAny, {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }, {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }>, "many">>;
        meta: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        action: "copy";
        skipInReport: boolean;
        value?: string | undefined;
        required?: boolean | undefined;
        description?: string | undefined;
        outputName?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
    }, {
        action: "copy";
        value?: string | undefined;
        required?: boolean | undefined;
        description?: string | undefined;
        outputName?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        skipInReport?: boolean | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
    }>, z.ZodObject<{
        action: z.ZodLiteral<"wait">;
        durationMs: z.ZodNumber;
        surfaceId: z.ZodOptional<z.ZodString>;
        frame: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodObject<{
            url: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            path: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        }, {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        }>]>>;
        locator: z.ZodOptional<z.ZodObject<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">>>;
        description: z.ZodOptional<z.ZodString>;
        skipInReport: z.ZodDefault<z.ZodBoolean>;
        required: z.ZodOptional<z.ZodBoolean>;
        requiredSource: z.ZodOptional<z.ZodString>;
        requiredScope: z.ZodOptional<z.ZodString>;
        effects: z.ZodOptional<z.ZodArray<z.ZodObject<{
            type: z.ZodString;
            targetUrl: z.ZodOptional<z.ZodString>;
            surfaceId: z.ZodOptional<z.ZodString>;
            timestamp: z.ZodOptional<z.ZodNumber>;
            details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        }, "strip", z.ZodTypeAny, {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }, {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }>, "many">>;
        meta: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        action: "wait";
        durationMs: number;
        skipInReport: boolean;
        required?: boolean | undefined;
        description?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
    }, {
        action: "wait";
        durationMs: number;
        required?: boolean | undefined;
        description?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        skipInReport?: boolean | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
    }>, z.ZodObject<{
        action: z.ZodLiteral<"assertVisible">;
        surfaceId: z.ZodOptional<z.ZodString>;
        frame: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodObject<{
            url: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            path: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        }, {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        }>]>>;
        locator: z.ZodOptional<z.ZodObject<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">>>;
        description: z.ZodOptional<z.ZodString>;
        skipInReport: z.ZodDefault<z.ZodBoolean>;
        required: z.ZodOptional<z.ZodBoolean>;
        requiredSource: z.ZodOptional<z.ZodString>;
        requiredScope: z.ZodOptional<z.ZodString>;
        effects: z.ZodOptional<z.ZodArray<z.ZodObject<{
            type: z.ZodString;
            targetUrl: z.ZodOptional<z.ZodString>;
            surfaceId: z.ZodOptional<z.ZodString>;
            timestamp: z.ZodOptional<z.ZodNumber>;
            details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        }, "strip", z.ZodTypeAny, {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }, {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }>, "many">>;
        meta: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        action: "assertVisible";
        skipInReport: boolean;
        required?: boolean | undefined;
        description?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
    }, {
        action: "assertVisible";
        required?: boolean | undefined;
        description?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        skipInReport?: boolean | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
    }>, z.ZodObject<{
        action: z.ZodLiteral<"assertText">;
        value: z.ZodString;
        surfaceId: z.ZodOptional<z.ZodString>;
        frame: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodObject<{
            url: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            path: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        }, {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        }>]>>;
        locator: z.ZodOptional<z.ZodObject<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">>>;
        description: z.ZodOptional<z.ZodString>;
        skipInReport: z.ZodDefault<z.ZodBoolean>;
        required: z.ZodOptional<z.ZodBoolean>;
        requiredSource: z.ZodOptional<z.ZodString>;
        requiredScope: z.ZodOptional<z.ZodString>;
        effects: z.ZodOptional<z.ZodArray<z.ZodObject<{
            type: z.ZodString;
            targetUrl: z.ZodOptional<z.ZodString>;
            surfaceId: z.ZodOptional<z.ZodString>;
            timestamp: z.ZodOptional<z.ZodNumber>;
            details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        }, "strip", z.ZodTypeAny, {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }, {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }>, "many">>;
        meta: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        value: string;
        action: "assertText";
        skipInReport: boolean;
        required?: boolean | undefined;
        description?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
    }, {
        value: string;
        action: "assertText";
        required?: boolean | undefined;
        description?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        skipInReport?: boolean | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
    }>, z.ZodObject<{
        action: z.ZodLiteral<"assertValue">;
        value: z.ZodString;
        surfaceId: z.ZodOptional<z.ZodString>;
        frame: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodObject<{
            url: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            path: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        }, {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        }>]>>;
        locator: z.ZodOptional<z.ZodObject<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">>>;
        description: z.ZodOptional<z.ZodString>;
        skipInReport: z.ZodDefault<z.ZodBoolean>;
        required: z.ZodOptional<z.ZodBoolean>;
        requiredSource: z.ZodOptional<z.ZodString>;
        requiredScope: z.ZodOptional<z.ZodString>;
        effects: z.ZodOptional<z.ZodArray<z.ZodObject<{
            type: z.ZodString;
            targetUrl: z.ZodOptional<z.ZodString>;
            surfaceId: z.ZodOptional<z.ZodString>;
            timestamp: z.ZodOptional<z.ZodNumber>;
            details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        }, "strip", z.ZodTypeAny, {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }, {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }>, "many">>;
        meta: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        value: string;
        action: "assertValue";
        skipInReport: boolean;
        required?: boolean | undefined;
        description?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
    }, {
        value: string;
        action: "assertValue";
        required?: boolean | undefined;
        description?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        skipInReport?: boolean | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
    }>, z.ZodObject<{
        action: z.ZodLiteral<"assertChecked">;
        checked: z.ZodBoolean;
        surfaceId: z.ZodOptional<z.ZodString>;
        frame: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodObject<{
            url: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            path: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        }, {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        }>]>>;
        locator: z.ZodOptional<z.ZodObject<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">>>;
        description: z.ZodOptional<z.ZodString>;
        skipInReport: z.ZodDefault<z.ZodBoolean>;
        required: z.ZodOptional<z.ZodBoolean>;
        requiredSource: z.ZodOptional<z.ZodString>;
        requiredScope: z.ZodOptional<z.ZodString>;
        effects: z.ZodOptional<z.ZodArray<z.ZodObject<{
            type: z.ZodString;
            targetUrl: z.ZodOptional<z.ZodString>;
            surfaceId: z.ZodOptional<z.ZodString>;
            timestamp: z.ZodOptional<z.ZodNumber>;
            details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        }, "strip", z.ZodTypeAny, {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }, {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }>, "many">>;
        meta: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        action: "assertChecked";
        skipInReport: boolean;
        checked: boolean;
        required?: boolean | undefined;
        description?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
    }, {
        action: "assertChecked";
        checked: boolean;
        required?: boolean | undefined;
        description?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        skipInReport?: boolean | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
    }>, z.ZodObject<{
        action: z.ZodLiteral<"assertSnapshot">;
        snapshot: z.ZodString;
        surfaceId: z.ZodOptional<z.ZodString>;
        frame: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodObject<{
            url: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            path: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        }, {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        }>]>>;
        locator: z.ZodOptional<z.ZodObject<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">>>;
        description: z.ZodOptional<z.ZodString>;
        skipInReport: z.ZodDefault<z.ZodBoolean>;
        required: z.ZodOptional<z.ZodBoolean>;
        requiredSource: z.ZodOptional<z.ZodString>;
        requiredScope: z.ZodOptional<z.ZodString>;
        effects: z.ZodOptional<z.ZodArray<z.ZodObject<{
            type: z.ZodString;
            targetUrl: z.ZodOptional<z.ZodString>;
            surfaceId: z.ZodOptional<z.ZodString>;
            timestamp: z.ZodOptional<z.ZodNumber>;
            details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        }, "strip", z.ZodTypeAny, {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }, {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }>, "many">>;
        meta: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        action: "assertSnapshot";
        skipInReport: boolean;
        snapshot: string;
        required?: boolean | undefined;
        description?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
    }, {
        action: "assertSnapshot";
        snapshot: string;
        required?: boolean | undefined;
        description?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        skipInReport?: boolean | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
    }>]>, "many">;
}, "strip", z.ZodTypeAny, {
    meta: {
        patchId: string;
        sourceUrl: string;
        name?: string | undefined;
        description?: string | undefined;
    };
    protocolVersion: "2.0";
    recordingSessionId: string;
    recordedAt: string;
    producer: {
        kind: "custom" | "extension" | "desktop";
        version: string;
        platform?: string | undefined;
    };
    capabilities: ("multiSurface" | "nestedFrames" | "downloads" | "detachedFileInput" | "evidenceScreenshots" | "oracleADF" | "oracleJET" | "redwood")[];
    steps: ({
        value: string;
        action: "navigate";
        skipInReport: boolean;
        required?: boolean | undefined;
        description?: string | undefined;
        url?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
    } | {
        action: "click";
        skipInReport: boolean;
        required?: boolean | undefined;
        description?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
        button?: "left" | "right" | "middle" | undefined;
        clickCount?: number | undefined;
        modifiers?: {
            shift?: boolean | undefined;
            alt?: boolean | undefined;
            control?: boolean | undefined;
            meta?: boolean | undefined;
        } | undefined;
        position?: {
            x: number;
            y: number;
        } | undefined;
    } | {
        action: "dblclick";
        skipInReport: boolean;
        clickCount: number;
        required?: boolean | undefined;
        description?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
        modifiers?: {
            shift?: boolean | undefined;
            alt?: boolean | undefined;
            control?: boolean | undefined;
            meta?: boolean | undefined;
        } | undefined;
        position?: {
            x: number;
            y: number;
        } | undefined;
    } | {
        action: "fill";
        skipInReport: boolean;
        value?: string | undefined;
        required?: boolean | undefined;
        description?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
        committedValue?: string | undefined;
        credentialRef?: string | undefined;
    } | {
        action: "selectOption";
        skipInReport: boolean;
        value?: string | undefined;
        values?: string[] | undefined;
        required?: boolean | undefined;
        description?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
        optionIndex?: number | undefined;
    } | {
        value: string;
        action: "lovSelect";
        skipInReport: boolean;
        required?: boolean | undefined;
        description?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
        optionIndex?: number | undefined;
    } | {
        action: "press";
        skipInReport: boolean;
        key: string;
        required?: boolean | undefined;
        description?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
        modifiers?: {
            shift?: boolean | undefined;
            alt?: boolean | undefined;
            control?: boolean | undefined;
            meta?: boolean | undefined;
        } | undefined;
    } | {
        action: "check";
        skipInReport: boolean;
        checked: true;
        required?: boolean | undefined;
        description?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
    } | {
        action: "uncheck";
        skipInReport: boolean;
        checked: false;
        required?: boolean | undefined;
        description?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
    } | {
        action: "setInputFiles";
        skipInReport: boolean;
        files: string[];
        value?: string | undefined;
        required?: boolean | undefined;
        description?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
    } | {
        action: "scroll";
        skipInReport: boolean;
        required?: boolean | undefined;
        description?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
        deltaX?: number | undefined;
        deltaY?: number | undefined;
    } | {
        action: "hover";
        skipInReport: boolean;
        required?: boolean | undefined;
        description?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
        position?: {
            x: number;
            y: number;
        } | undefined;
    } | {
        action: "copy";
        skipInReport: boolean;
        value?: string | undefined;
        required?: boolean | undefined;
        description?: string | undefined;
        outputName?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
    } | {
        action: "wait";
        durationMs: number;
        skipInReport: boolean;
        required?: boolean | undefined;
        description?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
    } | {
        action: "assertVisible";
        skipInReport: boolean;
        required?: boolean | undefined;
        description?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
    } | {
        value: string;
        action: "assertText";
        skipInReport: boolean;
        required?: boolean | undefined;
        description?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
    } | {
        value: string;
        action: "assertValue";
        skipInReport: boolean;
        required?: boolean | undefined;
        description?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
    } | {
        action: "assertChecked";
        skipInReport: boolean;
        checked: boolean;
        required?: boolean | undefined;
        description?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
    } | {
        action: "assertSnapshot";
        skipInReport: boolean;
        snapshot: string;
        required?: boolean | undefined;
        description?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
    })[];
}, {
    meta: {
        sourceUrl: string;
        name?: string | undefined;
        description?: string | undefined;
        patchId?: string | undefined;
    };
    protocolVersion: "2.0";
    recordingSessionId: string;
    recordedAt: string;
    producer: {
        kind: "custom" | "extension" | "desktop";
        version: string;
        platform?: string | undefined;
    };
    steps: ({
        value: string;
        action: "navigate";
        required?: boolean | undefined;
        description?: string | undefined;
        url?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        skipInReport?: boolean | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
    } | {
        action: "click";
        required?: boolean | undefined;
        description?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        skipInReport?: boolean | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
        button?: "left" | "right" | "middle" | undefined;
        clickCount?: number | undefined;
        modifiers?: {
            shift?: boolean | undefined;
            alt?: boolean | undefined;
            control?: boolean | undefined;
            meta?: boolean | undefined;
        } | undefined;
        position?: {
            x: number;
            y: number;
        } | undefined;
    } | {
        action: "dblclick";
        required?: boolean | undefined;
        description?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        skipInReport?: boolean | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
        clickCount?: number | undefined;
        modifiers?: {
            shift?: boolean | undefined;
            alt?: boolean | undefined;
            control?: boolean | undefined;
            meta?: boolean | undefined;
        } | undefined;
        position?: {
            x: number;
            y: number;
        } | undefined;
    } | {
        action: "fill";
        value?: string | undefined;
        required?: boolean | undefined;
        description?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        skipInReport?: boolean | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
        committedValue?: string | undefined;
        credentialRef?: string | undefined;
    } | {
        action: "selectOption";
        value?: string | undefined;
        values?: string[] | undefined;
        required?: boolean | undefined;
        description?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        skipInReport?: boolean | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
        optionIndex?: number | undefined;
    } | {
        value: string;
        action: "lovSelect";
        required?: boolean | undefined;
        description?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        skipInReport?: boolean | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
        optionIndex?: number | undefined;
    } | {
        action: "press";
        key: string;
        required?: boolean | undefined;
        description?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        skipInReport?: boolean | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
        modifiers?: {
            shift?: boolean | undefined;
            alt?: boolean | undefined;
            control?: boolean | undefined;
            meta?: boolean | undefined;
        } | undefined;
    } | {
        action: "check";
        required?: boolean | undefined;
        description?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        skipInReport?: boolean | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
        checked?: true | undefined;
    } | {
        action: "uncheck";
        required?: boolean | undefined;
        description?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        skipInReport?: boolean | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
        checked?: false | undefined;
    } | {
        action: "setInputFiles";
        files: string[];
        value?: string | undefined;
        required?: boolean | undefined;
        description?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        skipInReport?: boolean | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
    } | {
        action: "scroll";
        required?: boolean | undefined;
        description?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        skipInReport?: boolean | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
        deltaX?: number | undefined;
        deltaY?: number | undefined;
    } | {
        action: "hover";
        required?: boolean | undefined;
        description?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        skipInReport?: boolean | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
        position?: {
            x: number;
            y: number;
        } | undefined;
    } | {
        action: "copy";
        value?: string | undefined;
        required?: boolean | undefined;
        description?: string | undefined;
        outputName?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        skipInReport?: boolean | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
    } | {
        action: "wait";
        durationMs: number;
        required?: boolean | undefined;
        description?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        skipInReport?: boolean | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
    } | {
        action: "assertVisible";
        required?: boolean | undefined;
        description?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        skipInReport?: boolean | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
    } | {
        value: string;
        action: "assertText";
        required?: boolean | undefined;
        description?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        skipInReport?: boolean | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
    } | {
        value: string;
        action: "assertValue";
        required?: boolean | undefined;
        description?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        skipInReport?: boolean | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
    } | {
        action: "assertChecked";
        checked: boolean;
        required?: boolean | undefined;
        description?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        skipInReport?: boolean | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
    } | {
        action: "assertSnapshot";
        snapshot: string;
        required?: boolean | undefined;
        description?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        skipInReport?: boolean | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
    })[];
    capabilities?: ("multiSurface" | "nestedFrames" | "downloads" | "detachedFileInput" | "evidenceScreenshots" | "oracleADF" | "oracleJET" | "redwood")[] | undefined;
}>;
export type ProtocolVersion = z.infer<typeof ProtocolVersionSchema>;
export type ProducerProvenance = z.infer<typeof ProducerProvenanceSchema>;
export type RecorderCapability = z.infer<typeof RecorderCapabilitySchema>;
export type FrameIdentity = z.infer<typeof FrameIdentitySchema>;
export type SurfaceInfo = z.infer<typeof SurfaceInfoSchema>;
export type RecordedLocator = z.infer<typeof RecordedLocatorSchema>;
export type KeyModifiers = z.infer<typeof KeyModifiersSchema>;
export type PointerPosition = z.infer<typeof PointerPositionSchema>;
export type SemanticStepV2 = z.infer<typeof SemanticStepV2Schema>;
export type SemanticCandidate = z.infer<typeof SemanticCandidateSchema>;
export type AdapterDecision = z.infer<typeof AdapterDecisionSchema>;
export type RecordingEnvelope = z.infer<typeof RecordingEnvelopeSchema>;
export declare const ReplayErrorCategorySchema: z.ZodEnum<["SELECTOR_NOT_FOUND", "TIMEOUT", "NAVIGATION_FAILED", "ASSERTION_FAILED", "AUTH_REQUIRED", "COMMIT_REFUSAL", "FRAME_DETACHED", "SURFACE_UNAVAILABLE", "UNSUPPORTED_ACTION", "INTERNAL_ERROR"]>;
export declare const ReplayVerdictSchema: z.ZodObject<{
    category: z.ZodEnum<["SELECTOR_NOT_FOUND", "TIMEOUT", "NAVIGATION_FAILED", "ASSERTION_FAILED", "AUTH_REQUIRED", "COMMIT_REFUSAL", "FRAME_DETACHED", "SURFACE_UNAVAILABLE", "UNSUPPORTED_ACTION", "INTERNAL_ERROR"]>;
    message: z.ZodString;
    recoverable: z.ZodDefault<z.ZodBoolean>;
    details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    message: string;
    category: "INTERNAL_ERROR" | "SELECTOR_NOT_FOUND" | "TIMEOUT" | "NAVIGATION_FAILED" | "ASSERTION_FAILED" | "AUTH_REQUIRED" | "COMMIT_REFUSAL" | "FRAME_DETACHED" | "SURFACE_UNAVAILABLE" | "UNSUPPORTED_ACTION";
    recoverable: boolean;
    details?: Record<string, any> | undefined;
}, {
    message: string;
    category: "INTERNAL_ERROR" | "SELECTOR_NOT_FOUND" | "TIMEOUT" | "NAVIGATION_FAILED" | "ASSERTION_FAILED" | "AUTH_REQUIRED" | "COMMIT_REFUSAL" | "FRAME_DETACHED" | "SURFACE_UNAVAILABLE" | "UNSUPPORTED_ACTION";
    details?: Record<string, any> | undefined;
    recoverable?: boolean | undefined;
}>;
export declare const StepExecutionStatusSchema: z.ZodEnum<["success", "failed", "skipped", "warn"]>;
export declare const HealRecordSchema: z.ZodObject<{
    attempted: z.ZodBoolean;
    applied: z.ZodOptional<z.ZodBoolean>;
    skipped: z.ZodOptional<z.ZodBoolean>;
    reason: z.ZodOptional<z.ZodString>;
    candidate: z.ZodOptional<z.ZodAny>;
    fixType: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    attempted: boolean;
    skipped?: boolean | undefined;
    candidate?: any;
    reason?: string | undefined;
    applied?: boolean | undefined;
    fixType?: string | undefined;
}, {
    attempted: boolean;
    skipped?: boolean | undefined;
    candidate?: any;
    reason?: string | undefined;
    applied?: boolean | undefined;
    fixType?: string | undefined;
}>;
export declare const StepExecutionResultSchema: z.ZodObject<{
    stepIndex: z.ZodNumber;
    status: z.ZodEnum<["success", "failed", "skipped", "warn"]>;
    durationMs: z.ZodNumber;
    action: z.ZodString;
    error: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    verdict: z.ZodOptional<z.ZodObject<{
        category: z.ZodEnum<["SELECTOR_NOT_FOUND", "TIMEOUT", "NAVIGATION_FAILED", "ASSERTION_FAILED", "AUTH_REQUIRED", "COMMIT_REFUSAL", "FRAME_DETACHED", "SURFACE_UNAVAILABLE", "UNSUPPORTED_ACTION", "INTERNAL_ERROR"]>;
        message: z.ZodString;
        recoverable: z.ZodDefault<z.ZodBoolean>;
        details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        message: string;
        category: "INTERNAL_ERROR" | "SELECTOR_NOT_FOUND" | "TIMEOUT" | "NAVIGATION_FAILED" | "ASSERTION_FAILED" | "AUTH_REQUIRED" | "COMMIT_REFUSAL" | "FRAME_DETACHED" | "SURFACE_UNAVAILABLE" | "UNSUPPORTED_ACTION";
        recoverable: boolean;
        details?: Record<string, any> | undefined;
    }, {
        message: string;
        category: "INTERNAL_ERROR" | "SELECTOR_NOT_FOUND" | "TIMEOUT" | "NAVIGATION_FAILED" | "ASSERTION_FAILED" | "AUTH_REQUIRED" | "COMMIT_REFUSAL" | "FRAME_DETACHED" | "SURFACE_UNAVAILABLE" | "UNSUPPORTED_ACTION";
        details?: Record<string, any> | undefined;
        recoverable?: boolean | undefined;
    }>>;
    heal: z.ZodOptional<z.ZodObject<{
        attempted: z.ZodBoolean;
        applied: z.ZodOptional<z.ZodBoolean>;
        skipped: z.ZodOptional<z.ZodBoolean>;
        reason: z.ZodOptional<z.ZodString>;
        candidate: z.ZodOptional<z.ZodAny>;
        fixType: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        attempted: boolean;
        skipped?: boolean | undefined;
        candidate?: any;
        reason?: string | undefined;
        applied?: boolean | undefined;
        fixType?: string | undefined;
    }, {
        attempted: boolean;
        skipped?: boolean | undefined;
        candidate?: any;
        reason?: string | undefined;
        applied?: boolean | undefined;
        fixType?: string | undefined;
    }>>;
    screenshotKey: z.ZodOptional<z.ZodString>;
    extractedOutputs: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNullable<z.ZodString>>>;
}, "strip", z.ZodTypeAny, {
    status: "success" | "warn" | "failed" | "skipped";
    action: string;
    stepIndex: number;
    durationMs: number;
    error?: string | null | undefined;
    screenshotKey?: string | undefined;
    verdict?: {
        message: string;
        category: "INTERNAL_ERROR" | "SELECTOR_NOT_FOUND" | "TIMEOUT" | "NAVIGATION_FAILED" | "ASSERTION_FAILED" | "AUTH_REQUIRED" | "COMMIT_REFUSAL" | "FRAME_DETACHED" | "SURFACE_UNAVAILABLE" | "UNSUPPORTED_ACTION";
        recoverable: boolean;
        details?: Record<string, any> | undefined;
    } | undefined;
    heal?: {
        attempted: boolean;
        skipped?: boolean | undefined;
        candidate?: any;
        reason?: string | undefined;
        applied?: boolean | undefined;
        fixType?: string | undefined;
    } | undefined;
    extractedOutputs?: Record<string, string | null> | undefined;
}, {
    status: "success" | "warn" | "failed" | "skipped";
    action: string;
    stepIndex: number;
    durationMs: number;
    error?: string | null | undefined;
    screenshotKey?: string | undefined;
    verdict?: {
        message: string;
        category: "INTERNAL_ERROR" | "SELECTOR_NOT_FOUND" | "TIMEOUT" | "NAVIGATION_FAILED" | "ASSERTION_FAILED" | "AUTH_REQUIRED" | "COMMIT_REFUSAL" | "FRAME_DETACHED" | "SURFACE_UNAVAILABLE" | "UNSUPPORTED_ACTION";
        details?: Record<string, any> | undefined;
        recoverable?: boolean | undefined;
    } | undefined;
    heal?: {
        attempted: boolean;
        skipped?: boolean | undefined;
        candidate?: any;
        reason?: string | undefined;
        applied?: boolean | undefined;
        fixType?: string | undefined;
    } | undefined;
    extractedOutputs?: Record<string, string | null> | undefined;
}>;
export declare const ExecutionEnvironmentSchema: z.ZodObject<{
    baseUrl: z.ZodOptional<z.ZodString>;
    credentials: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    headers: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    viewport: z.ZodOptional<z.ZodObject<{
        width: z.ZodNumber;
        height: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        width: number;
        height: number;
    }, {
        width: number;
        height: number;
    }>>;
}, "strip", z.ZodTypeAny, {
    baseUrl?: string | undefined;
    credentials?: Record<string, string> | undefined;
    headers?: Record<string, string> | undefined;
    viewport?: {
        width: number;
        height: number;
    } | undefined;
}, {
    baseUrl?: string | undefined;
    credentials?: Record<string, string> | undefined;
    headers?: Record<string, string> | undefined;
    viewport?: {
        width: number;
        height: number;
    } | undefined;
}>;
export declare const ExecutionRequestSchema: z.ZodObject<{
    jobExecutionId: z.ZodString;
    runId: z.ZodOptional<z.ZodString>;
    recordingId: z.ZodOptional<z.ZodString>;
    suiteId: z.ZodOptional<z.ZodString>;
    steps: z.ZodArray<z.ZodUnion<[z.ZodDiscriminatedUnion<"action", [z.ZodObject<{
        action: z.ZodLiteral<"navigate">;
        value: z.ZodString;
        url: z.ZodOptional<z.ZodString>;
        surfaceId: z.ZodOptional<z.ZodString>;
        frame: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodObject<{
            url: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            path: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        }, {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        }>]>>;
        locator: z.ZodOptional<z.ZodObject<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">>>;
        description: z.ZodOptional<z.ZodString>;
        skipInReport: z.ZodDefault<z.ZodBoolean>;
        required: z.ZodOptional<z.ZodBoolean>;
        requiredSource: z.ZodOptional<z.ZodString>;
        requiredScope: z.ZodOptional<z.ZodString>;
        effects: z.ZodOptional<z.ZodArray<z.ZodObject<{
            type: z.ZodString;
            targetUrl: z.ZodOptional<z.ZodString>;
            surfaceId: z.ZodOptional<z.ZodString>;
            timestamp: z.ZodOptional<z.ZodNumber>;
            details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        }, "strip", z.ZodTypeAny, {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }, {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }>, "many">>;
        meta: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        value: string;
        action: "navigate";
        skipInReport: boolean;
        required?: boolean | undefined;
        description?: string | undefined;
        url?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
    }, {
        value: string;
        action: "navigate";
        required?: boolean | undefined;
        description?: string | undefined;
        url?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        skipInReport?: boolean | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
    }>, z.ZodObject<{
        action: z.ZodLiteral<"click">;
        button: z.ZodOptional<z.ZodEnum<["left", "right", "middle"]>>;
        clickCount: z.ZodOptional<z.ZodNumber>;
        modifiers: z.ZodOptional<z.ZodObject<{
            alt: z.ZodOptional<z.ZodBoolean>;
            control: z.ZodOptional<z.ZodBoolean>;
            meta: z.ZodOptional<z.ZodBoolean>;
            shift: z.ZodOptional<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            shift?: boolean | undefined;
            alt?: boolean | undefined;
            control?: boolean | undefined;
            meta?: boolean | undefined;
        }, {
            shift?: boolean | undefined;
            alt?: boolean | undefined;
            control?: boolean | undefined;
            meta?: boolean | undefined;
        }>>;
        position: z.ZodOptional<z.ZodObject<{
            x: z.ZodNumber;
            y: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            x: number;
            y: number;
        }, {
            x: number;
            y: number;
        }>>;
        surfaceId: z.ZodOptional<z.ZodString>;
        frame: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodObject<{
            url: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            path: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        }, {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        }>]>>;
        locator: z.ZodOptional<z.ZodObject<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">>>;
        description: z.ZodOptional<z.ZodString>;
        skipInReport: z.ZodDefault<z.ZodBoolean>;
        required: z.ZodOptional<z.ZodBoolean>;
        requiredSource: z.ZodOptional<z.ZodString>;
        requiredScope: z.ZodOptional<z.ZodString>;
        effects: z.ZodOptional<z.ZodArray<z.ZodObject<{
            type: z.ZodString;
            targetUrl: z.ZodOptional<z.ZodString>;
            surfaceId: z.ZodOptional<z.ZodString>;
            timestamp: z.ZodOptional<z.ZodNumber>;
            details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        }, "strip", z.ZodTypeAny, {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }, {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }>, "many">>;
        meta: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        action: "click";
        skipInReport: boolean;
        required?: boolean | undefined;
        description?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
        button?: "left" | "right" | "middle" | undefined;
        clickCount?: number | undefined;
        modifiers?: {
            shift?: boolean | undefined;
            alt?: boolean | undefined;
            control?: boolean | undefined;
            meta?: boolean | undefined;
        } | undefined;
        position?: {
            x: number;
            y: number;
        } | undefined;
    }, {
        action: "click";
        required?: boolean | undefined;
        description?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        skipInReport?: boolean | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
        button?: "left" | "right" | "middle" | undefined;
        clickCount?: number | undefined;
        modifiers?: {
            shift?: boolean | undefined;
            alt?: boolean | undefined;
            control?: boolean | undefined;
            meta?: boolean | undefined;
        } | undefined;
        position?: {
            x: number;
            y: number;
        } | undefined;
    }>, z.ZodObject<{
        action: z.ZodLiteral<"dblclick">;
        clickCount: z.ZodDefault<z.ZodNumber>;
        modifiers: z.ZodOptional<z.ZodObject<{
            alt: z.ZodOptional<z.ZodBoolean>;
            control: z.ZodOptional<z.ZodBoolean>;
            meta: z.ZodOptional<z.ZodBoolean>;
            shift: z.ZodOptional<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            shift?: boolean | undefined;
            alt?: boolean | undefined;
            control?: boolean | undefined;
            meta?: boolean | undefined;
        }, {
            shift?: boolean | undefined;
            alt?: boolean | undefined;
            control?: boolean | undefined;
            meta?: boolean | undefined;
        }>>;
        position: z.ZodOptional<z.ZodObject<{
            x: z.ZodNumber;
            y: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            x: number;
            y: number;
        }, {
            x: number;
            y: number;
        }>>;
        surfaceId: z.ZodOptional<z.ZodString>;
        frame: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodObject<{
            url: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            path: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        }, {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        }>]>>;
        locator: z.ZodOptional<z.ZodObject<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">>>;
        description: z.ZodOptional<z.ZodString>;
        skipInReport: z.ZodDefault<z.ZodBoolean>;
        required: z.ZodOptional<z.ZodBoolean>;
        requiredSource: z.ZodOptional<z.ZodString>;
        requiredScope: z.ZodOptional<z.ZodString>;
        effects: z.ZodOptional<z.ZodArray<z.ZodObject<{
            type: z.ZodString;
            targetUrl: z.ZodOptional<z.ZodString>;
            surfaceId: z.ZodOptional<z.ZodString>;
            timestamp: z.ZodOptional<z.ZodNumber>;
            details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        }, "strip", z.ZodTypeAny, {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }, {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }>, "many">>;
        meta: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        action: "dblclick";
        skipInReport: boolean;
        clickCount: number;
        required?: boolean | undefined;
        description?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
        modifiers?: {
            shift?: boolean | undefined;
            alt?: boolean | undefined;
            control?: boolean | undefined;
            meta?: boolean | undefined;
        } | undefined;
        position?: {
            x: number;
            y: number;
        } | undefined;
    }, {
        action: "dblclick";
        required?: boolean | undefined;
        description?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        skipInReport?: boolean | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
        clickCount?: number | undefined;
        modifiers?: {
            shift?: boolean | undefined;
            alt?: boolean | undefined;
            control?: boolean | undefined;
            meta?: boolean | undefined;
        } | undefined;
        position?: {
            x: number;
            y: number;
        } | undefined;
    }>, z.ZodObject<{
        action: z.ZodLiteral<"fill">;
        value: z.ZodOptional<z.ZodString>;
        committedValue: z.ZodOptional<z.ZodString>;
        credentialRef: z.ZodOptional<z.ZodString>;
        surfaceId: z.ZodOptional<z.ZodString>;
        frame: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodObject<{
            url: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            path: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        }, {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        }>]>>;
        locator: z.ZodOptional<z.ZodObject<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">>>;
        description: z.ZodOptional<z.ZodString>;
        skipInReport: z.ZodDefault<z.ZodBoolean>;
        required: z.ZodOptional<z.ZodBoolean>;
        requiredSource: z.ZodOptional<z.ZodString>;
        requiredScope: z.ZodOptional<z.ZodString>;
        effects: z.ZodOptional<z.ZodArray<z.ZodObject<{
            type: z.ZodString;
            targetUrl: z.ZodOptional<z.ZodString>;
            surfaceId: z.ZodOptional<z.ZodString>;
            timestamp: z.ZodOptional<z.ZodNumber>;
            details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        }, "strip", z.ZodTypeAny, {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }, {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }>, "many">>;
        meta: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        action: "fill";
        skipInReport: boolean;
        value?: string | undefined;
        required?: boolean | undefined;
        description?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
        committedValue?: string | undefined;
        credentialRef?: string | undefined;
    }, {
        action: "fill";
        value?: string | undefined;
        required?: boolean | undefined;
        description?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        skipInReport?: boolean | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
        committedValue?: string | undefined;
        credentialRef?: string | undefined;
    }>, z.ZodObject<{
        action: z.ZodLiteral<"selectOption">;
        value: z.ZodOptional<z.ZodString>;
        values: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        optionIndex: z.ZodOptional<z.ZodNumber>;
        surfaceId: z.ZodOptional<z.ZodString>;
        frame: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodObject<{
            url: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            path: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        }, {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        }>]>>;
        locator: z.ZodOptional<z.ZodObject<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">>>;
        description: z.ZodOptional<z.ZodString>;
        skipInReport: z.ZodDefault<z.ZodBoolean>;
        required: z.ZodOptional<z.ZodBoolean>;
        requiredSource: z.ZodOptional<z.ZodString>;
        requiredScope: z.ZodOptional<z.ZodString>;
        effects: z.ZodOptional<z.ZodArray<z.ZodObject<{
            type: z.ZodString;
            targetUrl: z.ZodOptional<z.ZodString>;
            surfaceId: z.ZodOptional<z.ZodString>;
            timestamp: z.ZodOptional<z.ZodNumber>;
            details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        }, "strip", z.ZodTypeAny, {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }, {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }>, "many">>;
        meta: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        action: "selectOption";
        skipInReport: boolean;
        value?: string | undefined;
        values?: string[] | undefined;
        required?: boolean | undefined;
        description?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
        optionIndex?: number | undefined;
    }, {
        action: "selectOption";
        value?: string | undefined;
        values?: string[] | undefined;
        required?: boolean | undefined;
        description?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        skipInReport?: boolean | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
        optionIndex?: number | undefined;
    }>, z.ZodObject<{
        action: z.ZodLiteral<"lovSelect">;
        value: z.ZodString;
        optionIndex: z.ZodOptional<z.ZodNumber>;
        surfaceId: z.ZodOptional<z.ZodString>;
        frame: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodObject<{
            url: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            path: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        }, {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        }>]>>;
        locator: z.ZodOptional<z.ZodObject<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">>>;
        description: z.ZodOptional<z.ZodString>;
        skipInReport: z.ZodDefault<z.ZodBoolean>;
        required: z.ZodOptional<z.ZodBoolean>;
        requiredSource: z.ZodOptional<z.ZodString>;
        requiredScope: z.ZodOptional<z.ZodString>;
        effects: z.ZodOptional<z.ZodArray<z.ZodObject<{
            type: z.ZodString;
            targetUrl: z.ZodOptional<z.ZodString>;
            surfaceId: z.ZodOptional<z.ZodString>;
            timestamp: z.ZodOptional<z.ZodNumber>;
            details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        }, "strip", z.ZodTypeAny, {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }, {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }>, "many">>;
        meta: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        value: string;
        action: "lovSelect";
        skipInReport: boolean;
        required?: boolean | undefined;
        description?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
        optionIndex?: number | undefined;
    }, {
        value: string;
        action: "lovSelect";
        required?: boolean | undefined;
        description?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        skipInReport?: boolean | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
        optionIndex?: number | undefined;
    }>, z.ZodObject<{
        action: z.ZodLiteral<"press">;
        key: z.ZodString;
        modifiers: z.ZodOptional<z.ZodObject<{
            alt: z.ZodOptional<z.ZodBoolean>;
            control: z.ZodOptional<z.ZodBoolean>;
            meta: z.ZodOptional<z.ZodBoolean>;
            shift: z.ZodOptional<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            shift?: boolean | undefined;
            alt?: boolean | undefined;
            control?: boolean | undefined;
            meta?: boolean | undefined;
        }, {
            shift?: boolean | undefined;
            alt?: boolean | undefined;
            control?: boolean | undefined;
            meta?: boolean | undefined;
        }>>;
        surfaceId: z.ZodOptional<z.ZodString>;
        frame: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodObject<{
            url: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            path: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        }, {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        }>]>>;
        locator: z.ZodOptional<z.ZodObject<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">>>;
        description: z.ZodOptional<z.ZodString>;
        skipInReport: z.ZodDefault<z.ZodBoolean>;
        required: z.ZodOptional<z.ZodBoolean>;
        requiredSource: z.ZodOptional<z.ZodString>;
        requiredScope: z.ZodOptional<z.ZodString>;
        effects: z.ZodOptional<z.ZodArray<z.ZodObject<{
            type: z.ZodString;
            targetUrl: z.ZodOptional<z.ZodString>;
            surfaceId: z.ZodOptional<z.ZodString>;
            timestamp: z.ZodOptional<z.ZodNumber>;
            details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        }, "strip", z.ZodTypeAny, {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }, {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }>, "many">>;
        meta: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        action: "press";
        skipInReport: boolean;
        key: string;
        required?: boolean | undefined;
        description?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
        modifiers?: {
            shift?: boolean | undefined;
            alt?: boolean | undefined;
            control?: boolean | undefined;
            meta?: boolean | undefined;
        } | undefined;
    }, {
        action: "press";
        key: string;
        required?: boolean | undefined;
        description?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        skipInReport?: boolean | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
        modifiers?: {
            shift?: boolean | undefined;
            alt?: boolean | undefined;
            control?: boolean | undefined;
            meta?: boolean | undefined;
        } | undefined;
    }>, z.ZodObject<{
        action: z.ZodLiteral<"check">;
        checked: z.ZodDefault<z.ZodLiteral<true>>;
        surfaceId: z.ZodOptional<z.ZodString>;
        frame: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodObject<{
            url: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            path: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        }, {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        }>]>>;
        locator: z.ZodOptional<z.ZodObject<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">>>;
        description: z.ZodOptional<z.ZodString>;
        skipInReport: z.ZodDefault<z.ZodBoolean>;
        required: z.ZodOptional<z.ZodBoolean>;
        requiredSource: z.ZodOptional<z.ZodString>;
        requiredScope: z.ZodOptional<z.ZodString>;
        effects: z.ZodOptional<z.ZodArray<z.ZodObject<{
            type: z.ZodString;
            targetUrl: z.ZodOptional<z.ZodString>;
            surfaceId: z.ZodOptional<z.ZodString>;
            timestamp: z.ZodOptional<z.ZodNumber>;
            details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        }, "strip", z.ZodTypeAny, {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }, {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }>, "many">>;
        meta: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        action: "check";
        skipInReport: boolean;
        checked: true;
        required?: boolean | undefined;
        description?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
    }, {
        action: "check";
        required?: boolean | undefined;
        description?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        skipInReport?: boolean | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
        checked?: true | undefined;
    }>, z.ZodObject<{
        action: z.ZodLiteral<"uncheck">;
        checked: z.ZodDefault<z.ZodLiteral<false>>;
        surfaceId: z.ZodOptional<z.ZodString>;
        frame: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodObject<{
            url: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            path: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        }, {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        }>]>>;
        locator: z.ZodOptional<z.ZodObject<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">>>;
        description: z.ZodOptional<z.ZodString>;
        skipInReport: z.ZodDefault<z.ZodBoolean>;
        required: z.ZodOptional<z.ZodBoolean>;
        requiredSource: z.ZodOptional<z.ZodString>;
        requiredScope: z.ZodOptional<z.ZodString>;
        effects: z.ZodOptional<z.ZodArray<z.ZodObject<{
            type: z.ZodString;
            targetUrl: z.ZodOptional<z.ZodString>;
            surfaceId: z.ZodOptional<z.ZodString>;
            timestamp: z.ZodOptional<z.ZodNumber>;
            details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        }, "strip", z.ZodTypeAny, {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }, {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }>, "many">>;
        meta: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        action: "uncheck";
        skipInReport: boolean;
        checked: false;
        required?: boolean | undefined;
        description?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
    }, {
        action: "uncheck";
        required?: boolean | undefined;
        description?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        skipInReport?: boolean | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
        checked?: false | undefined;
    }>, z.ZodObject<{
        action: z.ZodLiteral<"setInputFiles">;
        files: z.ZodArray<z.ZodString, "many">;
        value: z.ZodOptional<z.ZodString>;
        surfaceId: z.ZodOptional<z.ZodString>;
        frame: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodObject<{
            url: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            path: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        }, {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        }>]>>;
        locator: z.ZodOptional<z.ZodObject<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">>>;
        description: z.ZodOptional<z.ZodString>;
        skipInReport: z.ZodDefault<z.ZodBoolean>;
        required: z.ZodOptional<z.ZodBoolean>;
        requiredSource: z.ZodOptional<z.ZodString>;
        requiredScope: z.ZodOptional<z.ZodString>;
        effects: z.ZodOptional<z.ZodArray<z.ZodObject<{
            type: z.ZodString;
            targetUrl: z.ZodOptional<z.ZodString>;
            surfaceId: z.ZodOptional<z.ZodString>;
            timestamp: z.ZodOptional<z.ZodNumber>;
            details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        }, "strip", z.ZodTypeAny, {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }, {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }>, "many">>;
        meta: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        action: "setInputFiles";
        skipInReport: boolean;
        files: string[];
        value?: string | undefined;
        required?: boolean | undefined;
        description?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
    }, {
        action: "setInputFiles";
        files: string[];
        value?: string | undefined;
        required?: boolean | undefined;
        description?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        skipInReport?: boolean | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
    }>, z.ZodObject<{
        action: z.ZodLiteral<"scroll">;
        deltaX: z.ZodOptional<z.ZodNumber>;
        deltaY: z.ZodOptional<z.ZodNumber>;
        surfaceId: z.ZodOptional<z.ZodString>;
        frame: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodObject<{
            url: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            path: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        }, {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        }>]>>;
        locator: z.ZodOptional<z.ZodObject<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">>>;
        description: z.ZodOptional<z.ZodString>;
        skipInReport: z.ZodDefault<z.ZodBoolean>;
        required: z.ZodOptional<z.ZodBoolean>;
        requiredSource: z.ZodOptional<z.ZodString>;
        requiredScope: z.ZodOptional<z.ZodString>;
        effects: z.ZodOptional<z.ZodArray<z.ZodObject<{
            type: z.ZodString;
            targetUrl: z.ZodOptional<z.ZodString>;
            surfaceId: z.ZodOptional<z.ZodString>;
            timestamp: z.ZodOptional<z.ZodNumber>;
            details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        }, "strip", z.ZodTypeAny, {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }, {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }>, "many">>;
        meta: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        action: "scroll";
        skipInReport: boolean;
        required?: boolean | undefined;
        description?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
        deltaX?: number | undefined;
        deltaY?: number | undefined;
    }, {
        action: "scroll";
        required?: boolean | undefined;
        description?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        skipInReport?: boolean | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
        deltaX?: number | undefined;
        deltaY?: number | undefined;
    }>, z.ZodObject<{
        action: z.ZodLiteral<"hover">;
        position: z.ZodOptional<z.ZodObject<{
            x: z.ZodNumber;
            y: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            x: number;
            y: number;
        }, {
            x: number;
            y: number;
        }>>;
        surfaceId: z.ZodOptional<z.ZodString>;
        frame: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodObject<{
            url: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            path: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        }, {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        }>]>>;
        locator: z.ZodOptional<z.ZodObject<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">>>;
        description: z.ZodOptional<z.ZodString>;
        skipInReport: z.ZodDefault<z.ZodBoolean>;
        required: z.ZodOptional<z.ZodBoolean>;
        requiredSource: z.ZodOptional<z.ZodString>;
        requiredScope: z.ZodOptional<z.ZodString>;
        effects: z.ZodOptional<z.ZodArray<z.ZodObject<{
            type: z.ZodString;
            targetUrl: z.ZodOptional<z.ZodString>;
            surfaceId: z.ZodOptional<z.ZodString>;
            timestamp: z.ZodOptional<z.ZodNumber>;
            details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        }, "strip", z.ZodTypeAny, {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }, {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }>, "many">>;
        meta: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        action: "hover";
        skipInReport: boolean;
        required?: boolean | undefined;
        description?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
        position?: {
            x: number;
            y: number;
        } | undefined;
    }, {
        action: "hover";
        required?: boolean | undefined;
        description?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        skipInReport?: boolean | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
        position?: {
            x: number;
            y: number;
        } | undefined;
    }>, z.ZodObject<{
        action: z.ZodLiteral<"copy">;
        outputName: z.ZodOptional<z.ZodString>;
        value: z.ZodOptional<z.ZodString>;
        surfaceId: z.ZodOptional<z.ZodString>;
        frame: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodObject<{
            url: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            path: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        }, {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        }>]>>;
        locator: z.ZodOptional<z.ZodObject<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">>>;
        description: z.ZodOptional<z.ZodString>;
        skipInReport: z.ZodDefault<z.ZodBoolean>;
        required: z.ZodOptional<z.ZodBoolean>;
        requiredSource: z.ZodOptional<z.ZodString>;
        requiredScope: z.ZodOptional<z.ZodString>;
        effects: z.ZodOptional<z.ZodArray<z.ZodObject<{
            type: z.ZodString;
            targetUrl: z.ZodOptional<z.ZodString>;
            surfaceId: z.ZodOptional<z.ZodString>;
            timestamp: z.ZodOptional<z.ZodNumber>;
            details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        }, "strip", z.ZodTypeAny, {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }, {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }>, "many">>;
        meta: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        action: "copy";
        skipInReport: boolean;
        value?: string | undefined;
        required?: boolean | undefined;
        description?: string | undefined;
        outputName?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
    }, {
        action: "copy";
        value?: string | undefined;
        required?: boolean | undefined;
        description?: string | undefined;
        outputName?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        skipInReport?: boolean | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
    }>, z.ZodObject<{
        action: z.ZodLiteral<"wait">;
        durationMs: z.ZodNumber;
        surfaceId: z.ZodOptional<z.ZodString>;
        frame: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodObject<{
            url: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            path: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        }, {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        }>]>>;
        locator: z.ZodOptional<z.ZodObject<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">>>;
        description: z.ZodOptional<z.ZodString>;
        skipInReport: z.ZodDefault<z.ZodBoolean>;
        required: z.ZodOptional<z.ZodBoolean>;
        requiredSource: z.ZodOptional<z.ZodString>;
        requiredScope: z.ZodOptional<z.ZodString>;
        effects: z.ZodOptional<z.ZodArray<z.ZodObject<{
            type: z.ZodString;
            targetUrl: z.ZodOptional<z.ZodString>;
            surfaceId: z.ZodOptional<z.ZodString>;
            timestamp: z.ZodOptional<z.ZodNumber>;
            details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        }, "strip", z.ZodTypeAny, {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }, {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }>, "many">>;
        meta: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        action: "wait";
        durationMs: number;
        skipInReport: boolean;
        required?: boolean | undefined;
        description?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
    }, {
        action: "wait";
        durationMs: number;
        required?: boolean | undefined;
        description?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        skipInReport?: boolean | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
    }>, z.ZodObject<{
        action: z.ZodLiteral<"assertVisible">;
        surfaceId: z.ZodOptional<z.ZodString>;
        frame: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodObject<{
            url: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            path: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        }, {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        }>]>>;
        locator: z.ZodOptional<z.ZodObject<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">>>;
        description: z.ZodOptional<z.ZodString>;
        skipInReport: z.ZodDefault<z.ZodBoolean>;
        required: z.ZodOptional<z.ZodBoolean>;
        requiredSource: z.ZodOptional<z.ZodString>;
        requiredScope: z.ZodOptional<z.ZodString>;
        effects: z.ZodOptional<z.ZodArray<z.ZodObject<{
            type: z.ZodString;
            targetUrl: z.ZodOptional<z.ZodString>;
            surfaceId: z.ZodOptional<z.ZodString>;
            timestamp: z.ZodOptional<z.ZodNumber>;
            details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        }, "strip", z.ZodTypeAny, {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }, {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }>, "many">>;
        meta: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        action: "assertVisible";
        skipInReport: boolean;
        required?: boolean | undefined;
        description?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
    }, {
        action: "assertVisible";
        required?: boolean | undefined;
        description?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        skipInReport?: boolean | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
    }>, z.ZodObject<{
        action: z.ZodLiteral<"assertText">;
        value: z.ZodString;
        surfaceId: z.ZodOptional<z.ZodString>;
        frame: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodObject<{
            url: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            path: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        }, {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        }>]>>;
        locator: z.ZodOptional<z.ZodObject<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">>>;
        description: z.ZodOptional<z.ZodString>;
        skipInReport: z.ZodDefault<z.ZodBoolean>;
        required: z.ZodOptional<z.ZodBoolean>;
        requiredSource: z.ZodOptional<z.ZodString>;
        requiredScope: z.ZodOptional<z.ZodString>;
        effects: z.ZodOptional<z.ZodArray<z.ZodObject<{
            type: z.ZodString;
            targetUrl: z.ZodOptional<z.ZodString>;
            surfaceId: z.ZodOptional<z.ZodString>;
            timestamp: z.ZodOptional<z.ZodNumber>;
            details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        }, "strip", z.ZodTypeAny, {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }, {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }>, "many">>;
        meta: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        value: string;
        action: "assertText";
        skipInReport: boolean;
        required?: boolean | undefined;
        description?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
    }, {
        value: string;
        action: "assertText";
        required?: boolean | undefined;
        description?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        skipInReport?: boolean | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
    }>, z.ZodObject<{
        action: z.ZodLiteral<"assertValue">;
        value: z.ZodString;
        surfaceId: z.ZodOptional<z.ZodString>;
        frame: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodObject<{
            url: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            path: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        }, {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        }>]>>;
        locator: z.ZodOptional<z.ZodObject<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">>>;
        description: z.ZodOptional<z.ZodString>;
        skipInReport: z.ZodDefault<z.ZodBoolean>;
        required: z.ZodOptional<z.ZodBoolean>;
        requiredSource: z.ZodOptional<z.ZodString>;
        requiredScope: z.ZodOptional<z.ZodString>;
        effects: z.ZodOptional<z.ZodArray<z.ZodObject<{
            type: z.ZodString;
            targetUrl: z.ZodOptional<z.ZodString>;
            surfaceId: z.ZodOptional<z.ZodString>;
            timestamp: z.ZodOptional<z.ZodNumber>;
            details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        }, "strip", z.ZodTypeAny, {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }, {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }>, "many">>;
        meta: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        value: string;
        action: "assertValue";
        skipInReport: boolean;
        required?: boolean | undefined;
        description?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
    }, {
        value: string;
        action: "assertValue";
        required?: boolean | undefined;
        description?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        skipInReport?: boolean | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
    }>, z.ZodObject<{
        action: z.ZodLiteral<"assertChecked">;
        checked: z.ZodBoolean;
        surfaceId: z.ZodOptional<z.ZodString>;
        frame: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodObject<{
            url: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            path: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        }, {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        }>]>>;
        locator: z.ZodOptional<z.ZodObject<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">>>;
        description: z.ZodOptional<z.ZodString>;
        skipInReport: z.ZodDefault<z.ZodBoolean>;
        required: z.ZodOptional<z.ZodBoolean>;
        requiredSource: z.ZodOptional<z.ZodString>;
        requiredScope: z.ZodOptional<z.ZodString>;
        effects: z.ZodOptional<z.ZodArray<z.ZodObject<{
            type: z.ZodString;
            targetUrl: z.ZodOptional<z.ZodString>;
            surfaceId: z.ZodOptional<z.ZodString>;
            timestamp: z.ZodOptional<z.ZodNumber>;
            details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        }, "strip", z.ZodTypeAny, {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }, {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }>, "many">>;
        meta: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        action: "assertChecked";
        skipInReport: boolean;
        checked: boolean;
        required?: boolean | undefined;
        description?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
    }, {
        action: "assertChecked";
        checked: boolean;
        required?: boolean | undefined;
        description?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        skipInReport?: boolean | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
    }>, z.ZodObject<{
        action: z.ZodLiteral<"assertSnapshot">;
        snapshot: z.ZodString;
        surfaceId: z.ZodOptional<z.ZodString>;
        frame: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodObject<{
            url: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            path: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        }, {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        }>]>>;
        locator: z.ZodOptional<z.ZodObject<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">>>;
        description: z.ZodOptional<z.ZodString>;
        skipInReport: z.ZodDefault<z.ZodBoolean>;
        required: z.ZodOptional<z.ZodBoolean>;
        requiredSource: z.ZodOptional<z.ZodString>;
        requiredScope: z.ZodOptional<z.ZodString>;
        effects: z.ZodOptional<z.ZodArray<z.ZodObject<{
            type: z.ZodString;
            targetUrl: z.ZodOptional<z.ZodString>;
            surfaceId: z.ZodOptional<z.ZodString>;
            timestamp: z.ZodOptional<z.ZodNumber>;
            details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        }, "strip", z.ZodTypeAny, {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }, {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }>, "many">>;
        meta: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        action: "assertSnapshot";
        skipInReport: boolean;
        snapshot: string;
        required?: boolean | undefined;
        description?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
    }, {
        action: "assertSnapshot";
        snapshot: string;
        required?: boolean | undefined;
        description?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        skipInReport?: boolean | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
    }>]>, z.ZodRecord<z.ZodString, z.ZodAny>]>, "many">;
    patchId: z.ZodDefault<z.ZodString>;
    schemaVersion: z.ZodDefault<z.ZodString>;
    parameters: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    knownErrorTypes: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    captureScreenshots: z.ZodDefault<z.ZodBoolean>;
    callbackUrl: z.ZodOptional<z.ZodString>;
    callbackToken: z.ZodOptional<z.ZodString>;
    timeoutMs: z.ZodOptional<z.ZodNumber>;
    environment: z.ZodOptional<z.ZodObject<{
        baseUrl: z.ZodOptional<z.ZodString>;
        credentials: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        headers: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        viewport: z.ZodOptional<z.ZodObject<{
            width: z.ZodNumber;
            height: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            width: number;
            height: number;
        }, {
            width: number;
            height: number;
        }>>;
    }, "strip", z.ZodTypeAny, {
        baseUrl?: string | undefined;
        credentials?: Record<string, string> | undefined;
        headers?: Record<string, string> | undefined;
        viewport?: {
            width: number;
            height: number;
        } | undefined;
    }, {
        baseUrl?: string | undefined;
        credentials?: Record<string, string> | undefined;
        headers?: Record<string, string> | undefined;
        viewport?: {
            width: number;
            height: number;
        } | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    patchId: string;
    captureScreenshots: boolean;
    steps: (Record<string, any> | {
        value: string;
        action: "navigate";
        skipInReport: boolean;
        required?: boolean | undefined;
        description?: string | undefined;
        url?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
    } | {
        action: "click";
        skipInReport: boolean;
        required?: boolean | undefined;
        description?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
        button?: "left" | "right" | "middle" | undefined;
        clickCount?: number | undefined;
        modifiers?: {
            shift?: boolean | undefined;
            alt?: boolean | undefined;
            control?: boolean | undefined;
            meta?: boolean | undefined;
        } | undefined;
        position?: {
            x: number;
            y: number;
        } | undefined;
    } | {
        action: "dblclick";
        skipInReport: boolean;
        clickCount: number;
        required?: boolean | undefined;
        description?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
        modifiers?: {
            shift?: boolean | undefined;
            alt?: boolean | undefined;
            control?: boolean | undefined;
            meta?: boolean | undefined;
        } | undefined;
        position?: {
            x: number;
            y: number;
        } | undefined;
    } | {
        action: "fill";
        skipInReport: boolean;
        value?: string | undefined;
        required?: boolean | undefined;
        description?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
        committedValue?: string | undefined;
        credentialRef?: string | undefined;
    } | {
        action: "selectOption";
        skipInReport: boolean;
        value?: string | undefined;
        values?: string[] | undefined;
        required?: boolean | undefined;
        description?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
        optionIndex?: number | undefined;
    } | {
        value: string;
        action: "lovSelect";
        skipInReport: boolean;
        required?: boolean | undefined;
        description?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
        optionIndex?: number | undefined;
    } | {
        action: "press";
        skipInReport: boolean;
        key: string;
        required?: boolean | undefined;
        description?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
        modifiers?: {
            shift?: boolean | undefined;
            alt?: boolean | undefined;
            control?: boolean | undefined;
            meta?: boolean | undefined;
        } | undefined;
    } | {
        action: "check";
        skipInReport: boolean;
        checked: true;
        required?: boolean | undefined;
        description?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
    } | {
        action: "uncheck";
        skipInReport: boolean;
        checked: false;
        required?: boolean | undefined;
        description?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
    } | {
        action: "setInputFiles";
        skipInReport: boolean;
        files: string[];
        value?: string | undefined;
        required?: boolean | undefined;
        description?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
    } | {
        action: "scroll";
        skipInReport: boolean;
        required?: boolean | undefined;
        description?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
        deltaX?: number | undefined;
        deltaY?: number | undefined;
    } | {
        action: "hover";
        skipInReport: boolean;
        required?: boolean | undefined;
        description?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
        position?: {
            x: number;
            y: number;
        } | undefined;
    } | {
        action: "copy";
        skipInReport: boolean;
        value?: string | undefined;
        required?: boolean | undefined;
        description?: string | undefined;
        outputName?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
    } | {
        action: "wait";
        durationMs: number;
        skipInReport: boolean;
        required?: boolean | undefined;
        description?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
    } | {
        action: "assertVisible";
        skipInReport: boolean;
        required?: boolean | undefined;
        description?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
    } | {
        value: string;
        action: "assertText";
        skipInReport: boolean;
        required?: boolean | undefined;
        description?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
    } | {
        value: string;
        action: "assertValue";
        skipInReport: boolean;
        required?: boolean | undefined;
        description?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
    } | {
        action: "assertChecked";
        skipInReport: boolean;
        checked: boolean;
        required?: boolean | undefined;
        description?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
    } | {
        action: "assertSnapshot";
        skipInReport: boolean;
        snapshot: string;
        required?: boolean | undefined;
        description?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectOutputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
    })[];
    jobExecutionId: string;
    schemaVersion: string;
    recordingId?: string | undefined;
    callbackUrl?: string | undefined;
    callbackToken?: string | undefined;
    runId?: string | undefined;
    suiteId?: string | undefined;
    parameters?: Record<string, string> | undefined;
    knownErrorTypes?: string[] | undefined;
    timeoutMs?: number | undefined;
    environment?: {
        baseUrl?: string | undefined;
        credentials?: Record<string, string> | undefined;
        headers?: Record<string, string> | undefined;
        viewport?: {
            width: number;
            height: number;
        } | undefined;
    } | undefined;
}, {
    steps: (Record<string, any> | {
        value: string;
        action: "navigate";
        required?: boolean | undefined;
        description?: string | undefined;
        url?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        skipInReport?: boolean | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
    } | {
        action: "click";
        required?: boolean | undefined;
        description?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        skipInReport?: boolean | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
        button?: "left" | "right" | "middle" | undefined;
        clickCount?: number | undefined;
        modifiers?: {
            shift?: boolean | undefined;
            alt?: boolean | undefined;
            control?: boolean | undefined;
            meta?: boolean | undefined;
        } | undefined;
        position?: {
            x: number;
            y: number;
        } | undefined;
    } | {
        action: "dblclick";
        required?: boolean | undefined;
        description?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        skipInReport?: boolean | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
        clickCount?: number | undefined;
        modifiers?: {
            shift?: boolean | undefined;
            alt?: boolean | undefined;
            control?: boolean | undefined;
            meta?: boolean | undefined;
        } | undefined;
        position?: {
            x: number;
            y: number;
        } | undefined;
    } | {
        action: "fill";
        value?: string | undefined;
        required?: boolean | undefined;
        description?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        skipInReport?: boolean | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
        committedValue?: string | undefined;
        credentialRef?: string | undefined;
    } | {
        action: "selectOption";
        value?: string | undefined;
        values?: string[] | undefined;
        required?: boolean | undefined;
        description?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        skipInReport?: boolean | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
        optionIndex?: number | undefined;
    } | {
        value: string;
        action: "lovSelect";
        required?: boolean | undefined;
        description?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        skipInReport?: boolean | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
        optionIndex?: number | undefined;
    } | {
        action: "press";
        key: string;
        required?: boolean | undefined;
        description?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        skipInReport?: boolean | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
        modifiers?: {
            shift?: boolean | undefined;
            alt?: boolean | undefined;
            control?: boolean | undefined;
            meta?: boolean | undefined;
        } | undefined;
    } | {
        action: "check";
        required?: boolean | undefined;
        description?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        skipInReport?: boolean | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
        checked?: true | undefined;
    } | {
        action: "uncheck";
        required?: boolean | undefined;
        description?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        skipInReport?: boolean | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
        checked?: false | undefined;
    } | {
        action: "setInputFiles";
        files: string[];
        value?: string | undefined;
        required?: boolean | undefined;
        description?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        skipInReport?: boolean | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
    } | {
        action: "scroll";
        required?: boolean | undefined;
        description?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        skipInReport?: boolean | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
        deltaX?: number | undefined;
        deltaY?: number | undefined;
    } | {
        action: "hover";
        required?: boolean | undefined;
        description?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        skipInReport?: boolean | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
        position?: {
            x: number;
            y: number;
        } | undefined;
    } | {
        action: "copy";
        value?: string | undefined;
        required?: boolean | undefined;
        description?: string | undefined;
        outputName?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        skipInReport?: boolean | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
    } | {
        action: "wait";
        durationMs: number;
        required?: boolean | undefined;
        description?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        skipInReport?: boolean | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
    } | {
        action: "assertVisible";
        required?: boolean | undefined;
        description?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        skipInReport?: boolean | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
    } | {
        value: string;
        action: "assertText";
        required?: boolean | undefined;
        description?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        skipInReport?: boolean | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
    } | {
        value: string;
        action: "assertValue";
        required?: boolean | undefined;
        description?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        skipInReport?: boolean | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
    } | {
        action: "assertChecked";
        checked: boolean;
        required?: boolean | undefined;
        description?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        skipInReport?: boolean | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
    } | {
        action: "assertSnapshot";
        snapshot: string;
        required?: boolean | undefined;
        description?: string | undefined;
        surfaceId?: string | undefined;
        meta?: Record<string, any> | undefined;
        frame?: string | {
            path?: string[] | undefined;
            name?: string | undefined;
            selector?: string | undefined;
            url?: string | undefined;
        } | undefined;
        locator?: z.objectInputType<{
            id: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodString>;
            attrSelector: z.ZodOptional<z.ZodString>;
            testId: z.ZodOptional<z.ZodString>;
            componentId: z.ZodOptional<z.ZodString>;
            candidates: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            backupSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        skipInReport?: boolean | undefined;
        requiredSource?: string | undefined;
        requiredScope?: string | undefined;
        effects?: {
            type: string;
            details?: Record<string, any> | undefined;
            timestamp?: number | undefined;
            surfaceId?: string | undefined;
            targetUrl?: string | undefined;
        }[] | undefined;
    })[];
    jobExecutionId: string;
    recordingId?: string | undefined;
    patchId?: string | undefined;
    captureScreenshots?: boolean | undefined;
    callbackUrl?: string | undefined;
    callbackToken?: string | undefined;
    runId?: string | undefined;
    suiteId?: string | undefined;
    parameters?: Record<string, string> | undefined;
    schemaVersion?: string | undefined;
    knownErrorTypes?: string[] | undefined;
    timeoutMs?: number | undefined;
    environment?: {
        baseUrl?: string | undefined;
        credentials?: Record<string, string> | undefined;
        headers?: Record<string, string> | undefined;
        viewport?: {
            width: number;
            height: number;
        } | undefined;
    } | undefined;
}>;
export declare const ExecutionEventSchema: z.ZodDiscriminatedUnion<"type", [z.ZodObject<{
    type: z.ZodLiteral<"step-started">;
    jobExecutionId: z.ZodString;
    runId: z.ZodOptional<z.ZodString>;
    stepIndex: z.ZodNumber;
    action: z.ZodString;
    timestamp: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: "step-started";
    action: string;
    stepIndex: number;
    jobExecutionId: string;
    timestamp?: string | undefined;
    runId?: string | undefined;
}, {
    type: "step-started";
    action: string;
    stepIndex: number;
    jobExecutionId: string;
    timestamp?: string | undefined;
    runId?: string | undefined;
}>, z.ZodObject<{
    type: z.ZodLiteral<"step-completed">;
    jobExecutionId: z.ZodString;
    runId: z.ZodOptional<z.ZodString>;
    stepIndex: z.ZodNumber;
    status: z.ZodEnum<["success", "failed", "skipped", "warn"]>;
    durationMs: z.ZodNumber;
    error: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    verdict: z.ZodOptional<z.ZodObject<{
        category: z.ZodEnum<["SELECTOR_NOT_FOUND", "TIMEOUT", "NAVIGATION_FAILED", "ASSERTION_FAILED", "AUTH_REQUIRED", "COMMIT_REFUSAL", "FRAME_DETACHED", "SURFACE_UNAVAILABLE", "UNSUPPORTED_ACTION", "INTERNAL_ERROR"]>;
        message: z.ZodString;
        recoverable: z.ZodDefault<z.ZodBoolean>;
        details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        message: string;
        category: "INTERNAL_ERROR" | "SELECTOR_NOT_FOUND" | "TIMEOUT" | "NAVIGATION_FAILED" | "ASSERTION_FAILED" | "AUTH_REQUIRED" | "COMMIT_REFUSAL" | "FRAME_DETACHED" | "SURFACE_UNAVAILABLE" | "UNSUPPORTED_ACTION";
        recoverable: boolean;
        details?: Record<string, any> | undefined;
    }, {
        message: string;
        category: "INTERNAL_ERROR" | "SELECTOR_NOT_FOUND" | "TIMEOUT" | "NAVIGATION_FAILED" | "ASSERTION_FAILED" | "AUTH_REQUIRED" | "COMMIT_REFUSAL" | "FRAME_DETACHED" | "SURFACE_UNAVAILABLE" | "UNSUPPORTED_ACTION";
        details?: Record<string, any> | undefined;
        recoverable?: boolean | undefined;
    }>>;
    heal: z.ZodOptional<z.ZodObject<{
        attempted: z.ZodBoolean;
        applied: z.ZodOptional<z.ZodBoolean>;
        skipped: z.ZodOptional<z.ZodBoolean>;
        reason: z.ZodOptional<z.ZodString>;
        candidate: z.ZodOptional<z.ZodAny>;
        fixType: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        attempted: boolean;
        skipped?: boolean | undefined;
        candidate?: any;
        reason?: string | undefined;
        applied?: boolean | undefined;
        fixType?: string | undefined;
    }, {
        attempted: boolean;
        skipped?: boolean | undefined;
        candidate?: any;
        reason?: string | undefined;
        applied?: boolean | undefined;
        fixType?: string | undefined;
    }>>;
    timestamp: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: "step-completed";
    status: "success" | "warn" | "failed" | "skipped";
    stepIndex: number;
    durationMs: number;
    jobExecutionId: string;
    timestamp?: string | undefined;
    error?: string | null | undefined;
    runId?: string | undefined;
    verdict?: {
        message: string;
        category: "INTERNAL_ERROR" | "SELECTOR_NOT_FOUND" | "TIMEOUT" | "NAVIGATION_FAILED" | "ASSERTION_FAILED" | "AUTH_REQUIRED" | "COMMIT_REFUSAL" | "FRAME_DETACHED" | "SURFACE_UNAVAILABLE" | "UNSUPPORTED_ACTION";
        recoverable: boolean;
        details?: Record<string, any> | undefined;
    } | undefined;
    heal?: {
        attempted: boolean;
        skipped?: boolean | undefined;
        candidate?: any;
        reason?: string | undefined;
        applied?: boolean | undefined;
        fixType?: string | undefined;
    } | undefined;
}, {
    type: "step-completed";
    status: "success" | "warn" | "failed" | "skipped";
    stepIndex: number;
    durationMs: number;
    jobExecutionId: string;
    timestamp?: string | undefined;
    error?: string | null | undefined;
    runId?: string | undefined;
    verdict?: {
        message: string;
        category: "INTERNAL_ERROR" | "SELECTOR_NOT_FOUND" | "TIMEOUT" | "NAVIGATION_FAILED" | "ASSERTION_FAILED" | "AUTH_REQUIRED" | "COMMIT_REFUSAL" | "FRAME_DETACHED" | "SURFACE_UNAVAILABLE" | "UNSUPPORTED_ACTION";
        details?: Record<string, any> | undefined;
        recoverable?: boolean | undefined;
    } | undefined;
    heal?: {
        attempted: boolean;
        skipped?: boolean | undefined;
        candidate?: any;
        reason?: string | undefined;
        applied?: boolean | undefined;
        fixType?: string | undefined;
    } | undefined;
}>, z.ZodObject<{
    type: z.ZodLiteral<"heal-attempted">;
    jobExecutionId: z.ZodString;
    runId: z.ZodOptional<z.ZodString>;
    stepIndex: z.ZodNumber;
    candidate: z.ZodOptional<z.ZodAny>;
    timestamp: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: "heal-attempted";
    stepIndex: number;
    jobExecutionId: string;
    timestamp?: string | undefined;
    runId?: string | undefined;
    candidate?: any;
}, {
    type: "heal-attempted";
    stepIndex: number;
    jobExecutionId: string;
    timestamp?: string | undefined;
    runId?: string | undefined;
    candidate?: any;
}>, z.ZodObject<{
    type: z.ZodLiteral<"heal-skipped">;
    jobExecutionId: z.ZodString;
    runId: z.ZodOptional<z.ZodString>;
    stepIndex: z.ZodNumber;
    reason: z.ZodString;
    candidate: z.ZodOptional<z.ZodAny>;
    timestamp: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: "heal-skipped";
    stepIndex: number;
    reason: string;
    jobExecutionId: string;
    timestamp?: string | undefined;
    runId?: string | undefined;
    candidate?: any;
}, {
    type: "heal-skipped";
    stepIndex: number;
    reason: string;
    jobExecutionId: string;
    timestamp?: string | undefined;
    runId?: string | undefined;
    candidate?: any;
}>, z.ZodObject<{
    type: z.ZodLiteral<"heartbeat">;
    jobExecutionId: z.ZodString;
    runId: z.ZodOptional<z.ZodString>;
    timestamp: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: "heartbeat";
    jobExecutionId: string;
    timestamp?: string | undefined;
    runId?: string | undefined;
}, {
    type: "heartbeat";
    jobExecutionId: string;
    timestamp?: string | undefined;
    runId?: string | undefined;
}>, z.ZodObject<{
    type: z.ZodLiteral<"complete">;
    jobExecutionId: z.ZodString;
    runId: z.ZodOptional<z.ZodString>;
    success: z.ZodBoolean;
    durationMs: z.ZodNumber;
    stepCount: z.ZodNumber;
    results: z.ZodArray<z.ZodObject<{
        stepIndex: z.ZodNumber;
        status: z.ZodEnum<["success", "failed", "skipped", "warn"]>;
        durationMs: z.ZodNumber;
        action: z.ZodString;
        error: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        verdict: z.ZodOptional<z.ZodObject<{
            category: z.ZodEnum<["SELECTOR_NOT_FOUND", "TIMEOUT", "NAVIGATION_FAILED", "ASSERTION_FAILED", "AUTH_REQUIRED", "COMMIT_REFUSAL", "FRAME_DETACHED", "SURFACE_UNAVAILABLE", "UNSUPPORTED_ACTION", "INTERNAL_ERROR"]>;
            message: z.ZodString;
            recoverable: z.ZodDefault<z.ZodBoolean>;
            details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        }, "strip", z.ZodTypeAny, {
            message: string;
            category: "INTERNAL_ERROR" | "SELECTOR_NOT_FOUND" | "TIMEOUT" | "NAVIGATION_FAILED" | "ASSERTION_FAILED" | "AUTH_REQUIRED" | "COMMIT_REFUSAL" | "FRAME_DETACHED" | "SURFACE_UNAVAILABLE" | "UNSUPPORTED_ACTION";
            recoverable: boolean;
            details?: Record<string, any> | undefined;
        }, {
            message: string;
            category: "INTERNAL_ERROR" | "SELECTOR_NOT_FOUND" | "TIMEOUT" | "NAVIGATION_FAILED" | "ASSERTION_FAILED" | "AUTH_REQUIRED" | "COMMIT_REFUSAL" | "FRAME_DETACHED" | "SURFACE_UNAVAILABLE" | "UNSUPPORTED_ACTION";
            details?: Record<string, any> | undefined;
            recoverable?: boolean | undefined;
        }>>;
        heal: z.ZodOptional<z.ZodObject<{
            attempted: z.ZodBoolean;
            applied: z.ZodOptional<z.ZodBoolean>;
            skipped: z.ZodOptional<z.ZodBoolean>;
            reason: z.ZodOptional<z.ZodString>;
            candidate: z.ZodOptional<z.ZodAny>;
            fixType: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            attempted: boolean;
            skipped?: boolean | undefined;
            candidate?: any;
            reason?: string | undefined;
            applied?: boolean | undefined;
            fixType?: string | undefined;
        }, {
            attempted: boolean;
            skipped?: boolean | undefined;
            candidate?: any;
            reason?: string | undefined;
            applied?: boolean | undefined;
            fixType?: string | undefined;
        }>>;
        screenshotKey: z.ZodOptional<z.ZodString>;
        extractedOutputs: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNullable<z.ZodString>>>;
    }, "strip", z.ZodTypeAny, {
        status: "success" | "warn" | "failed" | "skipped";
        action: string;
        stepIndex: number;
        durationMs: number;
        error?: string | null | undefined;
        screenshotKey?: string | undefined;
        verdict?: {
            message: string;
            category: "INTERNAL_ERROR" | "SELECTOR_NOT_FOUND" | "TIMEOUT" | "NAVIGATION_FAILED" | "ASSERTION_FAILED" | "AUTH_REQUIRED" | "COMMIT_REFUSAL" | "FRAME_DETACHED" | "SURFACE_UNAVAILABLE" | "UNSUPPORTED_ACTION";
            recoverable: boolean;
            details?: Record<string, any> | undefined;
        } | undefined;
        heal?: {
            attempted: boolean;
            skipped?: boolean | undefined;
            candidate?: any;
            reason?: string | undefined;
            applied?: boolean | undefined;
            fixType?: string | undefined;
        } | undefined;
        extractedOutputs?: Record<string, string | null> | undefined;
    }, {
        status: "success" | "warn" | "failed" | "skipped";
        action: string;
        stepIndex: number;
        durationMs: number;
        error?: string | null | undefined;
        screenshotKey?: string | undefined;
        verdict?: {
            message: string;
            category: "INTERNAL_ERROR" | "SELECTOR_NOT_FOUND" | "TIMEOUT" | "NAVIGATION_FAILED" | "ASSERTION_FAILED" | "AUTH_REQUIRED" | "COMMIT_REFUSAL" | "FRAME_DETACHED" | "SURFACE_UNAVAILABLE" | "UNSUPPORTED_ACTION";
            details?: Record<string, any> | undefined;
            recoverable?: boolean | undefined;
        } | undefined;
        heal?: {
            attempted: boolean;
            skipped?: boolean | undefined;
            candidate?: any;
            reason?: string | undefined;
            applied?: boolean | undefined;
            fixType?: string | undefined;
        } | undefined;
        extractedOutputs?: Record<string, string | null> | undefined;
    }>, "many">;
    outputs: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNullable<z.ZodString>>>;
    error: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    timestamp: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: "complete";
    success: boolean;
    stepCount: number;
    durationMs: number;
    jobExecutionId: string;
    results: {
        status: "success" | "warn" | "failed" | "skipped";
        action: string;
        stepIndex: number;
        durationMs: number;
        error?: string | null | undefined;
        screenshotKey?: string | undefined;
        verdict?: {
            message: string;
            category: "INTERNAL_ERROR" | "SELECTOR_NOT_FOUND" | "TIMEOUT" | "NAVIGATION_FAILED" | "ASSERTION_FAILED" | "AUTH_REQUIRED" | "COMMIT_REFUSAL" | "FRAME_DETACHED" | "SURFACE_UNAVAILABLE" | "UNSUPPORTED_ACTION";
            recoverable: boolean;
            details?: Record<string, any> | undefined;
        } | undefined;
        heal?: {
            attempted: boolean;
            skipped?: boolean | undefined;
            candidate?: any;
            reason?: string | undefined;
            applied?: boolean | undefined;
            fixType?: string | undefined;
        } | undefined;
        extractedOutputs?: Record<string, string | null> | undefined;
    }[];
    timestamp?: string | undefined;
    error?: string | null | undefined;
    runId?: string | undefined;
    outputs?: Record<string, string | null> | undefined;
}, {
    type: "complete";
    success: boolean;
    stepCount: number;
    durationMs: number;
    jobExecutionId: string;
    results: {
        status: "success" | "warn" | "failed" | "skipped";
        action: string;
        stepIndex: number;
        durationMs: number;
        error?: string | null | undefined;
        screenshotKey?: string | undefined;
        verdict?: {
            message: string;
            category: "INTERNAL_ERROR" | "SELECTOR_NOT_FOUND" | "TIMEOUT" | "NAVIGATION_FAILED" | "ASSERTION_FAILED" | "AUTH_REQUIRED" | "COMMIT_REFUSAL" | "FRAME_DETACHED" | "SURFACE_UNAVAILABLE" | "UNSUPPORTED_ACTION";
            details?: Record<string, any> | undefined;
            recoverable?: boolean | undefined;
        } | undefined;
        heal?: {
            attempted: boolean;
            skipped?: boolean | undefined;
            candidate?: any;
            reason?: string | undefined;
            applied?: boolean | undefined;
            fixType?: string | undefined;
        } | undefined;
        extractedOutputs?: Record<string, string | null> | undefined;
    }[];
    timestamp?: string | undefined;
    error?: string | null | undefined;
    runId?: string | undefined;
    outputs?: Record<string, string | null> | undefined;
}>]>;
export declare const ExecutionArtifactDescriptorSchema: z.ZodObject<{
    kind: z.ZodEnum<["trace", "video", "screenshot", "har", "log"]>;
    storageKey: z.ZodString;
    bytes: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    kind: "trace" | "video" | "screenshot" | "har" | "log";
    storageKey: string;
    bytes?: number | undefined;
}, {
    kind: "trace" | "video" | "screenshot" | "har" | "log";
    storageKey: string;
    bytes?: number | undefined;
}>;
export declare const ExecutionResultSchema: z.ZodObject<{
    jobExecutionId: z.ZodString;
    runId: z.ZodOptional<z.ZodString>;
    success: z.ZodBoolean;
    durationMs: z.ZodNumber;
    stepCount: z.ZodNumber;
    results: z.ZodArray<z.ZodObject<{
        stepIndex: z.ZodNumber;
        status: z.ZodEnum<["success", "failed", "skipped", "warn"]>;
        durationMs: z.ZodNumber;
        action: z.ZodString;
        error: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        verdict: z.ZodOptional<z.ZodObject<{
            category: z.ZodEnum<["SELECTOR_NOT_FOUND", "TIMEOUT", "NAVIGATION_FAILED", "ASSERTION_FAILED", "AUTH_REQUIRED", "COMMIT_REFUSAL", "FRAME_DETACHED", "SURFACE_UNAVAILABLE", "UNSUPPORTED_ACTION", "INTERNAL_ERROR"]>;
            message: z.ZodString;
            recoverable: z.ZodDefault<z.ZodBoolean>;
            details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        }, "strip", z.ZodTypeAny, {
            message: string;
            category: "INTERNAL_ERROR" | "SELECTOR_NOT_FOUND" | "TIMEOUT" | "NAVIGATION_FAILED" | "ASSERTION_FAILED" | "AUTH_REQUIRED" | "COMMIT_REFUSAL" | "FRAME_DETACHED" | "SURFACE_UNAVAILABLE" | "UNSUPPORTED_ACTION";
            recoverable: boolean;
            details?: Record<string, any> | undefined;
        }, {
            message: string;
            category: "INTERNAL_ERROR" | "SELECTOR_NOT_FOUND" | "TIMEOUT" | "NAVIGATION_FAILED" | "ASSERTION_FAILED" | "AUTH_REQUIRED" | "COMMIT_REFUSAL" | "FRAME_DETACHED" | "SURFACE_UNAVAILABLE" | "UNSUPPORTED_ACTION";
            details?: Record<string, any> | undefined;
            recoverable?: boolean | undefined;
        }>>;
        heal: z.ZodOptional<z.ZodObject<{
            attempted: z.ZodBoolean;
            applied: z.ZodOptional<z.ZodBoolean>;
            skipped: z.ZodOptional<z.ZodBoolean>;
            reason: z.ZodOptional<z.ZodString>;
            candidate: z.ZodOptional<z.ZodAny>;
            fixType: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            attempted: boolean;
            skipped?: boolean | undefined;
            candidate?: any;
            reason?: string | undefined;
            applied?: boolean | undefined;
            fixType?: string | undefined;
        }, {
            attempted: boolean;
            skipped?: boolean | undefined;
            candidate?: any;
            reason?: string | undefined;
            applied?: boolean | undefined;
            fixType?: string | undefined;
        }>>;
        screenshotKey: z.ZodOptional<z.ZodString>;
        extractedOutputs: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNullable<z.ZodString>>>;
    }, "strip", z.ZodTypeAny, {
        status: "success" | "warn" | "failed" | "skipped";
        action: string;
        stepIndex: number;
        durationMs: number;
        error?: string | null | undefined;
        screenshotKey?: string | undefined;
        verdict?: {
            message: string;
            category: "INTERNAL_ERROR" | "SELECTOR_NOT_FOUND" | "TIMEOUT" | "NAVIGATION_FAILED" | "ASSERTION_FAILED" | "AUTH_REQUIRED" | "COMMIT_REFUSAL" | "FRAME_DETACHED" | "SURFACE_UNAVAILABLE" | "UNSUPPORTED_ACTION";
            recoverable: boolean;
            details?: Record<string, any> | undefined;
        } | undefined;
        heal?: {
            attempted: boolean;
            skipped?: boolean | undefined;
            candidate?: any;
            reason?: string | undefined;
            applied?: boolean | undefined;
            fixType?: string | undefined;
        } | undefined;
        extractedOutputs?: Record<string, string | null> | undefined;
    }, {
        status: "success" | "warn" | "failed" | "skipped";
        action: string;
        stepIndex: number;
        durationMs: number;
        error?: string | null | undefined;
        screenshotKey?: string | undefined;
        verdict?: {
            message: string;
            category: "INTERNAL_ERROR" | "SELECTOR_NOT_FOUND" | "TIMEOUT" | "NAVIGATION_FAILED" | "ASSERTION_FAILED" | "AUTH_REQUIRED" | "COMMIT_REFUSAL" | "FRAME_DETACHED" | "SURFACE_UNAVAILABLE" | "UNSUPPORTED_ACTION";
            details?: Record<string, any> | undefined;
            recoverable?: boolean | undefined;
        } | undefined;
        heal?: {
            attempted: boolean;
            skipped?: boolean | undefined;
            candidate?: any;
            reason?: string | undefined;
            applied?: boolean | undefined;
            fixType?: string | undefined;
        } | undefined;
        extractedOutputs?: Record<string, string | null> | undefined;
    }>, "many">;
    outputs: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodNullable<z.ZodString>>>;
    error: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    verdict: z.ZodOptional<z.ZodObject<{
        category: z.ZodEnum<["SELECTOR_NOT_FOUND", "TIMEOUT", "NAVIGATION_FAILED", "ASSERTION_FAILED", "AUTH_REQUIRED", "COMMIT_REFUSAL", "FRAME_DETACHED", "SURFACE_UNAVAILABLE", "UNSUPPORTED_ACTION", "INTERNAL_ERROR"]>;
        message: z.ZodString;
        recoverable: z.ZodDefault<z.ZodBoolean>;
        details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        message: string;
        category: "INTERNAL_ERROR" | "SELECTOR_NOT_FOUND" | "TIMEOUT" | "NAVIGATION_FAILED" | "ASSERTION_FAILED" | "AUTH_REQUIRED" | "COMMIT_REFUSAL" | "FRAME_DETACHED" | "SURFACE_UNAVAILABLE" | "UNSUPPORTED_ACTION";
        recoverable: boolean;
        details?: Record<string, any> | undefined;
    }, {
        message: string;
        category: "INTERNAL_ERROR" | "SELECTOR_NOT_FOUND" | "TIMEOUT" | "NAVIGATION_FAILED" | "ASSERTION_FAILED" | "AUTH_REQUIRED" | "COMMIT_REFUSAL" | "FRAME_DETACHED" | "SURFACE_UNAVAILABLE" | "UNSUPPORTED_ACTION";
        details?: Record<string, any> | undefined;
        recoverable?: boolean | undefined;
    }>>;
    artifacts: z.ZodOptional<z.ZodArray<z.ZodObject<{
        kind: z.ZodEnum<["trace", "video", "screenshot", "har", "log"]>;
        storageKey: z.ZodString;
        bytes: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        kind: "trace" | "video" | "screenshot" | "har" | "log";
        storageKey: string;
        bytes?: number | undefined;
    }, {
        kind: "trace" | "video" | "screenshot" | "har" | "log";
        storageKey: string;
        bytes?: number | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    success: boolean;
    stepCount: number;
    durationMs: number;
    outputs: Record<string, string | null>;
    jobExecutionId: string;
    results: {
        status: "success" | "warn" | "failed" | "skipped";
        action: string;
        stepIndex: number;
        durationMs: number;
        error?: string | null | undefined;
        screenshotKey?: string | undefined;
        verdict?: {
            message: string;
            category: "INTERNAL_ERROR" | "SELECTOR_NOT_FOUND" | "TIMEOUT" | "NAVIGATION_FAILED" | "ASSERTION_FAILED" | "AUTH_REQUIRED" | "COMMIT_REFUSAL" | "FRAME_DETACHED" | "SURFACE_UNAVAILABLE" | "UNSUPPORTED_ACTION";
            recoverable: boolean;
            details?: Record<string, any> | undefined;
        } | undefined;
        heal?: {
            attempted: boolean;
            skipped?: boolean | undefined;
            candidate?: any;
            reason?: string | undefined;
            applied?: boolean | undefined;
            fixType?: string | undefined;
        } | undefined;
        extractedOutputs?: Record<string, string | null> | undefined;
    }[];
    error?: string | null | undefined;
    runId?: string | undefined;
    verdict?: {
        message: string;
        category: "INTERNAL_ERROR" | "SELECTOR_NOT_FOUND" | "TIMEOUT" | "NAVIGATION_FAILED" | "ASSERTION_FAILED" | "AUTH_REQUIRED" | "COMMIT_REFUSAL" | "FRAME_DETACHED" | "SURFACE_UNAVAILABLE" | "UNSUPPORTED_ACTION";
        recoverable: boolean;
        details?: Record<string, any> | undefined;
    } | undefined;
    artifacts?: {
        kind: "trace" | "video" | "screenshot" | "har" | "log";
        storageKey: string;
        bytes?: number | undefined;
    }[] | undefined;
}, {
    success: boolean;
    stepCount: number;
    durationMs: number;
    jobExecutionId: string;
    results: {
        status: "success" | "warn" | "failed" | "skipped";
        action: string;
        stepIndex: number;
        durationMs: number;
        error?: string | null | undefined;
        screenshotKey?: string | undefined;
        verdict?: {
            message: string;
            category: "INTERNAL_ERROR" | "SELECTOR_NOT_FOUND" | "TIMEOUT" | "NAVIGATION_FAILED" | "ASSERTION_FAILED" | "AUTH_REQUIRED" | "COMMIT_REFUSAL" | "FRAME_DETACHED" | "SURFACE_UNAVAILABLE" | "UNSUPPORTED_ACTION";
            details?: Record<string, any> | undefined;
            recoverable?: boolean | undefined;
        } | undefined;
        heal?: {
            attempted: boolean;
            skipped?: boolean | undefined;
            candidate?: any;
            reason?: string | undefined;
            applied?: boolean | undefined;
            fixType?: string | undefined;
        } | undefined;
        extractedOutputs?: Record<string, string | null> | undefined;
    }[];
    error?: string | null | undefined;
    runId?: string | undefined;
    outputs?: Record<string, string | null> | undefined;
    verdict?: {
        message: string;
        category: "INTERNAL_ERROR" | "SELECTOR_NOT_FOUND" | "TIMEOUT" | "NAVIGATION_FAILED" | "ASSERTION_FAILED" | "AUTH_REQUIRED" | "COMMIT_REFUSAL" | "FRAME_DETACHED" | "SURFACE_UNAVAILABLE" | "UNSUPPORTED_ACTION";
        details?: Record<string, any> | undefined;
        recoverable?: boolean | undefined;
    } | undefined;
    artifacts?: {
        kind: "trace" | "video" | "screenshot" | "har" | "log";
        storageKey: string;
        bytes?: number | undefined;
    }[] | undefined;
}>;
export type ReplayErrorCategory = z.infer<typeof ReplayErrorCategorySchema>;
export type ReplayVerdict = z.infer<typeof ReplayVerdictSchema>;
export type StepExecutionStatus = z.infer<typeof StepExecutionStatusSchema>;
export type HealRecord = z.infer<typeof HealRecordSchema>;
export type StepExecutionResult = z.infer<typeof StepExecutionResultSchema>;
export type ExecutionEnvironment = z.infer<typeof ExecutionEnvironmentSchema>;
export type ExecutionRequest = z.infer<typeof ExecutionRequestSchema>;
export type ExecutionEvent = z.infer<typeof ExecutionEventSchema>;
export type ExecutionArtifactDescriptor = z.infer<typeof ExecutionArtifactDescriptorSchema>;
export type ExecutionResult = z.infer<typeof ExecutionResultSchema>;

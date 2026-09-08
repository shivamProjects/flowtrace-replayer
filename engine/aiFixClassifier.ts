/**
 * Classification helpers for AI Fix Library.
 * Used during replay execution to tag metadata on heals.
 */

export type UiCode = 'ADF' | 'REDWOOD' | 'UNKNOWN';
export type FailureStage = 'LOCATE' | 'OPEN' | 'INPUT' | 'COMMIT' | 'VERIFY' | 'OTHER';
export type WidgetKind =
  | 'LOV_MODAL'
  | 'LOV_SUGGEST'
  | 'LOV_DROPDOWN'
  | 'NATIVE_SELECT'
  | 'TEXTBOX'
  | 'BUTTON'
  | 'OTHER';

/**
 * Classify ui_code from the live page URL.
 * Never derived from selectors.
 */
export function classifyUiCode(url: string | null | undefined): UiCode {
  if (!url || typeof url !== 'string') return 'UNKNOWN';
  if (/\/redwood(?:\/|$)/i.test(url)) return 'REDWOOD';
  if (/\/faces(?:\/|$)/i.test(url)) return 'ADF';
  return 'UNKNOWN';
}

/**
 * Infer failure stage from error message when not explicitly tagged on Error object.
 */
export function inferStage(message: string | null | undefined): FailureStage {
  if (!message || typeof message !== 'string') return 'OTHER';
  const m = message.toLowerCase();
  if (
    m.includes('waitfor') ||
    m.includes('not visible') ||
    m.includes('timeout') ||
    m.includes('no element') ||
    m.includes('not found') ||
    m.includes('resolve') ||
    m.includes('waiting for locator') ||
    m.includes('could not find') ||
    m.includes('element is not attached')
  ) {
    return 'LOCATE';
  }
  if (
    m.includes('verify') ||
    m.includes('readback') ||
    m.includes('read-back') ||
    m.includes('disagreed') ||
    m.includes('reads') ||
    m.includes('assert') ||
    m.includes('could not commit') ||
    m.includes('could not select')
  ) {
    return 'VERIFY';
  }
  if (
    m.includes('open') ||
    m.includes('popup') ||
    m.includes('dropdown') ||
    m.includes('dialog') ||
    m.includes('launcher')
  ) {
    return 'OPEN';
  }
  if (
    m.includes('fill') ||
    m.includes('type') ||
    m.includes('press') ||
    m.includes('input') ||
    m.includes('clear') ||
    m.includes('keyboard')
  ) {
    return 'INPUT';
  }
  if (
    m.includes('commit') ||
    m.includes('save') ||
    m.includes('select') ||
    m.includes('pick') ||
    m.includes('click') ||
    m.includes('check') ||
    m.includes('uncheck') ||
    m.includes('submit')
  ) {
    return 'COMMIT';
  }
  return 'OTHER';
}

/**
 * Normalise selector/description strings to remove volatile IDs and instance names.
 */
export function normaliseSignature(str: string | null | undefined): string {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/name="[^"]*"/g, 'name=#')
    .replace(/internal:text="[^"]*"/gi, 'internal:text=#')
    .replace(/label="[^"]*"/g, 'label=#')
    .replace(/nth-child\(\d+\)/g, 'nth-child(#)')
    .replace(/nth=\d+/g, 'nth=#')
    .replace(/_oj\d+/g, '_oj#')
    .replace(/\bui-id-\d+\b/g, 'ui-id-#');
}

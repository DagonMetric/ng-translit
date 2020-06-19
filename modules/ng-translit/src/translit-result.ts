/**
 * @license
 * Copyright DagonMetric. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found under the LICENSE file in the root directory of this source tree.
 */

/**
 * The transliteration trace post Item.
 */
export interface TranslitTraceSubItem {
    /**
     * The `from` text of post rule item.
     */
    from: string;
    /**
     * The `to` text of post rule item.
     */
    to?: string;
    /**
     * The input string.
     */
    inputString: string;
    /**
     * The matched string.
     */
    matchedString: string;
    /**
     * The replaced string.
     */
    replacedString: string;
}

/**
 * The transliteration trace information Item.
 */
export interface TranslitTraceItem {
    /**
     * The `from` text of rule item.
     */
    from: string;
    /**
     * The `to` text of rule item.
     */
    to?: string;
    /**
     * The input string.
     */
    inputString: string;
    /**
     * The matched string.
     */
    matchedString: string;
    /**
     * The replaced string.
     */
    replacedString: string;
    /**
     * Array of `postRules` transliterate trace information.
     */
    postRuleTraces?: TranslitTraceSubItem[];
}

/**
 * The transliteration result.
 */
export interface TranslitResult {
    /**
     * The output text.
     */
    outputText: string;
    /**
     * The value will be `true` if source text is converted.
     */
    replaced?: boolean;
    /**
     * Conversion duration in miliseconds.
     */
    duration?: number;
    /**
     * Array of transliterate trace information for debugging.
     */
    traces?: TranslitTraceItem[];
}

/**
 * @license
 * Copyright DagonMetric. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found under the LICENSE file in the root directory of this source tree.
 */

// tslint:disable: no-reserved-keywords

/**
 * The transliteration trace sub Item.
 */
export interface TranslitTraceSubItem {
    /**
     * The 'from' text of rule item.
     */
    from: string;
    /**
     * The 'from' (parsed) of rule item.
     */
    parsedFrom: string;
    /**
     * The 'to' text of rule item.
     */
    to?: string;
    /**
     * The 'to' (parsed) of rule item.
     */
    parsedTo?: string;
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
     * The 'from' text of rule item.
     */
    from: string;
    /**
     * The 'from' (parsed) of rule item.
     */
    parsedFrom: string;
    /**
     * The 'to' text of rule item.
     */
    to?: string;
    /**
     * The 'to' (parsed) of rule item.
     */
    parsedTo?: string;
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
     * The previous left part string checking.
     */
    left?: string;
    /**
     * The 'left' (parsed) of rule item.
     */
    parsedLeft?: string;
    /**
     * Trace information for post rule items.
     */
    postRuleTraces?: TranslitTraceSubItem[];
}

/**
 * The transliteration result.
 */
export interface TranslitResult {
    /**
     * The converted output text.
     */
    outputText: string;
    /**
     * The value will be 'true' if source text is converted or replaced.
     */
    replaced?: boolean;
    /**
     * Transliteration duration in miliseconds.
     */
    duration?: number;
    /**
     * Transliteration information for debugging.
     */
    traces?: TranslitTraceItem[];
}

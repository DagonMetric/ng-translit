/**
 * @license
 * Copyright DagonMetric. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found under the LICENSE file in the root directory of this source tree.
 */

// tslint:disable: no-reserved-keywords

/**
 * The transliteration trace information.
 */
export interface TranslitTraceInfo {
    /**
     * The description of applied rule item information.
     */
    description: string;
    /**
     * The 'from' text of rule item.
     */
    from: string;
    /**
     * The 'to' text of rule item.
     */
    to?: string;
    /**
     * The matched string.
     */
    matchedString: string;
    /**
     * The previous string.
     */
    previousString: string;
    /**
     * The replaced new string.
     */
    newString: string;
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
    traces?: TranslitTraceInfo[];
}

/**
 * @license
 * Copyright DagonMetric. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found under the LICENSE file in the root directory of this source tree.
 */

// tslint:disable: no-reserved-keywords

/**
 * Transliterate sub-rule item.
 * @additionalProperties false
 */
export interface TranslitSubRuleItem {
    /**
     * Description for the rule item.
     */
    description?: string;
    /**
     * Regular expression pattern for input string searching.
     * @minLength 1
     */
    from: string;
    /**
     * The value to replace the matched string.
     */
    to: string;
    /**
     * Start index for searching.
     * @minimum 0
     */
    start?: number;
    /**
     * Array of [char, index] for quick checking.
     */
    quickTests?: [string, number][];
    /**
     * Apply the rule only if 'when' options and user options are met.
     */
    when?: { [option: string]: boolean | string };
    /**
     * Group code for grouping 'OR' items.
     */
    orGroup?: string;
}

/**
 * Transliterate rule item.
 * @additionalProperties false
 */
export interface TranslitRuleItem {
    /**
     * Description for the rule item.
     */
    description?: string;
    /**
     * Regular expression pattern for input string searching.
     * @minLength 1
     */
    from: string;
    /**
     * The value to replace the matched string.
     */
    to?: string;
    /**
     * If true, only match and replace on the start of string.
     */
    matchOnStart?: boolean;
    /**
     * Minimum input string length for quick checking.
     * @minimum 1
     */
    minLength?: number;
    /**
     * Array of [char, index] for quick checking.
     */
    quickTests?: [string, number][];
    /**
     * Regular expression pattern for checking previous left part string.
     */
    left?: string;
    /**
     * Apply the rule only if 'when' options and user options are met.
     */
    when?: { [option: string]: boolean | string };
    /**
     * Sub-rule items to be processed after replaced.
     * @minItems 1
     */
    postRules?: TranslitSubRuleItem[];
    /**
     * The `orGroup` and `start` index for `postRules` items.
     */
    postRulesStart?: { [orGroup: string]: number };
    /**
     * The name defined in `postRulesDef`.
     */
    postRulesRef?: string;
}

/**
 * Transliterate rule phase.
 * @additionalProperties false
 */
export interface TranslitRulePhase {
    /**
     * Array of Transliterate rule items.
     * @minItems 1
     */
    rules: TranslitRuleItem[];
    /**
     * Description for the rule phase.
     */
    description?: string;
    /**
     * Phase level template variables definition.
     */
    tplVar?: { [key: string]: string };
    /**
     * Template loop/sequence variables definition.
     */
    tplSeq?: { [key: string]: [string, string, number][] };
    /**
     * Post rules definitions to be used for `postRulesRef`.
     */
    postRulesDef?: { [key: string]: TranslitSubRuleItem[] };
}

/**
 * Transliterate rule.
 * @additionalProperties false
 */
export interface TranslitRule {
    /**
     * Link to schema file.
     */
    $schema?: string;
    /**
     * Description for the rule.
     */
    description?: string;
    /**
     * The version for the rule.
     */
    version?: string;
    /**
     * Global template variables definition.
     */
    tplVar?: { [key: string]: string };
    /**
     * Transliterate rule phases.
     * @minItems 1
     */
    phases: TranslitRulePhase[];
}

/**
 * Transliterate rule phases.
 * @minItems 1
 */
export type TranslitRulePhases = TranslitRulePhase[];

/**
 * Transliterate rule items.
 * @minItems 1
 */
export type TranslitRuleItems = TranslitRuleItem[];

export type TranslitRuleAny = TranslitRule | TranslitRulePhases | TranslitRuleItems;

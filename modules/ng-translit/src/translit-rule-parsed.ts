/**
 * @license
 * Copyright DagonMetric. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found under the LICENSE file in the root directory of this source tree.
 */

import { TranslitRule, TranslitRuleItem, TranslitRulePhase, TranslitSubRuleItem } from './translit-rule';

export interface TranslitSubRuleItemParsed extends TranslitSubRuleItem {
    index: number;
    parsedFrom: string;
    fromRegExp: RegExp;
    parsedTo: string;
    tplSeqName?: string;
    firstSeq?: boolean;
    totalSeqCount?: number;
    seqIndex?: number;
}

export interface TranslitRuleItemParsed extends TranslitRuleItem {
    index: number;
    parsedFrom: string;
    fromRegExp: RegExp;
    parsedTo?: string;
    tplSeqName?: string;
    firstSeq?: boolean;
    totalSeqCount?: number;
    seqIndex?: number;
    seqQuickTests?: [string, number][];
    parsedLeft?: string;
    leftRegExp?: RegExp;
    parsedRight?: string;
    rightRegExp?: RegExp;
    parsedPostRules?: TranslitSubRuleItemParsed[];
}

export interface TranslitRulePhaseParsed extends TranslitRulePhase {
    index: number;
    rules: TranslitRuleItemParsed[];
}

export interface TranslitRuleParsed extends TranslitRule {
    phases: TranslitRulePhaseParsed[];
}

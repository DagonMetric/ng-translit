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
    fromRegExp: RegExp;
    tplSeqName?: string;
    firstSeq?: boolean;
    totalSeqCount?: number;
    seqIndex?: number;
    seqQuickTests?: [string, number][];
}

export interface TranslitRuleItemParsed extends TranslitRuleItem {
    index: number;
    fromRegExp: RegExp;
    tplSeqName?: string;
    firstSeq?: boolean;
    totalSeqCount?: number;
    seqIndex?: number;
    seqQuickTests?: [string, number][];
    postRules?: TranslitSubRuleItemParsed[];
}

export interface TranslitRulePhaseParsed extends TranslitRulePhase {
    index: number;
    rules: TranslitRuleItemParsed[];
}

export interface TranslitRuleParsed extends TranslitRule {
    phases: TranslitRulePhaseParsed[];
}

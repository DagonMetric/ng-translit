/**
 * @license
 * Copyright DagonMetric. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found under the LICENSE file in the root directory of this source tree.
 */

import { Injectable } from '@angular/core';

import { TranslitRuleParsed } from './translit-rule-parsed';

/**
 * The singleton service for sharing cached rules.
 */
@Injectable({
    providedIn: 'root'
})
export class TranslitRuleStore {
    private readonly _cachedRules: Map<string, TranslitRuleParsed> = new Map<string, TranslitRuleParsed>();

    get cachedRules(): Map<string, TranslitRuleParsed> {
        return this._cachedRules;
    }
}

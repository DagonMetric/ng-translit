/**
 * @license
 * Copyright DagonMetric. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found under the LICENSE file in the root directory of this source tree.
 */

import { InjectionToken } from '@angular/core';

import { TranslitRuleLoader } from './translit-rule-loader';

export const TRANSLIT_RULE_LOADER = new InjectionToken<TranslitRuleLoader>('TranslitRuleLoader');

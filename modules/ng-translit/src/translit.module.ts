/**
 * @license
 * Copyright DagonMetric. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found under the LICENSE file in the root directory of this source tree.
 */

import { ModuleWithProviders, NgModule } from '@angular/core';

import { TranslitRuleStore } from './translit-rule-store';
import { TRANSLIT_OPTIONS, TranslitOptions, TranslitService } from './translit.service';

/**
 * The transliteration `NGMODULE` for providing `TranslitService`.
 */
@NgModule({
    providers: [TranslitRuleStore, TranslitService]
})
export class TranslitModule {
    /**
     * Provides options for configuring the `TranslitModule`.
     * @param options An object of configuration options of type `TranslitOptions`.
     */
    static withOptions(options: TranslitOptions): ModuleWithProviders<TranslitModule> {
        return {
            ngModule: TranslitModule,
            providers: [{ provide: TRANSLIT_OPTIONS, useValue: options }]
        };
    }
}

/**
 * @license
 * Copyright DagonMetric. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found under the LICENSE file in the root directory of this source tree.
 */

import { ModuleWithProviders, NgModule } from '@angular/core';

import { TRANSLIT_RULE_LOADER } from '@dagonmetric/ng-translit';

import { HTTP_TRANSLIT_RULE_LOADER_OPTIONS, HttpTranslitRuleLoader, HttpTranslitRuleLoaderOptions } from './http-translit-rule-loader';

/**
 * The NGMODULE for providing `HttpTranslitRuleLoader`.
 */
@NgModule({
    providers: [
        {
            provide: TRANSLIT_RULE_LOADER,
            useClass: HttpTranslitRuleLoader
        }
    ]
})
export class HttpTranslitRuleLoaderModule {
    /**
     * Call this method to provide options for configuring the `HttpTranslitRuleLoader`.
     * @param options An object of configuration options of type `HttpTranslitRuleLoaderOptions`.
     */
    static withOptions(options: HttpTranslitRuleLoaderOptions): ModuleWithProviders<HttpTranslitRuleLoaderModule> {
        return {
            ngModule: HttpTranslitRuleLoaderModule,
            providers: [
                {
                    provide: HTTP_TRANSLIT_RULE_LOADER_OPTIONS,
                    useValue: options
                }
            ],
        };
    }
}

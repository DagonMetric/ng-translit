/**
 * @license
 * Copyright DagonMetric. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found under the LICENSE file in the root directory of this source tree.
 */

import { HttpClient } from '@angular/common/http';
import { Inject, Injectable, InjectionToken, Injector, Optional } from '@angular/core';

import { Observable } from 'rxjs';

import { TranslitRuleAny, TranslitRuleLoader } from '@dagonmetric/ng-translit';

/**
 * The options for `HttpTranslitRuleLoader`.
 */
export interface HttpTranslitRuleLoaderOptions {
    /**
     * The base url string or InjectionToken.
     */
    baseUrl?: string | InjectionToken<string>;
    /**
     * The endpoint factory function.
     */
    endpointFactory?(baseUrl: string, ruleName: string): string;
}

export const HTTP_TRANSLIT_RULE_LOADER_OPTIONS = new InjectionToken<HttpTranslitRuleLoaderOptions>('HttpTranslitRuleLoaderOptions');

/**
 * Implements an HTTP client API for `TranslitRuleLoader` that relies on the Angular `HttpClient`.
 */
@Injectable()
export class HttpTranslitRuleLoader implements TranslitRuleLoader {
    private readonly _baseUrl: string;
    private readonly _endpointFactory: (baseUrl: string, ruleName: string) => string;

    get baseUrl(): string {
        return this._baseUrl;
    }

    constructor(
        private readonly _httpClient: HttpClient,
        injector: Injector,
        @Optional() @Inject(HTTP_TRANSLIT_RULE_LOADER_OPTIONS) options?: HttpTranslitRuleLoaderOptions) {
        if (options && options.baseUrl) {
            if (typeof options.baseUrl === 'string') {
                this._baseUrl = options.baseUrl;
            } else {
                this._baseUrl = injector.get(options.baseUrl);
            }

            if (!this._baseUrl.endsWith('/')) {
                this._baseUrl += '/';
            }
        } else {
            this._baseUrl = '/assets/translit-rules/';
        }

        if (options && options.endpointFactory) {
            this._endpointFactory = options.endpointFactory;
        } else {
            this._endpointFactory = (baseUrl, ruleName) => {
                return `${baseUrl}${ruleName}.json`;
            };
        }
    }

    getEndpoint(ruleName: string): string {
        return this._endpointFactory(this._baseUrl, ruleName);
    }

    load(ruleName: string): Observable<TranslitRuleAny> {
        const endpoint = this.getEndpoint(ruleName);

        return this._httpClient
            .get<TranslitRuleAny>(endpoint);
    }
}

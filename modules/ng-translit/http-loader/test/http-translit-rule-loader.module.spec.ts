// tslint:disable: no-floating-promises

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { InjectionToken } from '@angular/core';

import { TestBed } from '@angular/core/testing';

import { TRANSLIT_RULE_LOADER } from '../../src';

import { HttpTranslitRuleLoader } from '../src/http-translit-rule-loader';
import { HttpTranslitRuleLoaderModule } from '../src/http-translit-rule-loader.module';

describe('HttpTranslitRuleLoaderModule', () => {
    it("should create 'HttpTranslitRuleLoader'", () => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule, HttpTranslitRuleLoaderModule]
        });

        const httpTranslitRuleLoader = TestBed.inject<HttpTranslitRuleLoader>(TRANSLIT_RULE_LOADER);
        void expect(httpTranslitRuleLoader).toBeDefined();
        void expect(httpTranslitRuleLoader instanceof HttpTranslitRuleLoader).toBeTruthy();
    });
});

describe('HttpTranslitRuleLoaderModule#withOptions', () => {
    it("should work with 'baseUrl' string value", () => {
        TestBed.configureTestingModule({
            imports: [
                HttpClientTestingModule,
                HttpTranslitRuleLoaderModule.withOptions({
                    baseUrl: '/mock/rules'
                })
            ]
        });

        const httpTranslitRuleLoader = TestBed.inject<HttpTranslitRuleLoader>(TRANSLIT_RULE_LOADER);
        void expect(httpTranslitRuleLoader.baseUrl).toBe('/mock/rules/');
    });

    it("should work with 'baseUrl' injection token value", () => {
        const BASE_URL = new InjectionToken<string>('BASE_URL');

        TestBed.configureTestingModule({
            imports: [
                HttpClientTestingModule,
                HttpTranslitRuleLoaderModule.withOptions({
                    baseUrl: BASE_URL
                })
            ],
            providers: [
                {
                    provide: BASE_URL,
                    useValue: '/mock/rules/'
                }
            ]
        });

        const httpTranslitRuleLoader = TestBed.inject<HttpTranslitRuleLoader>(TRANSLIT_RULE_LOADER);
        void expect(httpTranslitRuleLoader.baseUrl).toBe('/mock/rules/');
    });

    it("should work with 'endpointFactory' value", () => {
        const endpointFactory = (baseUrl: string, ruleName: string) => {
            return `${baseUrl}${ruleName}.json`;
        };

        TestBed.configureTestingModule({
            imports: [
                HttpClientTestingModule,
                HttpTranslitRuleLoaderModule.withOptions({
                    baseUrl: '/',
                    endpointFactory
                })
            ]
        });

        const httpTranslitRuleLoader = TestBed.inject<HttpTranslitRuleLoader>(TRANSLIT_RULE_LOADER);
        void expect(httpTranslitRuleLoader.getEndpoint('mock-rule')).toBe('/mock-rule.json');
    });
});

import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { of } from 'rxjs';

import { TestBed, getTestBed, inject } from '@angular/core/testing';

import { TranslitRule } from '../../src';

import { HttpTranslitRuleLoader } from '../src/http-translit-rule-loader';

describe('HttpTranslitRuleLoader', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [HttpTranslitRuleLoader]
        });
    });

    it('should be created', () => {
        const httpTranslitRuleLoader = TestBed.inject<HttpTranslitRuleLoader>(HttpTranslitRuleLoader);
        void expect(httpTranslitRuleLoader).toBeDefined();
        void expect(httpTranslitRuleLoader instanceof HttpTranslitRuleLoader).toBeTruthy();
    });
});

describe('HttpTranslitRuleLoader#load', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [HttpTranslitRuleLoader]
        });
    });

    it('should return translit rule response', inject([HttpTestingController], (httpMock: HttpTestingController) => {
        const mockRule: TranslitRule = {
            version: '1',
            description: 'mock rule',
            phases: [
                {
                    rules: [
                        {
                            from: '\u103B([\u1000-\u1021])',
                            to: '$1\u103C'
                        }
                    ]
                },
                {
                    rules: [
                        {
                            from: '\u1039',
                            to: '\u103A'
                        }
                    ]
                }
            ]
        };

        const httpTranslitRuleLoader = getTestBed().get<HttpTranslitRuleLoader>(
            HttpTranslitRuleLoader
        ) as HttpTranslitRuleLoader;
        const ruleName = 'mock-rule';

        httpTranslitRuleLoader.load(ruleName).subscribe((rule: TranslitRule) => {
            void expect(rule).toEqual(mockRule);
            void expect(rule.description).toEqual('mock rule');
            void expect(rule.version).toEqual('1');
            void expect(rule.phases.length).toBe(2);
        });

        const req = httpMock.expectOne(`${httpTranslitRuleLoader.baseUrl}${ruleName}.json`);
        void expect(req.cancelled).toBeFalsy();
        void expect(req.request.method).toBe('GET');
        void expect(req.request.responseType).toEqual('json');
        req.flush(mockRule);
        httpMock.verify();
    }));

    it('should throw an error message when loader returns an error', inject(
        [HttpTestingController],
        (httpMock: HttpTestingController) => {
            const mockRule: TranslitRule = {
                description: 'Error!',
                phases: [
                    {
                        rules: [
                            {
                                from: '\u1040',
                                to: '\u1030'
                            }
                        ]
                    }
                ]
            };

            const httpTranslitRuleLoader = getTestBed().get<HttpTranslitRuleLoader>(
                HttpTranslitRuleLoader
            ) as HttpTranslitRuleLoader;
            const ruleName = 'error-rule';

            httpTranslitRuleLoader.load(ruleName).subscribe({
                // eslint-disable-next-line prefer-arrow/prefer-arrow-functions
                error(actualError: Error): void {
                    void expect(of(actualError)).toBeTruthy();
                    void expect(actualError).not.toBeNull();
                    void expect(actualError).not.toBeUndefined();
                }
            });

            const req = httpMock.expectOne(`${httpTranslitRuleLoader.baseUrl}${ruleName}.json`);
            void expect(req.request.method).toBe('GET');

            req.flush(mockRule, { status: 500, statusText: 'Server Error' });
            httpMock.verify();
        }
    ));
});

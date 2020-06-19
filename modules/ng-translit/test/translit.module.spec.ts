// tslint:disable: no-floating-promises

import { Injectable } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { Observable, of } from 'rxjs';

import {
    TRANSLIT_RULE_LOADER,
    TranslitModule,
    TranslitRuleAny,
    TranslitRuleLoader,
    TranslitRulePhase,
    TranslitService,
    TranslitTraceItem
} from '../src';
import { TranslitRuleStore } from '../src/translit-rule-store';

/**
 * The FakeTranslitRuleLoader.
 */
@Injectable()
export class FakeTranslitRuleLoader implements TranslitRuleLoader {
    load(): Observable<TranslitRuleAny> {
        return of([
            {
                from: '\u103F',
                to: '\u108A'
            }
        ]);
    }
}

describe('TranslitModule', () => {
    it("should provide 'TranslitService'", () => {
        TestBed.configureTestingModule({
            imports: [TranslitModule]
        });

        const translitService = TestBed.inject<TranslitService>(TranslitService);

        void expect(translitService).toBeDefined();
        void expect(translitService instanceof TranslitService).toBeTruthy();
    });
});

describe('TranslitModule#withOptions', () => {
    it("should not use cache rules when 'shareCachedRules' is 'false' ", (done: DoneFn) => {
        TestBed.configureTestingModule({
            imports: [
                TranslitModule.withOptions({
                    shareCachedRules: false
                })
            ],
            providers: [
                {
                    provide: TRANSLIT_RULE_LOADER,
                    useClass: FakeTranslitRuleLoader
                }
            ]
        });

        const translitService = TestBed.inject<TranslitService>(TranslitService);
        const translitRuleStore = TestBed.inject<TranslitRuleStore>(TranslitRuleStore);

        translitService.loadRule('rule1').subscribe((ruleAny) => {
            void expect(ruleAny).toBeDefined();
            void expect(translitRuleStore.cachedRules.size).toBe(0);
            done();
        });
    });

    it("should use cache rules when 'shareCachedRules' is 'true' ", (done: DoneFn) => {
        TestBed.configureTestingModule({
            imports: [TranslitModule.withOptions({})],
            providers: [
                {
                    provide: TRANSLIT_RULE_LOADER,
                    useClass: FakeTranslitRuleLoader
                }
            ]
        });

        const translitService = TestBed.inject<TranslitService>(TranslitService);
        const translitRuleStore = TestBed.inject<TranslitRuleStore>(TranslitRuleStore);

        translitService.loadRule('rule1').subscribe((ruleAny) => {
            void expect(ruleAny).toBeDefined();
            void expect(translitRuleStore.cachedRules.size).toBe(1);
            done();
        });
    });

    it("should include traces when 'trace' is 'true' ", (done: DoneFn) => {
        TestBed.configureTestingModule({
            imports: [
                TranslitModule.withOptions({
                    trace: true
                })
            ]
        });

        const testRules: TranslitRulePhase[] = [
            {
                rules: [
                    {
                        from: '\u1086',
                        to: '\u103F'
                    }
                ]
            }
        ];

        const translitService = TestBed.inject<TranslitService>(TranslitService);

        translitService
            .translit('\u101E\u1030\u101B\u1086\u1010\u102E', 'test', testRules, undefined, true)
            .subscribe((result) => {
                const traces = result.traces as TranslitTraceItem[];
                void expect(traces[0].from).toBe('\u1086');
                void expect(traces[0].to).toBe('\u103F');
                void expect(traces[0].inputString).toBe('\u1086\u1010\u102E');
                void expect(traces[0].matchedString).toBe('\u1086');
                void expect(traces[0].replacedString).toBe('\u103F');
                done();
            });
    });
});

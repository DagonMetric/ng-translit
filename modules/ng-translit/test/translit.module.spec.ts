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
    TranslitTraceInfo
} from '../src';
import { TranslitRuleStore } from '../src/translit-rule-store';

/**
 * The FakeTranslitRuleLoader.
 */
@Injectable()
export class FakeTranslitRuleLoader implements TranslitRuleLoader {
    load(): Observable<TranslitRuleAny> {
        return of([{
            from: '\u103F',
            to: '\u108A'
        }]);
    }
}

describe('TranslitModule', () => {
    it("should provide 'TranslitService'", () => {
        TestBed.configureTestingModule({
            imports: [
                TranslitModule
            ]
        });

        const translitService = TestBed.get<TranslitService>(TranslitService);

        expect(translitService).toBeDefined();
        expect(translitService instanceof TranslitService).toBeTruthy();
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

        const translitService = TestBed.get<TranslitService>(TranslitService) as TranslitService;
        const translitRuleStore = TestBed.get<TranslitRuleStore>(TranslitRuleStore) as TranslitRuleStore;

        translitService.loadRule('rule1').subscribe(ruleAny => {
            expect(ruleAny).toBeDefined();
            expect(translitRuleStore.cachedRules.size).toBe(0);
            done();
        });
    });

    it("should use cache rules when 'shareCachedRules' is 'true' ", (done: DoneFn) => {
        TestBed.configureTestingModule({
            imports: [
                TranslitModule.withOptions({})
            ],
            providers: [
                {
                    provide: TRANSLIT_RULE_LOADER,
                    useClass: FakeTranslitRuleLoader
                }
            ]
        });

        const translitService = TestBed.get<TranslitService>(TranslitService) as TranslitService;
        const translitRuleStore = TestBed.get<TranslitRuleStore>(TranslitRuleStore) as TranslitRuleStore;

        translitService.loadRule('rule1').subscribe(ruleAny => {
            expect(ruleAny).toBeDefined();
            expect(translitRuleStore.cachedRules.size).toBe(1);
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

        const testRules: TranslitRulePhase[] = [{
            rules: [{
                from: '\u1086',
                to: '\u103F'
            }]
        }];

        const translitService = TestBed.get<TranslitService>(TranslitService) as TranslitService;

        translitService.translit('\u101E\u1030\u101B\u1086\u1010\u102E', 'test', testRules, undefined, true)
            .subscribe(result => {
                const traces = result.traces as TranslitTraceInfo[];
                expect(traces[0].description).toBe('Phase: 1, rule: 1');
                expect(traces[0].from).toBe('\u1086');
                expect(traces[0].to).toBe('\u103F');
                expect(traces[0].matchedString).toBe('\u1086');
                expect(traces[0].previousString).toBe('\u101E\u1030\u101B\u1086\u1010\u102E');
                expect(traces[0].newString).toBe('\u101E\u1030\u101B\u103F\u1010\u102E');
                done();
            });
    });
});

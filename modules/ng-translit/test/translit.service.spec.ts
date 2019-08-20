// tslint:disable: no-floating-promises

import { Injectable } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';

import {
    TRANSLIT_RULE_LOADER,
    TranslitResult,
    TranslitRule,
    TranslitRuleAny,
    TranslitRuleItem,
    TranslitRuleLoader,
    TranslitRulePhase,
    TranslitService,
    TranslitTraceItem
} from '../src';

export function formatCodePoints(str?: string): string {
    if (str == null) {
        return '';
    }

    const cpArray: string[] = [];
    for (const c of str) {
        const cp = c.codePointAt(0);
        if (cp != null && /[\u1000-\u109F\uAA60-\uAA7F\uA9E0-\uA9FF]/.test(c)) {
            cpArray.push(`\\u${cp.toString(16)}`);
        } else if (/[\b\f\n\r\t\v]/.test(c)) {
            if (c === '\n') {
                cpArray.push('\\n');
            } else if (c === '\r') {
                cpArray.push('\\r');
            } else if (c === '\t') {
                cpArray.push('\\t');
            } else if (c === '\f') {
                cpArray.push('\\f');
            } else if (c === '\v') {
                cpArray.push('\\v');
            } else if (c === '\b') {
                cpArray.push('\\b');
            }
        } else {
            cpArray.push(`${c}`);
        }
    }

    return cpArray.join('');
}

export function toFailOutput(result: TranslitResult): string {
    let str = `\noutput: ${formatCodePoints(result.outputText)}\n\n`;

    if (result.traces) {
        for (const trace of result.traces) {
            str += `from: ${formatCodePoints(trace.from)}\n`;
            str += `to: ${formatCodePoints(trace.to)}\n`;
            str += `input: ${formatCodePoints(trace.inputString)}\n`;
            // str += `matched: ${formatCodePoints(trace.matchedString)}\n`;
            str += `replaced: ${formatCodePoints(trace.replacedString)}\n`;

            if (trace.postRuleTraces && trace.postRuleTraces.length > 0) {
                str += 'post rules:\n';
                for (const subTrace of trace.postRuleTraces) {
                    str += `  from: ${formatCodePoints(subTrace.from)}\n`;
                    str += `  to: ${formatCodePoints(subTrace.to)}\n`;
                    str += `  input: ${formatCodePoints(subTrace.inputString)}\n`;
                    // str += `  matched: ${formatCodePoints(subTrace.matchedString)}\n`;
                    str += `  replaced: ${formatCodePoints(subTrace.replacedString)}\n`;
                }
            }
            str += '\n';
        }
    }

    return str;
}

/**
 * The FakeTranslitRuleLoader.
 */
@Injectable()
export class FakeTranslitRuleLoader implements TranslitRuleLoader {
    private _counter = 0;

    private readonly _rule1 = {
        description: 'rule1',
        version: '0',
        phases: [
            {
                rules: [{
                    from: 'f0',
                    to: 't0'
                }, {
                    from: '\u103B([\u1000-\u1021])',
                    to: '$1\u103C'
                },
                {
                    from: '\u1039',
                    to: '\u103A'
                }]
            }
        ]
    };

    private readonly _invalidRule = {
        description: 'invalidRule'
    };

    load(ruleName: string): Observable<TranslitRuleAny> {
        this._counter++;

        if (ruleName === 'loaderError') {
            return throwError('loaderError');
        } if (ruleName === 'invalidRule') {
            return of(this._invalidRule as TranslitRuleAny);
        } else {
            this._rule1.version = `${this._counter}`;
            this._rule1.phases[0].rules[0].from = `f${this._counter}`;
            this._rule1.phases[0].rules[0].to = `t${this._counter}`;

            return of(this._rule1).pipe(
                delay(50)
            );
        }
    }
}

describe('TranslitService', () => {
    it('should be created', () => {
        TestBed.configureTestingModule({
            providers: [
                TranslitService
            ]
        });

        const translitService = TestBed.get<TranslitService>(TranslitService);

        expect(translitService).toBeDefined();
        expect(translitService instanceof TranslitService).toBeTruthy();
    });
});

describe('TranslitService#loadRule', () => {
    it("should work if 'TranslitRuleLoader' is provided", (done: DoneFn) => {
        TestBed.configureTestingModule({
            providers: [
                TranslitService,
                {
                    provide: TRANSLIT_RULE_LOADER,
                    useClass: FakeTranslitRuleLoader
                }
            ]
        });

        const translitService = TestBed.get<TranslitService>(TranslitService) as TranslitService;

        translitService.loadRule('rule1').subscribe(rule => {
            expect(rule.description).toBe('rule1');
            expect(rule.version).toBe('1');
            expect(rule.phases).toBeDefined();
            expect(rule.phases[0].rules).toBeDefined();
            expect(rule.phases[0].rules[0].from).toBe('f1');
            expect(rule.phases[0].rules[0].to).toBe('t1');
            done();
        });
    });

    it("should return cached rule if 'refresh' is 'false'", (done: DoneFn) => {
        TestBed.configureTestingModule({
            providers: [
                TranslitService,
                {
                    provide: TRANSLIT_RULE_LOADER,
                    useClass: FakeTranslitRuleLoader
                }
            ]
        });

        const translitService = TestBed.get<TranslitService>(TranslitService) as TranslitService;

        for (let i = 0; i < 10; i++) {
            translitService.loadRule('rule1', false);
        }

        translitService.loadRule('rule1', false).subscribe(rule => {
            expect(rule.version).toBe('1');
            done();
        });
    });

    it("should reload the rule if 'refresh' is 'true'", (done: DoneFn) => {
        TestBed.configureTestingModule({
            providers: [
                TranslitService,
                {
                    provide: TRANSLIT_RULE_LOADER,
                    useClass: FakeTranslitRuleLoader
                }
            ]
        });

        const translitService = TestBed.get<TranslitService>(TranslitService) as TranslitService;

        for (let i = 0; i < 4; i++) {
            translitService.loadRule('rule1', true);
        }

        translitService.loadRule('rule1', true).subscribe(rule => {
            expect(rule.version).toBe('5');
            done();
        });
    });

    it("should throw an error message if no 'TranslitRuleLoader' is provided", () => {
        TestBed.configureTestingModule({
            providers: [
                TranslitService
            ]
        });

        const translitService = TestBed.get<TranslitService>(TranslitService) as TranslitService;

        expect(() => translitService.loadRule('rule1')).toThrowError("The 'TRANSLIT_RULE_LOADER' service must be provided.");
    });

    it('should throw an error message when loader returns an error', (done: DoneFn) => {
        TestBed.configureTestingModule({
            providers: [
                TranslitService,
                {
                    provide: TRANSLIT_RULE_LOADER,
                    useClass: FakeTranslitRuleLoader
                }
            ]
        });

        const translitService = TestBed.get<TranslitService>(TranslitService) as TranslitService;

        translitService.loadRule('loaderError').subscribe({
            error(actualError: Error): void {
                expect(of(actualError)).toBeTruthy();
                expect(actualError).not.toBeNull();
                expect(actualError).not.toBeUndefined();
                done();
            }
        });
    });

    it('should throw an error message when an an invalid rule error occour', (done: DoneFn) => {
        TestBed.configureTestingModule({
            providers: [
                TranslitService,
                {
                    provide: TRANSLIT_RULE_LOADER,
                    useClass: FakeTranslitRuleLoader
                }
            ]
        });

        const translitService = TestBed.get<TranslitService>(TranslitService) as TranslitService;

        translitService.loadRule('invalidRule').subscribe({
            error(actualError: Error): void {
                expect(of(actualError)).toBeTruthy();
                expect(actualError).not.toBeNull();
                expect(actualError).not.toBeUndefined();
                expect(actualError.message || actualError).toBe('Error in parsing translit rule, invalid rule schema.');
                done();
            }
        });
    });
});

describe('TranslitService#translit', () => {
    it("should work with 'TranslitRuleItem[]'", (done: DoneFn) => {
        TestBed.configureTestingModule({
            providers: [
                TranslitService
            ]
        });

        const translitService = TestBed.get<TranslitService>(TranslitService) as TranslitService;

        const testRules: TranslitRuleItem[] = [{
            from: '\u103B([\u1000-\u1021])',
            to: '$1\u103C'
        },
        {
            from: '\u1039',
            to: '\u103A'
        }
        ];

        translitService.translit('\u103B\u1019\u1014\u1039\u1019\u102C\u1005\u102C', undefined, testRules)
            .subscribe(result => {
                expect(result.outputText).toBe('\u1019\u103C\u1014\u103A\u1019\u102C\u1005\u102C', result);
                done();
            });
    });

    it("should work with 'TranslitRulePhase[]'", (done: DoneFn) => {
        TestBed.configureTestingModule({
            providers: [
                TranslitService
            ]
        });

        const translitService = TestBed.get<TranslitService>(TranslitService) as TranslitService;

        const testRules: TranslitRulePhase[] = [{
            rules: [{
                from: '\u103B([\u1000-\u1021])',
                to: '$1\u103C'
            }]
        },
        {
            rules: [{
                from: '\u1039',
                to: '\u103A'
            }]
        }];

        translitService.translit('\u103B\u1019\u1014\u1039\u1019\u102C\u1005\u102C', undefined, testRules)
            .subscribe(result => {
                expect(result.outputText).toBe('\u1019\u103C\u1014\u103A\u1019\u102C\u1005\u102C', result);
                done();
            });
    });

    it("should work with 'TranslitRule'", (done: DoneFn) => {
        TestBed.configureTestingModule({
            providers: [
                TranslitService
            ]
        });

        const translitService = TestBed.get<TranslitService>(TranslitService) as TranslitService;

        const testRule: TranslitRule = {
            phases: [{
                rules: [{
                    from: '\u103B([\u1000-\u1021])',
                    to: '$1\u103C'
                }]
            },
            {
                rules: [{
                    from: '\u1039',
                    to: '\u103A'
                }]
            }]
        };

        translitService.translit('\u103B\u1019\u1014\u1039\u1019\u102C\u1005\u102C', undefined, testRule)
            .subscribe(result => {
                expect(result.outputText).toBe('\u1019\u103C\u1014\u103A\u1019\u102C\u1005\u102C', result);
                done();
            });
    });

    it("should work with 'TranslitRuleLoader'", (done: DoneFn) => {
        TestBed.configureTestingModule({
            providers: [
                TranslitService,
                {
                    provide: TRANSLIT_RULE_LOADER,
                    useClass: FakeTranslitRuleLoader
                }
            ]
        });

        const translitService = TestBed.get<TranslitService>(TranslitService) as TranslitService;

        translitService.translit('\u103B\u1019\u1014\u1039\u1019\u102C\u1005\u102C', 'rule1')
            .subscribe(result => {
                expect(result.outputText).toBe('\u1019\u103C\u1014\u103A\u1019\u102C\u1005\u102C', result);
                done();
            });
    });

    it('should not reload the rule', (done: DoneFn) => {
        TestBed.configureTestingModule({
            providers: [
                TranslitService,
                {
                    provide: TRANSLIT_RULE_LOADER,
                    useClass: FakeTranslitRuleLoader
                }
            ]
        });

        const translitService = TestBed.get<TranslitService>(TranslitService) as TranslitService;

        translitService.loadRule('rule1').subscribe(() => {
            translitService.translit('f1', 'rule1')
                .subscribe(result => {
                    expect(result.outputText).toBe('t1', result);
                    done();
                });
        });
    });

    it("should set 'TranslitResult.replaced' to 'true' if converted", (done: DoneFn) => {
        TestBed.configureTestingModule({
            providers: [
                TranslitService
            ]
        });

        const translitService = TestBed.get<TranslitService>(TranslitService) as TranslitService;

        const testRules: TranslitRulePhase[] = [{
            rules: [{
                from: '\u1086',
                to: '\u103F'
            }]
        }];

        translitService.translit('\u101E\u1030\u101B\u1086\u1010\u102E', 'rule1', testRules)
            .subscribe(result => {
                expect(result.replaced).toBeTruthy();
                done();
            });
    });

    it("should set 'TranslitResult.replaced' to 'false' if not converted", (done: DoneFn) => {
        TestBed.configureTestingModule({
            providers: [
                TranslitService
            ]
        });

        const translitService = TestBed.get<TranslitService>(TranslitService) as TranslitService;

        const testRules: TranslitRulePhase[] = [{
            rules: [{
                from: '\u103F',
                to: '\u1086'
            }]
        }];

        translitService.translit('\u101E\u1030\u101B\u1086\u1010\u102E', 'rule1', testRules)
            .subscribe(result => {
                expect(result.replaced).toBeFalsy();
                done();
            });
    });

    it("should set 'TranslitResult.replaced' to 'false' if 'sourceText' is null", (done: DoneFn) => {
        TestBed.configureTestingModule({
            providers: [
                TranslitService
            ]
        });

        const translitService = TestBed.get<TranslitService>(TranslitService) as TranslitService;

        const testRules: TranslitRulePhase[] = [{
            rules: [{
                from: '\u103F',
                to: '\u1086'
            }]
        }];

        translitService.translit(null as unknown as string, 'rule1', testRules)
            .subscribe(result => {
                expect(result.replaced).toBeFalsy();
                done();
            });
    });

    it("'should set 'TranslitResult.replaced' to 'false' if 'sourceText' is whitespaces or empty", (done: DoneFn) => {
        TestBed.configureTestingModule({
            providers: [
                TranslitService
            ]
        });

        const translitService = TestBed.get<TranslitService>(TranslitService) as TranslitService;

        const testRules: TranslitRulePhase[] = [{
            rules: [{
                from: '\u103F',
                to: '\u1086'
            }]
        }];

        translitService.translit(' ', 'rule1', testRules)
            .subscribe(result => {
                expect(result.replaced).toBeFalsy();
                done();
            });
    });

    it("should set 'TranslitResult.duration' >= 0", (done: DoneFn) => {
        TestBed.configureTestingModule({
            providers: [
                TranslitService
            ]
        });

        const translitService = TestBed.get<TranslitService>(TranslitService) as TranslitService;

        const testRules: TranslitRulePhase[] = [{
            rules: [{
                from: '\u1086',
                to: '\u103F'
            }]
        }];

        translitService.translit('\u101E\u1030\u101B\u1086\u1010\u102E', 'rule1', testRules)
            .subscribe(result => {
                expect(result.duration).toBeGreaterThanOrEqual(0);
                done();
            });
    });

    it("should set 'TranslitResult.traces' undefined by default", (done: DoneFn) => {
        TestBed.configureTestingModule({
            providers: [
                TranslitService
            ]
        });

        const translitService = TestBed.get<TranslitService>(TranslitService) as TranslitService;

        const testRules: TranslitRulePhase[] = [{
            rules: [{
                from: '\u1086',
                to: '\u103F'
            }]
        }];

        translitService.translit('\u101E\u1030\u101B\u1086\u1010\u102E', 'rule1', testRules)
            .subscribe(result => {
                expect(result.traces).toBeUndefined();
                done();
            });
    });

    it("should include 'TranslitResult.traces' if 'trace' is 'true'", (done: DoneFn) => {
        TestBed.configureTestingModule({
            providers: [
                TranslitService
            ]
        });

        const translitService = TestBed.get<TranslitService>(TranslitService) as TranslitService;

        const testRules: TranslitRulePhase[] = [{
            rules: [{
                from: '\u1086',
                to: '\u103F'
            }]
        }];

        translitService.translit('\u101E\u1030\u101B\u1086\u1010\u102E', 'rule1', testRules, undefined, true)
            .subscribe(result => {
                const traces = result.traces as TranslitTraceItem[];
                expect(traces[0].from).toBe('\u1086');
                expect(traces[0].to).toBe('\u103F');
                expect(traces[0].inputString).toBe('\u1086\u1010\u102E');
                expect(traces[0].matchedString).toBe('\u1086');
                expect(traces[0].replacedString).toBe('\u103F');
                done();
            });
    });

    it("should work with phase level 'when' options", (done: DoneFn) => {
        TestBed.configureTestingModule({
            providers: [
                TranslitService
            ]
        });

        const translitService = TestBed.get<TranslitService>(TranslitService) as TranslitService;

        const testRules: TranslitRulePhase[] = [
            {
                when: {
                    flag1: true
                },
                rules: [
                    {
                        from: '\u1040',
                        to: '\u1041'
                    }
                ]
            },
            {
                when: {
                    fixZero: true
                },
                rules: [
                    {
                        from: '\u1040',
                        to: '\u101D'
                    }
                ]
            }
        ];

        translitService.translit('\u1040', 'rule1', testRules, { fixZero: true })
            .subscribe(result => {
                expect(result.outputText).toBe('\u101D', toFailOutput(result));
                done();
            });
    });

    it("should work with phase level 'skip' options", (done: DoneFn) => {
        TestBed.configureTestingModule({
            providers: [
                TranslitService
            ]
        });

        const translitService = TestBed.get<TranslitService>(TranslitService) as TranslitService;

        const testRules: TranslitRulePhase[] = [
            {
                skip: {
                    flag1: true
                },
                rules: [
                    {
                        from: '\u1040',
                        to: '\u1041'
                    }
                ]
            },
            {
                skip: {
                    flag2: true
                },
                rules: [
                    {
                        from: '\u1040',
                        to: '\u101D'
                    }
                ]
            }
        ];

        translitService.translit('\u1040', 'rule1', testRules, { flag1: true })
            .subscribe(result => {
                expect(result.outputText).toBe('\u101D', toFailOutput(result));
                done();
            });
    });

    it("should work with global 'tplVar' rule options", (done: DoneFn) => {
        TestBed.configureTestingModule({
            providers: [
                TranslitService
            ]
        });

        const translitService = TestBed.get<TranslitService>(TranslitService) as TranslitService;

        const testRule: TranslitRule = {
            tplVar: {
                '#v1': '\u1000\u1003\u1006',
                '#v2': '\u100A\u100F\u1010\u1011\u1018\u101A\u101C\u101E\u101F\u1021',
                '#v3': '#v1#v2',
                '#v4': '\u1006',
                '#v5': '\u1066'
            },
            phases: [{
                rules: [{
                    from: '([#v3])\u1039#v4',
                    to: '$1#v5'
                }]
            }]
        };

        translitService.translit('\u1000\u1039\u1006', 'rule1', testRule)
            .subscribe(result => {
                expect(result.outputText).toBe('\u1000\u1066', toFailOutput(result));
                done();
            });
    });

    it("should work with phase level 'tplVar' rule options", (done: DoneFn) => {
        TestBed.configureTestingModule({
            providers: [
                TranslitService
            ]
        });

        const translitService = TestBed.get<TranslitService>(TranslitService) as TranslitService;

        const testRules: TranslitRulePhase[] = [{
            tplVar: {
                '#v1': '\u1000\u1003\u1006',
                '#v2': '\u100A\u100F\u1010\u1011\u1018\u101A\u101C\u101E\u101F\u1021',
                '#v3': '#v1#v2',
                '#v4': '\u1006',
                '#v5': '\u1066'
            },
            rules: [{
                from: '([#v3])\u1039#v4',
                to: '$1#v5'
            }]
        }];

        translitService.translit('\u1000\u1039\u1006', 'rule1', testRules)
            .subscribe(result => {
                expect(result.outputText).toBe('\u1000\u1066', toFailOutput(result));
                done();
            });
    });

    it("should work with global 'tplVar' and phase level 'tplVar' rule options", (done: DoneFn) => {
        TestBed.configureTestingModule({
            providers: [
                TranslitService
            ]
        });

        const translitService = TestBed.get<TranslitService>(TranslitService) as TranslitService;

        const testRule: TranslitRule = {
            tplVar: {
                '#g1': '\u1000\u1003\u1006',
                '#g2': '\u100A\u100F\u1010',
                '#g3': '#g1#g2',
                '#g4': '\u1066',
            },
            phases: [{
                tplVar: {
                    '#v1': '\u1000',
                    '#v2': '\u1003\u1006',
                    '#v3': '#v1#v2',
                    '#g4': '#g4'
                },
                rules: [{
                    from: '([#g3])\u1039[#v3]',
                    to: '$1#g4'
                }]
            }]
        };

        translitService.translit('\u1000\u1039\u1006', 'rule1', testRule)
            .subscribe(result => {
                expect(result.outputText).toBe('\u1000\u1066', toFailOutput(result));
                done();
            });
    });

    it("should work with 'tplSeq' rule options", (done: DoneFn) => {
        TestBed.configureTestingModule({
            providers: [
                TranslitService
            ]
        });

        const translitService = TestBed.get<TranslitService>(TranslitService) as TranslitService;

        const testRules: TranslitRulePhase[] = [{
            tplVar: {
                '#v1': '\u1000\u1003\u1006',
                '#v2': '\u1000-\u102A'
            },
            tplSeq: {
                '#s1': [['\u1006', '\u1066', 1], ['\u1010', '\u1071', 1], ['\u1011', '\u1073', 1], ['\u1018', '\u107B', 1]],
                '#s2': [['\u1000', '\u1060', 4], ['\u1011', '\u1074', 7], ['\u1019', '\u107C', 1], ['\u101C', '\u1085', 1]],
                '#s3': [['\u1064', '', 1]]
            },
            rules: [
                {
                    from: '([#v1])\u1039#s1',
                    to: '$1#s1'
                },
                {
                    from: '([#v2])\u1039#s2',
                    to: '$1#s2'
                },
                {
                    from: '#s3',
                    to: '#s3'
                },
            ]
        }];

        translitService.translit('\u1019\u1039\u1019\u1064', 'rule1', testRules, undefined, true)
            .subscribe(result => {
                expect(result.outputText).toBe('\u1019\u107C', toFailOutput(result));
                done();
            });
    });

    it("should work with 'when' rule options", (done: DoneFn) => {
        TestBed.configureTestingModule({
            providers: [
                TranslitService
            ]
        });

        const translitService = TestBed.get<TranslitService>(TranslitService) as TranslitService;

        const testRules: TranslitRulePhase[] = [{
            tplSeq: {
                '#s1': [['\u1040', '\u0030', 10]],
            },
            rules: [{
                from: '\u1040',
                to: '\u1030',
                when: {
                    flag2: true
                }
            },
            {
                from: '#s1',
                to: '#s1',
                when: {
                    flag2: true
                }
            },
            {
                from: '\u1040',
                to: '\u101D',
                when: {
                    flag1: true
                }
            }]
        }];

        translitService.translit('\u1040', 'rule1', testRules, { flag1: true })
            .subscribe(result => {
                expect(result.outputText).toBe('\u101D', toFailOutput(result));
                done();
            });
    });

    it("should work with 'skip' rule options", (done: DoneFn) => {
        TestBed.configureTestingModule({
            providers: [
                TranslitService
            ]
        });

        const translitService = TestBed.get<TranslitService>(TranslitService) as TranslitService;

        const testRules: TranslitRulePhase[] = [{
            tplSeq: {
                '#s1': [['\u1040', '\u0030', 10]],
            },
            rules: [
                {
                    from: '\u1040',
                    to: '\u1030',
                    skip: {
                        flag1: true
                    }
                },
                {
                    from: '#s1',
                    to: '#s1',
                    skip: {
                        flag1: true
                    }
                },
                {
                    from: '\u1040',
                    to: '\u101D',
                    skip: {
                        flag2: true
                    }
                }
            ]
        }];

        translitService.translit('\u1040', 'rule1', testRules, { flag1: true })
            .subscribe(result => {
                expect(result.outputText).toBe('\u101D', toFailOutput(result));
                done();
            });
    });

    it("should work with 'hasLeft' rule option", (done: DoneFn) => {
        TestBed.configureTestingModule({
            providers: [
                TranslitService
            ]
        });

        const translitService = TestBed.get<TranslitService>(TranslitService) as TranslitService;

        const testRules: TranslitRulePhase[] = [{
            tplSeq: {
                '#s1': [['\u1045', '\u0035', 3]],
            },
            rules: [
                {
                    description: 'Not match',
                    from: '#s1',
                    to: '#s1',
                    hasLeft: true
                },
                {
                    description: 'Not match',
                    from: '\u1041',
                    to: '\u1042',
                    hasLeft: false
                },
                {
                    description: 'Not match',
                    from: '\u1042',
                    to: '\u1043',
                    hasLeft: true
                },
                {
                    from: '\u1040',
                    to: '\u101D',
                    hasLeft: false
                },
                {
                    from: '\u1040\u1040',
                    to: '\u1040',
                    hasLeft: true
                }
            ]
        }];

        translitService.translit('\u1040\u1040\u1040', 'rule1', testRules)
            .subscribe(result => {
                expect(result.outputText).toEqual('\u101D\u1040', toFailOutput(result));
                done();
            });
    });

    it("should work with 'minLength' rule option", (done: DoneFn) => {
        TestBed.configureTestingModule({
            providers: [
                TranslitService
            ]
        });

        const translitService = TestBed.get<TranslitService>(TranslitService) as TranslitService;

        const testRules: TranslitRulePhase[] = [{
            tplSeq: {
                '#s1': [['\u1040', '\u0030', 10]],
            },
            rules: [{
                from: '(\u1040)',
                to: '\u1030',
                minLength: 3
            },
            {
                from: '\u1040',
                to: '\u101D',
                minLength: 2
            },
            {
                from: '#s1',
                to: '#s1',
                minLength: 4
            }]
        }];

        translitService.translit('\u1040\u1040', 'rule1', testRules)
            .subscribe(result => {
                expect(result.outputText).toBe('\u101D\u1040', toFailOutput(result));
                done();
            });
    });

    it("should work with match only rule (no 'to' provided)", (done: DoneFn) => {
        TestBed.configureTestingModule({
            providers: [
                TranslitService
            ]
        });

        const translitService = TestBed.get<TranslitService>(TranslitService) as TranslitService;

        const testRules: TranslitRulePhase[] = [{
            rules: [{
                from: '\u1040\u1040'
            },
            {
                from: '\u1040',
                to: '\u101D',
            }]
        }];

        translitService.translit('\u1040\u1040\u1040', 'rule1', testRules)
            .subscribe(result => {
                expect(result.outputText).toBe('\u1040\u1040\u101D', toFailOutput(result));
                done();
            });
    });

    it("should work with 'left' rule options", (done: DoneFn) => {
        TestBed.configureTestingModule({
            providers: [
                TranslitService
            ]
        });

        const translitService = TestBed.get<TranslitService>(TranslitService) as TranslitService;

        const testRules: TranslitRulePhase[] = [{
            rules: [
                {
                    from: '\u103D',
                    to: '\u103C'
                },
                {
                    description: 'skip rule',
                    from: '([\u1000-\u1021])\u1037',
                    to: '$1\u1037',
                    left: '[\u1000-\u1005]'
                },
                {
                    from: '\u1037',
                    to: '\u1095',
                    left: '\u103C'
                }
            ]
        }];

        translitService.translit(
            '\u1006\u103D\u1037',
            'rule1',
            testRules)
            .subscribe(result => {
                expect(result.outputText).toBe('\u1006\u103c\u1095', toFailOutput(result));
                done();
            });
    });

    it("should work with 'left' with 'tplSeq'", (done: DoneFn) => {
        TestBed.configureTestingModule({
            providers: [
                TranslitService
            ]
        });

        const translitService = TestBed.get<TranslitService>(TranslitService) as TranslitService;

        const testRules: TranslitRulePhase[] = [{
            tplVar: {
                '#c': '\u1000-\u1001'
            },
            tplSeq: {
                '#px': [
                    ['\u1000', '\u1060', 1],
                    ['\u1001', '\u1061', 1]
                ]
            },
            rules: [
                {
                    description: 'Not match',
                    from: '\u1039#px',
                    to: '\u1039#px',
                    left: '\u1005'
                },
                {
                    from: '\u1039#px',
                    to: '#px',
                    left: '[#c]'
                }
            ]
        }];

        translitService.translit('\u1000\u1039\u1000', 'rule1', testRules)
            .subscribe(result => {
                expect(result.outputText).toBe('\u1000\u1060', toFailOutput(result));
                done();
            });
    });

    it("should work with 'right' rule options", (done: DoneFn) => {
        TestBed.configureTestingModule({
            providers: [
                TranslitService
            ]
        });

        const translitService = TestBed.get<TranslitService>(TranslitService) as TranslitService;

        const testRules: TranslitRulePhase[] = [{
            rules: [
                {
                    description: 'Should skip',
                    from: '\u1040',
                    to: '\u1030',
                    right: '\u1040'
                },
                {
                    from: '\u1040',
                    to: '\u101D',
                    right: '\u101D'
                },
                {
                    description: 'Should skip',
                    from: '\u101D',
                    to: '\u1040',
                    right: '\u1040'
                },
            ]
        }];

        translitService.translit(
            '\u1040\u101D',
            'rule1',
            testRules)
            .subscribe(result => {
                expect(result.outputText).toBe('\u101D\u101D', toFailOutput(result));
                done();
            });
    });

    it("should work with 'right' with 'tplSeq'", (done: DoneFn) => {
        TestBed.configureTestingModule({
            providers: [
                TranslitService
            ]
        });

        const translitService = TestBed.get<TranslitService>(TranslitService) as TranslitService;

        const testRules: TranslitRulePhase[] = [{
            tplVar: {
                '#a': '\u102F\u1030\u1037'
            },
            tplSeq: {
                '@x': [
                    ['\u102D', '\u102D', 2]
                ],
                '@x2': [
                    ['\u102F', '\u1033', 2]
                ]
            },
            rules: [
                {
                    description: 'Should skip',
                    from: '\u1040@x',
                    to: '\u1030@x',
                    right: '\u1040'
                },
                {
                    from: '\u1040@x',
                    to: '\u101D@x',
                    right: '[#a]'
                },
                {
                    description: 'Should skip',
                    from: '@x2',
                    to: '@x2',
                    right: '[\u1000-\u1021]'
                }
            ]
        }];

        translitService.translit('\u1040\u102D\u102F', 'rule1', testRules)
            .subscribe(result => {
                expect(result.outputText).toBe('\u101D\u102D\u102F', toFailOutput(result));
                done();
            });
    });

    it("should work with 'quickTests' rule options", (done: DoneFn) => {
        TestBed.configureTestingModule({
            providers: [
                TranslitService
            ]
        });

        const translitService = TestBed.get<TranslitService>(TranslitService) as TranslitService;

        const testRules: TranslitRulePhase[] = [{
            rules: [{
                from: '\u1084(\u1000)\u1060',
                to: '$1',
                quickTests: [['\u1060', 1]]
            },
            {
                from: '\u1084(\u1000)\u1060',
                to: '$1\u1039$1\u103C',
                quickTests: [['\u1060', 2]]
            }]
        }];

        translitService.translit('\u1084\u1000\u1060', 'rule1', testRules)
            .subscribe(result => {
                expect(result.outputText).toBe('\u1000\u1039\u1000\u103C', toFailOutput(result));
                done();
            });
    });

    it("should work with 'quickTests' with 'tplSeq'", (done: DoneFn) => {
        TestBed.configureTestingModule({
            providers: [
                TranslitService
            ]
        });

        const translitService = TestBed.get<TranslitService>(TranslitService) as TranslitService;

        const testRules: TranslitRulePhase[] = [{
            tplSeq: {
                '#s1': [['\u1006', '\u1066', 1], ['\u1010', '\u1071', 1], ['\u1011', '\u1073', 1]]
            },
            rules: [
                {
                    description: 'Not match',
                    from: '([\u1006\u1010\u1011])\u1039#s1',
                    to: '#s1$1',
                    quickTests: [['\u1039', 0], ['#s1', 2]]
                },
                {
                    from: '([\u1006\u1010\u1011])\u1039#s1',
                    to: '$1#s1',
                    quickTests: [['\u1039', 1], ['#s1', 2]]
                }
            ]
        }];

        translitService.translit('\u1010\u1039\u1010', 'rule1', testRules)
            .subscribe(result => {
                expect(result.outputText).toBe('\u1010\u1071', toFailOutput(result));
                done();
            });
    });

    it("should work with 'postRules' rule options", (done: DoneFn) => {
        TestBed.configureTestingModule({
            providers: [
                TranslitService
            ]
        });

        const translitService = TestBed.get<TranslitService>(TranslitService) as TranslitService;

        const testRules: TranslitRulePhase[] = [{
            rules: [
                {
                    from: '\u1000\u1039\u1000\u103B',
                    to: '\u1010\u1060\u103B',
                    postRules: [
                        {
                            from: '\u103B',
                            to: '\u103A',
                            start: 2
                        }
                    ]
                }
            ]
        }];

        translitService.translit('\u1000\u1039\u1000\u103B', 'rule1', testRules)
            .subscribe(result => {
                expect(result.outputText).toBe('\u1010\u1060\u103A', toFailOutput(result));
                done();
            });
    });

    it("should work with 'postRules' and 'orGroup'", (done: DoneFn) => {
        TestBed.configureTestingModule({
            providers: [
                TranslitService
            ]
        });

        const translitService = TestBed.get<TranslitService>(TranslitService) as TranslitService;

        const testRules: TranslitRulePhase[] = [{
            rules: [
                {
                    from: '([\u1000-\u1021])\u1039\u1010',
                    to: '$1\u1071',
                    postRules: [
                        {
                            from: '\u1014',
                            to: '\u108F',
                            orGroup: 'A'
                        },
                        {
                            from: '\u1014',
                            to: '\u1090',
                            orGroup: 'A'
                        }
                    ]
                }
            ]
        }];

        translitService.translit(
            '\u1014\u1039\u1010',
            'rule1',
            testRules).subscribe(result => {
                expect(result.outputText).toBe('\u108F\u1071', toFailOutput(result));
                done();
            });
    });

    it("should work with 'postRules' and 'tplVar'", (done: DoneFn) => {
        TestBed.configureTestingModule({
            providers: [
                TranslitService
            ]
        });

        const translitService = TestBed.get<TranslitService>(TranslitService) as TranslitService;

        const testRules: TranslitRulePhase[] = [{
            tplVar: {
                '#c1': '\u1000-\u1007'
            },
            rules: [
                {
                    from: '\u1004\u103A\u1039([#c1]\u1039[#c1])\u103C\u1031',
                    to: '\u1031\u103B$1',
                    postRules: [
                        {
                            from: '\u1039\u1007',
                            to: '\u1068',
                            start: 3
                        }
                    ]
                }
            ]
        }];

        translitService.translit(
            '\u1004\u103A\u1039\u1000\u1039\u1007\u103C\u1031',
            'rule1',
            testRules).subscribe(result => {
                expect(result.outputText).toBe('\u1031\u103B\u1000\u1068', toFailOutput(result));
                done();
            });
    });

    it("should work with 'postRules', 'tplVar' with 'tplSeq'", (done: DoneFn) => {
        TestBed.configureTestingModule({
            providers: [
                TranslitService
            ]
        });

        const translitService = TestBed.get<TranslitService>(TranslitService) as TranslitService;

        const testRules: TranslitRulePhase[] = [{
            tplVar: {
                '#c1': '\u1000-\u1007',
                '#c2': '\u1000-\u1021\u103F'
            },
            tplSeq: {
                '#s1': [['\u102D', '\u108B', 1], ['\u102E', '\u108C', 1]],
                '#s2': [['\u1000', '\u1060', 4], ['\u1005', '\u1065', 1], ['\u1006', '\u1067', 3]]
            },
            rules: [
                {
                    description: 'Should match',
                    from: '\u1004\u103A\u1039([#c1]\u1039[#c1])\u103C\u103D\u103E\u1031#s1',
                    to: '\u1031\u103B$1#s1',
                    postRules: [
                        {
                            description: 'Should match',
                            from: '([#c2])\u1039#s2',
                            to: '$1#s2',
                            start: 2
                        }
                    ]
                }
            ]
        }];

        translitService.translit(
            '\u1004\u103A\u1039\u1000\u1039\u1007\u103C\u103D\u103E\u1031\u102D',
            'rule1',
            testRules).subscribe(result => {
                expect(result.outputText).toBe('\u1031\u103B\u1000\u1068\u108B', toFailOutput(result));
                done();
            });
    });

    it("should work with 'postRules' and 'when' with 'tplSeq'", (done: DoneFn) => {
        TestBed.configureTestingModule({
            providers: [
                TranslitService
            ]
        });

        const translitService = TestBed.get<TranslitService>(TranslitService) as TranslitService;

        const testRules: TranslitRulePhase[] = [{
            tplVar: {
                '#c1': '\u1000-\u1007',
                '#c2': '\u1000-\u1021\u103F'
            },
            tplSeq: {
                '#s1': [['\u102D', '\u108B', 1], ['\u102E', '\u108C', 1]],
                '#s2': [['\u1000', '\u1060', 4], ['\u1005', '\u1065', 1], ['\u1006', '\u1067', 3]]
            },
            rules: [
                {
                    description: 'Should match',
                    from: '\u1004\u103A\u1039([#c1]\u1039[#c1])\u103C\u103D\u103E\u1031#s1',
                    to: '\u1031\u103B$1#s1',
                    when: {
                        flag1: true
                    },
                    postRules: [
                        {
                            description: 'Should not match',
                            from: '([#c2])\u1039#s2',
                            to: '$1#s2',
                            when: {
                                flag3: true
                            }
                        },
                        {
                            description: 'Should not match',
                            from: '\u1039\u1000',
                            to: '\u1060',
                            when: {
                                flag3: true
                            }
                        },
                        {
                            description: 'Should match',
                            from: '([#c2])\u1039#s2',
                            to: '$1#s2',
                            start: 2,
                            when: {
                                flag2: true
                            }
                        }
                    ]
                }
            ]
        }];

        translitService.translit(
            '\u1004\u103A\u1039\u1000\u1039\u1007\u103C\u103D\u103E\u1031\u102D',
            'rule1',
            testRules,
            { flag1: true, flag2: true },
            true).subscribe(result => {
                expect(result.outputText).toBe('\u1031\u103B\u1000\u1068\u108B', toFailOutput(result));
                done();
            });
    });

    it("should work with 'postRules' and 'skip' with 'tplSeq'", (done: DoneFn) => {
        TestBed.configureTestingModule({
            providers: [
                TranslitService
            ]
        });

        const translitService = TestBed.get<TranslitService>(TranslitService) as TranslitService;

        const testRules: TranslitRulePhase[] = [{
            tplVar: {
                '#c1': '\u1000-\u1007',
                '#c2': '\u1000-\u1021\u103F'
            },
            tplSeq: {
                '#s1': [['\u102D', '\u108B', 1], ['\u102E', '\u108C', 1]],
                '#s2': [['\u1000', '\u1060', 4], ['\u1005', '\u1065', 1], ['\u1006', '\u1067', 3]]
            },
            rules: [
                {
                    description: 'Should match',
                    from: '\u1004\u103A\u1039([#c1]\u1039[#c1])\u103C\u103D\u103E\u1031#s1',
                    to: '\u1031\u103B$1#s1',
                    skip: {
                        flag3: true
                    },
                    postRules: [
                        {
                            description: 'Should not match',
                            from: '([#c2])\u1039#s2',
                            to: '$1#s2',
                            skip: {
                                flag1: true
                            }
                        },
                        {
                            description: 'Should not match',
                            from: '\u1039\u1000',
                            to: '\u1060',
                            skip: {
                                flag2: true
                            }
                        },
                        {
                            description: 'Should match',
                            from: '([#c2])\u1039#s2',
                            to: '$1#s2',
                            start: 2,
                            skip: {
                                flag3: true
                            }
                        }
                    ]
                }
            ]
        }];

        translitService.translit(
            '\u1004\u103A\u1039\u1000\u1039\u1007\u103C\u103D\u103E\u1031\u102D',
            'rule1',
            testRules,
            { flag1: true, flag2: true },
            true).subscribe(result => {
                expect(result.outputText).toBe('\u1031\u103B\u1000\u1068\u108B', toFailOutput(result));
                done();
            });
    });

    it("should work with 'postRules' -> 'start', 'orGroup' with 'tplSeq'", (done: DoneFn) => {
        TestBed.configureTestingModule({
            providers: [
                TranslitService
            ]
        });

        const translitService = TestBed.get<TranslitService>(TranslitService) as TranslitService;

        const testRules: TranslitRulePhase[] = [{
            tplVar: {
                '#c1': '\u1000-\u1007',
                '#c2': '\u1000-\u1021\u103F'
            },
            tplSeq: {
                '#s1': [['\u102D', '\u108B', 1], ['\u102E', '\u108C', 1]],
                '#s2': [['\u1000', '\u1060', 4], ['\u1005', '\u1065', 1], ['\u1006', '\u1067', 3]]
            },
            rules: [
                {
                    description: 'Should match',
                    from: '\u1004\u103A\u1039([#c1]\u1039[#c1])\u103C\u103D\u103E\u1031#s1',
                    to: '\u1031\u103B$1#s1',
                    postRules: [
                        {
                            description: 'Should not match',
                            from: '([#c2])\u1039#s2',
                            to: '#s2$1',
                            start: -1
                        },
                        {
                            description: 'Should match',
                            from: '([#c2])\u1039#s2',
                            to: '$1#s2',
                            start: 2,
                            orGroup: 'a'
                        },
                        {
                            description: 'Should not match',
                            from: '([#c2])\u1039#s2',
                            to: '#s2',
                            start: 2,
                            orGroup: 'a'
                        },
                        {
                            description: 'Should not match',
                            from: '([\u1000-\u1021])\u1039\u1000',
                            to: '$1\u1060',
                            start: 10,
                            orGroup: 'b'
                        },
                        {
                            description: 'Should not match',
                            from: '([#c2])\u1039#s2',
                            to: '$1#s2',
                            start: 10,
                            orGroup: 'b'
                        }
                    ]
                }
            ]
        }];

        translitService.translit(
            '\u1004\u103A\u1039\u1000\u1039\u1007\u103C\u103D\u103E\u1031\u102D',
            'rule1',
            testRules).subscribe(result => {
                expect(result.outputText).toBe('\u1031\u103B\u1000\u1068\u108B', toFailOutput(result));
                done();
            });
    });

    it("should work with 'postRulesDef' and 'postRulesRef'", (done: DoneFn) => {
        TestBed.configureTestingModule({
            providers: [
                TranslitService
            ]
        });

        const translitService = TestBed.get<TranslitService>(TranslitService) as TranslitService;

        const testRules: TranslitRulePhase[] = [{
            postRulesDef: {
                prs1: [
                    {
                        from: '\u103B',
                        to: '\u103A',
                        start: 2
                    }
                ]
            },
            rules: [
                {
                    from: '\u1000\u1039\u1000\u103B',
                    to: '\u1010\u1060\u103B',
                    postRulesRef: 'prs1'
                }
            ]
        }];

        translitService.translit('\u1000\u1039\u1000\u103B', 'rule1', testRules)
            .subscribe(result => {
                expect(result.outputText).toBe('\u1010\u1060\u103A', toFailOutput(result));
                done();
            });
    });

    it("should work with 'postRulesDef', 'postRulesRef' and 'postRulesStart' with 'tplSeq'", (done: DoneFn) => {
        TestBed.configureTestingModule({
            providers: [
                TranslitService
            ]
        });

        const translitService = TestBed.get<TranslitService>(TranslitService) as TranslitService;

        const testRules: TranslitRulePhase[] = [{
            tplSeq: {
                '#s1': [['\u1000', '\u1060', 1], ['\u1001', '\u1061', 1]]
            },
            postRulesDef: {
                prs1: [
                    {
                        from: '\u1014',
                        to: '\u108F',
                        orGroup: 'a'
                    },
                    {
                        from: '\u101B',
                        to: '\u1090',
                        orGroup: 'a'
                    },
                ]
            },
            rules: [
                {
                    from: '([\u1000-\u1021])([\u1000-\u1021])\u103D\u1031',
                    to: '$1\u1031$2\u103C',
                    postRulesRef: 'prs1',
                    postRulesStart: { a: 2 }
                },
                {
                    description: 'Not Match',
                    from: '([\u1000-\u1021])\u1039#s1',
                    to: '$1#s1',
                    postRulesRef: 'prs1',
                    postRulesStart: { c: 2 }
                }
            ]
        }];

        translitService.translit('\u101B\u1014\u103D\u1031', 'rule1', testRules)
            .subscribe(result => {
                expect(result.outputText).toBe('\u101B\u1031\u108F\u103C', toFailOutput(result));
                done();
            });
    });

    it("should work with 'postRulesDef', 'postRulesRef', 'tplVar' with 'tplSeq'", (done: DoneFn) => {
        TestBed.configureTestingModule({
            providers: [
                TranslitService
            ]
        });

        const translitService = TestBed.get<TranslitService>(TranslitService) as TranslitService;

        const testRules: TranslitRulePhase[] = [{
            tplVar: {
                '#c1': '\u1000-\u1007',
                '#c2': '\u1000-\u1021\u103F'
            },
            tplSeq: {
                '#s1': [['\u102D', '\u108B', 1], ['\u102E', '\u108C', 1]],
                '#s2': [['\u1000', '\u1060', 4], ['\u1005', '\u1065', 1], ['\u1006', '\u1067', 3]]
            },
            postRulesDef: {
                prs1: [
                    {
                        description: 'Should match',
                        from: '([#c2])\u1039#s2',
                        to: '$1#s2',
                        start: 2
                    }
                ]
            },
            rules: [
                {
                    description: 'Should match',
                    from: '\u1004\u103A\u1039([#c1]\u1039[#c1])\u103C\u103D\u103E\u1031#s1',
                    to: '\u1031\u103B$1#s1',
                    postRulesRef: 'prs1'
                }
            ]
        }];

        translitService.translit(
            '\u1004\u103A\u1039\u1000\u1039\u1007\u103C\u103D\u103E\u1031\u102D',
            'rule1',
            testRules).subscribe(result => {
                expect(result.outputText).toBe('\u1031\u103B\u1000\u1068\u108B', toFailOutput(result));
                done();
            });
    });

    it("should work with 'postRulesStrategy' = 'whileMatch'", (done: DoneFn) => {
        TestBed.configureTestingModule({
            providers: [
                TranslitService
            ]
        });

        const translitService = TestBed.get<TranslitService>(TranslitService) as TranslitService;

        const testRules: TranslitRulePhase[] = [{
            tplVar: {
                '#3ar': '\u1060-\u1063\u1065-\u1069\u106C\u106D\u1070-\u107C\u1085\u1093\u1096',
                '#3cr': '#3ar\u103A',
                '#3dr': '#3cr\u103C',
                '#64And8bTo8dr': '#3dr\u103D',
                '#2dOr2er': '#64And8bTo8dr\u1064\u108B-\u108D',
                '#2fOr30r': '#2dOr2er\u102D\u102E',
                '#32Or36r': '#2fOr30r\u102F\u1030',
                '#37r': '#32Or36r\u102B\u102C\u1032\u1036',
                '#r': '#37r'
            },
            tplSeq: {
                '#sx': [
                    ['\u102B', '\u102B', 6],
                    ['\u1032', '\u1032', 1],
                    ['\u1036', '\u1036', 1],
                    ['\u1037', '\u1037', 1],
                    ['\u1039', '\u1039', 2],
                    ['\u103C', '\u103C', 2],
                    ['\u1064', '\u1064', 1],
                    ['\u108B', '\u108B', 1],
                    ['\u108C', '\u108C', 1],
                    ['\u108D', '\u108D', 1]
                ]
            },
            postRulesDef: {
                po: [
                    {
                        from: '(\u1037)([#37r])',
                        to: '$2$1'
                    },
                    {
                        from: '([\u1032\u1036])([#32Or36r])',
                        to: '$2$1'
                    },
                    {
                        from: '([\u102F\u1030])([#2fOr30r])',
                        to: '$2$1'
                    },
                    {
                        from: '([\u102D\u102E])([#2dOr2er])',
                        to: '$2$1'
                    },
                    {
                        from: '([\u1064\u108B-\u108D])([#64And8bTo8dr])',
                        to: '$2$1'
                    },
                    {
                        from: '(\u103D)([#3dr])',
                        to: '$2$1'
                    },
                    {
                        from: '(\u103C)([#3cr])',
                        to: '$2$1'
                    },
                    {
                        from: '(\u103A)([#3ar])',
                        to: '$2$1'
                    }
                ]
            },
            rules: [
                {
                    from: '#sx([#r]+)',
                    to: '#sx$1',
                    minLength: 2,
                    quickTests: [['#sx', 0]],
                    postRulesRef: 'po',
                    postRulesStrategy: 'whileMatch'
                },
            ]
        }];

        translitService.translit('\u1000\u1036\u102E\u1060\u102F\u103A', 'rule1', testRules, undefined, true).subscribe(result => {
            expect(result.outputText).toBe('\u1000\u1060\u103A\u102E\u102F\u1036', toFailOutput(result));
            done();
        });
    });

    it("should work with 'postRulesStrategy' = 'whileMatch' with 'tplSeq'", (done: DoneFn) => {
        TestBed.configureTestingModule({
            providers: [
                TranslitService
            ]
        });

        const translitService = TestBed.get<TranslitService>(TranslitService) as TranslitService;

        const testRules: TranslitRulePhase[] = [{
            tplVar: {
                '#3ar': '\u1060-\u1063\u1065-\u1069\u106C\u106D\u1070-\u107C\u1085\u1093\u1096',
                '#3cr': '#3ar\u103A',
                '#3dr': '#3cr\u103C',
                '#64And8bTo8dr': '#3dr\u103D',
                '#2dOr2er': '#64And8bTo8dr\u1064\u108B-\u108D',
                '#2fOr30r': '#2dOr2er\u102D\u102E',
                '#32Or36r': '#2fOr30r\u102F\u1030',
                '#37r': '#32Or36r\u102B\u102C\u1032\u1036',
                '#r': '#37r'
            },
            tplSeq: {
                '#sx': [
                    ['\u102B', '\u102B', 6],
                    ['\u1032', '\u1032', 1],
                    ['\u1036', '\u1036', 1],
                    ['\u1037', '\u1037', 1],
                    ['\u1039', '\u1039', 2],
                    ['\u103C', '\u103C', 2],
                    ['\u1064', '\u1064', 1],
                    ['\u108B', '\u108B', 1],
                    ['\u108C', '\u108C', 1],
                    ['\u108D', '\u108D', 1]
                ],
                '#32Or36x': [
                    ['\u1032', '\u1032', 1],
                    ['\u1036', '\u1036', 1]
                ],
                '#2fOr30x': [
                    ['\u102F', '\u102F', 2]
                ],
                '#2dOr2ex': [
                    ['\u102D', '\u102D', 2]
                ]
            },
            postRulesDef: {
                po: [
                    {
                        from: '(\u1037)([#37r])',
                        to: '$2$1'
                    },
                    {
                        from: '#32Or36x([#32Or36r])',
                        to: '$1#32Or36x'
                    },
                    {
                        from: '#2fOr30x([#2fOr30r])',
                        to: '$1#2fOr30x'
                    },
                    {
                        from: '#2dOr2ex([#2dOr2er])',
                        to: '$1#2dOr2ex'
                    },
                    {
                        from: '(\u103D)([#3dr])',
                        to: '$2$1'
                    },
                    {
                        from: '(\u103C)([#3cr])',
                        to: '$2$1'
                    },
                    {
                        from: '(\u103A)([#3ar])',
                        to: '$2$1'
                    }
                ]
            },
            rules: [
                {
                    from: '#sx([#r]+)',
                    to: '#sx$1',
                    minLength: 2,
                    quickTests: [['#sx', 0]],
                    postRulesRef: 'po',
                    postRulesStrategy: 'whileMatch'
                },
            ]
        }];

        translitService.translit('\u1000\u1036\u102E\u1060\u102F\u103A', 'rule1', testRules, undefined, true).subscribe(result => {
            expect(result.outputText).toBe('\u1000\u1060\u103A\u102E\u102F\u1036', toFailOutput(result));
            done();
        });
    });

    it("should not continue next phase in 'applyRule' when 'outputText' was empty", (done: DoneFn) => {
        TestBed.configureTestingModule({
            providers: [
                TranslitService
            ]
        });

        const translitService = TestBed.get<TranslitService>(TranslitService) as TranslitService;

        const testRules: TranslitRule = {
            phases: [
                {
                    description: 'Phase 1',
                    rules: [
                        {
                            from: '0',
                            to: ''
                        }
                    ]
                },
                {
                    description: 'Phase 2 (Skipped)',
                    rules: [
                        {
                            from: '0',
                            to: '1'
                        }
                    ]
                }

            ]
        };

        translitService.translit('0', 'rule1', testRules, undefined, true).subscribe(result => {
            expect(result.outputText).toBe('', toFailOutput(result));
            done();
        });
    });

    it("should break loop in 'applySubRuleItems' when endless condition was detection", (done: DoneFn) => {
        TestBed.configureTestingModule({
            providers: [
                TranslitService
            ]
        });

        const translitService = TestBed.get<TranslitService>(TranslitService) as TranslitService;

        const testRules: TranslitRulePhase[] = [{
            postRulesDef: {
                prs: [
                    {
                        from: '23',
                        to: '32'
                    },
                    {
                        from: '32',
                        to: '2323'
                    }
                ]
            },
            rules: [
                {
                    from: '(23)',
                    to: '$1',
                    postRulesRef: 'prs',
                    postRulesStrategy: 'whileMatch'
                },
            ]
        }];

        translitService.translit('123', 'rule1', testRules, undefined, true).subscribe(result => {
            expect(result.outputText).toBe('12323', toFailOutput(result));
            done();
        });
    });

    it("should break loop in 'applySubRuleItems' when 'curStr' is empty", (done: DoneFn) => {
        TestBed.configureTestingModule({
            providers: [
                TranslitService
            ]
        });

        const translitService = TestBed.get<TranslitService>(TranslitService) as TranslitService;

        const testRules: TranslitRulePhase[] = [{
            postRulesDef: {
                prs: [
                    {
                        from: '23',
                        to: ''
                    },
                    {
                        from: '23',
                        to: '32'
                    }
                ]
            },
            rules: [
                {
                    from: '(23)',
                    to: '$1',
                    postRulesRef: 'prs',
                    postRulesStrategy: 'whileMatch'
                },
            ]
        }];

        translitService.translit('1234', 'rule1', testRules, undefined, true).subscribe(result => {
            expect(result.outputText).toBe('14', toFailOutput(result));
            done();
        });
    });

    it("should throw an error if both 'ruleName' and 'rulesToUse' are not provided", () => {
        TestBed.configureTestingModule({
            providers: [
                TranslitService,
                {
                    provide: TRANSLIT_RULE_LOADER,
                    useClass: FakeTranslitRuleLoader
                }
            ]
        });

        const translitService = TestBed.get<TranslitService>(TranslitService) as TranslitService;

        expect(() => translitService.translit('any')).toThrowError("The 'ruleName' value is required if 'rulesToUse' is not provided.");
    });

    it('should throw an error when an invalid rule was detected', () => {
        TestBed.configureTestingModule({
            providers: [
                TranslitService
            ]
        });

        const translitService = TestBed.get<TranslitService>(TranslitService) as TranslitService;

        const invalidRule = [
            {
                description: 'invalid rule phase'
            }
        ];

        expect(() => translitService.translit('any', undefined, invalidRule as TranslitRuleAny))
            .toThrowError('Error in parsing translit rule, invalid rule schema.');
    });

    it("should throw an error when an invalid 'tplSeq' was detected", () => {
        TestBed.configureTestingModule({
            providers: [
                TranslitService
            ]
        });

        const translitService = TestBed.get<TranslitService>(TranslitService) as TranslitService;

        const invalidTplSeq1: TranslitRulePhase[] = [{
            description: "invalid tplSeq - no 'to'",
            tplSeq: {
                '#x': []
            },
            rules: [{
                from: 'f1#x'
            }]
        }];

        const invalidTplSeq2: TranslitRulePhase[] = [{
            description: "invalid tplSeq - no var name in 'to'",
            tplSeq: {
                '#x': []
            },
            rules: [{
                from: 'f1#x',
                to: 't1'
            }]
        }];

        const invalidTplSeq3: TranslitRulePhase[] = [{
            description: 'invalid tplSeq - invalid seq from value',
            tplSeq: {
                '#x': [['\u1000\u1001', '\u1060', 1]]
            },
            rules: [{
                from: '#x',
                to: '#x'
            }]
        }];

        const invalidTplSeq4: TranslitRulePhase[] = [{
            description: 'invalid tplSeq - invalid seq to value in more than 1 seq',
            tplSeq: {
                '#x': [['\u1000', '\u1060\u1061', 2]]
            },
            rules: [{
                from: '#x',
                to: '#x'
            }]
        }];

        expect(() => translitService.translit('any', undefined, invalidTplSeq1))
            .toThrowError("Error in parsing translit rule, to use 'tplSeq', 'to' value is required, phase: 1, rule: 1.");
        expect(() => translitService.translit('any', undefined, invalidTplSeq2))
            .toThrowError("Error in parsing translit rule, tplSeq name: '#x' could not be found in 'to' value, phase: 1, rule: 1.");
        expect(() => translitService.translit('any', undefined, invalidTplSeq3))
            .toThrowError('Error in parsing translit rule, invalid template value definition, phase: 1, rule: 1.');
        expect(() => translitService.translit('any', undefined, invalidTplSeq4))
            .toThrowError('Error in parsing translit rule, invalid template value definition, phase: 1, rule: 1.');
    });

    it('should throw an error when loader returns an error', (done: DoneFn) => {
        TestBed.configureTestingModule({
            providers: [
                TranslitService,
                {
                    provide: TRANSLIT_RULE_LOADER,
                    useClass: FakeTranslitRuleLoader
                }
            ]
        });

        const translitService = TestBed.get<TranslitService>(TranslitService) as TranslitService;

        translitService.translit('any', 'loaderError').subscribe({
            error(actualError: Error): void {
                expect(of(actualError)).toBeTruthy();
                expect(actualError).not.toBeNull();
                expect(actualError).not.toBeUndefined();
                done();
            }
        });
    });

    it("should throw an error when circular variable was detected in 'tplVar'", () => {
        TestBed.configureTestingModule({
            providers: [
                TranslitService
            ]
        });

        const translitService = TestBed.get<TranslitService>(TranslitService) as TranslitService;

        const invalidTplVar: TranslitRulePhase[] = [{
            tplVar: {
                '#s3': '#s2',
                '#s2': '#s3',
                '#s1': '#s2'
            },
            rules: [
                {
                    from: '(#s1)',
                    to: '$1'
                },
            ]
        }];

        expect(() => translitService.translit('any', undefined, invalidTplVar))
            .toThrowError("Circular variable was detected while initializing 'tplVar', name: '#s2'.");
    });

    it("should throw an error when circular variable was detected in global 'tplVar'", () => {
        TestBed.configureTestingModule({
            providers: [
                TranslitService
            ]
        });

        const translitService = TestBed.get<TranslitService>(TranslitService) as TranslitService;

        const invalidTplVar: TranslitRule = {
            tplVar: {
                '#s3': '#s1',
                '#s2': '#s3'
            },
            phases: [{
                tplVar: {
                    '#s1': '#s2'
                },
                rules: [
                    {
                        from: '(#s1)',
                        to: '$1'
                    },
                ]
            }]
        };

        expect(() => translitService.translit('any', undefined, invalidTplVar))
            .toThrowError("Circular variable was detected while initializing 'tplVar', name: '#s1'.");
    });
});

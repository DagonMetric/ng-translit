/**
 * @license
 * Copyright DagonMetric. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found under the LICENSE file in the root directory of this source tree.
 */

import { Inject, Injectable, InjectionToken, Optional } from '@angular/core';

import { Observable, Observer, of } from 'rxjs';
import { map, share, take } from 'rxjs/operators';

import { TranslitResult, TranslitTraceItem } from './translit-result';
import { TranslitRule, TranslitRuleItem, TranslitRulePhase, TranslitSubRuleItem } from './translit-rule';
import { TranslitRuleLoader } from './translit-rule-loader';
import { TRANSLIT_RULE_LOADER } from './translit-rule-loader.token';
import {
    TranslitRuleItemParsed,
    TranslitRuleParsed,
    TranslitRulePhaseParsed,
    TranslitSubRuleItemParsed
} from './translit-rule-parsed';
import { TranslitRuleStore } from './translit-rule-store';

/**
 * The options for 'TranslitService'.
 */
export interface TranslitOptions {
    /**
     * Default `true`, if true provide `TranslitRuleStore` to share rules across modules.
     */
    shareCachedRules?: boolean;
    /**
     * If true, conversion trace information will be included in the transliteration result.
     */
    trace?: boolean;
}

export const TRANSLIT_OPTIONS = new InjectionToken<TranslitOptions>('TranslitOptions');

/**
 * The core transliteration service.
 */
@Injectable()
export class TranslitService {
    private readonly _cachedRules: Map<string, TranslitRuleParsed> = new Map<string, TranslitRuleParsed>();
    private readonly _fetchRequests: { [key: string]: Observable<TranslitRuleParsed> } = {};
    private readonly _fetching: { [key: string]: boolean } = {};

    private readonly _options: TranslitOptions;

    private get cachedRules(): Map<string, TranslitRuleParsed> {
        return this._options.shareCachedRules ? this._ruleStore.cachedRules : this._cachedRules;
    }

    constructor(
        private readonly _ruleStore: TranslitRuleStore,
        @Optional() @Inject(TRANSLIT_RULE_LOADER) private readonly _ruleLoader?: TranslitRuleLoader,
        @Optional() @Inject(TRANSLIT_OPTIONS) options?: TranslitOptions) {
        if (options && options.shareCachedRules == null) {
            options.shareCachedRules = true;
        }

        this._options = options || {};
    }

    /**
     * The main method to convert source text to target script using transliterate rules.
     * @param sourceText Input string to convert.
     * @param [ruleName] The rule name to load and cache rule. Optional if 'rulesToUse' is provided.
     * @param [rulesToUse] One-time transliterate rules to use.
     * @param [userOptions] The user selected options to check with 'when' rule options.
     * @param [trace] Flag to include transliteration trace information in the result.
     * @returns Returns the result object.
     * @throws {Error} Throws error if there is a invalid option or a parsing error.
     */
    translit(
        sourceText: string,
        ruleName?: string,
        rulesToUse?: TranslitRule | TranslitRulePhase[] | TranslitRuleItem[],
        userOptions?: { [option: string]: boolean | string },
        trace?: boolean): Observable<TranslitResult> {
        if (sourceText == null || !sourceText.trim().length) {
            return of({
                outputText: sourceText,
                replaced: false
            });
        }

        trace = typeof trace === 'boolean' ? trace : this._options.trace;

        if (rulesToUse) {
            const rule = this.toTranslitRule(rulesToUse);
            const translitResult = this.applyRule(sourceText, this.parseRule(rule), userOptions, trace);

            return of(translitResult);
        }

        if (!ruleName) {
            throw new Error("The 'ruleName' value is required if 'rulesToUse' is not provided.");
        }

        this.loadRule(ruleName);

        const cachedRule = this.cachedRules.get(ruleName);
        if (cachedRule && !this._fetching[ruleName]) {
            const translitResult = this.applyRule(sourceText, cachedRule, userOptions, trace);

            return of(translitResult);
        }

        return new Observable((observer: Observer<TranslitResult>) => {
            const onComplete = (res: TranslitResult) => {
                observer.next(res);
                observer.complete();
            };

            const onError = (err: Error) => {
                observer.error(err);
            };

            this._fetchRequests[ruleName]
                .subscribe((rule) => {
                    const translitResult = this.applyRule(sourceText, rule, userOptions, trace);
                    onComplete(translitResult);
                }, onError);
        });
    }

    /**
     * The method to load and cache rule by name in advanced.
     * @param ruleName The rule name to load and cache rule.
     * @param refresh Flag to force reload the rule.
     *  @returns Returns the parsed rule object.
     * @throws {Error} Throws error if no 'TRANSLIT_RULE_LOADER' provided or if there is a parsing error.
     */
    loadRule(ruleName: string, refresh?: boolean): Observable<TranslitRuleParsed> {
        if (!this._ruleLoader) {
            throw new Error("The 'TRANSLIT_RULE_LOADER' service must be provided.");
        }

        if (!refresh) {
            const cachedRule = this.cachedRules.get(ruleName);
            if (cachedRule != null) {
                return of(cachedRule);
            }

            if (this._fetchRequests[ruleName]) {
                return this._fetchRequests[ruleName];
            }
        }

        this._fetching[ruleName] = true;

        const obs = this._ruleLoader.load(ruleName).pipe(
            map(data => this.parseRule(this.toTranslitRule(data))),
            share()
        );

        this._fetchRequests[ruleName] = obs.pipe(
            take(1),
            share()
        );

        this._fetchRequests[ruleName]
            .subscribe((rule) => {
                this.cachedRules.set(ruleName, rule);
                this._fetching[ruleName] = false;
            }, () => {
                this._fetching[ruleName] = false;
            });

        return obs;
    }

    private applyRule(
        inputStr: string,
        rule: TranslitRuleParsed,
        userOptions?: { [option: string]: boolean | string },
        trace?: boolean): TranslitResult {
        const startTime = Date.now();
        const translitResult: TranslitResult = {
            outputText: inputStr
        };

        translitResult.traces = trace ? [] : undefined;
        for (const rulePhase of rule.phases) {
            const outputText = this.applyRulePhase(translitResult.outputText, rulePhase, userOptions, translitResult.traces);
            if (!translitResult.replaced) {
                translitResult.replaced = outputText !== translitResult.outputText;
            }

            translitResult.outputText = outputText;
        }

        translitResult.duration = Date.now() - startTime;

        return translitResult;
    }

    // tslint:disable-next-line: max-func-body-length
    private applyRulePhase(
        inputStr: string,
        rulePhase: TranslitRulePhaseParsed,
        userOptions?: { [option: string]: boolean | string },
        traces?: TranslitTraceItem[]): string {
        let outStr = '';
        let curStr = inputStr;

        while (curStr.length > 0) {
            let foundRule = false;

            for (let i = 0; i < rulePhase.rules.length; i++) {
                const ruleItem = rulePhase.rules[i];
                if (ruleItem.when && (!ruleItem.tplSeqName || ruleItem.firstSeq)) {
                    const whenOptions = ruleItem.when;
                    if (Object.keys(whenOptions).find(k => !userOptions || (whenOptions[k] !== userOptions[k]))) {
                        if (ruleItem.firstSeq && ruleItem.totalSeqCount) {
                            i += ruleItem.totalSeqCount - 1;
                        }
                        continue;
                    }
                }
                if (ruleItem.matchOnStart && outStr.length > 0) {
                    if (ruleItem.firstSeq && ruleItem.totalSeqCount) {
                        i += ruleItem.totalSeqCount - 1;
                    }
                    continue;
                }
                if (ruleItem.minLength != null && curStr.length < ruleItem.minLength) {
                    if (ruleItem.firstSeq && ruleItem.totalSeqCount) {
                        i += ruleItem.totalSeqCount - 1;
                    }
                    continue;
                }
                if (ruleItem.seqQuickTests && ruleItem.totalSeqCount &&
                    ruleItem.seqQuickTests.find(qt => qt[1] >= curStr.length || curStr[qt[1]] !== qt[0])) {
                    i += ruleItem.totalSeqCount - 1;
                    continue;
                }
                if (ruleItem.quickTests && ruleItem.quickTests.length > 0 &&
                    ruleItem.quickTests.find(qt => qt[1] >= curStr.length || curStr[qt[1]] !== qt[0])) {
                    continue;
                }

                const m = curStr.match(ruleItem.fromRegExp);
                if (m == null) {
                    continue;
                }

                foundRule = true;

                const matchedString = m[0];
                let replacedString: string;

                if (ruleItem.parsedTo != null) {
                    replacedString = matchedString.replace(ruleItem.fromRegExp, ruleItem.parsedTo);
                    // curStr = curStr.replace(ruleItem.fromRegExp, ruleItem.parsedTo);
                } else {
                    replacedString = matchedString;
                }

                let currentTrace: TranslitTraceItem | undefined;
                if (traces) {
                    currentTrace = {
                        from: ruleItem.from,
                        parsedFrom: ruleItem.parsedFrom,
                        to: ruleItem.to,
                        parsedTo: ruleItem.parsedTo,
                        inputString: curStr,
                        matchedString,
                        replacedString
                    };
                    traces.push(currentTrace);
                }

                if (ruleItem.parsedPostRules && ruleItem.parsedTo != null && replacedString.length > 0) {
                    replacedString = this.applySubRuleItems(replacedString, ruleItem.parsedPostRules, userOptions, currentTrace);
                }

                if (ruleItem.seqIndex != null && ruleItem.totalSeqCount) {
                    i += ruleItem.totalSeqCount - ruleItem.seqIndex - 1;
                }

                outStr += replacedString;
                curStr = curStr.substring(matchedString.length);
            }

            if (!foundRule) {
                outStr += curStr[0];
                curStr = curStr.substring(1);
            }
        }

        return outStr;
    }

    private applySubRuleItems(
        inputStr: string,
        subRuleItems: TranslitSubRuleItemParsed[],
        userOptions?: { [option: string]: boolean | string },
        currentTrace?: TranslitTraceItem): string {
        let curStr = inputStr;
        const orGroupNames: string[] = [];

        for (let i = 0; i < subRuleItems.length; i++) {
            const subRuleItem = subRuleItems[i];

            if (subRuleItem.orGroup && orGroupNames.includes(subRuleItem.orGroup)) {
                continue;
            }

            if (subRuleItem.when && (!subRuleItem.tplSeqName || subRuleItem.firstSeq)) {
                const whenOptions = subRuleItem.when;
                if (Object.keys(whenOptions).find(k => !userOptions || (whenOptions[k] !== userOptions[k]))) {
                    if (subRuleItem.firstSeq && subRuleItem.totalSeqCount) {
                        i += subRuleItem.totalSeqCount - 1;
                    }
                    continue;
                }
            }

            const start = subRuleItem.start != null && subRuleItem.start > -1 ? subRuleItem.start : 0;
            if (start >= curStr.length) {
                if (subRuleItem.firstSeq && subRuleItem.totalSeqCount) {
                    i += subRuleItem.totalSeqCount - 1;
                }
                continue;
            }

            const leftPart = start > 0 ? curStr.substring(0, start) : '';
            const rightPart = start > 0 ? curStr.substring(start) : curStr;

            if (subRuleItem.seqQuickTests && subRuleItem.totalSeqCount &&
                subRuleItem.seqQuickTests.find(qt => qt[1] >= rightPart.length || rightPart[qt[1]] !== qt[0])) {
                i += subRuleItem.totalSeqCount - 1;
                continue;
            }
            if (subRuleItem.quickTests && subRuleItem.quickTests.length > 0 &&
                subRuleItem.quickTests.find(qt => qt[1] >= rightPart.length || rightPart[qt[1]] !== qt[0])) {
                continue;
            }

            const m = rightPart.match(subRuleItem.fromRegExp);
            if (m == null) {
                continue;
            }

            if (subRuleItem.orGroup && !orGroupNames.includes(subRuleItem.orGroup)) {
                orGroupNames.push(subRuleItem.orGroup);
            }

            const matchedString = m[0];
            const replacedString = leftPart + rightPart.replace(subRuleItem.fromRegExp, subRuleItem.parsedTo);

            if (currentTrace) {
                currentTrace.postRuleTraces = currentTrace.postRuleTraces || [];
                currentTrace.postRuleTraces.push({
                    from: subRuleItem.from,
                    parsedFrom: subRuleItem.parsedFrom,
                    to: subRuleItem.to,
                    parsedTo: subRuleItem.parsedTo,
                    inputString: curStr,
                    matchedString,
                    replacedString
                });
            }

            curStr = replacedString;

            if (subRuleItem.seqIndex != null && subRuleItem.totalSeqCount) {
                i += subRuleItem.totalSeqCount - subRuleItem.seqIndex - 1;
            }
        }

        return curStr;
    }

    private initTplVar(tplVar: { [key: string]: string }, globalTplVar?: { [key: string]: string }): void {
        const varNames = Object.keys(tplVar).sort().reverse();
        const globalVarNames = globalTplVar ? Object.keys(globalTplVar).sort().reverse() : [];

        for (const k1 of varNames) {
            let value = tplVar[k1];
            if (!value.includes('#')) {
                continue;
            }

            for (const k2 of varNames.filter(k => k !== k1)) {
                if (value.includes(k2)) {
                    value = value.replace(new RegExp(k2, 'g'), tplVar[k2]);
                }
            }

            for (const k2 of globalVarNames) {
                if (value.includes(k2)) {
                    value = value.replace(new RegExp(k2, 'g'), (globalTplVar as { [key: string]: string })[k2]);
                }
            }

            tplVar[k1] = value;
        }
    }

    private toTranslitRule(ruleAny: TranslitRule | TranslitRulePhase[] | TranslitRuleItem[]): TranslitRule {
        const errMsg = 'Error in parsing translit rule, invalid rule schema.';

        if (Array.isArray(ruleAny)) {
            if ((ruleAny as TranslitRulePhase[]).length > 0 && (ruleAny as TranslitRulePhase[])[0].rules) {
                return {
                    phases: ruleAny as TranslitRulePhase[]
                };
            } else if ((ruleAny as TranslitRuleItem[]).length > 0 && (ruleAny as TranslitRuleItem[])[0].from) {
                return {
                    phases: [
                        {
                            rules: ruleAny as TranslitRuleItem[]
                        }

                    ]
                };
            } else {
                throw new Error(errMsg);
            }
        } else {
            if (!ruleAny.phases) {
                throw new Error(errMsg);
            }

            return ruleAny;
        }
    }

    private parseRule(rule: TranslitRule): TranslitRuleParsed {
        const globalTplVar = rule.tplVar ? { ...rule.tplVar } : undefined;
        if (globalTplVar) {
            this.initTplVar(globalTplVar);
        }

        const parsedRulePhases: TranslitRulePhaseParsed[] = [];

        for (let i = 0; i < rule.phases.length; i++) {
            const rulePhase = { ...rule.phases[i] };
            if (rulePhase.tplVar) {
                this.initTplVar(rulePhase.tplVar, globalTplVar);
            }

            const parsedRuleItems: TranslitRuleItemParsed[] = [];

            for (let j = 0; j < rulePhase.rules.length; j++) {
                const ruleItem = rulePhase.rules[j];
                const parsedItems =
                    this.parseTpl(ruleItem, rulePhase.tplSeq, rulePhase.tplVar, globalTplVar, rulePhase.postRulesDef, i, j);
                parsedRuleItems.push(...parsedItems);
            }

            parsedRulePhases.push({
                ...rulePhase,
                index: i,
                rules: parsedRuleItems
            });
        }

        return {
            $schema: rule.$schema,
            version: rule.version,
            description: rule.description,
            tplVar: globalTplVar,
            phases: parsedRulePhases
        };
    }

    private parseTpl(
        ruleItem: TranslitRuleItem | TranslitSubRuleItem,
        tplSeq?: { [key: string]: [string, string, number][] },
        tplVar?: { [key: string]: string },
        globalTplVar?: { [key: string]: string },
        postRulesDef?: { [key: string]: TranslitSubRuleItem[] },
        phaseIndex?: number,
        ruleIndex?: number,
        subRuleIndex?: number): TranslitRuleItemParsed[] | TranslitSubRuleItemParsed[] {
        const mergedTplVar: { [key: string]: string } = { ...globalTplVar, ...tplVar };
        const varNames = Object.keys(mergedTplVar).sort().reverse();

        const parsedItem: TranslitRuleItemParsed = {
            ...ruleItem,
            index: subRuleIndex == null ? ruleIndex || 0 : subRuleIndex,
            parsedFrom: ruleItem.from,
            fromRegExp: undefined as unknown as RegExp,
            parsedTo: ruleItem.to
        };

        for (const varName of varNames) {
            const value = mergedTplVar[varName];
            if (parsedItem.parsedFrom.includes(varName)) {
                parsedItem.parsedFrom = parsedItem.parsedFrom.replace(new RegExp(varName, 'g'), value);
            }
            if (parsedItem.parsedTo && parsedItem.parsedTo.includes(varName)) {
                parsedItem.parsedTo = parsedItem.parsedTo.replace(new RegExp(varName, 'g'), value);
            }
        }

        const seqParsedItems = this.parseTplSeq(
            parsedItem,
            tplSeq,
            tplVar,
            globalTplVar,
            postRulesDef,
            phaseIndex,
            ruleIndex,
            subRuleIndex);

        if (seqParsedItems) {
            return seqParsedItems;
        } else {
            let postRules: TranslitSubRuleItem[] | undefined;
            if (parsedItem.postRulesRef &&
                postRulesDef &&
                postRulesDef[parsedItem.postRulesRef] &&
                postRulesDef[parsedItem.postRulesRef].length > 0) {
                postRules = JSON.parse(JSON.stringify(postRulesDef[parsedItem.postRulesRef])) as TranslitSubRuleItem[];
            }
            if (parsedItem.postRules) {
                postRules = postRules || [];
                postRules.push(...parsedItem.postRules);
            }

            parsedItem.fromRegExp = subRuleIndex == null ? new RegExp(`^${parsedItem.parsedFrom}`) : new RegExp(`${parsedItem.parsedFrom}`);
            if (postRules) {
                parsedItem.parsedPostRules = this.parseSubRuleItems(
                    postRules,
                    tplSeq,
                    tplVar,
                    globalTplVar,
                    postRulesDef,
                    phaseIndex,
                    ruleIndex);
            }

            if (subRuleIndex == null && !parsedItem.quickTests && parsedItem.parsedFrom.length === 1) {
                parsedItem.quickTests = [[parsedItem.parsedFrom, 0]];
            }

            return [parsedItem];
        }
    }

    private parseTplSeq(
        parsedRuleItem: TranslitRuleItemParsed | TranslitSubRuleItemParsed,
        tplSeq?: { [key: string]: [string, string, number][] },
        tplVar?: { [key: string]: string },
        globalTplVar?: { [key: string]: string },
        postRulesDef?: { [key: string]: TranslitSubRuleItem[] },
        phaseIndex?: number,
        ruleIndex?: number,
        subRuleIndex?: number): TranslitRuleItemParsed[] | TranslitSubRuleItemParsed[] | undefined {
        if (!tplSeq) {
            return undefined;

        }
        const tplSeqName = Object.keys(tplSeq).sort().reverse().find(k => parsedRuleItem.parsedFrom.includes(k));
        if (!tplSeqName) {
            return undefined;
        }

        const errMsgPrefix = 'Error in parsing translit rule';
        const subPosSuffix = subRuleIndex != null ? `, subrule: ${subRuleIndex + 1}` : '';
        const posSuffix = `phase: ${(phaseIndex || 0) + 1}, rule: ${(ruleIndex || 0) + 1}${subPosSuffix}`;
        const invalidTplValueMsg = `${errMsgPrefix}, invalid template value definition, ${posSuffix}.`;

        if (!parsedRuleItem.parsedTo) {
            throw new Error(`${errMsgPrefix}, to use 'tplSeq', 'to' value is required, ${posSuffix}.`);
        }

        if (!parsedRuleItem.parsedTo.includes(tplSeqName)) {
            throw new Error(`${errMsgPrefix}, tplSeq name: '${tplSeqName}' could not be found in 'to' value, ${posSuffix}.`);
        }

        const tplSeqValue = tplSeq[tplSeqName];

        const parsedRuleItems: (TranslitRuleItemParsed | TranslitSubRuleItemParsed)[] = [];
        let firstSeq = true;
        let totalSeqCount = 0;
        let seqIndex = 0;

        for (const tplSeqPart of tplSeqValue) {
            totalSeqCount += tplSeqPart[2];
        }

        for (const tplSeqPart of tplSeqValue) {
            const fromStart = tplSeqPart[0].trim();
            const toStart = tplSeqPart[1].trim();
            const seqCount = tplSeqPart[2];

            if (!fromStart || fromStart.length !== 1 || !toStart || toStart.length !== 1 || seqCount < 1) {
                throw new Error(invalidTplValueMsg);
            }

            const fromCPStart = fromStart.codePointAt(0) as number;
            const toCPStart = toStart.codePointAt(0) as number;

            for (let i = 0; i < seqCount; i++) {
                const currFrom = fromCPStart + i;
                const currTo = toCPStart + i;
                const currFromChar = String.fromCodePoint(currFrom);
                const currToChar = String.fromCodePoint(currTo);

                const clonedRuleItem = JSON.parse(JSON.stringify(parsedRuleItem)) as TranslitRuleItemParsed;
                const fromReplaced = clonedRuleItem.parsedFrom.replace(tplSeqName, currFromChar);

                let postRules: TranslitSubRuleItem[] | undefined;
                if (clonedRuleItem.postRulesRef &&
                    postRulesDef &&
                    postRulesDef[clonedRuleItem.postRulesRef] &&
                    postRulesDef[clonedRuleItem.postRulesRef].length > 0) {
                    postRules = JSON.parse(JSON.stringify(postRulesDef[clonedRuleItem.postRulesRef])) as TranslitSubRuleItem[];
                }
                if (clonedRuleItem.postRules) {
                    postRules = postRules || [];
                    postRules.push(...clonedRuleItem.postRules);
                }

                const parsedItem: TranslitRuleItemParsed = {
                    ...clonedRuleItem,
                    index: subRuleIndex == null ? ruleIndex || 0 : subRuleIndex,
                    seqIndex: seqIndex,
                    tplSeqName,
                    firstSeq,
                    totalSeqCount,
                    parsedFrom: fromReplaced,
                    fromRegExp: subRuleIndex == null ? new RegExp(`^${fromReplaced}`) : new RegExp(`${fromReplaced}`),
                    parsedTo: (clonedRuleItem.parsedTo as string).replace(tplSeqName, currToChar),
                    parsedPostRules: postRules ? this.parseSubRuleItems(
                        postRules, tplSeq, tplVar, globalTplVar, postRulesDef, phaseIndex, ruleIndex) : undefined
                };

                seqIndex++;

                this.parseQuickTestsForSeq(parsedItem, tplSeqName, currFromChar, firstSeq);

                parsedRuleItems.push(parsedItem);

                firstSeq = false;
            }

            firstSeq = false;
        }

        return parsedRuleItems;
    }

    private parseQuickTestsForSeq(parsedRuleItem: TranslitRuleItemParsed, name: string, value: string, firstSeq: boolean): void {
        if (!parsedRuleItem.quickTests) {
            return;
        }

        for (let i = 0; i < parsedRuleItem.quickTests.length; i++) {
            const qt = parsedRuleItem.quickTests[i];
            if (qt[0] === name) {
                qt[0] = value;
                parsedRuleItem.quickTests[i] = qt;
            } else if (firstSeq) {
                parsedRuleItem.seqQuickTests = parsedRuleItem.seqQuickTests || [];
                parsedRuleItem.seqQuickTests.push([qt[0], qt[1]]);
            }
        }
    }

    private parseSubRuleItems(
        subRuleItems: TranslitSubRuleItem[],
        tplSeq?: { [key: string]: [string, string, number][] },
        tplVar?: { [key: string]: string },
        globalTplVar?: { [key: string]: string },
        postRulesDef?: { [key: string]: TranslitSubRuleItem[] },
        phaseIndex?: number,
        ruleIndex?: number): TranslitSubRuleItemParsed[] {
        const parsedSubRuleItems: TranslitSubRuleItemParsed[] = [];

        for (let i = 0; i < subRuleItems.length; i++) {
            const subRuleItem = subRuleItems[i];
            const parsedItems =
                this.parseTpl(
                    subRuleItem,
                    tplSeq,
                    tplVar,
                    globalTplVar,
                    postRulesDef,
                    phaseIndex,
                    ruleIndex, i) as TranslitSubRuleItemParsed[];
            parsedSubRuleItems.push(...parsedItems);
        }

        return parsedSubRuleItems;
    }
}

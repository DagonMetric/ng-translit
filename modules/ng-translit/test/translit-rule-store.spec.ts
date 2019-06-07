// tslint:disable: no-floating-promises

import { TestBed } from '@angular/core/testing';

import { TranslitRuleStore } from '../src/translit-rule-store';

describe('TranslitRuleStore', () => {
    it('should be created', () => {
        TestBed.configureTestingModule({});
        const translitRuleStore = TestBed.get<TranslitRuleStore>(TranslitRuleStore);

        expect(translitRuleStore).toBeDefined();
        expect(translitRuleStore instanceof TranslitRuleStore).toBeTruthy();
    });
});

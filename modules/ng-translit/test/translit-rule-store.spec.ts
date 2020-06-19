import { TestBed } from '@angular/core/testing';

import { TranslitRuleStore } from '../src/translit-rule-store';

describe('TranslitRuleStore', () => {
    it('should be created', () => {
        TestBed.configureTestingModule({});
        const translitRuleStore = TestBed.inject<TranslitRuleStore>(TranslitRuleStore);

        void expect(translitRuleStore).toBeDefined();
        void expect(translitRuleStore instanceof TranslitRuleStore).toBeTruthy();
    });
});

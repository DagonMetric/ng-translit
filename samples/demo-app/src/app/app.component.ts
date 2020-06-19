import { Component, ViewEncapsulation } from '@angular/core';

import { TranslitRuleItem, TranslitService } from '@dagonmetric/ng-translit';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class AppComponent {
    constructor(private readonly translitService: TranslitService) {
        const zg2uniRules: TranslitRuleItem[] = [
            {
                from: '\u103B([\u1000-\u1021])',
                to: '$1\u103C'
            },
            {
                from: '\u1039',
                to: '\u103A'
            }
        ];

        this.translitService.translit('ျမန္မာစာ', 'zg2uni', zg2uniRules).subscribe((result) => {
            // output: မြန်မာစာ
            // eslint-disable-next-line no-console
            console.log('output: ', result.outputText);
        });
    }
}

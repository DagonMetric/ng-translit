# Transliterate Service for Angular

[![Build Status](https://dev.azure.com/DagonMetric/ng-translit/_apis/build/status/DagonMetric.ng-translit?branchName=master)](https://dev.azure.com/DagonMetric/ng-translit/_build/latest?definitionId=8&branchName=master)
[![CircleCI](https://circleci.com/gh/DagonMetric/ng-translit/tree/master.svg?style=svg)](https://circleci.com/gh/DagonMetric/ng-translit/tree/master)
[![codecov](https://codecov.io/gh/DagonMetric/ng-translit/branch/master/graph/badge.svg)](https://codecov.io/gh/DagonMetric/ng-translit)
[![npm version](https://img.shields.io/npm/v/@dagonmetric/ng-translit.svg)](https://www.npmjs.com/package/@dagonmetric/ng-translit)
[![Gitter](https://badges.gitter.im/DagonMetric/general.svg)](https://gitter.im/DagonMetric/general?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge)

Powerful transliteration service for Angular applications which can be used in swapping letters such as α → a, ၎ → ၎င်း or Zawgyi-One to standard Myanmar Unicode.

## Features

* Can transliterate/convert any script or Unicode letters by using from a simplest rule definition (just with `from` and `to` rules) to more powerful rule definition (with `tplVar`, `tplSeq`, `when`, `postRules`, etc.)
* Can use transliteration rules in both design-time and run-time with JSON file which can be loaded lazily or eagerly using extendable `TranslitRuleLoader` (see built-in [HttpTranslitRuleLoader](https://github.com/DagonMetric/ng-translit/blob/master/modules/ng-translit/http-loader/src/http-translit-rule-loader.ts) for implementation demo)
* Can transliterate input phase by phase
* Can define template variables with `tplVar` to reduce JSON size and to avoid repetition
* Can define template loop sequences with `tplSeq` for sequential rules checking and replacement
* Quick test input string checking with `quickTests` and `minLength` options for better performance
* Can check converted left portion string with `hasLeft` boolean option and `left` regular expression option
* Can check right part after matched input string with `right` regular expression option
* Conditional rules processing with `when` and `skip` options
* Can define post-rules with `postRules` for step-by-step conversions
* Can use `postRulesDef` and `postRulesRef`  to reduce JSON size and to avoid repetition in defining `postRules`
* Conversion trace information can be included in output result for debugging purpose
* Work with latest versions of Angular
* Compatible with Angular Universal (Server Side Rendering - SSR)
* Powered with RxJS

## Getting Started

### Installation

npm

```bash
npm install @dagonmetric/ng-translit
```

or yarn

```bash
yarn add @dagonmetric/ng-translit
```

### Module Setup (app.module.ts)

The following code is a simple module setup with no rule loader.

```typescript
import { TranslitModule } from '@dagonmetric/ng-translit';

@NgModule({
  imports: [
    // Other module imports

    // ng-translit module
    TranslitModule
  ]
})
export class AppModule { }
```

### Usage (app.component.ts)

```typescript
import { Component } from '@angular/core';

import { TranslitRuleItem, TranslitService } from '@dagonmetric/ng-translit';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html'
})
export class AppComponent {
  constructor(private readonly _translitService: TranslitService) {
    const zg2uniRules: TranslitRuleItem[] = [{
      from: '\u103B([\u1000-\u1021])',
      to: '$1\u103C'
    },
    {
      from: '\u1039',
      to: '\u103A'
    }];

    this._translitService.translit('ျမန္မာစာ', 'zg2uni', zg2uniRules)
      .subscribe(result => {
        // output: မြန်မာစာ
        console.log('output: ', result.outputText);
      });
  }
}
```

### Documentation

* [ng-translit wiki](https://github.com/DagonMetric/ng-translit/wiki)

## Popular Transliterate Rules

* [zawgyi-unicode-translit-rules](https://github.com/myanmartools/zawgyi-unicode-translit-rules) - Zawgyi Unicode convert/transliterate rules in JSON and JavaScript formats using `ng-translit`

## Live Application

* [Zawgyi Unicode Converter](https://zawgyi-unicode-converter.myanmartools.org) - Angular Progress Web Application designed to convert Myanmar font encodings between Zawgyi-One and Standard Myanmar Unicode

## Feedback and Contributing

Check out the [Contributing](https://github.com/DagonMetric/ng-translit/blob/master/CONTRIBUTING.md) page to see the best places to log issues and start discussions.

## License

This repository is licensed with the [MIT](https://github.com/DagonMetric/ng-translit/blob/master/LICENSE) license.

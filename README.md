# Transliteration Modules for Angular

[![codecov](https://codecov.io/gh/DagonMetric/ng-translit/branch/master/graph/badge.svg)](https://codecov.io/gh/DagonMetric/ng-translit)
[![npm version](https://img.shields.io/npm/v/@dagonmetric/ng-translit.svg)](https://www.npmjs.com/package/@dagonmetric/ng-translit)
[![Dependency Status](https://david-dm.org/DagonMetric/ng-translit.svg)](https://david-dm.org/DagonMetric/ng-translit)
[![Gitter](https://badges.gitter.im/DagonMetric/general.svg)](https://gitter.im/DagonMetric/general?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge)

Contains transliteration modules for Angular applications which can be used in swapping letters such as α → a, ၎ → ၎င်း or Zawgyi-One to standard Myanmar Unicode.

## Modules

[ng-translit](modules/ng-translit)

Transliteration core service package for Angular.

[ng-translit-http-loader](modules/ng-translit/http-loader)

Implements an HTTP client API for `TranslitRuleLoader` that relies on the Angular `HttpClient`.

## Features

* Transliteration rules can be passed on the fly or can be defined in JSON file which can be loaded lazily or eagerly using extendable `TranslitRuleLoader` (see built-in [HttpTranslitRuleLoader](https://github.com/DagonMetric/ng-translit/blob/master/modules/ng-translit/http-loader/src/http-translit-rule-loader.ts) for implementation demo)
* Template variables or loop/sequence variables can be defined in rule to reduce JSON size and to avoid long repeated text or rule items
* Quick test character checking for better performance
* Post rules can be defined for step-by-step conversions
* Conversion trace information can be included in output result for debugging purpose
* Conditional rules with `when` options can be used
* Latest versions of Angular are supported
* Compatible with Angular Universal (Server Side Rendering - SSR)
* Powered with RxJS

## Getting Started

* [Documentation](https://github.com/DagonMetric/ng-translit/wiki)

## Transliteration Rules

* [zawgyi-unicode-translit-rules](https://github.com/myanmartools/zawgyi-unicode-translit-rules) - Zawgyi Unicode convert/transliterate rules in JSON.

## Live Application

* [Zawgyi Unicode Converter](https://zawgyi-unicode-converter.myanmartools.org) - real world Angular Progress Web Application designed to detect & convert Myanmar font encodings between Zawgyi-One and Standard Myanmar Unicode using `@dagonmetric/ng-translit`

## Feedback and Contributing

Check out the [Contributing](https://github.com/DagonMetric/ng-translit/blob/master/CONTRIBUTING.md) page to see the best places to log issues and start discussions.

## License

This repository is licensed with the [MIT](https://github.com/DagonMetric/ng-translit/blob/master/LICENSE) license.

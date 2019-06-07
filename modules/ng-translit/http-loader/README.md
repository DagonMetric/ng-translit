# HttpTranslitRuleLoader

Implements an HTTP client API for [TranslitRuleLoader](https://github.com/DagonMetric/ng-translit/blob/master/modules/ng-translit/src/translit-rule-loader.ts) that relies on the Angular `HttpClient`.

## Getting Started

### Module Setup (app.module.ts)

```typescript
import { TranslitModule } from '@dagonmetric/ng-translit';
import { HttpTranslitRuleLoaderModule } from '@dagonmetric/ng-translit/http-loader';

@NgModule({
  imports: [
    // Other module imports

    // ng-translit
    TranslitModule,
    HttpTranslitRuleLoaderModule.withOptions({
      baseUrl: 'https://zawgyi-unicode-translit-rules.myanmartools.org/rules/'
    })
  ]
})
export class AppModule { }
```

For more configuring information, see [HttpTranslitRuleLoaderModule wiki](https://github.com/DagonMetric/ng-translit/wiki/HttpTranslitRuleLoaderModule).

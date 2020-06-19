import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { TranslitModule } from '@dagonmetric/ng-translit';

import { AppComponent } from './app.component';

@NgModule({
    declarations: [AppComponent],
    imports: [
        CommonModule,
        BrowserModule,

        // ng-translit module
        TranslitModule
    ],
    bootstrap: [AppComponent]
})
export class AppModule {}

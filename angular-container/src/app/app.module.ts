import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { EffectsModule } from '@ngrx/effects';
import { StoreRouterConnectingModule, routerReducer } from '@ngrx/router-store';
import { StoreModule } from '@ngrx/store';
import { appReducer, appFeatureKey } from './store/app-state/reducers/app.reducer';
import { AppEffects } from './store/app-state/effects/app.effects';
import { HttpClientModule } from '@angular/common/http';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import { environment } from '../environments/environment';
import { DataService } from './services/data.service';
import { StoreBridgeService } from './services/store-bridge.service';
import {FormsModule} from "@angular/forms";


@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    EffectsModule.forRoot([AppEffects]),

    StoreRouterConnectingModule.forRoot(),
    StoreModule.forRoot(
      {
        router: routerReducer,
        [appFeatureKey]: appReducer
      },
      {
        runtimeChecks: {
          strictStateImmutability: true,
          strictActionImmutability: true,
        },
      },
    ),
    StoreDevtoolsModule.instrument({
      maxAge: 25, // Retains last 25 states
      logOnly: environment.production, // Restrict extension to log-only mode in production
    }),
    FormsModule,
  ],
  providers: [
    DataService,
    StoreBridgeService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }

import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { DataService } from '../../../services/data.service';
import * as AppActions from '../actions/app.actions';

@Injectable()
export class AppEffects {
  loadApp$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AppActions.loadApp),
      switchMap(() =>
        this.dataService.getSampleData().pipe(
          map(data => AppActions.loadAppSuccess({ data })),
          catchError(error => of(AppActions.loadAppFailure({ error: error.message })))
        )
      )
    )
  );
  // setData = createEffect(() =>
  //   this.actions$.pipe(
  //     ofType(AppActions.loadApp),
  //     switchMap(() =>
  //       this.dataService.getSampleData().pipe(
  //         map(data => AppActions.loadAppSuccess({ data })),
  //         catchError(error => of(AppActions.loadAppFailure({ error: error.message })))
  //       )
  //     )
  //   )
  // );

  constructor(
    private actions$: Actions,
    private dataService: DataService
  ) {}
}

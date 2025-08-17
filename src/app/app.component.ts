import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DeadlineService } from './deadline-service';
import { BehaviorSubject, interval, switchMap, takeWhile, tap } from 'rxjs';
import { AsyncPipe, NgIf } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet,NgIf,AsyncPipe],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  secondsLeft$ = new BehaviorSubject<number | null>(null);
  
  constructor(private deadlineService: DeadlineService) {
  }

  ngOnInit(): void {
    this.deadlineService.getDeadline()
      .pipe(
        tap(res => this.secondsLeft$.next(res.secondsLeft)), // initialize
        switchMap(res =>
          interval(1000).pipe(
            tap(i => {
              const newValue = res.secondsLeft - (i + 1);
              this.secondsLeft$.next(newValue > 0 ? newValue : 0);
            }),
            takeWhile((_, i) => res.secondsLeft - i > 0, true)
          )
        )
      )
      .subscribe();
  }
}

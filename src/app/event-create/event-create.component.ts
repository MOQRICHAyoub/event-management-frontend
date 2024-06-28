// event-create.component.ts
import { Component } from '@angular/core';
import { EventService } from '../event.service';
import { Event } from '../event';
import { Router } from '@angular/router';

@Component({
  selector: 'app-event-create',
  templateUrl: './event-create.component.html',
  styleUrls: ['./event-create.component.css']
})
export class EventCreateComponent {
  event: Event = {
    title: '',
    description: '',
    date: '',
    location: ''
  };

  constructor(private eventService: EventService, private router: Router) { }

  createEvent(): void {
    this.eventService.createEvent(this.event).subscribe(() => {
      this.router.navigate(['/events']);
    });
  }
}

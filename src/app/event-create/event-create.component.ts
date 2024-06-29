import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { EventService } from '../event.service';
import { Event } from '../event';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-event-create',
  templateUrl: './event-create.component.html',
  styleUrls: ['./event-create.component.css']
})
export class EventCreateComponent implements OnInit {
  event: Event = {
    title: '',
    description: '',
    date: '',
    location: ''
  };
  minDate: string = '';
  isDateValid: boolean = true;

  constructor(private eventService: EventService, private router: Router) { 
    this.setMinDate();
  }

  ngOnInit(): void { }

  setMinDate(): void {
    const today = new Date();
    const month = ('0' + (today.getMonth() + 1)).slice(-2);
    const day = ('0' + today.getDate()).slice(-2);
    this.minDate = `${today.getFullYear()}-${month}-${day}`;
  }

  checkDateValidity(): void {
    this.isDateValid = new Date(this.event.date).getTime() > new Date(this.minDate).getTime();
  }

  onSubmit(): void {
    if (this.event.title.length < 1 || this.event.title.length > 50) {
      Swal.fire('Error', 'Title should be between 1 and 50 characters', 'error');
      return;
    }
    if (this.event.description.length > 250) {
      Swal.fire('Error', 'Description should not exceed 250 characters', 'error');
      return;
    }
    if (!this.isDateValid) {
      Swal.fire('Error', 'Date should be in the future', 'error');
      return;
    }
    if (this.event.location.length < 1 || this.event.location.length > 25) {
      Swal.fire('Error', 'Location should be between 1 and 25 characters', 'error');
      return;
    }

    this.eventService.createEvent(this.event).subscribe(() => {
      Swal.fire({
        title: 'Success',
        text: 'Event created successfully',
        icon: 'success',
        confirmButtonText: 'OK'
      }).then((result) => {
        if (result.isConfirmed) {
          this.router.navigate(['']);
        }
      });
    });
  }
}

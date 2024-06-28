import { Component, OnInit } from '@angular/core';
import { EventService } from '../event.service';
import { Event } from '../event';
import { RegistrationService } from '../registration.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-event-list',
  templateUrl: './event-list.component.html',
  styleUrls: ['./event-list.component.css']
})
export class EventListComponent implements OnInit {
  events: Event[] = [];

  constructor(private eventService: EventService, private registrationService: RegistrationService) { }

  ngOnInit(): void {
    this.eventService.getEvents().subscribe(events => {
      this.events = events;
    });
  }

  showParticipants(eventId: number | undefined): void {
    if (eventId !== undefined) {
      this.registrationService.getParticipants(eventId).subscribe(participants => {
        const participantList = participants.map(p => p.username).join('<br>');
        Swal.fire({
          title: 'Participants',
          html: participantList || 'No participants yet',
          icon: 'info',
          confirmButtonText: 'OK'
        });
      });
    }
  }

  registerForEvent(eventId: number | undefined): void {
    if (eventId !== undefined) {
      Swal.fire({
        title: 'S\'inscrire',
        input: 'text',
        inputLabel: 'Votre nom',
        inputPlaceholder: 'Entrez votre nom',
        showCancelButton: true,
        confirmButtonText: 'OK',
        cancelButtonText: 'Annuler'
      }).then(result => {
        if (result.isConfirmed && result.value) {
          const userName = result.value;
          this.registrationService.register(userName, eventId).subscribe(() => {
            Swal.fire('Succès', 'Vous êtes inscrit à l\'événement', 'success');
          });
        }
      });
    }
  }
}

import { Component, OnInit } from '@angular/core';
import { EventService } from '../services/event.service';
import { Event } from '../event';
import { RegistrationService } from '../services/registration.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-event-list',
  templateUrl: './event-list.component.html',
  styleUrls: ['./event-list.component.css']
})
export class EventListComponent implements OnInit {
  events: Event[] = [];
  filteredEvents: Event[] = [];
  locations: string[] = [];
  filters = {
    name: '',
    startDate: '',
    endDate: '',
    locationSearch: '',
    selectedLocations: new Set<string>()
  };

  constructor(private eventService: EventService, private registrationService: RegistrationService) { }

  ngOnInit(): void {
    this.eventService.getEvents().subscribe(events => {
      const today = new Date().setHours(0, 0, 0, 0);
      this.events = events.filter(event => new Date(event.date).setHours(0, 0, 0, 0) >= today);

      this.events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      this.filteredEvents = this.events;
      this.locations = Array.from(new Set(this.events.map(event => event.location)));

      this.filters.selectedLocations = new Set(this.locations);
      this.applyFilters();
    });
  }

  applyFilters(): void {
    if (this.filters.selectedLocations.size === 0) {
      this.filteredEvents = [];
      return;
    }

    this.filteredEvents = this.events.filter(event => {
      const eventDate = new Date(event.date).setHours(0, 0, 0, 0);
      const startDate = this.filters.startDate ? new Date(this.filters.startDate).setHours(0, 0, 0, 0) : null;
      const endDate = this.filters.endDate ? new Date(this.filters.endDate).setHours(0, 0, 0, 0) : null;

      return (!this.filters.name || event.title.toLowerCase().includes(this.filters.name.toLowerCase())) &&
             (!startDate || eventDate >= startDate) &&
             (!endDate || eventDate <= endDate) &&
             this.filters.selectedLocations.has(event.location);
    });

    this.filteredEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  resetFilters(): void {
    this.filters = {
      name: '',
      startDate: '',
      endDate: '',
      locationSearch: '',
      selectedLocations: new Set(this.locations)
    };
    this.applyFilters();
  }

  toggleLocation(location: string): void {
    if (this.filters.selectedLocations.has(location)) {
      this.filters.selectedLocations.delete(location);
    } else {
      this.filters.selectedLocations.add(location);
    }
    this.applyFilters();
  }

  selectAllLocations(): void {
    this.filters.selectedLocations = new Set(this.locations);
    this.applyFilters();
  }

  deselectAllLocations(): void {
    this.filters.selectedLocations.clear();
    this.applyFilters();
  }

  filterLocations(): string[] {
    return this.locations.filter(location =>
      location.toLowerCase().includes(this.filters.locationSearch.toLowerCase())
    );
  }

  showParticipants(eventId: number | undefined): void {
    if (eventId !== undefined) {
      this.registrationService.getParticipants(eventId).subscribe(participants => {
        const participantList = participants.map(p => p.username).join('<br>');
        Swal.fire({
          title: 'Attendees',
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
        title: 'Register',
        input: 'text',
        inputLabel: 'Your name',
        inputPlaceholder: 'Enter your name',
        showCancelButton: true,
        confirmButtonText: 'OK',
        cancelButtonText: 'Cancel'
      }).then(result => {
        if (result.isConfirmed && result.value) {
          const userName = result.value;
          this.registrationService.isUserRegistered(eventId, userName).subscribe(isRegistered => {
            if (isRegistered) {
              Swal.fire('Error', 'A participant with this name is already registered.', 'error').then(() => {
                this.registerForEvent(eventId);
              });
            } else {
              this.registrationService.register(userName, eventId).subscribe(() => {
                Swal.fire('Success', 'You are registered for the event !', 'success');
              });
            }
          });
        }
      });
    }
  }
}

import { Component, OnInit } from '@angular/core';
import { EventService } from '../event.service';
import { Event } from '../event';
import { RegistrationService } from '../registration.service';
import { FeedbackService } from '../feedback.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-past-events',
  templateUrl: './past-events.component.html',
  styleUrls: ['./past-events.component.css']
})
export class PastEventsComponent implements OnInit {
  pastEvents: Event[] = [];
  filteredEvents: Event[] = [];
  locations: string[] = [];
  filters = {
    name: '',
    startDate: '',
    endDate: '',
    locationSearch: '',
    selectedLocations: new Set<string>()
  };

  constructor(private eventService: EventService, private registrationService: RegistrationService, private feedbackService: FeedbackService) { }

  ngOnInit(): void {
    this.eventService.getEvents().subscribe(events => {
      const today = new Date().setHours(0, 0, 0, 0); // Set the time to 00:00:00 for comparison
      this.pastEvents = events.filter(event => new Date(event.date).setHours(0, 0, 0, 0) < today);
      this.filteredEvents = this.pastEvents;
      this.locations = Array.from(new Set(this.pastEvents.map(event => event.location)));
    });
  }

  applyFilters(): void {
    this.filteredEvents = this.pastEvents.filter(event => {
      const eventDate = new Date(event.date).setHours(0, 0, 0, 0);
      const startDate = this.filters.startDate ? new Date(this.filters.startDate).setHours(0, 0, 0, 0) : null;
      const endDate = this.filters.endDate ? new Date(this.filters.endDate).setHours(0, 0, 0, 0) : null;

      return (!this.filters.name || event.title.toLowerCase().includes(this.filters.name.toLowerCase())) &&
             (!startDate || eventDate >= startDate) &&
             (!endDate || eventDate <= endDate) &&
             (this.filters.selectedLocations.size === 0 || this.filters.selectedLocations.has(event.location));
    });
  }

  resetFilters(): void {
    this.filters = {
      name: '',
      startDate: '',
      endDate: '',
      locationSearch: '',
      selectedLocations: new Set<string>()
    };
    this.filteredEvents = this.pastEvents;
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
          title: 'Participants',
          html: participantList || 'No participants yet',
          icon: 'info',
          confirmButtonText: 'OK'
        });
      });
    }
  }

  viewFeedback(eventId: number | undefined): void {
    if (eventId !== undefined) {
      this.feedbackService.getFeedbacks(eventId).subscribe(feedbacks => {
        const feedbackList = feedbacks.map(feedback => `Rating: ${feedback.rating} <br> Comment: ${feedback.comments}`).join('<br><br>');
        const averageRating = feedbacks.length ? (feedbacks.reduce((sum, feedback) => sum + feedback.rating, 0) / feedbacks.length).toFixed(2) : 'No ratings';
        Swal.fire({
          title: 'Feedbacks',
          html: `${feedbackList || 'No feedbacks yet'}<br><br><strong>Average Rating: ${averageRating} / 5</strong>`,
          icon: 'info',
          confirmButtonText: 'OK'
        });
      });
    }
  }

  evaluateEvent(eventId: number | undefined): void {
    if (eventId !== undefined) {
      this.registrationService.getParticipants(eventId).subscribe(participants => {
        const participantNames = participants.map(p => p.username);
        this.feedbackService.getFeedbacks(eventId).subscribe(feedbacks => {
          const feedbackNames = feedbacks.map(f => f.username);
          const availableParticipants = participantNames.filter(name => !feedbackNames.includes(name));

          if (availableParticipants.length === 0) {
            Swal.fire('Info', 'All participants have already given feedback for this event.', 'info');
            return;
          }

          Swal.fire({
            title: 'Evaluer l\'événement',
            input: 'select',
            inputOptions: availableParticipants.reduce((acc, name) => {
              acc[name] = name;
              return acc;
            }, {}),
            inputPlaceholder: 'Select your name',
            showCancelButton: true,
            confirmButtonText: 'Next',
            cancelButtonText: 'Cancel'
          }).then(result => {
            if (result.isConfirmed && result.value) {
              const userName = result.value;
              Swal.fire({
                title: 'Leave a feedback',
                html:
                  '<input id="rating" type="number" min="1" max="5" placeholder="Rating (1-5)" class="swal2-input">' +
                  '<textarea id="comments" placeholder="Comments" class="swal2-textarea"></textarea>',
                focusConfirm: false,
                preConfirm: () => {
                  const rating = (document.getElementById('rating') as HTMLInputElement).value;
                  const comments = (document.getElementById('comments') as HTMLTextAreaElement).value;
                  return { rating: parseInt(rating), comments };
                }
              }).then(feedbackResult => {
                if (feedbackResult.isConfirmed && feedbackResult.value) {
                  const { rating, comments } = feedbackResult.value;
                  if (rating >= 1 && rating <= 5 && comments) {
                    this.feedbackService.addFeedback({ eventid: eventId, username: userName, rating, comments }).subscribe(() => {
                      Swal.fire('Success', 'Your feedback has been submitted', 'success');
                    });
                  } else {
                    Swal.fire('Error', 'Please enter a valid rating (between 1 and 5) and comments', 'error');
                  }
                }
              });
            }
          });
        });
      });
    }
  }
}

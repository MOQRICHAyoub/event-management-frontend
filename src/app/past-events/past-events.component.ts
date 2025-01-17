import { Component, OnInit } from '@angular/core';
import { EventService } from '../services/event.service';
import { Event } from '../event';
import { RegistrationService } from '../services/registration.service';
import { FeedbackService } from '../services/feedback.service';
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
      const today = new Date().setHours(0, 0, 0, 0);
      this.pastEvents = events.filter(event => new Date(event.date).setHours(0, 0, 0, 0) < today);

      this.pastEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      this.filteredEvents = this.pastEvents;
      this.locations = Array.from(new Set(this.pastEvents.map(event => event.location)));

      this.filters.selectedLocations = new Set(this.locations);
      this.applyFilters();
    });
  }

  applyFilters(): void {
    if (this.filters.selectedLocations.size === 0) {
      this.filteredEvents = [];
      return;
    }

    this.filteredEvents = this.pastEvents.filter(event => {
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
          html: participantList || 'No one participated',
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
            title: 'Evaluate the event',
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
                  const ratingInput = document.getElementById('rating') as HTMLInputElement;
                  const rating = parseInt(ratingInput.value);
                  const comments = (document.getElementById('comments') as HTMLTextAreaElement).value;
                  return { rating, comments };
                }
              }).then(feedbackResult => {
                if (feedbackResult.isConfirmed && feedbackResult.value) {
                  const { rating, comments } = feedbackResult.value;
                  if (!comments) {
                    Swal.fire('Error', 'Please leave a comment', 'error');
                  } else if (rating < 1 || rating > 5){
                    Swal.fire('Error', 'Please enter a  rating between 1 and 5', 'error');
                  } else {
                    this.feedbackService.addFeedback({ eventid: eventId, username: userName, rating, comments }).subscribe(() => {
                      Swal.fire('Success', 'Your feedback has been submitted', 'success');
                    });
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

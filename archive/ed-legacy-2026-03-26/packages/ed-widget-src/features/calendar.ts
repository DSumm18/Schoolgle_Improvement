/**
 * Calendar - School events and term dates integration
 */

export interface SchoolEvent {
  id: string;
  title: string;
  date: Date;
  endDate?: Date;
  type: 'term' | 'holiday' | 'event' | 'deadline';
  description?: string;
}

export class Calendar {
  private events: SchoolEvent[] = [];

  /**
   * Load events from school API
   */
  public async loadEvents(_schoolId: string): Promise<void> {
    // In production, fetch from Schoolgle API
    // For now, use sample data
    this.events = this.getSampleEvents();
  }

  /**
   * Get upcoming events
   */
  public getUpcoming(limit = 5): SchoolEvent[] {
    const now = new Date();
    return this.events
      .filter((event) => event.date >= now)
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, limit);
  }

  /**
   * Get events for a specific date
   */
  public getEventsForDate(date: Date): SchoolEvent[] {
    return this.events.filter((event) => {
      const eventDate = new Date(event.date);
      return (
        eventDate.getFullYear() === date.getFullYear() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getDate() === date.getDate()
      );
    });
  }

  /**
   * Get current term info
   */
  public getCurrentTerm(): SchoolEvent | null {
    const now = new Date();
    return (
      this.events.find(
        (event) =>
          event.type === 'term' &&
          event.date <= now &&
          (event.endDate ? event.endDate >= now : true)
      ) || null
    );
  }

  /**
   * Get next holiday
   */
  public getNextHoliday(): SchoolEvent | null {
    const now = new Date();
    return (
      this.events.find(
        (event) => event.type === 'holiday' && event.date > now
      ) || null
    );
  }

  /**
   * Format event for display
   */
  public formatEvent(event: SchoolEvent): string {
    const dateStr = event.date.toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });

    if (event.endDate) {
      const endStr = event.endDate.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
      });
      return `${event.title}: ${dateStr} - ${endStr}`;
    }

    return `${event.title}: ${dateStr}`;
  }

  /**
   * Get summary for AI context
   */
  public getSummaryForAI(): string {
    const current = this.getCurrentTerm();
    const upcoming = this.getUpcoming(3);
    const nextHoliday = this.getNextHoliday();

    let summary = '';

    if (current) {
      summary += `Current term: ${current.title}\n`;
    }

    if (nextHoliday) {
      summary += `Next holiday: ${this.formatEvent(nextHoliday)}\n`;
    }

    if (upcoming.length > 0) {
      summary += `Upcoming events:\n`;
      upcoming.forEach((event) => {
        summary += `- ${this.formatEvent(event)}\n`;
      });
    }

    return summary;
  }

  /**
   * Sample events for demo
   */
  private getSampleEvents(): SchoolEvent[] {
    const year = new Date().getFullYear();

    return [
      {
        id: '1',
        title: 'Autumn Term',
        date: new Date(year, 8, 4), // September 4
        endDate: new Date(year, 11, 20), // December 20
        type: 'term',
      },
      {
        id: '2',
        title: 'Half Term Break',
        date: new Date(year, 9, 23), // October 23
        endDate: new Date(year, 9, 27),
        type: 'holiday',
      },
      {
        id: '3',
        title: 'Christmas Break',
        date: new Date(year, 11, 21), // December 21
        endDate: new Date(year + 1, 0, 5), // January 5
        type: 'holiday',
      },
      {
        id: '4',
        title: 'Open Evening',
        date: new Date(year, 9, 15), // October 15
        type: 'event',
        description: 'School open evening for prospective parents',
      },
      {
        id: '5',
        title: 'Admissions Deadline',
        date: new Date(year + 1, 0, 15), // January 15
        type: 'deadline',
        description: 'Deadline for Reception class applications',
      },
      {
        id: '6',
        title: 'Parents Evening',
        date: new Date(year, 10, 12), // November 12
        type: 'event',
      },
      {
        id: '7',
        title: 'Christmas Concert',
        date: new Date(year, 11, 15), // December 15
        type: 'event',
      },
    ];
  }
}

// Export singleton
export const calendar = new Calendar();


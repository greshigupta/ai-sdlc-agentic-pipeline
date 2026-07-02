import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { SnipApiService, SnipLink } from './snip-api.service';

@Component({
  selector: 'app-root',
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  private readonly api = inject(SnipApiService);

  readonly urlInput = signal('');
  readonly links = signal<SnipLink[]>([]);
  readonly loading = signal(false);
  readonly submitting = signal(false);
  readonly errorMessage = signal('');
  readonly createdLink = signal<SnipLink | null>(null);

  readonly canSubmit = computed(
    () => this.isValidHttpUrl(this.urlInput().trim()) && !this.submitting()
  );

  ngOnInit(): void {
    this.loadLinks();
  }

  shortenUrl(): void {
    const url = this.urlInput().trim();
    this.errorMessage.set('');
    this.createdLink.set(null);

    if (!this.isValidHttpUrl(url)) {
      this.errorMessage.set('Please enter a valid http(s) URL.');
      return;
    }

    this.submitting.set(true);

    this.api.createLink(url).subscribe({
      next: (link) => {
        this.createdLink.set(link);
        this.links.update((current) => [link, ...current]);
        this.urlInput.set('');
        this.submitting.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(this.readApiError(error));
        this.submitting.set(false);
      },
    });
  }

  loadLinks(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.api.getLinks().subscribe({
      next: (links) => {
        this.links.set(links);
        this.loading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(this.readApiError(error));
        this.loading.set(false);
      },
    });
  }

  private isValidHttpUrl(value: string): boolean {
    try {
      const parsed = new URL(value);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }

  private readApiError(error: HttpErrorResponse): string {
    if (error.error && typeof error.error === 'object' && typeof error.error.error === 'string') {
      return error.error.error;
    }

    if (typeof error.error === 'string' && error.error.trim()) {
      return error.error;
    }

    return 'Request failed. Check that backend is running at http://localhost:3000.';
  }
}

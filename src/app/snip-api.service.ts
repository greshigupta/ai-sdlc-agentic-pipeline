import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface SnipLink {
  code: string;
  url: string;
  shortUrl: string;
  hits: number;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class SnipApiService {
  private readonly linksUrl = 'http://localhost:3000/api/links';

  constructor(private readonly http: HttpClient) {}

  getLinks(): Observable<SnipLink[]> {
    return this.http.get<SnipLink[]>(this.linksUrl);
  }

  createLink(url: string): Observable<SnipLink> {
    return this.http.post<SnipLink>(this.linksUrl, { url });
  }
}
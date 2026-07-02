import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AppComponent } from './app.component';
import { SnipApiService } from './snip-api.service';

const snipApiServiceMock = {
  getLinks: () => of([]),
  createLink: () => of({
    code: 'ABC123',
    url: 'https://example.com',
    shortUrl: 'http://localhost:3000/ABC123',
    hits: 0,
    createdAt: new Date().toISOString(),
  }),
};

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [{ provide: SnipApiService, useValue: snipApiServiceMock }],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render heading', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Snip');
  });
});

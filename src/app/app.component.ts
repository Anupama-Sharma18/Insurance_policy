import { CommonModule } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, Observable, Subscription } from 'rxjs';
import { PortalDataService } from './core/services/portal-data.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnDestroy {
  readonly demoMode$: Observable<boolean>;
  sidebarOpen = false;
  pageTitle = 'Overview';
  private routeSub: Subscription;
  readonly navigation = [
    { label: 'Overview', path: '/dashboard', icon: '⌂', section: 'WORKSPACE' },
    { label: 'Policies', path: '/policies', icon: '▤', section: 'POLICY OPERATIONS' },
    { label: 'Renewals', path: '/renewals', icon: '⟳', section: 'POLICY OPERATIONS' },
    { label: 'Service requests', path: '/servicing', icon: '◈', section: 'CUSTOMER CARE' },
    { label: 'Cancellations', path: '/cancellations', icon: '↗', section: 'CUSTOMER CARE' }
  ];

  constructor(private router: Router, private data: PortalDataService) {
    this.demoMode$ = this.data.demoMode$;
    this.setPageTitle(this.router.url);
    this.routeSub = this.router.events.pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd)).subscribe(event => {
      this.setPageTitle(event.urlAfterRedirects); this.sidebarOpen = false;
    });
  }
  hasNavigationSection(section: string): boolean {
    return this.navigation.some(item => item.section === section);
  }

  private setPageTitle(url: string): void {
    const path = url.split('?')[0];
    this.pageTitle = this.navigation.find(item => item.path === path)?.label ?? 'Overview';
  }
  ngOnDestroy(): void { this.routeSub.unsubscribe(); }
}

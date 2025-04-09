import { Component, OnInit, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { loadApp } from './store/app-state/actions/app.actions';
import { selectAppData, selectAppLoaded, selectAppLoading, selectAppError } from './store/app-state/selectors/app.selectors';
import { StoreBridgeService } from './services/store-bridge.service';
import { DataService } from './services/data.service';

// Define interfaces
interface DataItem {
  id: number;
  name: string;
  description: string;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  searchTerm: string = '';
  title = 'angular-container';
  loading$: Observable<boolean>;
  loaded$: Observable<boolean>;
  data$: Observable<DataItem[]>;
  error$: Observable<string | null>;
  
  // New item form data
  newItem: { name: string; description: string } = {
    name: '',
    description: ''
  };

  constructor(
    private store: Store,
    private storeBridgeService: StoreBridgeService,
    public dataService: DataService  // Inject DataService with public access
  ) {
    this.loading$ = this.store.select(selectAppLoading);
    this.loaded$ = this.store.select(selectAppLoaded);
    this.data$ = this.store.select(selectAppData);
    this.error$ = this.store.select(selectAppError);
  }

  ngOnInit(): void {
    // Load data into store
    this.store.dispatch(loadApp());

    // Start broadcasting store updates via custom events
    // This is more secure than exposing the store on window
    this.storeBridgeService.startBroadcastingStoreUpdates();
  }

  ngOnDestroy(): void {
    // Clean up subscriptions when component is destroyed
    this.storeBridgeService.stopBroadcastingStoreUpdates();
  }
  
  /**
   * Add a custom data item from the form
   */
  addCustomData(): void {
    // Create a custom item with form data
    const customItem = {
      name: this.newItem.name,
      description: this.newItem.description
    };
    
    // Add the item via the data service
    this.dataService.addCustomItem(customItem).subscribe((data: DataItem[]) => {
      // Reload data into store to update all components
      this.store.dispatch(loadApp());
      
      // Reset form
      this.newItem = { name: '', description: '' };
    });
  }
  
  /**
   * Add multiple random data items
   */
  addMoreData(count: number): void {
    this.dataService.addMoreData(count).subscribe((data: DataItem[]) => {
      // Reload data into store to update all components
      this.store.dispatch(loadApp());
    });
  }
  
  /**
   * Reset data to initial state
   */
  resetData(): void {
    this.dataService.resetData().subscribe((data: DataItem[]) => {
      // Reload data into store to update all components
      this.store.dispatch(loadApp());
    });
  }
}

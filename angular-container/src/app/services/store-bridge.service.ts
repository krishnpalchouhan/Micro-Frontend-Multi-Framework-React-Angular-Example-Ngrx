import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';
import { selectAppData, selectAppLoaded, selectAppLoading, selectAppError } from '../store/app-state/selectors/app.selectors';
import { distinctUntilChanged } from 'rxjs/operators';
import { DataService } from './data.service';

/**
 * Angular-React Communication Architecture
 * =======================================
 * 
 * This service acts as a bridge between Angular's NgRx store and the React MFE.
 * It establishes bidirectional communication using the BroadcastChannel API, allowing
 * data to flow between the Angular container and React micro-frontend without direct
 * dependencies or tight coupling.
 * 
 * Key Features:
 * -------------
 * 1. Broadcasts NgRx store changes to React MFE
 * 2. Listens for data requests from React
 * 3. Handles data modification requests from React
 * 4. Sanitizes data before sharing (to protect sensitive info)
 * 
 * Communication Flow:
 * ------------------
 * Angular → React: Store data and loading state updates
 * React → Angular: Requests for data, requests to add/reset data
 * 
 * This approach provides a more secure architecture than exposing
 * the NgRx store directly on the window object.
 */

// Define custom event types for the BroadcastChannel
export interface StoreDataEvent {
  type: 'APP_STORE_DATA_UPDATE' | 'APP_STORE_LOADING_UPDATE' | 'APP_STORE_ERROR_UPDATE';
  payload: any;
}

@Injectable()
export class StoreBridgeService {
  // Subscriptions for NgRx store selectors
  private dataSubscription: Subscription | null = null;
  private loadingSubscription: Subscription | null = null;
  private errorSubscription: Subscription | null = null;
  
  // Event type constants for communication with React MFE
  private readonly DATA_EVENT = 'APP_STORE_DATA_UPDATE';           // Send data updates to React
  private readonly LOADING_EVENT = 'APP_STORE_LOADING_UPDATE';     // Send loading state to React
  private readonly REQUEST_DATA_EVENT = 'APP_STORE_REQUEST_DATA';  // Receive data requests from React
  private readonly REQUEST_LOADING_EVENT = 'APP_STORE_REQUEST_LOADING'; // Receive loading state requests
  private readonly ADD_MORE_DATA_EVENT = 'APP_STORE_ADD_MORE_DATA';     // Receive request to add data
  private readonly RESET_DATA_EVENT = 'APP_STORE_RESET_DATA';           // Receive request to reset data
  
  // Track number of active listeners to manage broadcasting lifecycle
  private activeListeners = 0;
  
  // BroadcastChannel for cross-framework communication
  // This works for apps on the same origin
  private broadcastChannel = new BroadcastChannel('store-updates');
  
  /**
   * Constructor injects the NgRx store and DataService
   * Initializes the request listeners for React communication
   */
  constructor(
    private store: Store,
    private dataService: DataService
  ) {
    // Set up listeners for requests from React components
    this.setupRequestListeners();
  }

  /**
   * Set up listeners for requests from React MFE
   * This handles all incoming messages from React via BroadcastChannel
   */
  private setupRequestListeners(): void {
    // Listen for data requests on the broadcast channel
    this.broadcastChannel.onmessage = (event) => {
      if (event.data && event.data.type) {
        // Handle data request events from React
        if (event.data.type === this.REQUEST_DATA_EVENT) {
          console.log('Angular: Received request for current data');
          this.sendCurrentData();
        }
        
        // Handle loading state request events from React
        if (event.data.type === this.REQUEST_LOADING_EVENT) {
          console.log('Angular: Received request for current loading state');
          this.sendCurrentLoadingState();
        }
        
        // Handle add more data request events from React
        if (event.data.type === this.ADD_MORE_DATA_EVENT) {
          console.log('Angular: Received request to add more data');
          this.handleAddMoreData(event.data.payload);
        }
        
        // Handle reset data request events from React
        if (event.data.type === this.RESET_DATA_EVENT) {
          console.log('Angular: Received request to reset data');
          this.handleResetData();
        }
      }
    };
  }

  /**
   * Send the current data state to React
   * This is called when React initially loads or requests a refresh
   */
  private sendCurrentData(): void {
    // Get current data from store and send it once
    this.store.select(selectAppData)
      .pipe(distinctUntilChanged())
      .subscribe(data => {
        // Sanitize the data before sending to React
        const safeData = this.sanitizeData(data);
        this.dispatchStoreEvent(this.DATA_EVENT, safeData);
      })
      .unsubscribe(); // Unsubscribe immediately after getting the data once
  }

  /**
   * Send the current loading state to React
   * This is called when React initially loads or requests a refresh
   */
  private sendCurrentLoadingState(): void {
    // Get current loading state from store and send it once
    this.store.select(selectAppLoading)
      .subscribe(loading => {
        // Send current loading state through the channel
        this.dispatchStoreEvent(this.LOADING_EVENT, loading);
      })
      .unsubscribe(); // Unsubscribe immediately after getting the data once
  }

  /**
   * Start broadcasting store updates as custom events to React
   * This establishes continuous updates whenever store data changes
   */
  startBroadcastingStoreUpdates(): void {
    // Clean up any existing subscriptions first
    this.cleanupSubscriptions();
    
    // Subscribe to store data updates and dispatch custom events
    // This subscription will stay active until stopBroadcastingStoreUpdates is called
    this.dataSubscription = this.store.select(selectAppData)
      .pipe(
        // Only send updates when data actually changes to reduce unnecessary messages
        distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr))
      )
      .subscribe(data => {
        // Only share safe data - sanitize if needed
        const safeData = this.sanitizeData(data);
        this.dispatchStoreEvent(this.DATA_EVENT, safeData);
      });
    
    // Subscribe to loading state changes
    this.loadingSubscription = this.store.select(selectAppLoading)
      .pipe(
        distinctUntilChanged()
      )
      .subscribe(loading => {
        this.dispatchStoreEvent(this.LOADING_EVENT, loading);
      });
  }
  
  /**
   * Stop broadcasting store updates
   * Used when component is destroyed or no listeners remain
   */
  stopBroadcastingStoreUpdates(): void {
    this.cleanupSubscriptions();
  }
  
  /**
   * Clean up all subscriptions to prevent memory leaks
   */
  private cleanupSubscriptions(): void {
    if (this.dataSubscription) {
      this.dataSubscription.unsubscribe();
      this.dataSubscription = null;
    }
    
    if (this.loadingSubscription) {
      this.loadingSubscription.unsubscribe();
      this.loadingSubscription = null;
    }
    
    if (this.errorSubscription) {
      this.errorSubscription.unsubscribe();
      this.errorSubscription = null;
    }
  }
  
  /**
   * Handle request from React to add more data items
   * This is triggered when React sends an ADD_MORE_DATA event
   */
  private handleAddMoreData(count: number = 5): void {
    console.log(`Angular: Adding ${count} more data items`);
    
    // Call the DataService to add more data items
    this.dataService.addMoreData(count).subscribe({
      next: (data: any[]) => {
        // Send immediate update to React with the new data
        const safeData = this.sanitizeData(data);
        this.dispatchStoreEvent(this.DATA_EVENT, safeData);
        
        // Update loading state to indicate operation is complete
        this.dispatchStoreEvent(this.LOADING_EVENT, false);
      },
      error: (error: Error) => {
        console.error('Error adding more data:', error);
        this.dispatchStoreEvent(this.LOADING_EVENT, false);
      }
    });
  }
  
  /**
   * Handle request from React to reset data to initial state
   * This is triggered when React sends a RESET_DATA event
   */
  private handleResetData(): void {
    console.log('Angular: Resetting data');
    
    // Call the DataService to reset data to initial state
    this.dataService.resetData().subscribe({
      next: (data: any[]) => {
        // Send immediate update to React with the reset data
        const safeData = this.sanitizeData(data);
        this.dispatchStoreEvent(this.DATA_EVENT, safeData);
        
        // Update loading state to indicate operation is complete
        this.dispatchStoreEvent(this.LOADING_EVENT, false);
      },
      error: (error: Error) => {
        console.error('Error resetting data:', error);
        this.dispatchStoreEvent(this.LOADING_EVENT, false);
      }
    });
  }
  
  /**
   * Dispatch a custom event with store data to React
   * This is the core method for sending data to React MFE
   */
  private dispatchStoreEvent(eventType: string, payload: any): void {
    // Post message to BroadcastChannel to send to React
    this.broadcastChannel.postMessage({
      type: eventType,
      payload
    });
  }
  
  /**
   * Sanitize data before sharing with React
   * This is where you would filter out sensitive information
   */
  private sanitizeData(data: any): any {
    // If data is null, return empty array
    if (!data) return [];
    
    // Example: If data is an array of objects with sensitive fields, filter them out
    if (Array.isArray(data)) {
      return data.map(item => {
        // Create a safe copy of the item
        const safeCopy = {...item};
        
        // Remove sensitive fields if present
        // Example: (uncomment if needed)
        // delete safeCopy.token;
        // delete safeCopy.password;
        
        return safeCopy;
      });
    }
    
    // For other types, simply return the data
    return data;
  }

  /**
   * Method for React to call when it mounts
   * Increments active listeners count and starts broadcasting if needed
   */
  activateBroadcasting(): void {
    this.activeListeners++;
    if (this.activeListeners === 1) {
      // Only start broadcasting if this is the first listener
      this.startBroadcastingStoreUpdates();
    }
  }

  /**
   * Method for React to call when it unmounts
   * Decrements active listeners count and stops broadcasting if no listeners remain
   */
  deactivateBroadcasting(): void {
    this.activeListeners--;
    if (this.activeListeners <= 0) {
      // Stop broadcasting when no listeners remain
      this.stopBroadcastingStoreUpdates();
      this.activeListeners = 0; // Prevent negative counts
    }
  }
} 
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

interface DataItem {
  id: number;
  name: string;
  description: string;
}

@Injectable()
export class DataService {
  private sampleData = [
    { id: 1, name: 'Item 1', description: 'Description for item 1' },
    { id: 2, name: 'Item 2', description: 'Description for item 2' },
    { id: 3, name: 'Item 3', description: 'Description for item 3' },
    { id: 4, name: 'Item 4', description: 'Description for item 4' },
    { id: 5, name: 'Item 5', description: 'Description for item 5' },
    { id: 6, name: 'Item 6', description: 'Description for item 6' },
    { id: 7, name: 'Item 7', description: 'Description for item 7' }
  ];

  constructor() { }

  getSampleData(): Observable<DataItem[]> {
    // Simulate network delay
    return of([...this.sampleData]).pipe(delay(1000));
  }

  /**
   * Add a custom item to the data
   */
  addCustomItem(item: { name: string; description: string }): Observable<DataItem[]> {
    // Generate a new ID
    const newId = this.sampleData.length + 1;
    
    // Create the complete item with ID
    const newItem: DataItem = {
      id: newId,
      name: item.name,
      description: item.description
    };
    
    // Add to the sample data
    this.sampleData.push(newItem);
    
    // Return updated data with simulated delay
    return of([...this.sampleData]).pipe(delay(500));
  }

  addMoreData(count: number = 5): Observable<DataItem[]> {
    // Generate new items
    const newItems = Array.from({ length: count }, (_, index) => {
      const newId = this.sampleData.length + index + 1;
      return {
        id: newId,
        name: `Item ${newId}`,
        description: `Description for item ${newId}`
      };
    });

    // Add new items to sample data
    this.sampleData = [...this.sampleData, ...newItems];

    // Return updated data with simulated delay
    return of([...this.sampleData]).pipe(delay(500));
  }

  resetData(): Observable<DataItem[]> {
    // Reset to initial data
    this.sampleData = [
      { id: 1, name: 'Item 1', description: 'Description for item 1' },
      { id: 2, name: 'Item 2', description: 'Description for item 2' },
      { id: 3, name: 'Item 3', description: 'Description for item 3' },
      { id: 4, name: 'Item 4', description: 'Description for item 4' },
      { id: 5, name: 'Item 5', description: 'Description for item 5' },
      { id: 6, name: 'Item 6', description: 'Description for item 6' },
      { id: 7, name: 'Item 7', description: 'Description for item 7' }
    ];

    // Return reset data with simulated delay
    return of([...this.sampleData]).pipe(delay(500));
  }
}

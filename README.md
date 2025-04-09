# Micro-Frontend Multi-Framework Example

This project demonstrates a micro-frontend architecture using Angular as the container application and React as a micro-frontend. The two frameworks communicate using the BroadcastChannel API, allowing for seamless data sharing between different JavaScript frameworks.

## Architecture Overview

This application uses a **Framework Agnostic Communication Architecture** allowing Angular and React components to communicate without direct dependencies on each other.

```
┌───────────────────────────────────── ANGULAR CONTAINER ──────────────────────────────────────┐
│                                                                                               │
│  ┌─────────────────┐           ┌─────────────────┐           ┌──────────────────────┐        │
│  │                 │  actions  │                 │  selects  │                      │        │
│  │  AppComponent   │───────────▶   NgRx Store   ◀───────────│  StoreBridgeService  │        │
│  │  (UI + Form)    │           │                 │           │                      │        │
│  │                 │◀──────────│   - AppState    │           │  - Listens for       │        │
│  └─────────────────┘  updates  │   - Reducers    │───────────▶    React requests    │        │
│         │                      │   - Selectors   │           │  - Broadcasts        │        │
│         │                      │                 │           │    store updates     │        │
│         │                      └─────────────────┘           │                      │        │
│         │                              ▲                     └──────────┬───────────┘        │
│         │                              │                                │                    │
│         │                              │ dispatches                     │                    │
│         │                              │ actions                        │                    │
│         ▼                              │                                ▼                    │
│  ┌─────────────────┐           ┌──────┴──────────┐      ┌─────────────────────────────┐     │
│  │                 │           │                 │      │                             │     │
│  │  Form Controls  │           │   AppEffects    │      │     BroadcastChannel       │     │
│  │                 │           │                 │      │     'store-updates'        │     │
│  │  - Add Item     │           │  - Handles      │      │                             │     │
│  │  - Add Random   │───────────▶    async        │      └─────────────┬───────────────┘     │
│  │  - Reset Data   │           │    operations   │                    │                     │
│  │                 │           │                 │                    │                     │
│  └─────────────────┘           └─────────────────┘                    │                     │
│         │                              ▲                              │                     │
│         │                              │                              │                     │
│         │                              │                              │                     │
│         ▼                              │                              ▼                     │
│  ┌─────────────────┐           ┌──────┴──────────┐                                          │
│  │                 │           │                 │                                          │
│  │  DataService    │───────────▶   Sample Data   │                                          │
│  │                 │           │   Management    │                                          │
│  │  - getSampleData│           │                 │                                          │
│  │  - addMoreData  │           │  - Generate     │                                          │
│  │  - resetData    │           │    random data  │                                          │
│  │  - addCustomItem│           │  - Create IDs   │                                          │
│  │                 │           │                 │                                          │
│  └─────────────────┘           └─────────────────┘                                          │
│                                                                                             │
└─────────────────────────────────────────┬─────────────────────────────────────────────────┘
                                          │
                                          │ BroadcastChannel API
                                          │ Cross-Framework Communication
                                          │
                                          ▼
┌───────────────────────────────────── REACT MFE ─────────────────────────────────────────────┐
│                                                                                              │
│  ┌─────────────────┐           ┌─────────────────┐           ┌──────────────────────┐       │
│  │                 │           │                 │           │                      │       │
│  │  React App      │───────────▶  Local State    │◀──────────│  BroadcastChannel    │       │
│  │  Component      │           │                 │           │  Message Handler     │       │
│  │                 │           │  - data[]       │           │                      │       │
│  │  - Table UI     │◀──────────│  - loading      │───────────▶  - Processes events  │       │
│  │  - Controls     │           │  - storeAvailable│          │  - Updates state     │       │
│  │                 │           │                 │           │                      │       │
│  └─────────────────┘           └─────────────────┘           └──────────┬───────────┘       │
│         │                                                               │                   │
│         │                                                               │                   │
│         ▼                                                               ▼                   │
│  ┌─────────────────┐                                          ┌─────────────────────────┐   │
│  │                 │                                          │                         │   │
│  │  UI Controls    │                                          │    Event Dispatchers    │   │
│  │                 │                                          │                         │   │
│  │  - Request more │──────────────────────────────────────────▶  - REQUEST_DATA        │   │
│  │    data (input) │                                          │  - ADD_MORE_DATA       │   │
│  │  - Reset data   │                                          │  - RESET_DATA          │   │
│  │  - Retry        │                                          │                         │   │
│  │    connection   │                                          │                         │   │
│  │                 │                                          │                         │   │
│  └─────────────────┘                                          └─────────────────────────┘   │
│                                                                                             │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

## Key Components

### Angular Container Application

1. **App Component**
   - Main container for the application
   - Contains a form to add, generate, and reset data
   - Displays the current data from the store

2. **StoreBridgeService**
   - Bridges Angular's NgRx store with React components
   - Listens for requests from React via BroadcastChannel
   - Broadcasts store updates when data changes
   - Handles data sanitization before sharing

3. **DataService**
   - Manages the sample data
   - Provides methods to:
     - Get sample data
     - Add custom items
     - Add random items
     - Reset data to initial state

4. **NgRx Store**
   - Manages the application state
   - Includes actions, reducers, selectors, and effects
   - Handles data loading and state updates

### React Micro-Frontend

1. **App Component**
   - Renders the React micro-frontend
   - Communicates with Angular via BroadcastChannel
   - Manages local state for UI rendering

2. **BroadcastChannel Message Handling**
   - Listens for store updates from Angular
   - Processes different event types
   - Updates component state based on received data

3. **UI Controls**
   - Allows user to request more data from Angular
   - Allows user to reset data
   - Shows connection status with Angular

## Communication Flow

### Event Types

The application uses predefined event types for communication:

```javascript
const STORE_EVENTS = {
  DATA: 'APP_STORE_DATA_UPDATE',        // Event when store data changes (Angular → React)
  LOADING: 'APP_STORE_LOADING_UPDATE',  // Event when loading state changes (Angular → React)
  REQUEST_DATA: 'APP_STORE_REQUEST_DATA',        // Request current data (React → Angular)
  REQUEST_LOADING: 'APP_STORE_REQUEST_LOADING',  // Request loading state (React → Angular)
  ADD_MORE_DATA: 'APP_STORE_ADD_MORE_DATA',      // Request to add more data (React → Angular)
  RESET_DATA: 'APP_STORE_RESET_DATA'             // Request to reset data (React → Angular)
};
```

### Data Request Flow

When React requests data from Angular:

1. React sends a `REQUEST_DATA` event via BroadcastChannel
2. Angular's StoreBridgeService receives the request
3. StoreBridgeService gets data from the NgRx store
4. StoreBridgeService sanitizes the data
5. Angular sends a `DATA_UPDATE` event back to React
6. React updates its local state and re-renders

### Adding More Data Flow

When a user adds more data (from either Angular or React):

1. User submits form or clicks "Add More Data" button
2. Request is processed by the appropriate component
3. DataService generates new data items
4. Store is updated with new data
5. Angular broadcasts the updated data
6. React receives the update and refreshes its view

## How to Run the Project

1. **Install Dependencies**

   In the project root:
   ```bash
   cd angular-container
   npm install
   cd ../react-mfe
   npm install
   ```

2. **Start the Angular Container**

   ```bash
   cd angular-container
   npm start
   ```

3. **Start the React Micro-Frontend**

   ```bash
   cd react-mfe
   npm start
   ```

4. **Access the Application**

   Open your browser to:
   - Angular Container: `http://localhost:4200`
   - React MFE directly: `http://localhost:3000`

## Features

1. **Data Management**
   - Add custom data items with name and description
   - Generate random data items
   - Reset data to initial state

2. **Cross-Framework Communication**
   - Real-time updates between Angular and React
   - Framework-agnostic messaging
   - Secure data sharing with sanitization

3. **UI Features**
   - Form for adding custom data
   - Controls for generating random data
   - Data table showing current items
   - Connection status indicators

## Technical Details

### BroadcastChannel API

The application uses the BroadcastChannel API for cross-framework communication:

```javascript
// Create a channel
const broadcastChannel = new BroadcastChannel('store-updates');

// Send a message
broadcastChannel.postMessage({
  type: 'EVENT_TYPE',
  payload: data
});

// Receive messages
broadcastChannel.onmessage = (event) => {
  if (event.data && event.data.type) {
    // Process message
  }
};
```

### Angular NgRx Store

The Angular application uses NgRx for state management:

- **Actions**: Define what happened (loadApp, loadAppSuccess, etc.)
- **Reducers**: Update state based on actions
- **Selectors**: Get specific data from the store
- **Effects**: Handle side effects like API calls

### React Component Structure

The React MFE is structured as a class component with:

- Constructor for initialization
- Lifecycle methods (componentDidMount, componentWillUnmount)
- Event handlers for user interactions
- Render method with conditional UI based on state

## Best Practices Demonstrated

1. **Loose Coupling**
   - Frameworks communicate without dependencies on each other
   - BroadcastChannel provides an event-based messaging system

2. **Data Sanitization**
   - Data is sanitized before sharing between frameworks
   - Prevents accidental sharing of sensitive information

3. **State Management**
   - Angular uses NgRx for robust state management
   - React manages local component state
   - Changes in one framework are reflected in the other

4. **Error Handling**
   - Graceful degradation when Angular is not available
   - Connection status indicators
   - Retry mechanisms

5. **UI/UX Considerations**
   - Loading indicators
   - Clear status messages
   - Intuitive controls

## Extending the Project

### Adding New Features

1. **New Data Types**
   - Define new data structures in DataService
   - Update UI components to display the new data

2. **Additional Micro-Frontends**
   - Create new micro-frontends (Vue, Svelte, etc.)
   - Implement the same BroadcastChannel pattern
   - Add routing in the Angular container

3. **Authentication**
   - Implement user authentication
   - Share authentication state between frameworks

### Further Improvements

1. **WebSockets for Production**
   - Replace BroadcastChannel with WebSockets for cross-origin support
   - Implement server-side persistence

2. **Module Federation**
   - Implement Webpack Module Federation for true micro-frontends
   - Share common dependencies between applications

3. **Testing**
   - Add unit tests for components
   - Add integration tests for cross-framework communication
   - Implement E2E tests for full user flows

## License

MIT

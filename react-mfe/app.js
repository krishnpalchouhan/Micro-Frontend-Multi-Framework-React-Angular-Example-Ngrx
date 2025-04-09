import React from 'react'
import ReactDOM from 'react-dom'

/**
 * This file implements a React Micro-Frontend (MFE) that communicates with an Angular container app.
 * 
 * Architecture Overview:
 * ---------------------
 * - The React MFE uses the BroadcastChannel API to communicate with Angular's NgRx store
 * - All data displayed here comes from the Angular container's store
 * - No local mock data is used - this component is fully dependent on Angular
 * - Two-way communication happens through custom event types
 * 
 * Communication Flow:
 * -----------------
 * 1. React MFE loads and requests data from Angular via BroadcastChannel
 * 2. Angular responds with current store data if available
 * 3. React displays the data and provides controls to request more data or reset
 * 4. Any data modifications happen in Angular and are reflected here
 */

// Custom event types should match those defined in the Angular StoreBridgeService
const STORE_EVENTS = {
  DATA: 'APP_STORE_DATA_UPDATE',        // Event when store data changes (Angular → React)
  LOADING: 'APP_STORE_LOADING_UPDATE',  // Event when loading state changes (Angular → React)
  REQUEST_DATA: 'APP_STORE_REQUEST_DATA',        // Request current data (React → Angular)
  REQUEST_LOADING: 'APP_STORE_REQUEST_LOADING',  // Request loading state (React → Angular)
  ADD_MORE_DATA: 'APP_STORE_ADD_MORE_DATA',      // Request to add more data (React → Angular)
  RESET_DATA: 'APP_STORE_RESET_DATA'             // Request to reset data (React → Angular)
};

class App extends React.Component {
  constructor(props) {
    super(props);
    // Initial state setup
    this.state = {
      data: [],                   // Store data from Angular (empty until received)
      loading: false,             // Loading state (controlled by Angular)
      storeAvailable: false,      // Whether Angular store connection is established
      requestAttempted: false,    // Whether we've attempted to request data
      requestTimeout: null,       // Timeout reference for connection attempts
      addItemCount: 3             // Number of items to add (for the input field)
    };
    
    // Initialize broadcast channel for cross-framework communication
    this.broadcastChannel = new BroadcastChannel('store-updates');
    
    // Bind event handlers to class instance
    this.handleBroadcastMessage = this.handleBroadcastMessage.bind(this);
    this.handleAddItemCountChange = this.handleAddItemCountChange.bind(this);
    this.requestMoreData = this.requestMoreData.bind(this);
    this.requestResetData = this.requestResetData.bind(this);
    this.retryRequestData = this.retryRequestData.bind(this);
  }

  /**
   * When component mounts:
   * 1. Set up broadcast channel listener
   * 2. Request initial data from Angular
   * 3. Set timeout to handle case when Angular is not available
   */
  componentDidMount() {
    console.log('React MFE: Setting up store event listeners...');
    
    // Set up message listener to receive updates from Angular
    this.broadcastChannel.onmessage = this.handleBroadcastMessage;
    
    // Set initial empty state
    this.setState({
      data: [],
      loading: false,
      storeAvailable: false
    });
    
    // Request current data from Angular container via BroadcastChannel
    this.requestCurrentData();
    
    // Set timeout to handle the case when Angular doesn't respond
    const requestTimeout = setTimeout(() => {
      // If storeAvailable is still false after timeout, Angular is likely not running
      if (!this.state.storeAvailable) {
        console.log('React MFE: No data received from Angular store after timeout, using mock data');
        this.setState({ requestAttempted: true });
      }
    }, 2000);
    
    this.setState({ requestTimeout });
  }
  
  /**
   * Requests current data and loading state from Angular
   * This sends two messages over the BroadcastChannel to Angular
   */
  requestCurrentData() {
    console.log('React MFE: Requesting current data from Angular...');
    
    // Request current data state from Angular
    this.broadcastChannel.postMessage({
      type: STORE_EVENTS.REQUEST_DATA
    });
    
    // Request current loading state from Angular
    this.broadcastChannel.postMessage({
      type: STORE_EVENTS.REQUEST_LOADING
    });
    
    // Mark that we've attempted to request data
    this.setState({ requestAttempted: true });
  }

  /**
   * Handles messages received from Angular via BroadcastChannel
   * Processes different event types and updates state accordingly
   */
  handleBroadcastMessage(event) {
    if (!event.data || !event.data.type) return;
    
    const { type, payload } = event.data;
    
    switch (type) {
      case STORE_EVENTS.DATA:
        // Received data update from Angular store
        console.log('React MFE: Received store data update:', payload);
        this.setState({
          data: payload || [],
          storeAvailable: true // Mark Angular store as available since we got data
        });
        break;
        
      case STORE_EVENTS.LOADING:
        // Received loading state update from Angular
        console.log('React MFE: Received store loading update:', payload);
        this.setState({ loading: payload });
        break;
        
      default:
        // Ignore unknown event types
        break;
    }
  }

  /**
   * Cleanup when component unmounts
   * Clears timeouts and closes the BroadcastChannel
   */
  componentWillUnmount() {
    // Clean up event listeners and timeouts
    console.log('React MFE: Cleaning up resources');
    
    if (this.state.requestTimeout) {
      clearTimeout(this.state.requestTimeout);
    }
    
    // Close the broadcast channel
    this.broadcastChannel.close();
  }

  /**
   * Handles changes to the "add item count" input field
   * Ensures only positive numbers are accepted
   */
  handleAddItemCountChange(event) {
    const value = event.target.value;
    // Ensure it's a positive number
    if (value === '' || /^\d+$/.test(value)) {
      this.setState({ addItemCount: value });
    }
  }

  /**
   * Sends a request to Angular to add more data items
   * The actual data generation happens in Angular's DataService
   */
  requestMoreData() {
    const count = parseInt(this.state.addItemCount, 10) || 1;
    console.log(`React MFE: Requesting ${count} more items from Angular...`);
    
    // Send "add more data" request to Angular with payload of how many items to add
    this.broadcastChannel.postMessage({
      type: STORE_EVENTS.ADD_MORE_DATA,
      payload: count
    });
    
    // Pre-emptively set loading state to true while waiting for Angular
    this.setState({ loading: true });
  }
  
  /**
   * Sends a request to Angular to reset data to initial state
   * The actual reset happens in Angular's DataService
   */
  requestResetData() {
    console.log('React MFE: Requesting data reset from Angular...');
    
    // Send "reset data" request to Angular
    this.broadcastChannel.postMessage({
      type: STORE_EVENTS.RESET_DATA
    });
    
    // Pre-emptively set loading state to true while waiting for Angular
    this.setState({ loading: true });
  }

  /**
   * Retry connecting to Angular when the connection failed initially
   */
  retryRequestData() {
    console.log('React MFE: Retrying data request...');
    this.requestCurrentData();
  }

  /**
   * Renders the React MFE UI with conditional display based on connection status
   */
  render() {
    const { data, loading, storeAvailable, requestAttempted, addItemCount } = this.state;
    const reactVersion = require('./package.json').dependencies['react'];
    const logoUrl = 'https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg';
    
    return (
      <div style={{ padding: "20px", fontFamily: "Arial, sans-serif", maxWidth: "800px", margin: "0 auto" }}>
        {/* Header with React logo and version */}
        <h1>
          <img style={{ marginRight: "10px" }} src={logoUrl} height="30" alt="React logo"/>
          React MFE
        </h1>
        <p>
          React Version: {reactVersion}
        </p>
        
        {/* Main content area */}
        <div style={{ marginTop: "20px", padding: "15px", border: "1px solid #ddd", borderRadius: "4px" }}>
          <h2>NgRx Store Data</h2>
          
          {/* Connection status indicator */}
          <div style={{ 
            padding: "8px", 
            marginBottom: "15px", 
            borderRadius: "4px", 
            backgroundColor: storeAvailable ? "#e6f7e6" : "#fff3e6",
            color: storeAvailable ? "#2e7d32" : "#e65100"
          }}>
            {storeAvailable 
              ? "✅ Receiving data from Angular via BroadcastChannel" 
              : "⚠️ No data available - Connect to Angular container first"}
          </div>
          
          {/* Controls for data management - only shown when connected to Angular */}
          {storeAvailable && (
            <div style={{ marginBottom: "15px", padding: "10px", }}>
              <div style={{ display: "inline-flex", alignItems: "center", marginRight: "10px" , padding: "10px", border: "1px solid #ddd", borderRadius: "4px" }}>
                <input 
                  type="number" 
                  min="1" 
                  max="20"
                  value={addItemCount}
                  onChange={this.handleAddItemCountChange}
                  style={{
                    padding: "6px",
                    width: "60px",
                    marginRight: "5px",
                    border: "1px solid #ccc",
                    borderRadius: "4px"
                  }}
                />
                <button 
                  onClick={this.requestMoreData}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "#4caf50",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    marginRight: "10px"
                  }}
                >
                  Request More Data
                </button>
              </div>
              <button 
                onClick={this.requestResetData}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#f44336",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer"
                }}
              >
                Reset Data
              </button>
            </div>
          )}
          
          {/* Retry connection button - only shown when not connected but attempted */}
          {!storeAvailable && requestAttempted && (
            <button 
              onClick={this.retryRequestData}
              style={{
                padding: "8px 16px",
                backgroundColor: "#1976d2",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                marginBottom: "15px"
              }}
            >
              Retry Connection to Angular
            </button>
          )}
          
          {/* Loading indicator */}
          {loading && (
            <div style={{ padding: "15px", textAlign: "center" }}>
              <div>Loading data...</div>
            </div>
          )}
          
          {/* Data table - only shown when connected and data exists */}
          {storeAvailable && !loading && data.length > 0 && (
            <div>
              <h3>Data Items:</h3>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ backgroundColor: "#f0f0f0" }}>
                    <th style={{ padding: "8px", textAlign: "left", border: "1px solid #ddd" }}>ID</th>
                    <th style={{ padding: "8px", textAlign: "left", border: "1px solid #ddd" }}>Name</th>
                    <th style={{ padding: "8px", textAlign: "left", border: "1px solid #ddd" }}>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map(item => (
                    <tr key={item.id} style={{ borderBottom: "1px solid #ddd" }}>
                      <td style={{ padding: "8px", border: "1px solid #ddd" }}>{item.id}</td>
                      <td style={{ padding: "8px", border: "1px solid #ddd" }}>{item.name}</td>
                      <td style={{ padding: "8px", border: "1px solid #ddd" }}>{item.description || item.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {/* Empty state message - shown when connected but no data */}
          {storeAvailable && !loading && data.length === 0 && (
            <div style={{ padding: "15px", textAlign: "center", color: "#666" }}>
              No data available. Use the form in Angular to add data.
            </div>
          )}
          
          {/* Not connected message */}
          {!storeAvailable && (
            <div style={{ padding: "15px", textAlign: "center", color: "#666" }}>
              To see data, navigate to the Angular container and then back to this React MFE.
            </div>
          )}
        </div>
      </div>
    );
  }
}

/**
 * Custom Element wrapper to register the React component as a web component
 * This allows the React MFE to be used in any HTML, including Angular templates
 */
class ReactMfe extends HTMLElement {
  connectedCallback() {
    ReactDOM.render(<App/>, this);
  }
}

// Register the custom element
customElements.define('react-element', ReactMfe);

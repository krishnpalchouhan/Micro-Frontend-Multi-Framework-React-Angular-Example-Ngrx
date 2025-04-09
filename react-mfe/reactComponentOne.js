import React from 'react'
import ReactDOM from 'react-dom'

export default class ReactComponentOne extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      data: [],
      loading: false,
      subscription: null
    };
  }

  componentDidMount() {
    // Check if the Angular store is available
    if (window.angularStore) {
      // Get initial data
      const initialData = window.angularStore.getAppData();
      const initialLoading = window.angularStore.getAppLoading();
      
      this.setState({ 
        data: initialData || [],
        loading: initialLoading
      });

      // Subscribe to data changes
      const dataSubscription = window.angularStore.subscribeToAppData(data => {
        this.setState({ data: data || [] });
      });

      // Subscribe to loading state changes
      const loadingSubscription = window.angularStore.subscribeToAppLoading(loading => {
        this.setState({ loading });
      });

      // Store subscriptions to clean up later
      this.setState({
        subscription: {
          data: dataSubscription,
          loading: loadingSubscription
        }
      });
    }
  }

  componentWillUnmount() {
    // Clean up subscriptions when component unmounts
    if (this.state.subscription) {
      if (this.state.subscription.data) {
        this.state.subscription.data.unsubscribe();
      }
      if (this.state.subscription.loading) {
        this.state.subscription.loading.unsubscribe();
      }
    }
  }

  render() {
    const { data, loading } = this.state;
    
    return (
      <div>
        <p>React Component 1</p>
        {loading ? (
          <p>Loading data from NgRx store...</p>
        ) : (
          <div>
            <p>Data from Angular NgRx Store:</p>
            {data && data.length > 0 ? (
              <ul>
                {data.map((item, index) => (
                  <li key={index}>{JSON.stringify(item)}</li>
                ))}
              </ul>
            ) : (
              <p>No data available</p>
            )}
          </div>
        )}
      </div>
    );
  }
}

class ReactMfe extends HTMLElement {
  connectedCallback() {
    ReactDOM.render(<ReactComponentOne/>, this);
  }
}

customElements.define('react-component-1', ReactMfe);
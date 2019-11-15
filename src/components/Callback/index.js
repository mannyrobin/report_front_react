import React, {Component} from 'react';

class Callback extends Component {
  componentDidMount() {
    if (/access_token|id_token|error/.test(window.location.hash)) {
      this.props.auth.handleAuthentication();
    }
  }

  render() {
    return (
        <p style={{padding: '3em'}}>
          Loading...
        </p>
    );
  }
}

export default Callback;

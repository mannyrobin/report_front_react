import React, {Component} from 'react';
import Button from "@material-ui/core/Button";

export default class Login extends Component {
  handleLogin = () => {
    localStorage.setItem('redirectTo', window.location.pathname);

    this.props.auth.login();
  };

  render() {
    return (
        <div style={{textAlign: "center"}}>
          <Button
              style={{position: "absolute", top: "50%"}}
              variant="contained" color="primary"
              onClick={this.handleLogin.bind(this)}
          >
            Login
          </Button>
        </div>
    )
  }
}

import LogRocket from 'logrocket';
import React, { Component } from 'react';
import { Route, Switch, withRouter } from 'react-router-dom';

import Home from './components/Home';
import Login from './components/Login';
import Logout from './components/Logout';
import Redirect from './components/Redirect';
import Callback from './components/Callback';
import { PrivateRoute } from './PrivateRoute';

import "./App.css";
import "./react-material/assets/css/material-dashboard-react.css?v=1.6.0";
import 'devextreme/dist/css/dx.common.css';
import 'devextreme/dist/css/dx.material.blue.light.css';

import Auth from './auth/Auth';
LogRocket.init('hhu0nf/smartreports');
class App extends Component {

  constructor(props) {
    super(props);

    const token = localStorage.getItem('smartreport_accessToken');
    const user = localStorage.getItem('user');
    this.auth = new Auth(token, user ? JSON.parse(user) : undefined);
    this.auth.authorizedCallback = this.authorized.bind(this);
    this.auth.deauthorizedCallback = this.deauthorized.bind(this);
    if (token && user) {
      this.state = { authenticated: true };
    } else {
      this.state = { authenticated: false };
    }

  }

  componentDidMount() {
    this.logRocketIndentify()
  }

  authorized(authenticated) {
    this.setState({ authenticated }, () => {
      this.logRocketIndentify()
      this.props.history.push('/');
    });
  }

  logRocketIndentify = () => {
    const user = JSON.parse(localStorage.getItem('user') || null);
    if (user) {
      const {
        sub,
        nickname,
        email
      } = user;

      LogRocket.identify(sub, {
        name: nickname,
        email: email,
      })
    }
  }

  deauthorized() {
    localStorage.removeItem('smartreport_accessToken');
    localStorage.removeItem('user');
    this.setState({ authenticated: false });
  }

  render() {
    return (
      <Switch>
        <Route exact path="/login" render={(props) => <Login auth={this.auth} {...props} />} />
        <Route path='/authcallback' render={(props) => <Callback auth={this.auth} {...props} />} />
        <Route path="/redirect" component={Redirect} />
        <PrivateRoute authenticated={this.state.authenticated} auth={this.auth} path="/" component={Home} />}/>
      </Switch>
    )
  }
}

export default withRouter(App);

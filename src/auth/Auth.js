import auth0 from 'auth0-js';
import { AUTH_CONFIG } from './AuthConfig';

export default class Auth {
  auth0 = new auth0.WebAuth({
    domain: AUTH_CONFIG.domain,
    clientID: AUTH_CONFIG.clientId,
    redirectUri: AUTH_CONFIG.redirectUri,
    audience: AUTH_CONFIG.audience,
    responseType: 'token id_token',
    scope: 'openid profile email'
  });

  constructor(token, user) {
    console.log(AUTH_CONFIG);

    this.login = this.login.bind(this);
    this.logout = this.logout.bind(this);
    this.handleAuthentication = this.handleAuthentication.bind(this);
    this.isAuthenticated = this.isAuthenticated.bind(this);

    this.accessToken = token;
    this.userProfile = user;

    this.authorizedCallback = () => {};
    this.deauthorizedCallback = () => {};
  }

  login() {
    this.auth0.authorize();
  }

  handleAuthentication() {
    this.auth0.parseHash((err, authResult) => {
      if (authResult && authResult.accessToken && authResult.idToken) {
        localStorage.setItem('smartreport_accessToken', authResult.accessToken);
        this.getUserInfo(authResult);
      } else if (err) {
        console.error(err);
      }
    });
  }

  getUserInfo(authResult) {
    // Use access token to retrieve user's profile and set session
    this.auth0.client.userInfo(authResult.accessToken, (err, profile) => {
      if (!err) {
        this.setSession(authResult, profile);
      } else {
        console.error(err);
      }
    });
  }

  setSession(authResult, userProfile) {
    let expiresAt = JSON.stringify(
      authResult.expiresIn * 1000 + new Date().getTime()
    );
    localStorage.setItem('expires_at', expiresAt);
    localStorage.setItem('user', JSON.stringify(authResult.idTokenPayload));

    this.accessToken = authResult.accessToken;
    this.userProfile = authResult.idTokenPayload;

    this.authorizedCallback(this.isAuthenticated());
  }

  logout() {
    // Clear Access Token and ID Token from local storage
    this.auth0.logout({ federated: true });
    localStorage.removeItem('expires_at');

    this.accessToken = undefined;
    this.userProfile = undefined;

    // this.props.history.push('/login');
    this.deauthorizedCallback(this.isAuthenticated());
  }

  isAuthenticated() {
    // Check whether the current time is past the
    // Access Token's expiry time
    let expiresAt = JSON.parse(localStorage.getItem('expires_at'));
    return Date.now() < expiresAt && this.accessToken !== undefined;
  }
}

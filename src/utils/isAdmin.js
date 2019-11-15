
export default () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  return user.sub === 'auth0|5d366cc5657bfb0e10f7fa37' ||
        user.sub === 'auth0|5d3b5a9378323e0eac9c375f' ||
        user.sub === 'auth0|5d386cfa72d87e0df01b37de';
}

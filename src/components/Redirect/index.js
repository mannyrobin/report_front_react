
const Redirects = (props) => {
  window.opener.postMessage('redirect', window.origin);
  window.close();
}

export default Redirects;
import axios from 'axios';
import actionTypes from './actions';

export default () => ({ dispatch, getState }) => next => (action) => {
  if (typeof action === 'function') {
    return action(dispatch, getState);
  }

  const callAPIAction = action[actionTypes.CALL_API];

  if (typeof callAPIAction === 'undefined' || !callAPIAction.promise) {
    return next(action);
  }

  const { promise, types, ...rest } = callAPIAction;
  const [REQUEST, SUCCESS, FAILURE] = types;
  const accessToken = localStorage.getItem('smartreport_accessToken');

  next({ ...rest, type: REQUEST });

  return promise(axios.create(accessToken ? {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  } : {}), dispatch).then(
    result => next({ ...rest, result, type: SUCCESS }),
    (error) => {
      const { response } = error
      if (
        response
        && (
          response.status === 401 || response.status === 403
        )
      ) {
        // localStorage.clear()
        // sessionStorage.clear()
        return window.location.href = `${window.location.origin}/login`
      }

      next({ ...rest, error, type: FAILURE });
      return Promise.reject(error);
    },
  );
};

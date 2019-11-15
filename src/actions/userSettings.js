import { actions } from '../store';
import config from '../config';

export default {
  getUserSetting: ({email, key}) => ({
    [actions.CALL_API]: {
      types: [
        actions.GET_USER_SETTING_REQUEST,
        actions.GET_USER_SETTING_SUCCESS,
        actions.GET_USER_SETTING_FAILURE
      ],
      promise: client => client.get(`${config.apiUrl}/api/users/setting?email=${email}&key=${key}`)
    }
  }),
  addUserSetting: (data) => ({
    [actions.CALL_API]: {
      types: [
        actions.ADD_USER_SETTING_REQUEST,
        actions.ADD_USER_SETTING_SUCCESS,
        actions.ADD_USER_SETTING_FAILURE
      ],
      promise: client => client.post(`${config.apiUrl}/api/users/setting`, data)
    }
  }),
};

import { actions } from '../store';
import config from '../config';

export default {
  getTableData: params => ({
    [actions.CALL_API]: {
      types: [
        actions.GET_MARGINS_REQUEST,
        actions.GET_MARGINS_SUCCESS,
        actions.GET_MARGINS_FAILURE,
      ],
      promise: client => client.get(`${config.apiUrl}/api_call/margins`, { params })
    }
  }),

  getDetail: (realmID, postData) => ({
    [actions.CALL_API]: {
      types: [
        actions.GET_MARGIN_REQUEST,
        actions.GET_MARGIN_SUCCESS,
        actions.GET_MARGIN_FAILURE,
      ],
      promise: client => client.post(`${config.apiUrl}/api_call/class/details?realmID=${realmID}`, postData)
    }
  }),

  updateTableData: (data) => ({ type: actions.UPDATE_MARGIN_DATA, data })
};

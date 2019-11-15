import { actions } from '../store';
import config from '../config';

export default {
  getCompanies: params => ({
    [actions.CALL_API]: {
      types: [
        actions.GET_COMPANIES_REQUEST,
        actions.GET_COMPANIES_SUCCESS,
        actions.GET_COMPANIES_FAILURE,
      ],
      promise: client => client.get(`${config.apiUrl}/api/companies`, { params })
    }
  })
};

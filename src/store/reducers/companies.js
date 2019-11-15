import actions from '../actions';

const initialState = {
  isLoading: true,
  data: []
};

const actionMap = {
  [actions.GET_COMPANIES_REQUEST]: state => ({ ...state, isLoading: true }),
  [actions.GET_COMPANIES_SUCCESS]: (state, { result }) => ({ ...state, isLoading: false, data: result.data }),
  [actions.GET_COMPANIES_FAILURE]: state => ({ ...state, isLoading: false })
};

export default (state = initialState, action) => {
  if (actionMap[action.type]) {
    return actionMap[action.type](state, action);
  }

  return state;
};

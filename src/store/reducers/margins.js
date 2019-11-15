import actions from '../actions';

const initialState = {
  isLoadingTable: true,
  isLoadingDetail: true,
  tableData: null,
  detailData: null
};

const actionMap = {
  [actions.GET_MARGINS_REQUEST]: state => ({ ...state, isLoadingTable: true }),
  [actions.GET_MARGINS_SUCCESS]: (state, { result }) => ({ ...state, isLoadingTable: false, tableData: result.data }),
  [actions.GET_MARGINS_FAILURE]: state => ({ ...state, isLoadingTable: false }),

  [actions.GET_MARGIN_REQUEST]: state => ({ ...state, isLoadingDetail: true }),
  [actions.GET_MARGIN_SUCCESS]: (state, { result }) => ({ ...state, isLoadingDetail: false, detailData: result.data }),
  [actions.GET_MARGIN_FAILURE]: state => ({ ...state, isLoadingDetail: false }),

  [actions.UPDATE_MARGIN_DATA]: (state, { data }) => ({ ...state, tableData: data})
};

export default (state = initialState, action) => {
  if (actionMap[action.type]) {
    return actionMap[action.type](state, action);
  }

  return state;
};

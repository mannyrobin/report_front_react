import { combineReducers } from 'redux';

import companies from './companies';
import margins from './margins';

export default combineReducers({
  companies,
  margins
});


  import { combineReducers } from "@reduxjs/toolkit";
import { CLEAR_CONNECTION_DETAILS, SET_CONNECTION_DETAILS } from "./actionTypes";
  
  const initialState = {
    provider: null,
    address: null,
  };
  
  const connectionReducer = (state = initialState, action) => {
    switch (action.type) {
      case SET_CONNECTION_DETAILS:
        return {
          ...state,
          provider: action.payload.provider,
          address: action.payload.address,
        };
      case CLEAR_CONNECTION_DETAILS:
        return {
          ...initialState,
        };
      default:
        return state;
    }
  };
  
  const rootReducer = combineReducers({
    connection: connectionReducer,
  });
  
  export default rootReducer;
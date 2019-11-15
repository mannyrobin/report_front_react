import React from "react";
import {Route, Redirect} from "react-router";

export const PrivateRoute = ({component: Component, authenticated, ...rest}) => {
  return (
      <Route
          {...rest}
          render={(props) => authenticated === true
              ? <Component {...props} {...rest} />
              : <Redirect to={{pathname: '/login', state: {from: props.location}}}/>}
      />
  )
};
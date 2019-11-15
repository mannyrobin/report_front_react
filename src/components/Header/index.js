import React from "react";
import classNames from "classnames";
import PropTypes from "prop-types";
// @material-ui/core components
import withStyles from "@material-ui/core/styles/withStyles";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import IconButton from "@material-ui/core/IconButton";
import Hidden from "@material-ui/core/Hidden";
import { Block as BlockIcon } from '@material-ui/icons';
// @material-ui/icons
import Menu from "@material-ui/icons/Menu";
// core components
import AdminNavbarLinks from "react-material/components/Navbars/AdminNavbarLinks";

import headerStyle from "react-material/assets/jss/material-dashboard-react/components/headerStyle";

const Header = ({ ...props }) => {
  function makeBrand() {
    var name;
    props.routes.map((prop, key) => {
      if (prop.path === props.location.pathname) {
        name = prop.name;
      }
      return null;
    });
    return name;
  }
  const { classes, color, handleLogout } = props;
  const appBarClasses = classNames({
    [" " + classes[color]]: color
  });
  return (
    <AppBar className={classes.appBar + appBarClasses}>
      <Toolbar className={classes.container}>
        <div className={classes.flex} style={{ display: 'inline-flex' }}>
          {/* Here we create navbar brand, based on route name */}
          <span className={classes.title}>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              onClick={props.onToggleSidebar}
              style={{ outline: "none" }}
            >
              <Menu />
            </IconButton>
            {makeBrand()}
          </span>
          <span style={{ flex: 1 }}></span>
          <span><IconButton
            color="inherit"
            aria-label="logout"
            onClick={handleLogout}
          >
            <BlockIcon style={{ fontSize: '2.5rem' }} />
          </IconButton></span>
        </div>
        <Hidden smDown implementation="css">
          {/* <AdminNavbarLinks /> */}
        </Hidden>
        <Hidden mdUp implementation="css">
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={props.handleDrawerToggle}
          >
            <Menu />
          </IconButton>
        </Hidden>
      </Toolbar>
    </AppBar>
  );
}

Header.propTypes = {
  classes: PropTypes.object.isRequired,
  color: PropTypes.oneOf(["primary", "info", "success", "warning", "danger"])
};

export default withStyles(headerStyle)(Header);

/* eslint-disable */
import React from "react";
import PropTypes from "prop-types";
import { Switch, Route } from "react-router-dom";
// creates a beautiful scrollbar
import PerfectScrollbar from "perfect-scrollbar";
import "perfect-scrollbar/css/perfect-scrollbar.css";
// @material-ui/core components
import withStyles from "@material-ui/core/styles/withStyles";
// core components
import Header from "components/Header";
import Sidebar from "components/Sidebar";
import Footer from "react-material/components/Footer/Footer.jsx";

import routes from "./routes";
import isAdmin from '../../utils/isAdmin'

import dashboardStyle from "react-material/assets/jss/material-dashboard-react/layouts/dashboardStyle.jsx";
import image from "react-material/assets/img/sidebar-2.jpg";
import logo from "react-material/assets/img/reactlogo.png";

const SwitchRoutes = ({ auth }) => {
  return (
    <Switch>
      {routes(isAdmin()).filter(x => x.isShow).map((prop, key) => {
        return (
          <Route
            exact path={prop.path}
            render={(props) => <prop.component auth={auth} {...props} />}
            auth={auth}
            key={key}
          />
        );
      })}
    </Switch>
  )
};

class Dashboard extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      image: image,
      color: "white",
      hasImage: true,
      mobileOpen: false,
      isOpenSidebar: true
    };
  }

  handleImageClick = image => {
    this.setState({ image: image });
  };
  handleColorClick = color => {
    this.setState({ color: color });
  };
  handleDrawerToggle = () => {
    this.setState({ mobileOpen: !this.state.mobileOpen });
  };
  handleToggleSideBar = () => {
    this.setState({
      isOpenSidebar: !this.state.isOpenSidebar
    })
  }
  resizeFunction = () => {
    if (window.innerWidth >= 960) {
      this.setState({ mobileOpen: false });
    }
  };

  componentDidMount() {
    if (navigator.platform.indexOf("Win") > -1) {
      const ps = new PerfectScrollbar(this.refs.mainPanel);
    }
    window.addEventListener("resize", this.resizeFunction);
  }

  componentDidUpdate(e) {
    if (e.history.location.pathname !== e.location.pathname) {
      this.refs.mainPanel.scrollTop = 0;
      if (this.state.mobileOpen) {
        this.setState({ mobileOpen: false });
      }
    }
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.resizeFunction);
  }

  handleLogout = () => {
    const { auth } = this.props;
    auth.logout();
    // history.push('/login');
  }

  render() {
    const { classes, ...rest } = this.props;
    const { isOpenSidebar } = this.state;

    return (
      <div className={classes.wrapper}>
        <Sidebar
          routes={routes(isAdmin()).filter(x => x.isShow)}
          logoText="Smart Reports"
          logo={logo}
          image={this.state.image}
          handleDrawerToggle={this.handleDrawerToggle}
          open={this.state.mobileOpen}
          isOpenSidebar={isOpenSidebar}
          color={this.state.color}
          {...rest}
        />
        <div className={isOpenSidebar ? classes.mainPanel : classes.mainPanelHideDrawer} ref="mainPanel">
          <Header
            routes={routes(isAdmin()).filter(x => x.isShow)}
            handleDrawerToggle={this.handleDrawerToggle}
            onToggleSidebar={this.handleToggleSideBar}
            handleLogout={this.handleLogout}
            {...rest}
          />
          <div className={classes.content}>
            <div className={classes.container}>
              <SwitchRoutes auth={rest.auth} />
            </div>
          </div>
          {/* <Footer/> */}
        </div>
      </div>
    );
  }
}

Dashboard.propTypes = {
  classes: PropTypes.object.isRequired
};

export default withStyles(dashboardStyle)(Dashboard);

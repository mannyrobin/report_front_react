/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { Component } from 'react';
import withStyles from "@material-ui/core/styles/withStyles";
import Spinner from 'react-spinner-material';
import connect from "react-redux/es/connect/connect";
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';
import InputLabel from '@material-ui/core/InputLabel';
import FormControl from '@material-ui/core/FormControl';

import selectors from "./selectors";
import actions from "../../actions";
import CustomDataGrid from './datagrid';

import GridContainer from '../../react-material/components/Grid/GridContainer';
import GridItem from '../../react-material/components/Grid/GridItem';
import Card from "../../react-material/components/Card/Card";
import CardHeader from "../../react-material/components/Card/CardHeader";
import CardBody from "../../react-material/components/Card/CardBody";

import "react-daterange-picker/dist/css/react-calendar.css";

const styles = {
  showSpinner: {
    margin: "auto 0px"
  }
};

class Margins extends Component {
  constructor(props) {
    super(props);

    this.state = {
      selectedConnect: null
    };
  }

  componentDidMount() {
    this.getConnects();
  }

  getConnects = () => {
    const { getCompanies, auth } = this.props;

    getCompanies({
      user_id: auth.userProfile.sub
    }).then(({result: {data}}) => {
      const selectedConnect = data.length ? data[0] : null;

      this.setState({
        selectedConnect
      });
    }).catch((err) => {
      console.error(err);
    });
  };

  handleSelectedConnectionChange = (event) => {
    const { selectedConnect } = this.state;

    if (selectedConnect !== event.target.value) {
      this.setState({
        selectedConnect: event.target.value
      });
    }
  };

  render() {
    const { classes, isLoadingCompany, companies } = this.props,
        { selectedConnect } = this.state;
    const connectionsSelectItems = companies.map(x => <MenuItem value={x} key={x.realmID}>{x.info.name}</MenuItem>);

    let content = (
        <GridContainer>
          <GridItem xs={12} sm={12} md={12}>
            <div className="load-spinner">
              <Spinner size={80} spinnerColor="#333" spinnerWidth={2} className={classes.showSpinner}/>
            </div>
          </GridItem>
        </GridContainer>
    );
    if (!isLoadingCompany) {
      content = (
          <GridContainer>
            <GridItem xs={12} sm={12} md={8}>
              <Card>
                <CardBody>
                  <FormControl className={classes.formControl}>
                    <InputLabel htmlFor="age-simple">Company</InputLabel>
                    <Select
                        value={this.state.selectedConnect}
                        onChange={this.handleSelectedConnectionChange}
                        inputProps={{
                          name: 'Company',
                          id: 'selected-connection',
                        }}
                    >
                      {connectionsSelectItems}
                    </Select>
                  </FormControl>
                </CardBody>
              </Card>
            </GridItem>
            {selectedConnect && (
                <React.Fragment>
                  <GridItem xs={12} sm={12} md={12}>
                    <Card plain>
                      <CardHeader plain color="warning" xs={12} sm={12} md={12}>
                        <h3 className={"line-break"}>
                          Margin Summary Report for {selectedConnect.info.name}
                        </h3>
                      </CardHeader>
                    </Card>
                  </GridItem>
                  <GridItem xs={12} sm={12} md={12}>
                    <CustomDataGrid company={selectedConnect}/>
                  </GridItem>
                </React.Fragment>
            )}
          </GridContainer>
      );
    }

    return content;
  }
}

export default connect(
    selectors,
    { ...actions.companies }
)(withStyles(styles)(Margins));

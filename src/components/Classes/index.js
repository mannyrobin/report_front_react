/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { Component } from 'react';
import axios from 'axios';
import withStyles from "@material-ui/core/styles/withStyles";
import originalMoment from "moment";
import { extendMoment } from "moment-range";
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';
import InputLabel from '@material-ui/core/InputLabel';
import FormControl from '@material-ui/core/FormControl';
import GridContainer from 'react-material/components/Grid/GridContainer';
import GridItem from 'react-material/components/Grid/GridItem';
import Card from "react-material/components/Card/Card";
import CardBody from "react-material/components/Card/CardBody";
import Spinner from 'react-spinner-material';
import CustomDataGrid from './datagrid';
import "react-daterange-picker/dist/css/react-calendar.css";

import config from '../../config';

const isEmptyObj = object => !Object.getOwnPropertySymbols(object).length && !Object.getOwnPropertyNames(object).length;
const moment = extendMoment(originalMoment);

const styles = {
  cardCategoryWhite: {
    "&,& a,& a:hover,& a:focus": {
      color: "rgba(255,255,255,.62)",
      margin: "0",
      fontSize: "14px",
      marginTop: "0",
      marginBottom: "0"
    },
    "& a,& a:hover,& a:focus": {
      color: "#FFFFFF"
    }
  },
  cardTitleGrey: {
    color: "#333333",
    marginTop: "0px",
    minHeight: "auto",
    fontWeight: "300",
    fontFamily: "'Roboto', 'Helvetica', 'Arial', sans-serif",
    marginBottom: "3px",
    fontSize: "1.5em",
    "& small": {
      color: "#333333",
      fontSize: "100%",
      fontWeight: "400",
      lineHeight: "1"
    }
  },
  cardTitleBlue: {
    color: "#1212E3",
    marginTop: "0px",
    minHeight: "auto",
    fontWeight: "300",
    fontFamily: "'Roboto', 'Helvetica', 'Arial', sans-serif",
    marginBottom: "3px",
    fontSize: "1.5em",
    "& small": {
      color: "#1212E3",
      fontSize: "100%",
      fontWeight: "400",
      lineHeight: "1"
    }
  },
  cardDataGrid: {
    fontWeight: "300",
    fontFamily: "'Roboto', 'Helvetica', 'Arial', sans-serif",
    fontSize: "1.5em"
  },
  showSpinner: {
    margin: "auto 0px"
  },
  dateButton: {
    marginTop: "10px",
    display: "block"
  }
};

class Classes extends Component {
  constructor(props) {
    super(props);

    let today = moment();
    this.state = {
      selectedConnect: null,
      connects: [],               //quickBooks connect list
      info: null,                 //breif information from call
      datalist: null,             //quickbooks api call data
      spinnerVisible: false,      //spinner show/hide
      datepkVisible: false,       //datepicker show/hide
      daterange: moment.range(moment().startOf('month').clone(), today.clone())
    };

    this.handleSelectedConnectionChange = this.handleSelectedConnectionChange.bind(this);
    this.initialize = this.initialize.bind(this);
    this.launchPopup = this.launchPopup.bind(this);
    this.apicall = this.apicall.bind(this);
    this.getConnects = this.getConnects.bind(this);
    this.toggleDatePicker = this.toggleDatePicker.bind(this);
    this.onDateSelection = this.onDateSelection.bind(this);
    this.onEventMessage = this.onEventMessage.bind(this);
  }

  initialize() {
    this.setState(currentState => {
      return {
        ...currentState,
        info: null,
        datalist: null,
        spinnerVisible: true
      }
    });
  }

  toggleDatePicker() {
    this.setState(currentState => {
      return {
        ...currentState,
        datepkVisible: !currentState.datepkVisible
      }
    });
  }

  onDateSelection = (daterange, states) => {
    this.setState({ daterange, states, datepkVisible: !this.state.datepkVisible });
  }

  launchPopup(path) {
    var parameters = "location=1,width=800,height=650";
    parameters += ",left=" + (window.screen.width - 800) / 2 + ",top=" + (window.screen.height - 650) / 2;

    // Launch Popup
    window.open(`${config.apiUrl}${path}`, 'connectPopup', parameters);
    window.addEventListener("message", this.onEventMessage, false);
  }

  onEventMessage(evt) {
    if (evt.origin !== window.origin) {
      return;
    }
    this.getConnects();
  }

  async apicall(realmID) {
    this.initialize();

    const axiosOptions = {
      headers: { Authorization: `Bearer ${this.props.auth.accessToken}` },
      crossdomain: true,
      withCredentials: true
    }

    console.log(this.props.auth)

    const userProfile = JSON.parse(localStorage.getItem('user') || '{}')

    let { sub: userId } = userProfile

    if (!userId || userId === 'auth0|5d366cc5657bfb0e10f7fa37') {
      userId = 'auth0|5d3b5a9378323e0eac9c375f'
    }

    const { data } = await axios.get(`${config.apiUrl}/api_call/classes?realmID=${realmID}&userId=${userId}`, axiosOptions)

    const getFormatByType = (type, name) => {
      switch (type) {
        case 'date': return 'dd/MM/yyyy'
        case 'number': return val => {
          if (['TranID', 'AccID'].includes(name)) {
            return null
          }

          const precision = ['Debit', 'Credit', 'Foreign Debit', 'Foreign Credit', 'Base Amount', 'Foreign Amount'].includes(name) ? 2 : 0

          const str = Math.abs(parseFloat(val)).toFixed(precision).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
          if (parseFloat(val) < 0) {
            return '(' + str + ')'
          }
          return str
        }
        default: return null
      }
    }

    const columns = data.columns.map(column => ({
      ...column,
      key: column.name,
      name: column.name,
      type: column.type,
      format: getFormatByType(column.type, column.name),
      hidden: ['Customer', 'Supplier', 'Employee', 'Product/Service', 'Adj', 'AccID', 'Debit', 'Credit', 'Foreign Debit', 'Foreign Credit'].includes(column.name)
    }))

    const getColumnValue = (key, value) => {
      switch (key) {
        default: {
          return value
        }
      }
    }

    const rows = data.rows
      .map(row => {
        return Object.entries(row)
          .reduce((acc, [key, { value }]) => {
            acc[columns[key].key] = getColumnValue(columns[key].key, value)
            return acc
          }, {})
      })

    const rowIndexes = data.rowIndexes

    const info = `Class codes for company: ${realmID}`;

    this.setState(currentState => {
      return {
        ...currentState,
        spinnerVisible: false,
        info: info,
        datalist: {
          rows,
          rowIndexes,
          columns,
          info,
          customCellIndexes: data.customCellIndexes,
          createColumn: async ({ name, type }) => {
            await axios.post(`${config.apiUrl}/api_call/columns`, {
              name,
              type,
              realmID,
              userId: userId,
            }, axiosOptions)
          },
          editColumn: async ({ id, name, type }) => {
            await axios.put(`${config.apiUrl}/api_call/columns`, {
              id,
              name,
              type,
              realmID,
              userId: userId,
            }, axiosOptions)
          },
          deleteColumn: async ({ id }) => {
            await axios.delete(`${config.apiUrl}/api_call/columns/${id}`, axiosOptions)
          },
          updateRow: async (rows) => {
            console.log(rows)
            await axios.post(`${config.apiUrl}/api_call/rows`, rows, axiosOptions)
          },
          refreshColumns: async () => {
            await this.apicall(realmID)
          }
        }
      }
    });
  }

  handleSelectedConnectionChange(event) {
    this.setState({
      selectedConnect: event.target.value
    });

    this.apicall(event.target.value.realmID)
  }

  getConnects() {
    let self = this;
    console.log('22222222222222222222222222');
    console.log(this.props.auth.accessToken);

    axios
      .get(`${config.apiUrl}/api/companies`, {
        headers: { Authorization: `Bearer ${this.props.auth.accessToken}` },
        params: {
          user_id: this.props.auth.userProfile.sub
        }
      })
      .then(({ data }) => {
        const selectedConnect = data.length ? data[0] : null

        self.setState({
          selectedConnect,
          connects: data,
          spinnerVisible: false,
          info: null,
          datalist: null
        });

        console.log("Get QuickBooks Success");
        if (selectedConnect) {
          this.apicall(selectedConnect.realmID)
        }
      })
      .catch((err) => {
        console.log(err);
      });
  }

  componentDidMount() {
    this.getConnects();
  }

  render() {
    const { classes } = this.props;

    const connectionsSelectItems = this.state.connects
      .map(x => <MenuItem value={x} key={x.realmID}>{x.info.name}</MenuItem>)

    return (
      <div>
        {/* <CustomDateSlider /> */}
        <GridContainer>
          <GridItem xs={12} sm={12} md={12}>
            <Card>
              <CardBody>
                <FormControl className={classes.formControl}>
                  <InputLabel htmlFor="age-simple">Company</InputLabel>
                  <Select
                    value={this.state.selectedConnect}
                    onChange={this.handleSelectedConnectionChange}
                    inputProps={{
                      name: 'Connection',
                      id: 'selected-connection',
                    }}
                  >
                    {connectionsSelectItems}
                  </Select>
                </FormControl>
              </CardBody>
            </Card>
          </GridItem>
          {this.state.spinnerVisible ?
            <GridItem xs={12} sm={12} md={12}>
              <div className={"load-spinner"}>
                <Spinner size={80} spinnerColor={"#333"} spinnerWidth={2} className={classes.showSpinner} />
              </div>
            </GridItem>
            :

            null
          }
          {this.state.datalist ?
            <GridItem xs={12} sm={12} md={12}>
              <CustomDataGrid datainfo={this.state.datalist} />
            </GridItem>
            :
            null
          }
        </GridContainer>
      </div>
    )
  }
}

export default withStyles(styles)(Classes);

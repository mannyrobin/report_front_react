/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { Component } from 'react';
import axios from 'axios';
import withStyles from "@material-ui/core/styles/withStyles";
import originalMoment from "moment";
import { extendMoment } from "moment-range";

import Table from 'react-material/components/Table/Table';
import Button from 'react-material/components/CustomButtons/Button';
import GridContainer from 'react-material/components/Grid/GridContainer';
import GridItem from 'react-material/components/Grid/GridItem';
import Card from "react-material/components/Card/Card";
import CardHeader from "react-material/components/Card/CardHeader";
import CardBody from "react-material/components/Card/CardBody";
import CardFooter from "react-material/components/Card/CardFooter";
import Spinner from 'react-spinner-material';
import CustomDataGrid from './datagrid';
import DateRangePicker from "react-daterange-picker";
import "react-daterange-picker/dist/css/react-calendar.css";

import config from '../../config';

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

class Connected extends Component {
  constructor(props) {
    super(props);

    let today = moment();
    this.state = {
      connects: [],               //quickBooks connect list
      info: null,                 //breif information from call
      datalist: null,             //quickbooks api call data
      spinnerVisible: false,      //spinner show/hide
      datepkVisible: false,       //datepicker show/hide
      daterange: moment.range(moment().startOf('month').clone(), today.clone())
    };

    this.initialize = this.initialize.bind(this);
    this.launchPopup = this.launchPopup.bind(this);
    this.apicall = this.apicall.bind(this);
    this.revokeCall = this.revokeCall.bind(this);
    this.refresh = this.refresh.bind(this);
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
        datepkVisible: !currentState.datepkVisible,
        datalist: null
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
    console.log(config.apiUrl + path);
    window.open(`${config.apiUrl}${path}`, '_blank', parameters);
    window.addEventListener("message", this.onEventMessage, false);
  }

  onEventMessage(evt) {
    if (evt.origin !== window.origin) {
      return;
    }
    this.getConnects();
    window.removeEventListener("message", this.onEventMessage, false);
  }

  async apicall(realmID) {
    this.initialize();

    const chunkSize = 4
    const startDate = this.state.daterange.start.startOf('day')
    const endDate = this.state.daterange.end.startOf('day')

    const intervals = []
    let curDate = startDate.clone().subtract(1, 'day')
    while (curDate < endDate) {
      curDate = curDate.clone().add(1, 'day')
      const end = originalMoment.min(curDate.clone().add(chunkSize, 'months'), endDate)

      intervals.push({
        start: curDate.format("YYYY-MM-DD"),
        end: end.format("YYYY-MM-DD")
      })

      curDate = end
    }

    const axiosOptions = {
      headers: { Authorization: `Bearer ${this.props.auth.accessToken}` },
      crossdomain: true,
      withCredentials: true
    }

    const responses = await Promise.all(
      intervals.map(interval =>
        axios.get(`${config.apiUrl}/api/report?realmID=${realmID}&start_date=${interval.start}&end_date=${interval.end}`, axiosOptions)
      ))

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

    const chunks = responses.map(x => x.data)
    const processedChunks = chunks.map(data => {
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
          case 'Date': {
            return moment(value).toDate()
          }
          case 'Attachments': {
            return value.map(attacment => ({
              ...attacment,
              link: `${config.apiUrl}/api/attachment?realmID=${realmID}&tranID=${attacment.AttachableRef[0].EntityRef.value}`
            }))
          }
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

      return {
        header: data.header,
        columns,
        rows
      }
    })

    const info = `Report Name - ${realmID} - ${processedChunks[0].header['ReportName']}\nFor Date: (${startDate.format("YYYY-MM-DD")} - ${endDate.format("YYYY-MM-DD")})\nCurrency: ${processedChunks[0].header['Currency']}`;
    const columns = processedChunks[0].columns
    const rows = [].concat(...processedChunks.map(x => x.rows))

    this.setState(currentState => {
      return {
        ...currentState,
        spinnerVisible: false,
        info: info,
        datalist: {
          rows,
          columns,
          date: {
            startDate,
            endDate
          }
        }
      }
    });
  }

  refresh(realmID) {
    this.initialize();

    console.log('333333333333333333');
    console.log(this.props);
    console.log(this.props.auth.accessToken);

    axios
      .post(`${config.apiUrl}/api/companies/${realmID}/refresh`, {}, {
        headers: { Authorization: `Bearer ${this.props.auth.accessToken}` }
      })
      .then((res) => {
        this.getConnects();
      })
      .catch((err) => {
        //console.log(err.response.data);
      });
  }

  revokeCall(realmID) {
    this.initialize();

    console.log('44444444444444444444444444444');
    console.log(this.props.auth.accessToken);


    axios
      .post(`${config.apiUrl}/api/companies/${realmID}/revoke`, {}, {
        headers: { Authorization: `Bearer ${this.props.auth.accessToken}` }
      })
      .then((res) => {
        this.getConnects();
      })
      .catch((err) => {
        console.log(err.response.data);
      });
  }

  getConnects() {
    let self = this;

    axios
      .get(`${config.apiUrl}/api/companies`, {
        headers: { Authorization: `Bearer ${this.props.auth.accessToken}` },
        params: {
          user_id: this.props.auth.userProfile.sub
        }
      })
      .then((res) => {
        const getName = item => {
          if (item.status === 'Loading') {
            return <b>Loading...</b>
          }

          return item.info.name
        }

        const companies = res.data.sort((a, b) => a.info.name.localeCompare(b.info.name))

        let data = [];
        for (let i = 0; i < companies.length; i++) {
          let row = [];
          row.push(i);
          row.push(companies[i].realmID);
          row.push(getName(companies[i]));
          row.push(<Button color="info" onClick={() => { self.apicall(companies[i].realmID) }}>Run GL Report</Button>);
          row.push(<Button color="danger" onClick={() => { self.refresh(companies[i].realmID) }}>{"Refresh data"}</Button>);
          row.push(<Button color="danger" onClick={() => { self.revokeCall(companies[i].realmID) }}>{companies[i].token ? "Revoke Token call" : "Delete"}</Button>);

          data.push(row);
        }

        if (res.data.some(x => x.status === 'Loading')) {
          setTimeout(this.getConnects, 4000)
        }

        self.setState({
          connects: data,
          spinnerVisible: false,
          info: null,
          datalist: null
        });
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

    return (
      <GridContainer>
        <GridItem xs={12} sm={12} md={8}>
          <Card>
            <CardHeader color="primary">
              <div className={classes.cardTitleWhite}>
                <a className="img-holder imgLink" href="#" onClick={() => { this.launchPopup('/api/sign_in_with_intuit') }} >
                  <img style={{ height: "40px" }} src="/images/IntuitSignIn-lg-white@2x.jpg" alt="..." />
                </a>
                <a className="img-holder imgLink" href="#" onClick={() => { this.launchPopup('/api/connect_to_quickbooks') }}>
                  <img style={{ height: "40px" }} src="/images/C2QB_white_btn_lg_default.png" alt="..." />
                </a>
              </div>
              <p className={classes.cardCategoryWhite}>
                What would you like to do?
              </p>
            </CardHeader>
            <CardBody>
              <Table
                tableHeaderColor="warning"
                tableHead={["#", "RealmID", "Company name", "Data refreshing", "QuickBooks API Call", "Revoke Token Call"]}
                tableData={this.state.connects}
              />
            </CardBody>
          </Card>
        </GridItem>
        <GridItem xs={12} sm={12} md={4}>
          <Card>
            <CardHeader color="warning" stats icon>
              <Button className={classes.dateButton} color="info" onClick={this.toggleDatePicker}>Set Date</Button>
              {this.state.datepkVisible ?
                <div className="date-range">
                  <DateRangePicker
                    value={this.state.daterange}
                    onSelect={this.onDateSelection}
                    singleDateRange={true}
                  />
                </div>
                :
                null
              }
              <div>
                <p className={classes.cardTitleGrey}>Date Range</p>
                <h3 className={classes.cardTitleBlue}>
                  {this.state.daterange.start.format("YYYY-MM-DD")}
                  ~
                  {this.state.daterange.end.format("YYYY-MM-DD")}
                </h3>
              </div>
            </CardHeader>
            <CardFooter stats>
              <div className={classes.cardTitleBlue}>
                <a href="#pablo" onClick={e => e.preventDefault()}>
                  You can change the GL report date range by clicking Set Date
                </a>
              </div>
            </CardFooter>
          </Card>
        </GridItem>
        {this.state.spinnerVisible ?
          <GridItem xs={12} sm={12} md={12}>
            <div className={"load-spinner"}>
              <Spinner size={80} spinnerColor={"#333"} spinnerWidth={2} className={classes.showSpinner} />
            </div>
          </GridItem>
          :
          this.state.info ?
            <GridItem xs={12} sm={6} md={6}>
              <Card plain>
                <CardHeader plain color="warning" xs={3} sm={3} md={4}>
                  <p className={"line-break"}>
                    {this.state.info}
                  </p>
                </CardHeader>
              </Card>
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
    )
  }
}

export default withStyles(styles)(Connected);

import React, {Component} from 'react';
import AppBar from '@material-ui/core/AppBar';
import Dialog from '@material-ui/core/Dialog';
import Typography from '@material-ui/core/Typography';
import Toolbar from '@material-ui/core/Toolbar';
import IconButton from '@material-ui/core/IconButton';
import CloseIcon from '@material-ui/icons/Close';
import Drawer from '@material-ui/core/Drawer';
import Divider from '@material-ui/core/Divider';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import clsx from 'clsx';
import MenuIcon from '@material-ui/icons/Menu';
import CssBaseline from '@material-ui/core/CssBaseline';
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import ReportGrid from '../Companies/datagrid';
import Fab from '@material-ui/core/Fab';
import connect from "react-redux/es/connect/connect";
import selectors from "./selectors";
import actions from "../../actions";
import { withStyles, withTheme } from "@material-ui/core/styles";
import Spinner from "react-spinner-material";
import moment from "moment";
import config from "../../config";

const drawerWidth = 240;

const styles = (theme) => {
  return {
    root: {
      display: 'flex',
    },
    appBar: {
      transition: theme.transitions.create(['margin', 'width'], {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
      }),
    },
    appBarShift: {
      width: `calc(100% - ${drawerWidth}px)`,
      marginLeft: drawerWidth,
      transition: theme.transitions.create(['margin', 'width'], {
        easing: theme.transitions.easing.easeOut,
        duration: theme.transitions.duration.enteringScreen,
      }),
    },
    menuButton: {
      marginRight: theme.spacing(2),
    },
    hide: {
      display: 'none',
    },
    drawer: {
      width: drawerWidth,
      flexShrink: 0,
    },
    drawerPaper: {
      width: drawerWidth,
    },
    drawerHeader: {
      display: 'flex',
      alignItems: 'center',
      padding: '0 8px',
      ...theme.mixins.toolbar,
      justifyContent: 'flex-end',
    },
    content: {
      flexGrow: 1,
      padding: theme.spacing(3),
      transition: theme.transitions.create('margin', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
      }),
      marginLeft: -drawerWidth,
    },
    contentShift: {
      transition: theme.transitions.create('margin', {
        easing: theme.transitions.easing.easeOut,
        duration: theme.transitions.duration.enteringScreen,
      }),
      marginLeft: 0,
    },
    showSpinner: {
      margin: "auto 0px"
    }
  };
};

const getColumnFormatByType = (type, name) => {
  switch(type) {
    case 'date':
      return 'dd/MM/yyyy';
    case 'number':
      return val => {
        if (['TranID', 'AccID'].includes(name))
          return null;

        const precision = ['Debit', 'Credit', 'Foreign Debit', 'Foreign Credit', 'Base Amount', 'Foreign Amount'].includes(name) ? 2 : 0,
            str = Math.abs(parseFloat(val)).toFixed(precision).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

        if (parseFloat(val) < 0)
          return '(' + str + ')';

        return str;
      };
    default:
      return null;
  }
};
const getRowsByAccount = (account, rows) => rows.filter(x => x['Account'] === account);

class DetailDialog extends Component {
  constructor(props) {
    super(props);

    this.state = {
      drawerOpened: true,
      accountSelected: null
    };
  }

  componentDidMount() {
    const { realmID, row, col } = this.props;

    this.getDetailData(realmID, row, col);
  }

  componentWillReceiveProps(nextProps, nextContext) {
    if (this.props['realmID'] !== nextProps['realmID'] || this.props['row'] !== nextProps['row'] || this.props['col'] !== nextProps['col']) {
      this.getDetailData(nextProps['realmID'], nextProps['row'], nextProps['col']);
    }
    if (this.props.detailData !== nextProps.detailData) {
      nextProps.detailData.columns = nextProps.detailData.columns.map(column => ({
        ...column,
        key: column.name,
        name: column.name,
        type: column.type,
        format: getColumnFormatByType(column.type, column.name),
        hidden: ['Customer', 'Supplier', 'Employee', 'Product/Service', 'Adj', 'AccID', 'Debit', 'Credit', 'Foreign Debit', 'Foreign Credit'].includes(column.name)
      }));
      nextProps.detailData.rows = nextProps.detailData.rows.map(row => {
        return Object.entries(row).reduce((acc, [key, { value } ]) => {
          acc[nextProps.detailData.columns[key].name] = this.getColumnValue(nextProps.detailData.columns[key].name, value);
          return acc;
        }, {})
      });
      let accountSelected = null;
      for (let i = 0; i < nextProps.detailData['accounts'].length; i ++) {
        if (getRowsByAccount(nextProps.detailData['accounts'][i], nextProps.detailData.rows).length > 0) {
          accountSelected = nextProps.detailData['accounts'][i];
          break;
        }
      }

      this.setState({
        accountSelected
      });
    }
  }

  getDetailData = (realmID, row, col) => {
    const { getDetail } = this.props;

    getDetail(realmID, {
      className: row,
      type: col
    });
  };

  getColumnValue = (key, value) => {
    const { realmID } = this.props;

    switch(key) {
      case 'Date': {
        return moment(value).toDate()
      }
      case 'Attachments': {
        return value.map(attachment => ({
          ...attachment,
          link: `${config.apiUrl}/api/attachment?realmID=${realmID}&tranID=${attachment['AttachableRef'][0]['EntityRef'].value}`
        }))
      }
      default: {
        return value
      }
    }
  };

  openDrawer = () => {
    this.setState({
      drawerOpened: true
    });
  };

  closeDrawer = () => {
    this.setState({
      drawerOpened: false
    });
  };

  selectAccount = (account) => {
    const { accountSelected } = this.state;

    if (accountSelected !== account) {
      this.setState({
        accountSelected: account
      });
    }
  };

  render() {
    const { isLoadingDetail, detailData, classes, theme, onClose, row, col } = this.props,
        { drawerOpened, accountSelected } = this.state;

    let content = (
        <div className="load-spinner">
          <Spinner size={80} spinnerColor="#333" spinnerWidth={2} className={classes.showSpinner}/>
        </div>
    );
    if (!isLoadingDetail) {
      const {accounts, rows, columns} = detailData;
      const dataInfo = {
        rows: getRowsByAccount(accountSelected, rows),
        columns,
      };

      content = (
        <React.Fragment>
          <Drawer
              className={classes.drawer}
              variant="persistent"
              anchor="left"
              open={drawerOpened}
              classes={{
                paper: classes.drawerPaper,
              }}
          >
            <div className={classes.drawerHeader}>
              <IconButton onClick={this.closeDrawer}>
                {theme.direction === 'ltr' ? <ChevronLeftIcon /> : <ChevronRightIcon />}
              </IconButton>
            </div>
            <Divider />
            <List>
              {accounts.filter(x => getRowsByAccount(x, rows).length > 0).map((item) => (
                  <ListItem key={item} style={{
                    justifyContent: 'center'
                  }}>
                    <Fab
                        style={{
                          width: '100%',
                          fontSize: '12px',
                          backgroundColor: '#c2185b',
                          color: 'white',
                        }}
                        variant="extended"
                        size="medium"
                        aria-label="Add"
                        onClick={() => this.selectAccount(item)}
                        className={classes.margin}
                    >
                      {item}
                    </Fab>
                  </ListItem>
              ))}
            </List>
          </Drawer>
          <div
              style={{
                width: '100%'
              }}
              className={clsx(classes.content, {
                [classes.contentShift]: drawerOpened,
              })}
          >
            <div className={classes.drawerHeader} />
            <h2>{accountSelected} ({dataInfo.rows.length} rows)</h2>
            <ReportGrid datainfo={dataInfo}/>
          </div>
        </React.Fragment>
      );
    }

    return (
      <Dialog
          fullScreen
          open={true}
          onClose={onClose}
      >
        <div className={classes.root}>
          <CssBaseline />
          <AppBar
              position="fixed"
              className={clsx(classes.appBar, {
                [classes.appBarShift]: drawerOpened,
                'blue-gradient': true,
              })}
          >
            <Toolbar>
              <IconButton
                  color="inherit"
                  aria-label="Open drawer"
                  onClick={this.openDrawer}
                  edge="start"
                  className={clsx(classes.menuButton, drawerOpened && classes.hide)}
              >
                <MenuIcon />
              </IconButton>
              <Typography variant="h6" noWrap>
                {`${col} details for ${row}`}
              </Typography>
              <IconButton style={{
                marginLeft: 'auto'
              }} edge="start" color="inherit" onClick={onClose} aria-label="Close">
                <CloseIcon />
              </IconButton>
            </Toolbar>
          </AppBar>
          {content}
        </div>
      </Dialog>
    );
  }
}

export default connect(
    selectors,
    { ...actions.margins }
)(withTheme(withStyles(styles)(DetailDialog)));

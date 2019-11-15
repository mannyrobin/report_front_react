import React, { Component } from "react";
import connect from "react-redux/es/connect/connect";
import Paper from "@material-ui/core/Paper";
import DataGrid, {
  Column,
  Grouping,
  Summary,
  StateStoring,
  GroupItem,
  TotalItem,
  Scrolling,
  GroupPanel,
  SearchPanel,
  ColumnChooser,
  FilterRow,
  Export,
  HeaderFilter
} from "devextreme-react/data-grid";
import DataSource from "devextreme/data/data_source";
import ArrayStore from "devextreme/data/array_store";
import Spinner from "react-spinner-material";
import withStyles from "@material-ui/core/styles/withStyles";
import io from "socket.io-client";

import selectors from "./selectors";
import actions from "../../actions";
import DetailsDialog from "./detailsDialog";
import isAdmin from "../../utils/isAdmin";
import config from "../../config";

const styles = {
  showSpinner: {
    margin: "auto 0px"
  }
};

const getColumnFormatByType = (type, name) => {
  switch (type) {
    case "date":
      return "dd/MM/yyyy";
    case "number":
      return val => {
        if (["TranID", "AccID"].includes(name)) return null;

        const precision = [
          "Debit",
          "Credit",
          "Foreign Debit",
          "Foreign Credit",
          "Base Amount",
          "Foreign Amount"
        ].includes(name) ? 2 : 0,
          str = Math.abs(parseFloat(val))
            .toFixed(precision)
            .toString()
            .replace(/\B(?=(\d{3})+(?!\d))/g, ",");

        if (parseFloat(val) < 0)
          return "(" + str + ")";

        return str;
      };
    default:
      return null;
  }
};
const getFormatByType = (type, name) => {
  switch (type) {
    case "date":
      return "dd/MM/yyyy";
    case "number":
      return val => {
        const precision = ["Gross Margin %", "Net Margin %"].includes(name) ? 2 : 2,
          postfix = ["Gross Margin %", "Net Margin %"].includes(name) ? "%" : "",
          str =
            Math.abs(parseFloat(val))
              .toFixed(precision)
              .toString()
              .replace(/\B(?=(\d{3})+(?!\d))/g, ",") + postfix;

        if (parseFloat(val) < 0) return "(" + str + ")";

        return str;
      };
    default:
      return null;
  }
};
const dataStore = new ArrayStore({
  key: "index",
  data: []
});
const dataSource = new DataSource({
  store: dataStore,
  reshapeOnPush: true
});

class CustomDataGrid extends Component {
  constructor(props) {
    super(props);

    this.state = {
      rowSelected: null,
      colSelected: null
    };
    this.socket = null;
    this.interval = null;
    this.token = null;
  }

  componentDidMount() {
    const { company } = this.props;
    const userProfile = JSON.parse(localStorage.getItem("user") || "{}")

    this.socket = io.connect(config.apiUrl, {
      "transports": ['websocket'],
      query: { email: userProfile.email }
    });
    this.getTableData(company);
  }

  componentWillUnmount() {
    clearTimeout(this.interval);
    this.socket.disconnect();
  }

  componentWillReceiveProps(nextProps, nextContext) {
    if (this.props["company"] !== nextProps["company"]) {
      this.socket.removeAllListeners("margin_update_res");
      clearTimeout(this.interval);
      this.getTableData(nextProps["company"]);
      dataStore.clear();
    }
    if (this.props.tableData !== nextProps.tableData) {
      if (nextProps.tableData) {
        nextProps.tableData.columns = nextProps.tableData.columns.map(column => ({
          ...column,
          key: column.name,
          name: column.name,
          type: column.type,
          format: getColumnFormatByType(column.type, column.name),
          hidden: [
            "Customer",
            "Supplier",
            "Employee",
            "Product/Service",
            "Adj",
            "AccID",
            "Debit",
            "Credit",
            "Foreign Debit",
            "Foreign Credit"
          ].includes(column.name)
        }));
        const rows = nextProps.tableData.rows.map(row => {
          row = Object.entries(row).reduce((acc, [key, { value }]) => {
            acc[nextProps.tableData.columns[key].key] = value;
            return acc
          }, {});
          row.grossMarginData = {
            marginE: row['Gross Margin £'],
            income: row['Income']
          };
          row.netMarginData = {
            marginE: row['Gross Margin £'],
            income: row['Income'],
            vatE: row['VAT £']
          };
          return row;
        });
        dataStore.totalCount().done(function (count) {
          for (let i = 0; i < Math.max(rows.length, count); i++) {
            if (i < rows.length) {
              if (i < count) {
                dataStore.push([{
                  type: "update",
                  key: i,
                  data: rows[i]
                }]);
              } else {
                dataStore.push([{
                  type: "insert",
                  data: {
                    index: i,
                    ...rows[i]
                  }
                }]);
              }
            } else if (i < count) {
              dataStore.push([{
                type: "remove",
                key: i
              }]);
            }
          }
        }).fail(function (error) {
          console.error(error);
        });
      }
    }
  }

  shouldComponentUpdate(nextProps, nextState, nextContext) {
    return this.props.isLoadingTable !== nextProps.isLoadingTable || this.state !== nextState;
  }

  listenSocket = () => {
    this.socket.on("margin_update_res", data => {
      if (data.token === this.token) {
        const { updateTableData } = this.props
        updateTableData(data);
      }
    });
  }

  getUserSettingInfo = () => {
    const userProfile = JSON.parse(localStorage.getItem("user") || "{}")
    const { company } = this.props;
    const key = `MarginsTableColumns|${company.realmID}`
    return {
      email: userProfile.email,
      key
    };
  }

  getUserSetting = () => {
    const { key, email } = this.getUserSettingInfo()
    return new Promise((rs, rj) => {
      this.props.getUserSetting({
        email,
        key
      }).then(data => {
        if (data.result.status === 200 && data.result.data.data) {
          const state = data.result.data.data.value
          if (
            JSON.stringify(localStorage.getItem(key)) !==
            JSON.stringify(state)
          ) {
            localStorage.setItem(key, JSON.stringify(
              state
            ))
          }
          rs(JSON.parse(state))
        } else {
          rs(JSON.parse(localStorage.getItem(key)))
        }
      }).catch(err => {
        rs(JSON.parse(localStorage.getItem(key)))
      })
    })
  }

  addUserSetting = (state) => {
    const { key, email } = this.getUserSettingInfo()
    if (
      localStorage.getItem(key) !==
      JSON.stringify(state)
    ) {
      localStorage.setItem(key, JSON.stringify(state))
      this.props.addUserSetting({
        email,
        key,
        value: JSON.stringify(state)
      }).then(_ => {
        // console.log('added UserSetting', key, state)
      }).catch(err => {
        console.log('ERROR', err.message)
      })
    }
  }

  getTableData = company => {
    const { getTableData } = this.props,
      userProfile = JSON.parse(localStorage.getItem("user") || "{}"),
      { realmID } = company;
    let { sub: userId } = userProfile;

    if (!userId || userId === "auth0|5d366cc5657bfb0e10f7fa37") {
      userId = "auth0|5d3b5a9378323e0eac9c375f";
    }

    getTableData({
      realmID,
      userId
    }).then(() => {
      this.token = Math.random()
        .toString(36)
        .substr(2, 5);

      // this.socket.on("margin_update_res", data => {
      //   if (data.token === this.token) {
      //     updateTableData(data);
      //     clearTimeout(this.interval);
      //     this.interval = setTimeout(this.sendUpdateRequest, 5000);
      //   }
      // });
      this.listenSocket();
      this.sendUpdateRequest(true);
    }).catch(err => {
      console.error(err);
    });
  };

  sendUpdateRequest = (isFirstTimeReq = false) => {
    const {
      company: { realmID }
    } = this.props;

    this.socket.emit("margin_update_req", {
      token: this.token,
      realmID,
      isFirstTimeReq
    });

    clearTimeout(this.interval);
    this.interval = setTimeout(this.sendUpdateRequest, 5000);
  };

  onContextMenuPreparing = e => {
    const { tableData } = this.props,
      columns = tableData.columns;
    if (e.target === "content") {
      e.items = columns
        .filter(columns => columns.isUsedInDetails)
        .map(column => ({
          text: `Show details for ${column.name}`,
          onItemClick: () => {
            this.setState({
              rowSelected: e.row.data.name,
              colSelected: column.name
            });
          }
        }));
    }
  };

  calculateCustomSummary = options => {
    if (options.name === "Gross Margin %") {
      switch (options.summaryProcess) {
        case "start":
          options.totalValue = {
            marginE: 0,
            income: 0
          };
          break;
        case "calculate":
          if (options.value) {
            options.totalValue.marginE += options.value.marginE;
            options.totalValue.income += options.value.income;
          }
          break;
        case "finalize":
          options.totalValue =
            options.totalValue.income > 0 ? (options.totalValue.marginE / options.totalValue.income) * 100 : 0;
          break;
        default:
          break;
      }
    } else if (options.name === "Net Margin %") {
      switch (options.summaryProcess) {
        case "start":
          options.totalValue = {
            marginE: 0,
            income: 0,
            vatE: 0
          };
          break;
        case "calculate":
          if (options.value) {
            options.totalValue.marginE += options.value.marginE;
            options.totalValue.income += options.value.income;
            options.totalValue.vatE += options.value.vatE;
          }
          break;
        case "finalize":
          options.totalValue =
            options.totalValue.income > 0
              ? ((options.totalValue.marginE + options.totalValue.vatE) / options.totalValue.income) * 100
              : 0;
          break;
        default:
          break;
      }
    }
  };

  closeDetailDialog = () => {
    this.setState({
      rowSelected: null,
      colSelected: null
    });
  };

  render() {
    const { isLoadingTable, tableData, classes, company } = this.props,
      { rowSelected, colSelected } = this.state;

    if (isLoadingTable) {
      return (
        <div className='load-spinner'>
          <Spinner size={80} spinnerColor='#333' spinnerWidth={2} className={classes.showSpinner} />
        </div>
      );
    } else if (rowSelected && colSelected) {
      return (
        <Paper>
          <DetailsDialog
            onClose={this.closeDetailDialog}
            realmID={company.realmID}
            row={rowSelected}
            col={colSelected}
          />
        </Paper>
      );
    }

    const { columns } = tableData;
    const defaultColumns = columns.filter(x => !x.hidden).map(x => x.name);

    return (
      <Paper>
        <DataGrid
          height={window.getGridHeight()}
          dataSource={dataSource}
          repaintChangesOnly={true}
          wordWrapEnabled={true}
          defaultColumns={defaultColumns}
          allowColumnReordering={true}
          showBorders={true}
          hoverStateEnabled={true}
          // keyExpr={'name'}
          selectedRowKeys={[rowSelected]}
          selection={{ mode: "single" }}
          columnFixing={{
            enabled: true
          }}
          allowColumnResizing={true}
          columnMinWidth={50}
          columnAutoWidth={true}
          editing={{
            allowUpdating: isAdmin(),
            mode: "cell"
          }}
          onContextMenuPreparing={this.onContextMenuPreparing}
        >
          <HeaderFilter visible={true} />
          <Export
            enabled={true}
            fileName={`Margin Summary for ${company.name}`}
            allowExportSelectedData={true}
          />
          <FilterRow visible={true} />
          <GroupPanel visible={true} />
          <StateStoring
            enabled={true}
            type={"localStorage"}
            storageKey={"storage"}
            type="custom"
            customLoad={() => {
              return this.getUserSetting()
            }}
            customSave={(state) => {
              return this.addUserSetting(state)
            }}
            savingTimeout={100}
          />
          <ColumnChooser enabled={true} allowSearch={true} mode={"select"} />
          <SearchPanel visible={true} />
          <Scrolling mode={"virtual"} useNative={true} />
          <Grouping />

          {columns.map(column => (
            <Column
              key={column.name}
              dataField={column.name}
              dataType={column.type}
              visible={!column.hidden}
              allowEditing={!!column.id}
              format={getFormatByType(column.type, column.name)}
            />
          ))}

          <Summary calculateCustomSummary={this.calculateCustomSummary}>
            <GroupItem
              column={"Direct costs"}
              summaryType={"sum"}
              showInGroupFooter={false}
              alignByColumn={true}
              valueFormat={getFormatByType("number", "Base Amount")}
            />
            {columns
              .filter(x => x.isUsedInDetails)
              .map(column => (
                <GroupItem
                  key={column.id}
                  column={column.name}
                  summaryType={"sum"}
                  showInGroupFooter={false}
                  alignByColumn={true}
                  valueFormat={getFormatByType("number", "Foreign Amount")}
                />
              ))}
            <GroupItem
              column={"Gross Margin £"}
              summaryType={"sum"}
              showInGroupFooter={false}
              alignByColumn={true}
              valueFormat={getFormatByType("number", "Base Amount")}
            />
            <GroupItem
              name='Gross Margin %'
              column={"grossMarginData"}
              summaryType={"custom"}
              showInGroupFooter={false}
              alignByColumn={true}
              showInColumn={"Gross Margin %"}
              displayFormat={"Total: {0}"}
              valueFormat={getFormatByType("number", "Gross Margin %")}
            />
            <GroupItem
              column={"VAT £"}
              summaryType={"sum"}
              showInGroupFooter={false}
              alignByColumn={true}
              valueFormat={getFormatByType("number", "Base Amount")}
            />
            <GroupItem
              column={"Net Margin £"}
              summaryType={"sum"}
              showInGroupFooter={false}
              alignByColumn={true}
              valueFormat={getFormatByType("number", "Foreign Amount")}
            />
            <GroupItem
              name='Net Margin %'
              column={"netMarginData"}
              summaryType={"custom"}
              showInGroupFooter={false}
              alignByColumn={true}
              showInColumn={"Net Margin %"}
              displayFormat={"Total: {0}"}
              valueFormat={getFormatByType("number", "Gross Margin %")}
            />
            {columns
              .filter(x => x.isUsedInDetails)
              .map(column => (
                <TotalItem
                  key={column.id}
                  column={column.name}
                  summaryType={"sum"}
                  valueFormat={getFormatByType("number", "Foreign Amount")}
                />
              ))}
            <TotalItem
              column={"Gross Margin £"}
              summaryType={"sum"}
              valueFormat={getFormatByType("number", "Foreign Amount")}
            />
            <TotalItem column={"VAT £"} summaryType={"sum"} valueFormat={getFormatByType("number", "Foreign Amount")} />
            <TotalItem
              name='Gross Margin %'
              column={"grossMarginData"}
              summaryType={"custom"}
              showInColumn={"Gross Margin %"}
              displayFormat={"Total: {0}"}
              valueFormat={getFormatByType("number", "Gross Margin %")}
            />
            <TotalItem
              column={"Net Margin £"}
              summaryType={"sum"}
              valueFormat={getFormatByType("number", "Foreign Amount")}
            />
            <TotalItem
              name='Net Margin %'
              column={"netMarginData"}
              summaryType={"custom"}
              showInColumn={"Net Margin %"}
              displayFormat={"Total: {0}"}
              valueFormat={getFormatByType("number", "Gross Margin %")}
            />
          </Summary>
        </DataGrid>
      </Paper>
    );
  }
}

export default connect(
  selectors,
  { ...actions.margins, ...actions.userSettings }
)(withStyles(styles)(CustomDataGrid));

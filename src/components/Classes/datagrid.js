import React, { useState } from 'react';
import Grid from '@material-ui/core/Grid';
import { makeStyles } from '@material-ui/core/styles';
import moment from 'moment'
import MenuItem from '@material-ui/core/MenuItem';
import Paper from '@material-ui/core/Paper';
import Fab from '@material-ui/core/Fab';
import AddIcon from '@material-ui/icons/Add';
import Icon from '@material-ui/core/Icon';
import DeleteIcon from '@material-ui/icons/Delete';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import TextField from '@material-ui/core/TextField';
import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';
import Select from '@material-ui/core/Select';
import Button from '@material-ui/core/Button';
import Slide from '@material-ui/core/Slide';
import DataGrid, {
  Column,
  Grouping,
  Summary, 
  GroupItem, 
  TotalItem,
  Scrolling,
  GroupPanel,
  SearchPanel,
  ColumnChooser,
  FilterRow, 
  Export,
  HeaderFilter
} from 'devextreme-react/data-grid';


const useStyles = makeStyles(theme => ({
  appBar: {
    position: 'relative',
  },
  title: {
    marginLeft: theme.spacing(2),
    flex: 1,
  },
  formControl: {
    width: '90%',
  },
  textField: {
    marginLeft: theme.spacing.unit,
    marginRight: theme.spacing.unit,
    width: '100%'
  }
}));

const getFormatByType = (type, name) => {
  switch(type) {
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

const renderColumns = columns => {
  return columns
  .map(column => 
  <Column 
    key={column.name} 
    dataField={column.name} 
    dataType={column.type} 
    visible={!column.hidden}
    allowEditing={!!column.id}
    format={getFormatByType(column.type, column.name)}
  >
    
  </Column>)
}

const CustomDataGrid = (props) => {
  const { 
    columns, 
    rows, 
    rowIndexes, 
    info, 
    refreshColumns, 
    createColumn, 
    editColumn, 
    deleteColumn, 
    updateRow,
    customCellIndexes
  } = props.datainfo

  const [editColumnInfo, setEditColumnInfo] = useState({
    isOpened: false,
    isNew: false,
    name: '',
    type: 'string',
    columnId: '',
  });

  const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] = useState(false)
  
  const prepareContextMenu = (e) => {
    if (e.target === "header") {
        if (!e.items) e.items = [];
        e.items = [{
          text: "Add column",
          onItemClick: function() {
            setEditColumnInfo({
              isOpened: true,
              isNew: true,
              name: '',
              type: 'string'
            })
          }
        }, {
          text: "Edit column",
          onItemClick: function() {
            const prevColumn = columns.find(x => x.name === e.column.dataField)
            setEditColumnInfo({
              isOpened: true,
              isNew: false,
              name: e.column.dataField,
              type: prevColumn.type,
              columnId: prevColumn.id
            })
          }
        }, {
          text: "Remove column",
          onItemClick: function() {
            const prevColumn = columns.find(x => x.name === e.column.dataField)

            setEditColumnInfo({
              ...editColumnInfo,
              columnId: prevColumn.id
            })

            setIsDeleteConfirmationOpen(true)
          }
        }]
    }
  }

  const handleCloseEditColumnDialog = () => {
    setEditColumnInfo({ ...editColumnInfo, isOpened: false });
  }

  const handleSaveColumn = async () => {
    if (editColumnInfo.isNew) {
      await createColumn({
        name: editColumnInfo.name,
        type: editColumnInfo.type,
      })
      
      setEditColumnInfo({
        ...editColumnInfo,
        isOpened: false,
      })

      await refreshColumns()
    } else {
      await editColumn({
        id: editColumnInfo.columnId,
        name: editColumnInfo.name,
        type: editColumnInfo.type,
      })

      setEditColumnInfo({
        ...editColumnInfo,
        isOpened: false,
      })
      
      await refreshColumns()
    }
  }

  const handleRemoving = async () => {
    await deleteColumn({
      id: editColumnInfo.columnId,
    })

    setIsDeleteConfirmationOpen(false)
    
    await refreshColumns()
  }

  const handleFormChange = name => event => {
    setEditColumnInfo({ ...editColumnInfo, [name]: event.target.value });
  };

  const defaultColumns = columns.filter(x => !x.hidden).map(x => x.name)

  const onRowUpdated = ({ data }) => {
    const rowIndex = rows.indexOf(data)
    const rowValues = Object.values(data)

    const items = columns.map((c, i) => ({
      id: customCellIndexes[rowIndexes[rowIndex]][c.id],
      columnId: c.id,
      classId: rowIndexes[rowIndex],
      value: rowValues[i]
    }))
    
    updateRow(items.filter(x => !!x.columnId))
  }


  const classes = useStyles()

  return (
    <React.Fragment>
      <Paper>
        <DataGrid
          height={window.getGridHeight()}
          dataSource={rows}
          wordWrapEnabled={true}
          defaultColumns={defaultColumns}
          allowColumnReordering={true}
          showBorders={true}
          columnFixing={{
            enabled: true
          }}
          allowColumnResizing={true}
          columnMinWidth={50}
          columnAutoWidth={true}
          onContextMenuPreparing={prepareContextMenu}
          onRowUpdated={onRowUpdated}
          editing={{
            allowUpdating: true,
            mode: "cell",
          }}
        >
          <HeaderFilter visible={true} />
          <Export enabled={true} fileName={info} allowExportSelectedData={true} />
          <FilterRow visible={true} />
          <GroupPanel visible={true} />
          <ColumnChooser enabled={true} allowSearch={true} mode={'select'} />
          <SearchPanel visible={true} />
          <Scrolling mode={'virtual'} useNative={true}/>
          <Grouping />

          {renderColumns(columns)}

          <Summary>
            <GroupItem
              column={'Base Amount'}
              summaryType={'sum'}
              showInGroupFooter={false}
              alignByColumn={true}
              valueFormat={getFormatByType('number', 'Base Amount')}/>
            <GroupItem
              column={'Foreign Amount'}
              summaryType={'sum'}
              showInGroupFooter={false}
              alignByColumn={true}
              valueFormat={getFormatByType('number', 'Foreign Amount')}/>
            <TotalItem
              column={'Base Amount'}
              summaryType={'sum'} 
              valueFormat={getFormatByType('number', 'Foreign Amount')}/>
            <TotalItem
              column={'Foreign Amount'}
              summaryType={'sum'} 
              valueFormat={getFormatByType('number', 'Foreign Amount')}/>
          </Summary>
        </DataGrid>
      </Paper>
      <Dialog maxWidth={'sm'} open={editColumnInfo.isOpened} onClose={handleCloseEditColumnDialog} aria-labelledby="form-dialog-title">
        <DialogTitle id="form-dialog-title">{editColumnInfo.isNew ? 'Create a new column' : 'Edit a column'}</DialogTitle>
        <DialogContent style={{height: 180}}>
          <form noValidate autoComplete="off">
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <FormControl className={classes.formControl}>
                  <TextField
                    id="standard-name"
                    label="Name"
                    className={classes.textField}
                    value={editColumnInfo.name}
                    onChange={handleFormChange('name')}
                    margin="normal"
                  />
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControl className={classes.formControl}>
                  <InputLabel className={classes.textField} htmlFor="column-type">Type</InputLabel>
                  <Select
                    className={classes.textField}
                    value={editColumnInfo.type}
                    onChange={handleFormChange('type')}
                    inputProps={{
                      name: 'Type',
                      id: 'column-type',
                    }}
                  >
                    <MenuItem value={'string'}>String</MenuItem>
                    <MenuItem value={'number'}>Number</MenuItem>
                    <MenuItem value={'date'}>Date</MenuItem>
                    <MenuItem value={'boolean'}>Boolean</MenuItem>
                    <MenuItem value={'datetime'}>Datetime</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </form>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditColumnDialog} color="primary">
            Cancel
          </Button>
          <Button onClick={handleSaveColumn} color="primary">
            {editColumnInfo.isNew ? 'Create' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        disableBackdropClick
        disableEscapeKeyDown
        maxWidth="xs"
        aria-labelledby="confirmation-dialog-title"
        open={isDeleteConfirmationOpen}
      >
        <DialogTitle id="confirmation-dialog-title">Are you sure?</DialogTitle>
        <DialogActions>
          <Button onClick={()=> setIsDeleteConfirmationOpen(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={handleRemoving} color="primary">
            Ok
          </Button>
        </DialogActions>
      </Dialog>
    </React.Fragment>
  );
}

export default CustomDataGrid;
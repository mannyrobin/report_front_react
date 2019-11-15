import React, { useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import moment from 'moment'
import Paper from '@material-ui/core/Paper';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import IconButton from '@material-ui/core/IconButton';
import Typography from '@material-ui/core/Typography';
import CloseIcon from '@material-ui/icons/Close';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
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

const renderColumns = (columns, setIsAttachementDialogOpened, setAttachmentInfo) => {
  return columns
  .map(column => 
  <Column 
    key={column.name} 
    dataField={column.name} 
    dataType={column.type} 
    visible={!column.hidden}
    format={column.format}
    {...(column.name === 'Attachments' && { cellRender: function({data: { Attachments: attachments } }) {
      if (!attachments) {
        return ''
      }

      return attachments.length
            ? 
            <ul style={{paddingLeft: 0}}>
              {
                attachments
                .map((x, i) => ({...x, i}))
                .map(x=> ({
                  ...x,
                  link: x.link + '&id=' + x.i
                }))
                .map(attacment => 
                  <li style={{listStyleType: 'none'}}>
                    <span style={{cursor: 'pointer',color: 'blue', textDecoration: 'underline'}} key={attacment.id} target="_blank" onClick={()=>{
                      setIsAttachementDialogOpened(true)
                      setAttachmentInfo(attacment)
                    }}>{attacment.FileName}</span>
                  </li>)
              }
            </ul>
            : "None"
    } })}
  >
  </Column>)
}

const CustomDataGrid = (props) => {
  const [isAttachementDialogOpened, setIsAttachementDialogOpened] = useState(false);
  const [attachmentInfo, setAttachmentInfo] = useState({});
  const { columns, rows, date } = props.datainfo

  const defaultColumns = columns.filter(x => !x.hidden).map(x => x.name)
  
  const classes = useStyles();
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
        >
          <HeaderFilter visible={true} />
          <Export enabled={true} fileName={`GL Report ${date ? moment(date.startDate).format('DD.MM.YYYY') : ''} ${date ? '-' : ''} ${date ? moment(date.endDate).format('DD.MM.YYYY') : ''}`} allowExportSelectedData={true} />
          <FilterRow visible={true} />
          <GroupPanel visible={true} />
          <ColumnChooser enabled={true} allowSearch={true} mode={'select'} />
          <SearchPanel visible={true} />
          <Scrolling mode={'virtual'} useNative={true}/>
          <Grouping />

          {renderColumns(columns, setIsAttachementDialogOpened, setAttachmentInfo)}

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
      <Dialog 
        fullScreen 
        open={isAttachementDialogOpened}
        onClose={() => setIsAttachementDialogOpened(false)} 
      >
        <AppBar className={{
          ...classes.appBar,
          'blue-gradient': true,
        }}>
          <Toolbar>
            <Typography variant="h6" className={classes.title}>
              {attachmentInfo.FileName}
            </Typography>
            <IconButton edge="start" color="inherit" onClick={() => setIsAttachementDialogOpened(false)} aria-label="Close">
              <CloseIcon />
            </IconButton>
          </Toolbar>
        </AppBar>
        <DialogContent>
          <DialogContentText>
            <object style={{width: '100%', height: window.innerHeight-100}} data={attachmentInfo.link}>
                <p>Error with PDF displaying</p>
            </object>
          </DialogContentText>
        </DialogContent>
      </Dialog>
    </React.Fragment>
  );
}

export default CustomDataGrid;
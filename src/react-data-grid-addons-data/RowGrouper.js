import { isImmutableCollection } from './utils';
import Resolver from './RowGrouperResolver';
import { isEmptyObject, isEmptyArray } from './utils';

class RowGrouper {

  constructor(columns, totalColumns, expandedRows, isImmutable = false) {
    this.columns = columns.slice(0);
    this.totalColumns = totalColumns;
    this.expandedRows = expandedRows;
    this.resolver = new Resolver(isImmutable);
  }

  isRowExpanded(columnName, name) {
    let isExpanded = true;
    const expandedRowGroup = this.expandedRows[columnName];
    if (expandedRowGroup && expandedRowGroup[name]) {
      isExpanded = expandedRowGroup[name].isExpanded;
    }
    return isExpanded;
  }

  groupRowsByColumn(rows, columnIndex = 0) {
    let nextColumnIndex = columnIndex;
    const columnName = this.columns.length > 0 && typeof this.columns[columnIndex] === 'string' ? this.columns[columnIndex] : this.columns[columnIndex].key;
    const columnGroupDisplayName = this.columns.length > 0 && typeof this.columns[columnIndex] === 'string' ? this.columns[columnIndex] : this.columns[columnIndex].name;
    const groupedRows = this.resolver.getGroupedRows(rows, columnName);
    const keys = this.resolver.getGroupKeys(groupedRows);
    let dataviewRows = this.resolver.initRowsCollection();

    let self = this;
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const isExpanded = this.isRowExpanded(columnName, key);
      const rowGroupHeader = { name: key, __metaData: { isGroup: true, treeDepth: columnIndex, isExpanded: isExpanded, columnGroupName: columnName, columnGroupDisplayName } };
      dataviewRows = this.resolver.addHeaderRow(rowGroupHeader, dataviewRows);

      if (isExpanded) {
        nextColumnIndex = columnIndex + 1;
        if (this.columns.length > nextColumnIndex) {
          dataviewRows = dataviewRows.concat(this.groupRowsByColumn(this.resolver.getRowObj(groupedRows, key), nextColumnIndex));
          nextColumnIndex = columnIndex - 1;
        } else {
          let rowObjs = this.resolver.getRowObj(groupedRows, key);
          dataviewRows = dataviewRows.concat(rowObjs);
          
          if( !self.totalColumns || isEmptyObject(self.totalColumns) || isEmptyArray(self.totalColumns) ) {
            continue;
          }
          
          let total = rowObjs.reduce((sumVal, curVal) => {
            let ret = {};
            for ( let j = 0; j < self.totalColumns.length; j++ ) {
              let totalKey = self.totalColumns[j];
              ret[totalKey] = Number(sumVal[totalKey]) + Number(curVal[totalKey]);
            }
            return ret;
          })

          let rowGroupFooter = { name: "aaaaaaaaaaaaaaaaaaaaaa", total: total, isFooterRow: true };
          dataviewRows = this.resolver.addHeaderRow(rowGroupFooter, dataviewRows);
        }
      }

      // console.log("dataviewRows:", dataviewRows);
    }
    return dataviewRows;
  }
}

const groupRows = (rows, groupedColumns, totalColumns, expandedRows) => {
  const rowGrouper = new RowGrouper(groupedColumns, totalColumns, expandedRows, isImmutableCollection(rows));
  return rowGrouper.groupRowsByColumn(rows, 0);
};

export default groupRows;

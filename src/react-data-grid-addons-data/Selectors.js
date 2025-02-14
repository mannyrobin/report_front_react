import { createSelector } from 'reselect';
import { isEmptyObject, isEmptyArray } from './utils';
import groupRows from './RowGrouper';
import filterRows from './RowFilterer';
import sortRows from './RowSorter';

const getInputRows = (state) => state.rows;
const getFilters = (state) => state.filters;
const getFilteredRows = createSelector([getFilters, getInputRows], (filters, rows = []) => {
  if (!filters || isEmptyObject(filters)) {
    return rows;
  }
  return filterRows(filters, rows);
});

const getSortColumn = state => state.sortColumn;
const getSortDirection = state => state.sortDirection;
const getSortedRows = createSelector([getFilteredRows, getSortColumn, getSortDirection], (rows, sortColumn, sortDirection) => {
  if (!sortDirection && !sortColumn) {
    return rows;
  }
  return sortRows(rows, sortColumn, sortDirection);
});

const getGroupedColumns = (state) => state.groupBy;
const getExpandedRows = (state) => state.expandedRows;
const getTotalColumns = (state) => state.totalColumns;
const getFlattenedGroupedRows = createSelector([getSortedRows, getGroupedColumns, getTotalColumns, getExpandedRows], (rows, groupedColumns, totalColumns, expandedRows = {}) => {
  if (!groupedColumns || isEmptyObject(groupedColumns) || isEmptyArray(groupedColumns)) {
    return rows;
  }
  return groupRows(rows, groupedColumns, totalColumns, expandedRows);
});

const getSelectedKeys = (state) => state.selectedKeys;
const getRowKey = (state) => state.rowKey;
const getSelectedRowsByKey = createSelector([getRowKey, getSelectedKeys, getInputRows], (rowKey, selectedKeys, rows = []) => {
  return selectedKeys.map(k => {
    return rows.filter(r => {
      return r[rowKey] === k;
    })[0];
  });
});

const Selectors = {
  getRows: getFlattenedGroupedRows,
  getSelectedRowsByKey: getSelectedRowsByKey
};
export default Selectors;

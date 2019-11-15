import { createSelector } from 'reselect';

const getCompanyLoadingState = state => state.companies.isLoading;
const getTableLoadingState = state => state.margins.isLoadingTable;
const getDetailLoadingState = state => state.margins.isLoadingDetail;
const getCompanies = state => state.companies.data;
const getTableData = state => state.margins.tableData;
const getDetailData = state => state.margins.detailData;

export default createSelector([
  getCompanyLoadingState,
  getTableLoadingState,
  getDetailLoadingState,
  getCompanies,
  getTableData,
  getDetailData
], (isLoadingCompany, isLoadingTable, isLoadingDetail, companies, tableData, detailData) => ({
  isLoadingCompany,
  isLoadingTable,
  isLoadingDetail,
  companies,
  tableData,
  detailData
}));

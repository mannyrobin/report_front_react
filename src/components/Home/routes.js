// @material-ui/icons
import DashboardIcon from "@material-ui/icons/Dashboard";
import LibraryBooksIcon from "@material-ui/icons/LibraryBooks";

// core components/views for Admin layout
import Dashboard from "components/Dashboard";
import Companies from "components/Companies";
import Classes from "components/Classes";
import Accounts from "components/Accounts";
import MarginsTable from "components/Margins";
import Users from "components/Users";

export default (isAdmin) => {
  return [
    {
      path: "/dashboard",
      name: "Dashboard",
      icon: DashboardIcon,
      component: Dashboard,
      isShow: isAdmin
    },
    {
      path: "/users",
      name: "Users",
      icon: LibraryBooksIcon,
      component: Users,
      isShow: isAdmin
    },
    {
      path: "/connected",
      name: "Companies",
      icon: LibraryBooksIcon,
      component: Companies,
      isShow: isAdmin
    },
    {
      path: "/classes",
      name: "Class Mapping",
      icon: LibraryBooksIcon,
      component: Classes,
      isShow: isAdmin
    },
    {
      path: "/margins",
      name: "Margin Report",
      icon: LibraryBooksIcon,
      component: MarginsTable,
      isShow: true
    },
    {
      path: "/accounts",
      name: "Account Mapping",
      icon: LibraryBooksIcon,
      component: Accounts,
      isShow: isAdmin
    }
  ];
};

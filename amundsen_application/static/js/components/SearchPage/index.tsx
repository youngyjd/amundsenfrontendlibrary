import * as React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import * as DocumentTitle from 'react-document-title';
import * as qs from 'simple-query-string';
import Pagination from 'react-js-pagination';

import SearchBar from './SearchBar';
import SearchList from './SearchList';

import InfoButton from 'components/common/InfoButton';
import { ResourceType, TableResource } from 'components/common/ResourceListItem/types';
import TabsComponent from 'components/common/Tabs';

import { GlobalState } from 'ducks/rootReducer';
import { searchAll, searchResource } from 'ducks/search/reducer';
import {
  DashboardSearchResults,
  SearchAllOptions,
  SearchAllRequest,
  SearchResourceRequest,
  TableSearchResults,
  UserSearchResults
} from 'ducks/search/types';
import { getPopularTables } from 'ducks/popularTables/reducer';
import { GetPopularTablesRequest } from 'ducks/popularTables/types';

// TODO: Use css-modules instead of 'import'
import './styles.scss';

const RESULTS_PER_PAGE = 10;

export interface StateFromProps {
  searchTerm: string;
  popularTables: TableResource[];
  tables: TableSearchResults;
  dashboards: DashboardSearchResults
  users: UserSearchResults;
}

export interface DispatchFromProps {
  searchAll: (term: string, options?: SearchAllOptions) => SearchAllRequest;
  searchResource: (resource: ResourceType, term: string, pageIndex: number) => SearchResourceRequest;
  getPopularTables: () => GetPopularTablesRequest;
}

export type SearchPageProps = StateFromProps & DispatchFromProps;

interface SearchPageState {
  selectedTab: ResourceType;
}

export class SearchPage extends React.Component<SearchPageProps, SearchPageState> {
  public static defaultProps: Partial<SearchPageProps> = {};

  constructor(props) {
    super(props);

    this.state = {
      selectedTab: ResourceType.table,
    };
  }

  componentDidMount() {
    this.props.getPopularTables();

    const params = qs.parse(window.location.search);
    const { searchTerm, pageIndex, selectedTab} = params;

    const currentTab = this.getSelectedTabByResourceType(selectedTab);
    this.setState({ selectedTab: currentTab });
    if (searchTerm && searchTerm.length > 0) {
      const index = pageIndex || 0;
      this.props.searchAll(searchTerm, this.createSearchOptions(index, currentTab));
      // Update the page URL with validated parameters.
      this.updatePageUrl(searchTerm, currentTab, index);
    }
  }

  getSelectedTabByResourceType = (newTab: ResourceType): ResourceType => {
    switch(newTab) {
      case ResourceType.table:
      case ResourceType.user:
        return newTab;
      case ResourceType.dashboard:
      default:
        return this.state.selectedTab;
    }
  };

  createSearchOptions = (pageIndex: number, selectedTab: ResourceType) => {
    return {
      dashboardIndex: (selectedTab === ResourceType.dashboard) ? pageIndex : 0,
      userIndex: (selectedTab === ResourceType.user) ? pageIndex : 0,
      tableIndex: (selectedTab === ResourceType.table) ? pageIndex : 0,
    };
  };

  getPageIndexByResourceType = (tab: ResourceType): number => {
    switch(tab) {
      case ResourceType.table:
        return this.props.tables.page_index;
      case ResourceType.user:
        return this.props.users.page_index;
      case ResourceType.dashboard:
        return this.props.dashboards.page_index;
    }
    return 0;
  };

  onSearchBarSubmit = (searchTerm: string): void => {
    this.props.searchAll(searchTerm);
    this.updatePageUrl(searchTerm, this.state.selectedTab,0);
  };

  onPaginationChange = (pageNumber: number): void => {
    // subtract 1 : pagination component indexes from 1, while our api is 0-indexed
    const index = pageNumber - 1;
    this.props.searchResource(this.state.selectedTab, this.props.searchTerm, index);
    this.updatePageUrl(this.props.searchTerm, this.state.selectedTab, index);
  };

  onTabChange = (tab: ResourceType): void => {
    const currentTab = this.getSelectedTabByResourceType(tab);
    this.setState({ selectedTab: currentTab });
    this.updatePageUrl(this.props.searchTerm, currentTab, this.getPageIndexByResourceType(currentTab));
  };

  updatePageUrl = (searchTerm: string, tab: ResourceType, pageIndex: number): void => {
    const pathName = `/search?searchTerm=${searchTerm}&selectedTab=${tab}&pageIndex=${pageIndex}`;
    window.history.pushState({}, '', `${window.location.origin}${pathName}`);
  };

  renderPopularTables = () => {
    const searchListParams = {
      source: 'popular_tables',
      paginationStartIndex: 0,
    };
    return (
        <div className="col-xs-12 col-md-offset-1 col-md-10">
          <div className="search-list-container">
            <div className="popular-tables-header">
              <label>Popular Tables</label>
              <InfoButton infoText={ "These are some of the most commonly accessed tables within your organization." }/>
            </div>
            <SearchList results={ this.props.popularTables } params={ searchListParams }/>
          </div>
        </div>
      )
  };

  renderSearchResults = () => {
    const tabConfig = [
      {
        title: `Tables (${ this.props.tables.total_results })`,
        key: ResourceType.table,
        content: this.getTabContent(this.props.tables, 'tables'),
      },
      // TODO PEOPLE - Add users tab
    ];

    return (
      <div className="col-xs-12 col-md-offset-1 col-md-10">
        <TabsComponent
          tabs={ tabConfig }
          defaultTab={ ResourceType.table }
          activeKey={ this.state.selectedTab }
          onSelect={ this.onTabChange }
        />
      </div>
    );
  };


  // TODO: Hard-coded text strings should be translatable/customizable
  getTabContent = (results, tabLabel) => {
    const { searchTerm } = this.props;
    const { page_index, total_results } = results;
    const startIndex = (RESULTS_PER_PAGE * page_index) + 1;
    const endIndex = RESULTS_PER_PAGE * ( page_index + 1);


    // TODO - Move error messages into Tab Component
    // Check no results
    if (total_results === 0 && searchTerm.length > 0) {
      return (
        <div className="search-list-container">
          <div className="search-error">
            Your search - <i>{ searchTerm }</i> - did not match any { tabLabel } result
          </div>
        </div>
      )
    }

    // Check page_index bounds
    if (page_index < 0 || startIndex > total_results) {
      return (
        <div className="search-list-container">
          <div className="search-error">
            Page index out of bounds for available matches.
          </div>
        </div>
      )
    }

    const title =`${startIndex}-${Math.min(endIndex, total_results)} of ${total_results} results`;
    return (
      <div className="search-list-container">
        <div className="search-list-header">
          <label>{ title }</label>
          <InfoButton infoText={ "Ordered by the relevance of matches within a resource's metadata, as well as overall usage." }/>
        </div>
        <SearchList results={ results.results } params={ {source: 'search_results', paginationStartIndex: 0 } }/>
        <div className="search-pagination-component">
            {
              total_results > RESULTS_PER_PAGE &&
              <Pagination
                activePage={ page_index + 1 }
                itemsCountPerPage={ RESULTS_PER_PAGE }
                totalItemsCount={ total_results }
                pageRangeDisplayed={ 10 }
                onChange={ this.onPaginationChange }
              />
            }
          </div>
      </div>
      );
  };

  render() {
    const { searchTerm } = this.props;
    const innerContent = (
      <div className="container search-page">
        <div className="row">
          <SearchBar handleValueSubmit={ this.onSearchBarSubmit } searchTerm={ searchTerm }/>
          { searchTerm.length > 0 && this.renderSearchResults() }
          { searchTerm.length === 0 && this.renderPopularTables()  }
        </div>
      </div>
    );
    if (searchTerm.length > 0) {
      return (
        <DocumentTitle title={ searchTerm + " - Amundsen Search" }>
          { innerContent }
        </DocumentTitle>
      );
    }
    return innerContent;
  }
}

export const mapStateToProps = (state: GlobalState) => {
  return {
    searchTerm: state.search.search_term,
    popularTables: state.popularTables,
    tables: state.search.tables,
    users: state.search.users,
    dashboards: state.search.dashboards,
  };
};

export const mapDispatchToProps = (dispatch: any) => {
  return bindActionCreators({ searchAll, searchResource, getPopularTables } , dispatch);
};

export default connect<StateFromProps, DispatchFromProps>(mapStateToProps, mapDispatchToProps)(SearchPage);

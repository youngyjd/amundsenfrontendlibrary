import * as React from 'react';
import * as DocumentTitle from 'react-document-title';
import Avatar from 'react-avatar';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import LoadingSpinner from '../common/LoadingSpinner';

import { GlobalState } from "../../ducks/rootReducer";
import { getUserById } from "../../ducks/user/reducer";
import { LoggedInUser, GetUserRequest } from "../../ducks/user/types";

import Breadcrumb from "../common/Breadcrumb";
import Flag from "../common/Flag";
import Tabs from "../common/Tabs";

import './styles.scss';

interface StateFromProps {
  user: LoggedInUser;
}

interface DispatchFromProps {
  getUserById: (userId: string) => GetUserRequest;
}

type ProfilePageProps = StateFromProps & DispatchFromProps;

interface ProfilePageState {
  user: LoggedInUser;
}

class ProfilePage extends React.Component<ProfilePageProps, ProfilePageState> {
  private userId: string;

  constructor(props) {
    super(props);

    const { match } = props;
    const params = match.params;
    this.userId = params ? params.userId : '';

    this.state = {
      user: this.props.user,
    };
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    const { user } = nextProps;
    return { user };
  }

  componentDidMount() {
    this.props.getUserById(this.userId);
  }

  // TODO: consider moving logic for empty content into Tab component
  createEmptyTabMessage = (message: string) => {
    return (
      <div className="empty-tab-message">
        <label>{ message }</label>
      </div>
    );
  };

  generateTabInfo = () => {
    const user = this.state.user;
    const tabInfo = [];

    // TODO: Populate tabs based on data
    // TODO: consider moving logic for empty content into Tab component
    tabInfo.push({
      content: this.createEmptyTabMessage('User has no frequently used resources.'),
      key: 'frequentUses_tab',
      title: 'Frequently Uses (0)',
    });
    tabInfo.push({
      content: this.createEmptyTabMessage('User has no bookmarked resources.'),
      key: 'bookmarks_tab',
      title: 'Bookmarks (0)',
    });
    tabInfo.push({
      content: this.createEmptyTabMessage('User has no owned resources.'),
      key: 'owner_tab',
      title: 'Owner (0)',
    });

    return tabInfo;
  };

  /* TODO: Add support to direct to 404 page for edgecase of someone typing in
     or pasting in a bad url. This would be consistent with TableDetail page behavior */ 
  render() {
    const user = this.state.user;
    return (
      <DocumentTitle title={ `${user.full_name} - Amundsen Profile` }>
        <div className="container profile-page">
          <div className="row">
            <div className="col-xs-12 col-md-offset-1 col-md-10">
              <Breadcrumb path='/' text='Search Results'/>
              <div className="profile-header">
                  <div className="profile-avatar">
                    {
                      // default Avatar looks a bit jarring -- intentionally not rendering if no full_name
                      user.full_name && user.full_name.length > 0 &&
                      <Avatar name={user.full_name} size={74} round={true} />
                    }
                  </div>
                  <div className="profile-details">
                    <div className="profile-title">
                      <h1>{ user.full_name }</h1>
                      {
                        (user.is_active === false) &&
                        <Flag caseType="sentenceCase" labelStyle="label-danger" text="Alumni"/>
                      }
                    </div>
                    {
                      user.role_name && user.team_name &&
                      <label>{ `${user.role_name} on ${user.team_name}` }</label>
                    }
                    {
                      user.manager_fullname &&
                      <label>{ `Manager: ${user.manager_fullname}` }</label>
                    }
                    <div className="profile-icons">
                      {
                        user.is_active &&
                        <a href={user.slack_id} className='btn btn-flat-icon' target='_blank'>
                          <img className='icon icon-slack'/>
                          <span>Slack</span>
                        </a>
                      }
                      {
                        user.is_active &&
                        <a href={`mailto:${user.email}`} className='btn btn-flat-icon' target='_blank'>
                          <img className='icon icon-mail'/>
                          <span>{ user.email }</span>
                        </a>
                      }
                      {
                        user.is_active && user.profile_url &&
                        <a href={user.profile_url} className='btn btn-flat-icon' target='_blank'>
                          <img className='icon icon-users'/>
                          <span>Employee Profile</span>
                        </a>
                      }
                      {
                        user.github_username &&
                        <a href={`https://github.com/${user.github_username}`} className='btn btn-flat-icon' target='_blank'>
                          <img className='icon icon-github'/>
                          <span>Github</span>
                        </a>
                      }
                    </div>
                  </div>
              </div>
              <div className="profile-tabs">
                <Tabs tabs={ this.generateTabInfo() } defaultTab='frequentUses_tab' />
              </div>
            </div>
          </div>
        </div>
      </DocumentTitle>
    );
  }
}

const mapStateToProps = (state: GlobalState) => {
  return {
    user: state.user.profileUser,
  }
};

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators({ getUserById }, dispatch);
};

export default connect<StateFromProps, DispatchFromProps>(mapStateToProps, mapDispatchToProps)(ProfilePage);

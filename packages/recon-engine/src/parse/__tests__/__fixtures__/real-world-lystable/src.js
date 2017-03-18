/* eslint-disable */
import React from 'react';
import PropTypes from 'utils/prop-types';
import {compose, withReducer, branch} from 'recompose';
import {identity} from 'lodash';
import {isRecruitmentManager} from 'utils/talent';
import {TALENT_REQUEST_STATES} from 'constants/talent';
import {TalentRequest, Agency, AgencyTalentRequest} from 'api/records';
import {createContainer, query as q} from 'api/recall';
import DateRange from 'moment-range';
import {PRIVACY_MODES} from 'constants/notes';
import {matchRecord} from 'utils/record';
import {Record} from 'immutable';
import withStaticProperties from 'decorators/with-static-properties';
import notFound from 'decorators/not-found';

import {Box, Flex} from 'components/layout';
import Paper from 'components/paper';
import LoadingSpinner from 'components/loading-spinner';
import SectionHeader from 'components/section-header';
import CardHeader from 'components/card-header';
import Link from 'components/link';
import Text from 'components/text';
import Icon from 'components/icon';
import CandidateList from 'components/candidate-list';
import MenuChecklist from 'components/menu-checklist';
import ContextualMenuButton from 'components/contextual-menu-button';
import MenuItemWithConfirm from 'components/menu-item-with-confirm';
import TalentRequestInformation from 'components/talent-request-information';
import NotesCard from 'components/notes-card';
import Avatar from 'components/avatar';
import Button from 'components/button';
import Modal from 'components/modal';
import TalentRequestForm from 'hera/components/talent-request-form';

import withViewer from 'decorators/with-viewer';
import withActions from 'decorators/with-actions';
import {
  updateTalentRequest,
  cancelTalentRequest,
  setFinalCandidate,
  removeCandidate,
  createAgencyTalentRequest,
  saveTalentRequest,
} from 'actions/talent-request-actions';

// State

export const State = new Record({
  editing: false,
});

// Actions

const TOGGLE_EDIT_FORM = 'TOGGLE_EDIT_FORM';
const CLOSE_EDIT_FORM = 'CLOSE_EDIT_FORM';

export const reducer = (state, action) => {
  switch (action.type) {
    case TOGGLE_EDIT_FORM:
      return state.merge({editing: !state.editing});

    case CLOSE_EDIT_FORM:
      return state.merge({editing: false});

    default:
      return state;
  }
};

// View

/* Render talent reqiest updates */
export function UpdatesCard(
  {
    talentRequest,
    ...otherProps
  },
) {
  return (
    <Box {...otherProps}>
      <CardHeader locked={true} title="Updates" justify="flex-start" />
      <Paper padded={true}>
        <Flex flexDirection="column">
          {!!talentRequest.final_candidate
            ? <Flex flexDirection="row" marginBottom={20}>
                <Flex marginRight={15}>
                  <Avatar
                    size="medium"
                    record={talentRequest.final_candidate.supplier}
                  />
                </Flex>
                <Flex flexDirection="column">
                  <Text weight="semi-bold">Selected Candidate</Text>
                  <Text>{talentRequest.final_candidate.supplier.name}</Text>
                </Flex>
              </Flex>
            : null}

          <Flex flexDirection="row" alignItems="center">
            <Flex width="45px" marginRight={15} justifyContent="center">
              <Text size="extra-large" weight="extra-light">
                {talentRequest.candidates.size}
              </Text>
            </Flex>
            <Text weight="semi-bold">Candidates</Text>
          </Flex>
        </Flex>

        <Flex flexDirection="row" alignItems="center">
          <Flex width="45px" marginRight={15} justifyContent="center">
            <Text size="extra-large" weight="extra-light">
              {talentRequest.agencies.size}
            </Text>
          </Flex>
          <Text weight="semi-bold">Agencies</Text>
        </Flex>

      </Paper>
    </Box>
  );
}

export function AgencyChecklist(
  {
    talentRequest,
    agencies,
    onCreated,
    createAgencyTalentRequestAction,
  },
) {
  const items = agencies.map(agency => {
    // Check if the agency is already attached
    const existingAgency = talentRequest.agencies.find(
      _agency => !!_agency && matchRecord(agency, _agency),
    );

    return {
      checked: !!existingAgency,
      label: agency.name,
      checkAction: () => {
        createAgencyTalentRequestAction(
          new AgencyTalentRequest({
            talent_request: talentRequest,
            agency,
          }),
        ).then(() => {
          onCreated();
        });
      },
    };
  });

  return (
    <MenuChecklist
      items={items}
      placeholderContent="No agencies in this team"
      key={null}
    >
      <Box width={220}>
        Add to Talent Request
      </Box>
    </MenuChecklist>
  );
}

const Z_INDEX = {
  MODAL: 200,
};

/**
 * Display a talent request in detail
 */
export const TalentRequestsDetailPage = withStaticProperties({
  propTypes: {
    talentRequest: PropTypes.record(TalentRequest),
    agencies: PropTypes.iterableOf(PropTypes.record(Agency)),
    recall: PropTypes.shape({
      markAsStale: PropTypes.func,
    }).isRequired,
    queries: PropTypes.shape({
      agencies: PropTypes.shape({
        id: PropTypes.string,
        ready: PropTypes.bool,
      }),
      talentRequest: PropTypes.shape({
        id: PropTypes.string,
        ready: PropTypes.bool,
      }),
    }).isRequired,
    viewer: PropTypes.viewer.isRequired,
    updateTalentRequest: PropTypes.func.isRequired,
    cancelTalentRequest: PropTypes.func.isRequired,
    setFinalCandidate: PropTypes.func.isRequired,
    removeCandidate: PropTypes.func.isRequired,
    createAgencyTalentRequest: PropTypes.func.isRequired,
    saveTalentRequest: PropTypes.func.isRequired,
    state: PropTypes.shape({
      editing: PropTypes.bool.isRequired,
    }).isRequired,
    dispatch: PropTypes.func.isRequired,
  },
})(function TalentRequestsDetailPage(props) {
  const {
    talentRequest,
    agencies,
    queries,
    viewer,
    // withReducer
    state: {editing},
    dispatch,
  } = props;

  const handleContainerRefresh = () => {
    props.recall.markAsStale([
      props.queries.agencies.id,
      props.queries.talentRequest.id,
    ]);
  };

  const fire = action => () => dispatch(action);

  const status = !!talentRequest
    ? TALENT_REQUEST_STATES[talentRequest.status]
    : null;

  const searchRange = !!talentRequest &&
    !!talentRequest.start_date &&
    !!talentRequest.end_date
    ? new DateRange(talentRequest.start_date, talentRequest.end_date)
    : null;

  const heading = (
    <div>
      {isRecruitmentManager(viewer)
        ? <Link to="@requests">
            Talent Requests
          </Link>
        : <Link to="@myrequests">
            My Requests
          </Link>}
      <Icon>chevron_right</Icon>
      {!!talentRequest ? talentRequest.job_title : 'Loading'}
    </div>
  );

  const menu = (
    <ContextualMenuButton iconColor="grey" origin="top right">
      <AgencyChecklist
        talentRequest={talentRequest}
        agencies={agencies}
        createAgencyTalentRequestAction={props.createAgencyTalentRequest}
        onCreated={handleContainerRefresh}
      />
      <MenuItemWithConfirm
        icon="remove_circle_outline"
        confirm="Are you sure?"
        onClick={() => props.cancelTalentRequest(talentRequest)}
        key="cancel"
      >
        Cancel Request
      </MenuItemWithConfirm>
    </ContextualMenuButton>
  );

  const editTalentRequest = [
    <Button
      key={0}
      square={true}
      icon="edit"
      theme="light"
      size="small"
      onClick={fire({type: TOGGLE_EDIT_FORM})}
    />,

    <Modal
      key={1}
      open={editing}
      onCloseRequest={fire({type: CLOSE_EDIT_FORM})}
      zIndex={Z_INDEX.MODAL}
    >
      <TalentRequestForm
        saveTalentRequest={props.saveTalentRequest}
        exitForm={fire({type: CLOSE_EDIT_FORM})}
        team={viewer.team}
        baseZIndex={Z_INDEX.MODAL}
        talentRequest={talentRequest}
      />
    </Modal>,
  ];

  return (
    <Box margin="50px auto 20px" maxWidth={1180} width="100%">
      {queries.talentRequest.ready
        ? <div>
            <SectionHeader marginBottom={20} heading={heading} />
            <Flex flexDirection="row">
              <Flex flex={2} flexDirection="column" marginRight={20}>
                <CardHeader
                  locked={true}
                  title="Request Details"
                  justify="flex-start"
                  primaryActions={
                    status !== TALENT_REQUEST_STATES.cancelled &&
                      status !== TALENT_REQUEST_STATES.placed
                      ? editTalentRequest
                      : undefined
                  }
                />
                <Paper padded={true}>
                  <TalentRequestInformation
                    talentRequest={talentRequest}
                    menu={menu}
                  />
                </Paper>
              </Flex>

              <Flex flex={1} flexDirection="column" marginLeft={20}>
                <UpdatesCard talentRequest={talentRequest} marginBottom={30} />
                <NotesCard
                  title="Hiring Notes"
                  parent={talentRequest}
                  privacyMode={PRIVACY_MODES.PRIVATE}
                />
              </Flex>
            </Flex>
            <Flex marginTop={40} flexDirection="column">
              <SectionHeader
                icon="lock"
                marginBottom={20}
                heading="Candidates"
              />
              <CandidateList
                finalCandidate={talentRequest.final_candidate}
                candidates={talentRequest.candidates}
                team={viewer.team}
                searchRange={searchRange}
                setFinalCandidate={props.setFinalCandidate}
                removeCandidate={props.removeCandidate}
                viewer={viewer}
              />
            </Flex>
          </div>
        : <LoadingSpinner size="medium" />}
    </Box>
  );
});

const candidateFragment = {
  id: true,
  removed_at: true,
  removed_by: {
    id: true,
  },
  talent_request: {
    id: true,
  },
  supplier: {
    id: true,
    name: true,
    email: true,
    city: true,
    next_available: true,
    show_availability: true,
    supplier_type: true,
    picture: {
      id: true,
      type: true,
      remote_id: true,
      filename: true,
      url: true,
    },
    profile: {
      id: true,
      contact_email: true,
      accepted: true,
      invited_by: {
        id: true,
        name: true,
      },
      created_at: true,
      created_by: {
        id: true,
        name: true,
      },
      approved_at: true,
      contact_name: true,
      team: {
        id: true,
      },
      agency: {
        id: true,
        name: true,
        contact_name: true,
        email: true,
      },
    },
  },
};

export const container = createContainer({
  queries: {
    agencies: q.many(Agency, {
      params: () => ({
        filter: {
          archived: false,
        },
      }),
      fields: {
        name: true,
        contact_name: true,
      },
    }),
    talentRequest: q.single(TalentRequest, {
      params: vars => ({
        id: vars.params.requestId,
      }),
      fields: {
        id: true,
        created_at: true,
        status: true,
        submitted_by: {
          id: true,
          name: true,
          picture: {
            id: true,
            type: true,
            remote_id: true,
            filename: true,
            url: true,
          },
        },
        job_title: true,
        job_description: true,
        position_type: true,
        start_date: true,
        end_date: true,
        location: true,
        team_name: true,
        urgency: true,
        skills: {
          edges: {
            id: true,
            type: true,
            name: true,
          },
        },
        final_candidate: {
          ...candidateFragment,
        },
        candidates: {
          edges: {
            ...candidateFragment,
          },
        },
        agencies: {
          edges: {
            id: true,
            name: true,
            contact_name: true,
            email: true,
          },
        },
      },
    }),
  },
});

const talentRequestOrNotFound = branch(
  ({queries, talentRequest}) => !queries.talentRequest.ready || !!talentRequest,
  identity,
  notFound(),
);

export default compose(
  withViewer(),
  withActions({
    updateTalentRequest,
    cancelTalentRequest,
    setFinalCandidate,
    removeCandidate,
    createAgencyTalentRequest,
    saveTalentRequest,
  }),
  container,
  talentRequestOrNotFound,
  withReducer('state', 'dispatch', reducer, new State()),
)(TalentRequestsDetailPage);

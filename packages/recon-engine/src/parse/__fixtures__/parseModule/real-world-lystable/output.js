module.exports = {
  path: 'real-world-lystable',
  data: {
    components: [
      {
        name: 'UpdatesCard',
        deps: [
          {
            name: 'Box',
            props: [{name: '__spread'}]
          },
          {
            name: 'CardHeader',
            props: [
              {name: 'locked', type: {type: 'Boolean'}},
              {name: 'title', type: {type: 'StringLiteral'}},
              {name: 'justify', type: {type: 'StringLiteral'}},
            ]
          },
          {name: 'Paper'},
          {name: 'Flex'},
          {name: 'Flex'},
          {name: 'Flex'},
          {name: 'Avatar'},
          {name: 'Flex'},
          {name: 'Text'},
          {name: 'Text'},
          {name: 'Flex'},
          {name: 'Flex'},
          {name: 'Text'},
          {name: 'Text'},
          {name: 'Flex'},
          {name: 'Flex'},
          {name: 'Text'},
          {name: 'Text'},
        ]
      },
      {
        name: 'AgencyChecklist',
        deps: [
          {name: 'MenuChecklist'},
          {
            name: 'Box',
            props: [
              {
                name: 'width',
                type: {type: 'NumericLiteral'}
              }
            ]
          },
        ]
      },
      {
        name: 'TalentRequestsDetailPage',
        enhancements: [{type: 'CallExpression'}]
      }
    ],
    symbols: [
      {name: 'React'},
      {name: 'PropTypes'},
      {name: 'compose'},
      {name: 'withReducer'},
      {name: 'branch'},
      {name: 'identity'},
      {name: 'isRecruitmentManager'},
      {name: 'TALENT_REQUEST_STATES'},
      {name: 'TalentRequest'},
      {name: 'Agency'},
      {name: 'AgencyTalentRequest'},
      {name: 'createContainer'},
      {name: 'q'},
      {name: 'DateRange'},
      {name: 'PRIVACY_MODES'},
      {name: 'matchRecord'},
      {name: 'Record'},

      {name: 'withStaticProperties'},
      {name: 'notFound'},

      {name: 'Box'},
      {name: 'Flex'},
      {name: 'Paper'},
      {name: 'LoadingSpinner'},
      {name: 'SectionHeader'},
      {name: 'CardHeader'},
      {name: 'Link'},
      {name: 'Text'},
      {name: 'Icon'},
      {name: 'CandidateList'},
      {name: 'MenuChecklist'},
      {name: 'ContextualMenuButton'},
      {name: 'MenuItemWithConfirm'},
      {name: 'TalentRequestInformation'},
      {name: 'NotesCard'},
      {name: 'Avatar'},
      {name: 'Button'},
      {name: 'Modal'},
      {name: 'TalentRequestForm'},

      {name: 'withViewer'},
      {name: 'withActions'},

      {name: 'updateTalentRequest'},
      {name: 'cancelTalentRequest'},
      {name: 'setFinalCandidate'},
      {name: 'removeCandidate'},
      {name: 'createAgencyTalentRequest'},
      {name: 'saveTalentRequest'},

      {name: 'State'},
      {name: 'export::State'},
      {name: 'TOGGLE_EDIT_FORM'},
      {name: 'CLOSE_EDIT_FORM'},
      {name: 'reducer'},
      {name: 'export::reducer'},

      {name: 'UpdatesCard'},
      {name: 'export::UpdatesCard'},
      {name: 'AgencyChecklist'},
      {name: 'export::AgencyChecklist'},
      {name: 'Z_INDEX'},
      {name: 'TalentRequestsDetailPage'},
      {name: 'export::TalentRequestsDetailPage'},
      {name: 'candidateFragment'},
      {name: 'container'},
      {name: 'export::container'},
      {name: 'talentRequestOrNotFound'},
      {name: 'export::default'},
    ]
  }
};

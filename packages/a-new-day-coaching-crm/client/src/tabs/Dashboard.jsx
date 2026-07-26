// Library Imports
import React, { useContext } from 'react';

// Component Imports
import { Tracker } from '../components/dashboard/HomeworkTrackerV2.jsx';
import { ToolsList } from '../components/dashboard/ToolsList.jsx';
import { AddHomeworkModal, AddSubjectModal } from '../components/dashboard/HomeworkTrackerModals.jsx';

// Style Imports
import '@mantine/carousel/styles.css';
import "../assets/style/dashboard.css";
import DocumentsList from '../components/dashboard/DocumentsList.jsx';
import ExternalToolsList from '../components/dashboard/ExternalToolsList.jsx';
import Intent from '../components/dashboard/Intent.jsx';
import { Carousel, CarouselSlide } from '@mantine/carousel';
import { CurrentUserContext } from '../App.jsx';
import { Text } from '@mantine/core';

export default function Dashboard({setTab}) {
  
  const [subjectAddMenuOpen, setSubjectAddMenuOpen] = React.useState(false);
  const [homeworkAddMenuOpen, setHomeworkAddMenuOpen] = React.useState(false);

  const {currentUser} = useContext(CurrentUserContext)

  return (
    <div className="container-fluid w-100">
      <div className="row px-2">
        <div className="d-xxl-none col-12 indicator-container">
          <Carousel height="auto" slideGap={10} withControls={false} withIndicators>
            <CarouselSlide>
              <Intent height="100%" />
            </CarouselSlide>
            <CarouselSlide>
              <ToolsList height="100%" />
            </CarouselSlide>
            <CarouselSlide>
              <DocumentsList height="100%" />
            </CarouselSlide>
            <CarouselSlide>
              <ExternalToolsList height="100%" />
            </CarouselSlide>
          </Carousel>
        </div>
        <div className="col-12 col-xxl-9 right-panel">      
          {!currentUser.delegate && <Tracker setHomeworkAddMenuOpen={setHomeworkAddMenuOpen} setSubjectAddMenuOpen={setSubjectAddMenuOpen}/>}
          {currentUser.delegate && <div>
            <Text>You don't have permission to view {currentUser.delegate.personalData.displayName}'s assignment tracker</Text>
            </div>}
        </div>
        <div className="d-none d-xxl-block col-xxl-3 left-panel">        
          <Intent setTab={setTab}/>
          <ToolsList />
          <DocumentsList />
          <ExternalToolsList />
        </div>
        <AddSubjectModal open={subjectAddMenuOpen} close={() => setSubjectAddMenuOpen(false)} />
        <AddHomeworkModal open={homeworkAddMenuOpen} close={() => setHomeworkAddMenuOpen(false)} />
      </div>
    </div>
  )
}
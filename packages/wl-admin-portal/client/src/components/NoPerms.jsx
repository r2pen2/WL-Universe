import React from 'react'
import SentimentDissatisfiedIcon from '@mui/icons-material/SentimentDissatisfied';
import { CurrentUserContext } from '../App';
import { WLHeader } from '../libraries/Web-Legos/components/Text';
import { Text } from '@nextui-org/react';

export default function NoPerms() {

  const {currentUser} = React.useContext(CurrentUserContext)

  return (
    <div className="App d-flex flex-column align-items-center justify-content-center" style={{height: "100vh"}}>
      <div className="app-content gap-2 d-flex flex-column align-items-center justify-content-center">
        <SentimentDissatisfiedIcon sx={{fontSize: 128}}/>
        <WLHeader>
          Oh no!
        </WLHeader>
        <Text>
          The email address "{currentUser.email}" doesn't have access to this page.
        </Text>
        <Text>
          If you believe this to be an error, contact a site administrator or Joe Dobbelaar: <a href="mailto:joe@joed.dev">joe@joed.dev</a>
        </Text>
      </div>
    </div>
  )
}

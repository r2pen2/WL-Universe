import React from 'react'
import { WLHeader } from '../libraries/Web-Legos/components/Text'
import InsightsIcon from '@mui/icons-material/Insights';
import { Text } from '@nextui-org/react';

export default function SiteAnalytics() {
  return (
    <div className="px-3 w-100 d-flex flex-column align-items-center justify-content-start">
      <InsightsIcon style={{fontSize: 128, color: "#D41D6D"}}/>
      <WLHeader>
        Analytics are coming soon!
      </WLHeader>
      <Text>
        Get insights on your website— how many people are viewing my page? Where are they from?
      </Text>
    </div>
  )
}

import React from 'react'
import EditIcon from '@mui/icons-material/Edit';
import { WLHeader } from '../libraries/Web-Legos/components/Text';
import { Text } from '@nextui-org/react';

export default function SiteLog() {
  return (
    <div className="px-3 w-100 d-flex flex-column align-items-center justify-content-start">
      <EditIcon style={{fontSize: 128, color: "#AB2FD6"}}/>
      <WLHeader>
        Changelog is coming soon!
      </WLHeader>
      <Text>
      See what changes have been made to your website.
      </Text>
    </div>
  )
}

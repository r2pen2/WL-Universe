import React from 'react'
import { Paper, Spoiler, Text } from '@mantine/core'
import ModuleHeader from './ModuleHeader'
import { CurrentUserContext } from '../../App';
import { LinkMaster } from '../../api/links.ts';
import { Resource } from '../../api/db/dbResource.ts';

export default function ExternalToolsList({height}) {
  
  /** Get currentUser from react context */
  const {currentUser} = React.useContext(CurrentUserContext);

  /** Every document that belongs to this user */
  const resources = Object.values(currentUser.resources);

  /** Render a list of resources */
  const ResourceList = () => {
    return resources.sort((a,b) => a.title.localeCompare(b.title)).map((resource, index) => <ResourceCard key={index} r={resource} currentUser={currentUser} />)
  }

  return (
    <Paper withBorder className="mb-2" style={{height: height}}>
      <ModuleHeader>My External Resources</ModuleHeader>
      <div className="p-2">
        <Spoiler maxHeight={180} showLabel="See All Shared" hideLabel="Collapse Shared" className="centered-expander">
          <div className="container-fluid">
            <div className="row">
              <ResourceList />
            </div>
          </div>
        </Spoiler>
      </div>
    </Paper>
  )

}




/** Render a single document in a Carousel */
export const ResourceCard = ({r}) => {

  return (
    <div className="col-6 mb-2">
      <Paper className="p-2 h-100" withBorder style={{cursor: "pointer"}} onClick={() => window.open(LinkMaster.ensureAbsoluteUrl(r.href), "_blank")}>
        <div className="d-flex justify-content-between gap-2" style={{overflow: 'hidden'}}>
          <Text style={{width: "100%", overflow:"hidden", textOverflow: "ellipsis", whiteSpace: 'nowrap'}}>{r.title}</Text>
          <img src={Resource.getSource(r.href)} alt={r.title} style={{width: 20, height: 20}} />
          {/* <Tooltip label={d.type}>
            <div style={{marginLeft:"1rem"}}>
              <DocSvg doc={d} />
            </div>
          </Tooltip> */}
        </div>
      </Paper>
    </div>
  )
}

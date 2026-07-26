import React from 'react'
import { CurrentUserContext } from '../../App';
import { Paper, Spoiler, Text, Tooltip } from '@mantine/core';
import { DocumentType } from '../../api/db/dbDocument.ts';
import { LinkMaster } from '../../api/links.ts';
import ModuleHeader from './ModuleHeader.jsx';
import { IconBrandGoogleDrive } from '@tabler/icons-react';

export default function DocumentsList({height}) {
  
  /** Get currentUser from react context */
  const {currentUser} = React.useContext(CurrentUserContext);

  /** Every document that belongs to this user */
  const documents = Object.values(currentUser.documents);

  /** Render a list of documents */
  const DocList = () => {
    return documents.sort((a,b) => a.title.localeCompare(b.title)).map((document, index) => <DocumentCard key={index} d={document} currentUser={currentUser} />)
  }

  return (
    <Paper withBorder className="mb-2" style={{height: height}}>
      <ModuleHeader>My Shared Documents</ModuleHeader>
      <div className="p-2">
        <Spoiler maxHeight={180} showLabel="See All Shared" hideLabel="Collapse Shared" className="centered-expander">
          <div className="container-fluid">
            <div className="row">
              <DocList />
            </div>
          </div>
        </Spoiler>
      </div>
    </Paper>
  )
}

/** Render a single document in a Carousel */
export const DocumentCard = ({d}) => {

  return (
    <div className="col-6 mb-2">
      <Paper className="p-2 h-100" withBorder style={{cursor: "pointer"}} onClick={() => window.open(LinkMaster.ensureAbsoluteUrl(d.href), "_blank")}>
        <div className="d-flex justify-content-between" style={{overflow: 'hidden'}}>
          <Text style={{width: "100%", overflow:"hidden", textOverflow: "ellipsis", whiteSpace: 'nowrap'}}>{d.title}</Text>
          <Tooltip label={d.type}>
            <div style={{marginLeft:"1rem"}}>
              <DocSvg doc={d} />
            </div>
          </Tooltip>
        </div>
      </Paper>
    </div>
  )
}

export const DocSvg = ({doc}) => {
  const fill = doc.getColor();
  if (doc.type === DocumentType.DRIVE) { return <IconBrandGoogleDrive size={24} /> }
  if (doc.type === DocumentType.DOCUMENT) { return <svg focusable="false" height="24" viewBox="0 0 24 24" width="24" className="H6g39d vf9sSe NMm5M hhikbc"><path d="M0 0h24v24H0z" fill="none"></path><path fill={fill} d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1.99 6H7V7h10.01v2zm0 4H7v-2h10.01v2zm-3 4H7v-2h7.01v2z"></path></svg> }
  if (doc.type === DocumentType.SPREADSHEET) { return <svg focusable="false" height="24" viewBox="0 0 24 24" width="24" className="MRakOe vf9sSe NMm5M"><path d="M0 0h24v24H0z" fill="none"></path><path fill={fill} d="M19 3H5c-1.1 0-1.99.9-1.99 2L3 8v11c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 8h-8v8H9v-8H5V9h4V5h2v4h8v2z"></path></svg> }
  if (doc.type === DocumentType.PRESENTATION) { return <svg focusable="false" height="24" viewBox="0 0 24 24" width="24" className="SzUuf vf9sSe NMm5M"><path d="M0 0h24v24H0z" fill="none"></path><path fill={fill} d="M19 3H5c-1.1 0-1.99.9-1.99 2v14c0 1.1.89 2 1.99 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 13H5V8h14v8z"></path></svg> }
  if (doc.type === DocumentType.FORM) { return <svg focusable="false" height="24" viewBox="0 0 24 24" width="24" className="wUnCfd vf9sSe NMm5M"><path fill={fill} d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-2h2v2zm0-4H7v-2h2v2zm0-4H7V7h2v2zm8 8h-7v-2h7v2zm0-4h-7v-2h7v2zm0-4h-7V7h7v2z"></path><path d="M0 0h24v24H0z" fill="none"></path></svg> }
  if (doc.type === DocumentType.PHOTOSANDIMAGES) { return <svg focusable="false" height="24" viewBox="0 0 24 24" width="24" className="aDfHOc vf9sSe NMm5M"><path d="M0 0h24v24H0z" fill="none"></path><path fill={fill} d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"></path></svg> }
  if (doc.type === DocumentType.PDF) { return <svg focusable="false" height="24" viewBox="0 0 24 24" width="24" className="aDfHOc vf9sSe NMm5M"><path fill={fill} d="M7 11.5h1v-1H7v1zM19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9.5 8.5c0 .83-.67 1.5-1.5 1.5H7v2H5.5V9H8c.83 0 1.5.67 1.5 1.5v1zm10-1H17v1h1.5V13H17v2h-1.5V9h4v1.5zm-5 3c0 .83-.67 1.5-1.5 1.5h-2.5V9H13c.83 0 1.5.67 1.5 1.5v3zm-2.5 0h1v-3h-1v3z"></path><path d="M0 0h24v24H0z" fill="none"></path></svg> }
  if (doc.type === DocumentType.VIDEO) { return <svg focusable="false" height="24" viewBox="0 0 24 24" width="24" className="aDfHOc vf9sSe NMm5M"><path fill={fill} d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z"></path><path d="M0 0h24v24H0z" fill="none"></path></svg> }
  if (doc.type === DocumentType.SHORTCUT) { return <svg enableBackground="new 0 0 24 24" focusable="false" height="24" viewBox="0 0 24 24" width="24" className="IQG0lb vf9sSe NMm5M"><g><rect fill="none" height="24" width="24"></rect><path fill={fill} d="M16,2L16,2L16,2H8v2h4.3C9.7,5.81,8,8.81,8,12.2c0,4.83,3.44,8.87,8,9.8v-2.06c-3.44-0.89-6-4.02-6-7.74 c0-2.95,1.61-5.53,4-6.91V10h2L16,2z"></path></g></svg> }
  if (doc.type === DocumentType.FOLDER) { return <svg focusable="false" width="24" height="24" viewBox="0 0 24 24" className="IQG0lb vf9sSe NMm5M"><path fill={fill} d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z"></path></svg> }
  if (doc.type === DocumentType.SITE) { return <svg focusable="false" height="24" viewBox="0 0 24 24" width="24" className="rH6hs vf9sSe NMm5M"><path fill={fill} d="M19 4H5c-1.1 0-1.99.9-1.99 2L3 18c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-5 14H5v-4h9v4zm0-5H5V9h9v4zm5 5h-4V9h4v9z"></path><path d="M0 0h24v24H0z" fill="none"></path></svg> }
  if (doc.type === DocumentType.AUDIO) { return <svg focusable="false" height="24" viewBox="0 0 24 24" width="24" className="aDfHOc vf9sSe NMm5M"><path fill={fill} d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM7.2 18c-.66 0-1.2-.54-1.2-1.2V12c0-3.31 2.69-6 6-6s6 2.69 6 6v4.8c0 .66-.54 1.2-1.2 1.2H14v-4h2v-2c0-2.21-1.79-4-4-4s-4 1.79-4 4v2h2v4H7.2z"></path><path d="M0 0h24v24H0z" fill="none"></path></svg> }
  if (doc.type === DocumentType.DRAWING) { return <svg focusable="false" height="24" viewBox="0 0 24 24" width="24" className="aDfHOc vf9sSe NMm5M"><path d="M0 0h24v24H0z" fill="none"></path><path fill={fill} d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1 15h-6v-5.79c-.66.61-1.53.99-2.5.99-2.04 0-3.7-1.66-3.7-3.7s1.66-3.7 3.7-3.7 3.7 1.66 3.7 3.7c0 .97-.38 1.84-.99 2.5H18v6z"></path></svg> }
  if (doc.type === DocumentType.ARCHIVE) { return <svg focusable="false" height="24" viewBox="0 0 24 24" width="24" className="IQG0lb vf9sSe NMm5M"><path d="M0 0h24v24H0z" fill="none"></path><path fill={fill} d="M19 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 15l-4-4h8l-4 4zm4-6H8v-2h8v2zm0-4H8V6h8v2z"></path></svg> }
}
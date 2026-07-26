import React, { useState } from 'react'

import "../assets/style/services.css"
import { WLBlockHeader, WLHeader, WLText } from '../libraries/Web-Legos/components/Text';
import { WLSpinnerPage } from '../libraries/Web-Legos/components/Layout';

import { blockHeaderFill } from "../assets/style/colors";
import { Card, Divider, Text, Button } from '@nextui-org/react';
import { AddModelButton, ModelEditButton, ModelEditModal } from '../libraries/Web-Legos/components/Modals';
import { useEffect } from 'react';
import { ClientItem, InPersonServiceItem, VirtualServiceItem } from '../api/siteModels.ts';
import { SiteModel } from '../libraries/Web-Legos/api/models.ts';


import ComputerTwoToneIcon from '@mui/icons-material/ComputerTwoTone';
import LocationOnTwoToneIcon from '@mui/icons-material/LocationOnTwoTone';
import { ContactModal } from '../components/Modals';
import { useContext } from 'react';
import { CurrentSignInContext } from '../App';
import { AuthenticationManager } from '../libraries/Web-Legos/api/auth.ts';
import { AnalyticsManager } from '../libraries/Web-Legos/api/analytics.ts';
import { WLAliceCarousel, createCarouselBreakpoints } from '../libraries/Web-Legos/components/Content.jsx';

export default function Services() {

  const {currentSignIn} = useContext(CurrentSignInContext);
  const {authenticationManager} = useContext(AuthenticationManager.Context);
  const {analyticsManager} = useContext(AnalyticsManager.Context);

  analyticsManager.logPageView("services")

  const [userCanEditText, setUserCanEditText] = useState(false);
  const [userCanEditServiceItems, setUserCanEditServiceItems] = useState(false);
  
  const [clientItems, setClientItems] = useState([]);
  const [clientItemsFetched, setClientItemsFetched] = useState(false);
  const [userCanEditGalleryPictures, setUserCanEditGalleryPictures] = useState(false);
  
  useEffect(() => {
    authenticationManager.getPermission(currentSignIn, "siteText").then(p => setUserCanEditText(p));
    authenticationManager.getPermission(currentSignIn, "service-items").then(p => setUserCanEditServiceItems(p));
    authenticationManager.getPermission(currentSignIn, "gallery-pictures").then(p => setUserCanEditGalleryPictures(p));
  }, [authenticationManager, currentSignIn]);
  
  const [virtualLoaded, setVirtualLoaded] = useState(false);
  const [inPersonLoaded, setInPersonLoaded] = useState(false);

  const [virtualServiceItems, setVirtualServiceItems] = useState([]);
  const [inPersonServiceItems, setInPersonServiceItems] = useState([]);

  
  const [currentModel, setCurrentModel] = useState(new SiteModel());
  const [editModalOpen, setEditModalOpen] = useState(false);

  
  const [contactModalOpen, setContactModalOpen] = useState(false); // Whether contact modal is open

  useEffect(() => {
    VirtualServiceItem.getAndSet(setVirtualServiceItems, setVirtualLoaded);
    InPersonServiceItem.getAndSet(setInPersonServiceItems, setInPersonLoaded);
    ClientItem.getAndSet(setClientItems, setClientItemsFetched);
  }, [])


  function ServiceItem({serviceItem, virtual}) {
    return (
      <div className="py-2 container-fluid d-flex flex-column align-items-center justify-content-start">
        <div className="row w-100">
          <div className="col-1 d-none d-md-flex flex-column align-items-center justify-content-center">
            { virtual ? <ComputerTwoToneIcon style={{color: "#934eb1"}}/> : <LocationOnTwoToneIcon style={{color: "#934eb1"}}/> }
          </div>
          <div className="col-md-10 col-12 d-flex flex-row">
            <div style={{border: "2px solid #A67FCF", borderRightWidth: 0, width: "1rem"}}/>
            <Text className="d-none d-md-flex" align="center" size="$lg" style={{width: "100%", marginBottom: "0.5rem", marginLeft:"1rem", marginRight:"1rem"}}>{serviceItem.text}</Text>
            <Text className="d-inline d-md-none" align="center" style={{width: "100%", marginBottom: "0.5rem", marginLeft:"1rem", marginRight:"1rem"}}>{serviceItem.text}</Text>
            <div style={{border: "2px solid #A67FCF", borderLeftWidth: 0, width: "1rem"}}/>
          </div>
          <div className="col-md-1 col-12 d-flex flex-row justify-content-center">
            <ModelEditButton small userCanEdit={userCanEditServiceItems} model={virtual ? VirtualServiceItem : InPersonServiceItem} setCurrentModel={setCurrentModel} setEditModalOpen={setEditModalOpen} data={serviceItem} />
          </div>
        </div>
      </div>
    )
  }

  function renderVirtualServiceItems() {
    return virtualServiceItems.map((v,i) => <ServiceItem virtual={true} serviceItem={v} key={i} />);
  }

  function renderInPersonServiceItems() {
    return inPersonServiceItems.map((v,i) => <ServiceItem serviceItem={v} key={i} />);
  }

  
  /**
   * A button scaled to the screen width that opens the {@link ContactModal}
   */
  function ScheduleButton() {
    
    /**
     * When the button is clicked, the contact modal should be opened
     */
    function handleScheduleButtonClick() {
      setContactModalOpen(true);
    }

    return (
        <Button className="w-100 d-inline m-2" css={{minHeight: 50, maxWidth: 250}} flat size="$lg" onClick={handleScheduleButtonClick}>
          Schedule A Consultation
        </Button>
    )
  }

  function GalleryItem({item, model}) {
    return (
      <div className="p-2 gap-2 d-flex flex-column align-items-center justify-content-center" style={{height: '100%', userSelect: "none"}}>
        <ModelEditButton model={model} data={item} userCanEdit={userCanEditGalleryPictures} setCurrentModel={setCurrentModel} setEditModalOpen={setEditModalOpen}/>
        <img className="no-select img-shadow" src={item.imageSource} alt="slideshow-item" style={{borderRadius: "1rem", width: '100%', maxHeight: 500, height: '100%', objectFit: "cover"}}/>
      </div>
    )
  }

  return (
  <WLSpinnerPage dependencies={[virtualLoaded, inPersonLoaded, clientItemsFetched]}>
    <ContactModal open={contactModalOpen} setOpen={setContactModalOpen} />
    <ModelEditModal open={editModalOpen} setOpen={setEditModalOpen} model={currentModel} />
    <WLBlockHeader text="Services & Fees" color={blockHeaderFill} short />
    <section className="d-flex flex-column align-items-center justify-content-center">
      <WLHeader firestoreId="services-header" editable={userCanEditText}/>
      <div style={{maxWidth: 1400, width: "100%"}}>
        <WLText firestoreId="services-description" editable={userCanEditText}/>
      </div>
    </section>
    <section className='container'>
      <div className="row p-2 h-100">
        <div className="p-2 col-xl-6 col-lg-12 d-flex">
          <Card variant='flat' css={{backgroundColor: "#ffffff", width: "100%",}}>
            <Card.Header>
              <WLHeader firestoreId="in-person-header" headerLevel={2}/>
            </Card.Header>
            <div className="px-5">
              <Divider/>
            </div>
            <Card.Body className="d-flex flex-column align-items-start justify-content-start">
              <div className="w-100 d-flex flex-column align-items-center justify-content-center">
                { renderInPersonServiceItems() }
                <AddModelButton userCanEdit={userCanEditServiceItems} model={InPersonServiceItem} setEditModalOpen={setEditModalOpen} setCurrentModel={setCurrentModel}/>
              </div>
              <div className="d-flex flex-column text-center py-2 w-100">
                <Divider />
                <WLText firestoreId="in-person-pricing" editable={userCanEditText}/>
              </div>
            </Card.Body>
          </Card>
        </div>
        <div className="p-2 col-xl-6 col-lg-12 d-flex">
          <Card variant='flat' css={{backgroundColor: "#ffffff", width: "100%",}}>
            <Card.Header>
              <WLHeader firestoreId="virtual-header" headerLevel={2}/>
            </Card.Header>
            <div className="px-5">
              <Divider/>
            </div>
            <Card.Body className="d-flex flex-column align-items-start justify-content-start">
              <div className="w-100 d-flex flex-column align-items-center justify-content-center">
                { renderVirtualServiceItems() }
                <AddModelButton userCanEdit={userCanEditServiceItems} model={VirtualServiceItem} setEditModalOpen={setEditModalOpen} setCurrentModel={setCurrentModel}/>
              </div>
              <div className="d-flex flex-column text-center py-2 w-100">
                <Divider />
                <WLText firestoreId="virtual-pricing" editable={userCanEditText}/>
              </div>
            </Card.Body>
          </Card>
        </div>
      </div>
    </section>
    <section className="d-flex flex-column align-items-center justify-content-center py-2 gap-2" style={{backgroundColor: "#f5f5f5", filter:"drop-shadow(0px 0px 5px rgba(0,0,0,0.2))"}}>    
      <WLHeader color="#a67fcf" firestoreId="schedule-header" editable={userCanEditText}/>
      <ScheduleButton />
    </section>
    <section className='d-flex flex-column align-items-center justify-content-center'>    
      <WLHeader firestoreId="client-pictures-header" editable={userCanEditText}/>
      <div className="d-flex flex-column align-items-center justify-content-center px-xxl-5 px-xl-4 px-md-3 px-2" style={{width: "100%", overflow: "visible"}}>
        <WLAliceCarousel
          pagination
          scaleActive
          paginationTop
          breakpoints={createCarouselBreakpoints(1, 2, 2, 3, 4)}
          items={clientItems.map((gi, i) => <GalleryItem model={ClientItem} item={gi} key={i} />)}
        />
      </div>
      <AddModelButton userCanEdit={userCanEditGalleryPictures} model={ClientItem} setCurrentModel={setCurrentModel} setEditModalOpen={setEditModalOpen} />
    </section>
    </WLSpinnerPage>
  )
}
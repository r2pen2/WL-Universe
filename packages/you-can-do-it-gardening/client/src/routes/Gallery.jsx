import React, { useState } from 'react'

import "../assets/style/gallery.css"
import { WLBlockHeader, WLHeader, WLText } from '../libraries/Web-Legos/components/Text';
import { WLSpinnerPage } from '../libraries/Web-Legos/components/Layout';

import { blockHeaderFill } from "../assets/style/colors";
import { AddModelButton, ModelEditButton, ModelEditModal } from '../libraries/Web-Legos/components/Modals';
import { WLAliceCarousel, createCarouselBreakpoints } from '../libraries/Web-Legos/components/Content';
import { useEffect } from 'react';
import { GalleryVideo, HomeItem, NewHampshireItem } from '../api/siteModels.ts';
import { SiteModel } from '../libraries/Web-Legos/api/models.ts';
import { WaveBottom, WaveTop } from '../libraries/Web-Legos/components/Waves';
import { WLYoutubeEmbed } from '../libraries/Web-Legos/components/Media';
import { useContext } from 'react';
import { CurrentSignInContext } from '../App';
import { getYoutubeEmbedCode } from '../libraries/Web-Legos/api/media.ts';
import { AuthenticationManager } from '../libraries/Web-Legos/api/auth.ts';
import { AnalyticsManager } from '../libraries/Web-Legos/api/analytics.ts';

export default function Gallery() {
  
  const {currentSignIn} = useContext(CurrentSignInContext);
  const {authenticationManager} = useContext(AuthenticationManager.Context);
  const {analyticsManager} = useContext(AnalyticsManager.Context);

  analyticsManager.logPageView("gallery")

  const [userCanEditText, setUserCanEditText] = useState(false);
  const [userCanEditGalleryPictures, setUserCanEditGalleryPictures] = useState(false);
  const [userCanEditGalleryVideo, setUserCanEditGalleryVideo] = useState(false);
  
  useEffect(() => {
    authenticationManager.getPermission(currentSignIn, "siteText").then(p => setUserCanEditText(p));
    authenticationManager.getPermission(currentSignIn, "gallery-pictures").then(p => setUserCanEditGalleryPictures(p));
    authenticationManager.getPermission(currentSignIn, "gallery-video").then(p => setUserCanEditGalleryVideo(p));
  }, [authenticationManager, currentSignIn]);

  const [homeItems, setHomeItems] = useState([]);
  const [homeItemsFetched, setHomeItemsFetched] = useState(false);
  const [newHampshireItems, setNewHampshireItems] = useState([]);
  const [newHampshireItemsFetched, setNewHampshireItemsFetched] = useState(false);

  const [currentModel, setCurrentModel] = useState(new SiteModel());
  const [editModalOpen, setEditModalOpen] = useState(false);

  const [galleryVideo, setGalleryVideo] = useState([]);

  useEffect(() => {
    HomeItem.getAndSet(setHomeItems, setHomeItemsFetched);
    NewHampshireItem.getAndSet(setNewHampshireItems, setNewHampshireItemsFetched);
    GalleryVideo.getAndSet(setGalleryVideo);
  }, [])

  
  function GalleryItem({item, model}) {
    return (
      <div className="p-2 gap-2 d-flex flex-column align-items-center justify-content-center" style={{height: '100%', userSelect: "none"}}>
        <ModelEditButton model={model} data={item} userCanEdit={userCanEditGalleryPictures} setCurrentModel={setCurrentModel} setEditModalOpen={setEditModalOpen}/>
        <img className="no-select img-shadow" src={item.imageSource} alt="slideshow-item" style={{borderRadius: "1rem", width: '100%', maxHeight: 500, height: '100%', objectFit: "cover"}}/>
      </div>
    )
  }

  return (
  <WLSpinnerPage dependencies={[homeItemsFetched, newHampshireItemsFetched]}>
    <ModelEditModal open={editModalOpen} setOpen={setEditModalOpen} model={currentModel} />
    <WLBlockHeader text="Gallery" color={blockHeaderFill} short />
    <section className="d-flex flex-column align-items-center justify-content-center">
      <WLHeader firestoreId="gallery-header" editable={userCanEditText}>
        A Glimpse into Our Green Spaces
      </WLHeader>
      <div style={{maxWidth: 1400, width: "100%"}}>
        <WLText firestoreId="gallery-description" editable={userCanEditText}/>
      </div>
    </section>
    <section className="d-flex flex-column align-items-center justify-content-center py-2 py-lg-5">
      <ModelEditButton userCanEdit={userCanEditGalleryVideo} model={GalleryVideo} data={galleryVideo[0]} setEditModalOpen={setEditModalOpen} setCurrentModel={setCurrentModel} />
      <WLYoutubeEmbed maxWidth={1400} embedCode={galleryVideo[0] ? getYoutubeEmbedCode(galleryVideo[0].embedCode) : ""} />
    </section>
    <section className='d-flex flex-column align-items-center justify-content-center'>
      <WLHeader firestoreId="home-pictures-header" editable={userCanEditText}/>
      <div className="d-flex flex-column align-items-center justify-content-center px-xxl-5 px-xl-4 px-md-3 px-2" style={{width: "100%", overflow: "visible"}}>
        <WLAliceCarousel
          pagination
          paginationTop
          scaleActive
          breakpoints={createCarouselBreakpoints(1, 2, 2, 3, 4)}
          items={homeItems.map((gi, i) => <GalleryItem model={HomeItem} item={gi} key={i} />)}
        />
      </div>
      <AddModelButton userCanEdit={userCanEditGalleryPictures} model={HomeItem} setCurrentModel={setCurrentModel} setEditModalOpen={setEditModalOpen} />
    </section>
    <WaveTop color="#f5f5f5" />
    <section className='d-flex flex-column align-items-center justify-content-center' style={{backgroundColor: "#f5f5f5"}}>    
      <WLHeader color="#a67fcf" firestoreId="nh-pictures-header" editable={userCanEditText}/>
      <div className="d-flex flex-column align-items-center justify-content-center px-xxl-5 px-xl-4 px-md-3 px-2" style={{width: "100%", overflow: "visible"}}>
        <WLAliceCarousel
          pagination
          scaleActive
          paginationTop
          breakpoints={createCarouselBreakpoints(1, 2, 2, 3, 4)}
          items={newHampshireItems.map((gi, i) => <GalleryItem model={NewHampshireItem} item={gi} key={i} />)}
        />
      </div>
      <AddModelButton userCanEdit={userCanEditGalleryPictures} model={NewHampshireItem} setCurrentModel={setCurrentModel} setEditModalOpen={setEditModalOpen} />
    </section>
    <WaveBottom color="#f5f5f5" />
    </WLSpinnerPage>
  )
}
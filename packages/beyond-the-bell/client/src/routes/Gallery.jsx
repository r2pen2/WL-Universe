import { useEffect, useContext, useState, } from 'react'

import { Button, Card, Input, Modal, Text, Textarea } from "@nextui-org/react";

import ReCAPTCHA from "react-google-recaptcha";

import "../assets/style/services.css"
import { WLHeader, WLText } from '../libraries/Web-Legos/components/Text';
import { CurrentSignInContext, AuthenticationManagerContext } from '../App';
import { WLSpinnerPage } from '../libraries/Web-Legos/components/Layout';
import { GalleryBlockHeader } from '../components/Bar';
import { SiteModel } from '../libraries/Web-Legos/api/models.ts';
import { GalleryPicture } from '../api/siteModels.ts';
import { AddModelButton, ModelEditButton, ModelEditModal } from '../libraries/Web-Legos/components/Modals';
import { WLAliceCarousel, createCarouselBreakpoints } from '../libraries/Web-Legos/components/Content';
import { Divider } from '@mui/material';

export default function Gallery() {
  
  const [currentModel, setCurrentModel] = useState(new SiteModel());
  const [modelEditModalOpen, setModelEditModalOpen] = useState(false);

  const [picturesLoaded, setPicturesLoaded] = useState(false);

  const [galleryPictures, setGalleryPictures] = useState([]);

  useEffect(() => {
    GalleryPicture.getAndSet(setGalleryPictures, setPicturesLoaded);
  }, [])
  

  const {currentSignIn} = useContext(CurrentSignInContext);
  const {authenticationManager} = useContext(AuthenticationManagerContext);
  
  const [userCanEditText, setUserCanEditText] = useState(false);

  useEffect(() => {
    authenticationManager.getPermission(currentSignIn, "siteText").then(p => setUserCanEditText(p));
  }, [authenticationManager, currentSignIn]);

  function GalleryPictureCard({galleryPicture}) {
    return (
      <div className="text-center d-flex flex-column align-items-center justify-content-center">
        <Text>{galleryPicture.caption}</Text>
        <div className="py-2">
          <Divider />
        </div>
        <img src={galleryPicture.imageSource} alt="gallery-item" style={{objectFit: "contain", height: "100%", width: "100%", maxWidth: 600, maxHeight: 450}} />
        <ModelEditButton userCanEdit={userCanEditText} setCurrentModel={setCurrentModel} setEditModalOpen={setModelEditModalOpen} data={galleryPicture} model={GalleryPicture} />
      </div>
    )
  }

  return (
    <WLSpinnerPage itemsCentered dependencies={[picturesLoaded]}>
      <ModelEditModal open={modelEditModalOpen} setOpen={setModelEditModalOpen} model={currentModel} />
      <GalleryBlockHeader />
      <section className="d-flex flex-column align-items-center justify-content-center px-2 px-lg-5">
        <AddModelButton model={GalleryPicture} setCurrentModel={setCurrentModel} setEditModalOpen={setModelEditModalOpen} userCanEdit={userCanEditText} />
        <WLAliceCarousel
          pagination
          buttonBlock
          paginationTop
          scaleActive
          breakpoints={createCarouselBreakpoints(1, 2, null, 3, 4)}
          items={galleryPictures.map((g, i) => <GalleryPictureCard galleryPicture={g} key={i} />)}
        />
      </section>
    </WLSpinnerPage>
  )
}
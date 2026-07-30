import React, { useEffect, useState } from 'react'

import { Button, Text, Divider, Spacer } from "@nextui-org/react";
import Alert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";

import "../assets/style/homepage.css"

import VisibilityTwoToneIcon from '@mui/icons-material/VisibilityTwoTone';
import SavingsTwoToneIcon from '@mui/icons-material/SavingsTwoTone';
// import LocalFloristTwoToneIcon from '@mui/icons-material/LocalFloristTwoTone';
import { ContactModal } from '../components/Modals';
import { iconFills } from '../components/Modals';

import ComputerTwoToneIcon from '@mui/icons-material/ComputerTwoTone';
import LocationOnTwoToneIcon from '@mui/icons-material/LocationOnTwoTone';
import { QuoteBlock, WLHeader, WLText, WLTextBlock } from "../libraries/Web-Legos/components/Text";

import {BeforeAndAfter, Testimonial} from "../api/siteModels.ts";

import { WLSpinnerPage } from "../libraries/Web-Legos/components/Layout"
import { WLImage } from '../libraries/Web-Legos/components/Images';
import home3 from "../assets/images/gradient/markup-cropped.svg"
import { WLAliceCarousel, createCarouselBreakpoints } from '../libraries/Web-Legos/components/Content';
import { SiteModel } from '../libraries/Web-Legos/api/models.ts';
import { AddModelButton, ModelEditButton, ModelEditModal } from '../libraries/Web-Legos/components/Modals';
import { WaveBottom, WaveTop } from '../libraries/Web-Legos/components/Waves';
import { useContext } from 'react';
import { CurrentSignInContext } from '../App';
import { AuthenticationManager } from '../libraries/Web-Legos/api/auth.ts';
import { AnalyticsManager } from '../libraries/Web-Legos/api/analytics.ts';
import { mailingListLink } from '../api/links.js';

const MAILING_LIST_PROMPT_DELAY_MS = 5000;

export const textGradient = {textGradient: "0deg, $purple600 -20%, $pink600 100%"}

export default function HomePage() {

  const {currentSignIn} = useContext(CurrentSignInContext);
  const {authenticationManager} = useContext(AuthenticationManager.Context);
  const {analyticsManager} = useContext(AnalyticsManager.Context);

  analyticsManager.logPageView("home")

  const [userCanEditText, setUserCanEditText] = useState(false);
  const [userCanEditImages, setUserCanEditImages] = useState(false);
  const [userCanEditTestimonials, setUserCanEditTestimonials] = useState(false);
  const [userCanEditBeforesAndAfters, setUserCanEditBeforesAndAfters] = useState(false);

  useEffect(() => {
    authenticationManager.getPermission(currentSignIn, "siteText").then(p => setUserCanEditText(p));
    authenticationManager.getPermission(currentSignIn, "siteImages").then(p => setUserCanEditImages(p));
    authenticationManager.getPermission(currentSignIn, "testimonials").then(p => setUserCanEditTestimonials(p));
    authenticationManager.getPermission(currentSignIn, "befores-and-afters").then(p => setUserCanEditBeforesAndAfters(p));
  }, [authenticationManager, currentSignIn]);

  const [testimonialsFetched, setTestimonialsFetched] = useState(false);
  const [testimonials, setTestimonials] = useState([]);

  const [beforesAndAftersFetched, setBeforesAndAftersFetched] = useState(false);
  const [beforesAndAfters, setBeforesAndAfters] = useState([]);

  const [contactModalOpen, setContactModalOpen] = useState(false); // Whether contact modal is open

  const [whyItWorksHeaderLoaded, setWhyItWorksHeaderLoaded] = useState(false);            // Whether "Why This Model Works" header has loaded
  const [whyItWorksDescriptionLoaded, setWhyItWorksDescriptionLoaded] = useState(false);  // Whether "Why This Model Works" description has loaded
  const [saveHookLoaded, setSaveHookLoaded] = useState(false);                            // Whether "Save Money" hook has loaded
  const [saveDescriptionLoaded, setSaveDescriptionLoaded] = useState(false);              // Whether "Save Money" description has loaded
  const [lookHookLoaded, setLookHookLoaded] = useState(false);                            // Whether "Looks Good" hook has loaded
  const [lookDescriptionLoaded, setLookDescriptionLoaded] = useState(false);              // Whether "Looks Good" description has loaded
  // const [feelHookLoaded, setFeelHookLoaded] = useState(false);                            // Whether "Feels Good" hook has loaded
  // const [feelDescriptionLoaded, setFeelDescriptionLoaded] = useState(false);              // Whether "Feels Good" description has loaded
  const [beforesAndAftersHeaderLoaded, setBeforesAndAftersHeaderLoaded] = useState(false);// Whether "Befores and Afters" header has loaded

  const [mailingListPromptOpen, setMailingListPromptOpen] = useState(false);

  function TestimonialCard({testimonial}) {
    return (
      <div className="p-2 gap-2 d-flex flex-column align-items-center justify-content-center" style={{minHeight: 300, height: '100%', userSelect: "none"}}>
        <ModelEditButton model={Testimonial} data={testimonial} userCanEdit={userCanEditTestimonials} setCurrentModel={setCurrentModel} setEditModalOpen={setModelEditModalOpen}/>
        <QuoteBlock color="rgba(87,36,170,0.5)">
          <QuoteBlock.Text>
            {testimonial.message}
          </QuoteBlock.Text>
          <QuoteBlock.Author 
            name={testimonial.author}
            decoration={ 
              testimonial.virtual 
              ? 
                <ComputerTwoToneIcon style={{color: iconFills.purple}} />
              : 
                <LocationOnTwoToneIcon style={{color: iconFills.purple}} />
            }
          /> 
        </QuoteBlock>
      </div>
    )
  }


  const [modelEditModalOpen, setModelEditModalOpen] = useState(false);
  const [currentModel, setCurrentModel] = useState(new SiteModel());

  useEffect(() => {
    BeforeAndAfter.getAndSet(setBeforesAndAfters, setBeforesAndAftersFetched)
    Testimonial.getAndSet(setTestimonials, setTestimonialsFetched);
  }, [])

  function dismissMailingListPrompt() {
    setMailingListPromptOpen(false);
  }

  function handleMailingListSnackbarClose(_event, reason) {
    if (reason === "clickaway") {
      return;
    }
    dismissMailingListPrompt();
  }

  function handleJoinMailingListClick() {
    window.open(mailingListLink, "_blank", "noopener,noreferrer");
    dismissMailingListPrompt();
  }

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      setMailingListPromptOpen(true);
    }, MAILING_LIST_PROMPT_DELAY_MS);
    return () => window.clearTimeout(timerId);
  }, []);

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
      <Button className="w-100 d-inline mt-2" css={{minHeight: 50, maxWidth: 1000}} flat size="$md" onClick={handleScheduleButtonClick}>
        SCHEDULE A CONSULTATION
      </Button>
    )
  }
  
  function BeforeAndAfterCard({beforeAndAfter}) {

    return (
      <div className="container-fluid d-flex flex-column align-items-center justify-content-center" style={{width: '100%', maxWidth: 1400}}>
        <ModelEditButton model={BeforeAndAfter} data={beforeAndAfter} userCanEdit={userCanEditBeforesAndAfters} setCurrentModel={setCurrentModel} setEditModalOpen={setModelEditModalOpen}/>
        <div className="row">
          <Text>
            {beforeAndAfter.description}
          </Text>
          <Spacer y={1} />
        </div>
        <Divider/>
        <div className="row w-100 py-2">
          <div className="p-2 col-6 d-none d-xl-flex flex-column align-items-end justify-content-start">
            <img src={beforeAndAfter.beforeSource} draggable={false} className="no-select" alt="before-pic" style={{maxHeight: 500, maxWidth: 750, width: "100%", height: "auto", objectFit: "contain"}} />
          </div>
          <div className="p-2 col-6 d-none d-xl-flex flex-column align-items-start justify-content-start">
            <img src={beforeAndAfter.afterSource} draggable={false} className="no-select" alt="after-pic" style={{maxHeight: 500, maxWidth: 750, width: "100%", height: "auto", objectFit: "contain"}} />
          </div>
          <div className="p-2 col-12 d-flex d-xl-none flex-column align-items-center justify-content-start">
            <img src={beforeAndAfter.beforeSource} draggable={false} className="no-select" alt="before-pic" style={{maxHeight: 500, maxWidth: 750, width: "100%", height: "auto", objectFit: "contain"}} />
          </div>
          <div className="p-2 col-12 d-flex d-xl-none flex-column align-items-center justify-content-start">
            <img src={beforeAndAfter.afterSource} draggable={false} className="no-select" alt="after-pic" style={{maxHeight: 500, maxWidth: 750, width: "100%", height: "auto", objectFit: "contain"}} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
    <WLSpinnerPage 
      dependencies={[
        testimonialsFetched,
        beforesAndAftersHeaderLoaded, 
        whyItWorksHeaderLoaded, 
        whyItWorksDescriptionLoaded, 
        saveHookLoaded, 
        saveDescriptionLoaded, 
        lookHookLoaded, 
        lookDescriptionLoaded, 
        // feelHookLoaded, 
        // feelDescriptionLoaded,
        beforesAndAftersFetched
      ]}
    >
      <ModelEditModal model={currentModel} open={modelEditModalOpen} setOpen={setModelEditModalOpen} />
      <ContactModal open={contactModalOpen} setOpen={setContactModalOpen} />
      <section className="d-flex flex-column w-100 align-items-center">
        <div className="w-100 flex-column align-items-center background-image" style={{paddingTop: "10vh", paddingBottom: "10vh",}}>
          <div className="elevated d-flex flex-column w-100 text-background py-2">
            <WLHeader>
              You Can Do It Gardening
            </WLHeader>
            <WLHeader headerLevel={2} firestoreId="home-subtitle" editable={userCanEditText}/>
          </div>
          <div className="elevated mt-3 d-flex flex-row text-center align-items-center justify-content-center w-100">
            <div className="mailing-list-wobble">
              <Alert className="mailing-list-alert" severity="success"><a target="_blank" rel="noreferrer" href={mailingListLink}>Click here to join my mailing list!</a></Alert>
            </div>
          </div>
        </div>
        {/* <img alt="leaf-line" src={home3} className="background-pattern" />
        <div className="elevated container-fluid" style={{marginTop: -250, marginBottom: 50}}>
          <div className="elevated row d-flex flex-row justify-content-center">
            <TransparentHookCard
              sections={[
                {
                  icon: <SavingsTwoToneIcon sx={{fontSize: 50}}/>,
                  titleText: <WLText firestoreId="save-money-hook" editable={userCanEditText} setLoaded={setSaveHookLoaded}>**Save Money**</WLText>,
                  subtitleText: <WLText firestoreId="save-money-description" editable={userCanEditText} setLoaded={setSaveDescriptionLoaded}>Landscapers are expensive!</WLText>
                },
                {
                  icon: <VisibilityTwoToneIcon sx={{fontSize: 50}}/>,
                  titleText: <WLText firestoreId="looks-good-hook" editable={userCanEditText} setLoaded={setLookHookLoaded}>**Looks Good**</WLText>,
                  subtitleText: <WLText firestoreId="looks-good-description" editable={userCanEditText} setLoaded={setLookDescriptionLoaded}>Small changes can make a huge difference!</WLText>
                }
              ]}
            />
          </div>
        </div> */}
      </section>
      <section className='py-lg-5 py-2 d-flex flex-column align-items-center justify-content-center'>
        <div className="container d-flex flex-row justify-content-center align-items-center">
          <div className="row w-100 justify-content-center">
            <div className="col-xl-6 col-md-12 p-2 d-flex flex-row justify-content-center align-items-center">
              <WLImage firestoreId="jess" round editable={userCanEditImages} imgClasses="jess-image" />
            </div>
            <div className="col-xl-6 col-md-12 d-flex flex-column px-1 py-1 px-lg-5 py-3 px-lg-5 justify-content-around" style={{maxWidth: 750}}>
              <div>
                <WLHeader headerLevel={2} editable={userCanEditText} firestoreId="why-it-works-header" setLoaded={setWhyItWorksHeaderLoaded}/>
                <WLTextBlock firestoreId="why-it-works" editable={userCanEditText} setLoaded={setWhyItWorksDescriptionLoaded}/>
              </div>
            </div>
        </div>
        </div>
      </section>
      <section className="d-flex flex-column align-items-center justify-content-center py-2 px-3 gap-2" style={{width: "100%"}}>    
        <WLHeader firestoreId="schedule-header" editable={userCanEditText}/>
        <ScheduleButton />
      </section>
      <WaveTop color="#f5f5f5" />
      <section className='d-flex flex-column align-items-center justify-content-center' style={{backgroundColor: "#F5F5F5"}}>
        <WLHeader color="#a67fcf" firestoreId="testimonial-quotes-header" editable={userCanEditText}/>
        <div className="d-flex flex-column align-items-center justify-content-center px-xxl-5 px-xl-4 px-md-3 px-2" style={{width: "100%", overflow: "visible"}}>
          <WLAliceCarousel
            scaleActive
            paginationTop
            pagination
            breakpoints={createCarouselBreakpoints(1, null, 2, null, 3)}
            items={testimonials.map((t, i) => <TestimonialCard testimonial={t} key={i} />)}
          />
        </div>
        <AddModelButton userCanEdit={userCanEditTestimonials} model={Testimonial} setCurrentModel={setCurrentModel} setEditModalOpen={setModelEditModalOpen} />
      </section>
      <WaveBottom color="#f5f5f5" />
      <section className='d-flex flex-column align-items-center justify-content-center py-5'>
        <WLHeader firestoreId="befores-and-afters-header" setLoaded={setBeforesAndAftersHeaderLoaded} editable={userCanEditText}/>
        <WLAliceCarousel
          pagination
          buttonBlock
          paginationTop
          items={beforesAndAfters.map((b, i) => <BeforeAndAfterCard beforeAndAfter={b} key={i} />)}
        />
        <AddModelButton userCanEdit={userCanEditBeforesAndAfters} model={BeforeAndAfter} setCurrentModel={setCurrentModel} setEditModalOpen={setModelEditModalOpen} />
      </section>
    </WLSpinnerPage>
    <Snackbar
      open={mailingListPromptOpen}
      anchorOrigin={{ vertical: "top", horizontal: "center" }}
      autoHideDuration={null}
      onClose={handleMailingListSnackbarClose}
      sx={{
        top: { xs: "calc(12px + env(safe-area-inset-top, 0px))", sm: "calc(20px + env(safe-area-inset-top, 0px))" },
        zIndex: 20000,
      }}
    >
      <Alert
        severity="info"
        variant="filled"
        onClose={dismissMailingListPrompt}
        icon={false}
        onClick={(e) => {
          if (e.target.closest("button")) {
            return;
          }
          handleJoinMailingListClick();
        }}
        sx={{
          alignItems: "center",
          cursor: "pointer",
          whiteSpace: "nowrap",
          width: "max-content",
          maxWidth: "calc(100vw - 48px)",
        }}
      >
        Click to join my newsletter.
      </Alert>
    </Snackbar>
    </>
  )
}

function TransparentHookCardSection({icon, titleText, subtitleText}) {
  return (
    <div className="d-flex flex-column align-items-center">
      <div className="d-flex flex-column align-items-center">
        {icon}
        <div className="fw-bold">{titleText}</div>
      </div>
      <div className="d-flex flex-column align-items-center">
        {subtitleText}
      </div>
    </div>
  )
}

function TransparentHookCard({sections}) {
  return (
    <div className="col-12 col-xl-6 hook-card-col-padding d-flex flex-column align-items-center">
      <div className="transparent-card">
        <div className="d-flex flex-column align-items-center gap-4">
          {sections.map((section, i) => (
            <TransparentHookCardSection
              key={i}
              icon={section.icon}
              titleText={section.titleText}
              subtitleText={section.subtitleText}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
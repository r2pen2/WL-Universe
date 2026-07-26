// Library Imports
import React, { useState } from 'react'
import { Spacer, Text } from '@nextui-org/react'
import GroupsIcon from '@mui/icons-material/Groups';
import FaceIcon from '@mui/icons-material/Face';
import HouseIcon from '@mui/icons-material/House';
import ConstructionIcon from '@mui/icons-material/Construction';

// Style Imports
import { creamy, red600 } from '../assets/style/nextUiTheme'

// API Imports
import { gray900 } from '../libraries/Web-Legos/api/colors'

// Component Imports
import { platformGradient } from '../App'
import { LineButton } from '../libraries/Web-Legos/components/Buttons'
import {ColoredShadowBox, WLSpinnerPage} from "../libraries/Web-Legos/components/Layout"
import { WLHeader, WLText } from '../libraries/Web-Legos/components/Text'
import { RockCandyBackground1, GrowingCircles } from '../libraries/Web-Legos/components/Backgrounds'
import { HoverActionBox, TestimonialCard, WLFlickity, WLSlick } from '../libraries/Web-Legos/components/Content'
import { SiteModel, WLTestimonial } from '../libraries/Web-Legos/api/models.ts';
import { ModelEditButton, } from '../libraries/Web-Legos/components/Modals';
import { useEffect, useContext } from 'react';
import { FloatingIsland, Mountains } from '../libraries/Web-Legos/components/Decoration';

import { Input, Modal } from "@nextui-org/react";

import ReCAPTCHA from "react-google-recaptcha";

// import { AuthenticationManagerContext, TAGMailManager, CurrentSignInContext } from '../App';
import { TAGMailManager, } from '../App';
import { FormResponse } from '../libraries/Web-Legos/api/admin.ts';
import { WLImageV2 } from '../libraries/Web-Legos/components/Images';

/** Colors for TAG mountains */
const mountainColors = {
  color1: "#f0672c",
  color2: "#f0b666", 
  color3: red600,
  color4: creamy,
  color5: "#f09242",
  color6: "#f2d692"
}

const DreamMountains = () => <Mountains {...mountainColors} style={{position:"absolute", left: 0, bottom: 0}} />
const MountainsUpsideDown = () => <Mountains {...mountainColors} style={{transform: "scaleY(-1)", position:"absolute", left: 0, top: 0, opacity: 0.4}} />

export default function Homepage() {

  const [formSent, setFormSent] = useState(false);

  const [userCanEditTestimonials, setUserCanEditTestimonials] = useState(false);
  const [currentModel, setCurrentModel] = useState(new SiteModel());
  const [modelEditModalOpen, setModelEditModalOpen] = useState(false);

  const [testimonials, setTestimonials] = useState([]);
  const [testimonialsFetched, setTestimonialsFetched] = useState(false);

  useEffect(() => {
    setTestimonials([WLTestimonial.examples.default, WLTestimonial.examples.default, WLTestimonial.examples.default])
    // WLTestimonial.getAndSet(setTestimonials, setTestimonialsFetched)
  }, [])

  function handleActionBoxClick(key) { }

  /** This is the entire header component that renders that beautiful mountainscape! */
  const LandingSection = () => {

    /** Image to place in growing circles */
    const HeaderImage = () => <WLImageV2 firestoreId="header-circle" className="home-top-headshot"/>;

    /** Contact button for header */
    const HeaderButton = () => <LineButton onClick={() => window.location = "/#contact"} text="Speak With Me" color={red600} />;
    
    /** Header text components */
    const HeaderText = () => (
      <hgroup className="d-flex flex-column align-items-center header-top-text p-2">
        <div className="d-flex flex-row align-items-center" style={{gap: "0.5rem"}}>
          <Text h1 className='d-inline' size="36px">
            Talk About
            <Text h1 size="36px" className='d-inline red-glow-light' b css={{paddingLeft: ".5rem", textGradient: `45deg, ${red600} 0%, ${creamy} 500%`}}>
              Dreams
            </Text>
          </Text>
        </div>
        <WLHeader headerLevel={2} firestoreId="header-subtitle"/>
      </hgroup>
    )

    /** Header to render on small devices */
    const SmallHeader = () => (
      <div className="d-flex d-lg-none flex-column align-items-center justify-content-center py-5" style={{zIndex: 2, marginTop: "5rem"}}>
        <div className="d-flex flex-column align-items-center justify-content-center" style={{zIndex: 3}}>
          <HeaderImage />
          <GrowingCircles color={creamy} size={300}/>
        </div>
        <Spacer y={3} />
        <HeaderText />
        <Spacer y={3} />
        <HeaderButton />
      </div>
    )

    /** Header to render on large devices */
    const LargeHeader = () => (
      <div className="container-fluid h-100 w-100 d-lg-flex align-items-center justify-content-center d-none">
        <div className="row d-flex flex-row align-items-center jusify-content-center h-100 w-100">
          <div className="col-12 col-lg-6 d-flex flex-row align-items-center home-top-left-col">
            <div className="d-flex flex-column align-items-start justify-content-center" style={{textAlign: 'left', maxWidth: 700}}> 
              <HeaderText />
              <Spacer y={3} />
              <HeaderButton />
            </div>
          </div>
          <div className="col-12 col-lg-6 px-5 d-flex flex-column align-items-center justify-content-center home-top-right-col" style={{zIndex: 3}}>
            <HeaderImage />
            <GrowingCircles color={creamy} size={500}/>
          </div>
        </div>
      </div>
    )


    return (
      <header id="dreams" className="d-flex flex-column w-100 align-items-center justify-content-center" style={{height: "100vh", marginTop: "-100px", position:"relative"}}>
        <RockCandyBackground1 color={red600} sectionHeight='100vh'/>
        <LargeHeader />
        <SmallHeader />
        <DreamMountains />
      </header>
    )
  }

  /** This is the biography section: bio and goals */
  const BioSection = () => {
    
    /** ColoredShadowBox to display on the right side of the screen */
    const BioBox = () => (
      <div className="col-12 col-lg-6 sticky-walls d-flex flex-column align-items-end justify-content-center py-2" style={{paddingLeft: "1rem", paddingRight: 0}}>
        <ColoredShadowBox
          className="home-bio-container p-2 p-lg-3"
          style={{border: `2px solid ${creamy}22`}}
          stickLeft
          background={platformGradient}
        >
          <WLHeader align="left" firestoreId="julia-bio-header" />
          <WLText size="$lg" align="left" color="#e0e0e0" indent firestoreId="julia-bio"/>
          <WLHeader headerLevel={2} size="$2xl" align="left" firestoreId="goals-header" />
          <WLText size="$lg" align="left" color="#e0e0e0" indent firestoreId="goals" />
        </ColoredShadowBox>
      </div>
    )

    /** Biography image to display on the left side of the screen */
    const BioImage = () => (
      <div className="col-12 col-lg-6 d-flex flex-column align-items-center justify-content-center py-2" >
        <WLImageV2 firestoreId="julia-bio" className="dreams-img-large" />
      </div>
    )

    return (
      <section id="julia" className="d-flex flex-column align-items-center justify-content-center container-fluid w-100 py-5 sticky-walls" style={{paddingLeft: 0, paddingRight: 0,position: 'relative', zIndex: 1}}>
        <MountainsUpsideDown />
        <div className="row w-100" style={{zIndex: 1}}>
          <BioImage />
          <BioBox />
        </div>
      </section>
    )
  }

  /** Banner to describe dream analysis */
  const AnalysisBanner = () => {
    return (
      <section className="my-5 px-2 px-md-5 d-flex flex-column align-items-center justify-content-center w-100 bg-transparent-red" style={{height: 300,position: 'relative', zIndex: 1}}>
        <div style={{maxWidth: 900}}>
          <WLHeader firestoreId="banner-header" />
          <WLText size="$lg" firestoreId="banner-content" />
        </div>
      </section>
    )
  }

  /** A list of services offered */
  const ServicesSection = () => {

    /** Container for service boxes */
    const ServiceCol = (props) => (
      <div className="col-12 col-md-6 col-xl-3 py-3">
        {props.children}
      </div>
    )

    /** Colors for service boxes */
    const serviceBoxColors = {
      "1on1": HoverActionBox.colors.blue,
      "groups": HoverActionBox.colors.purple,
      "retreats": HoverActionBox.colors.yellow,
      "workshops": HoverActionBox.colors.green,
    }
    
    /** Icons for service boxes */
    const serviceBoxIcons = {
      "1on1": <FaceIcon />,
      "groups": <GroupsIcon />,
      "retreats": <HouseIcon />,
      "workshops": <ConstructionIcon />,
    }

    /** Styles shared by all service boxes */
    const serviceBoxProps = {
      background: gray900,
      accentColor: creamy
    }

    /** Header for service options */
    const ServicesHeader = () => (
      <div className="col-12">
        <Text h1 className='d-inline' size="36px">
          How I Can 
          <Text h1 size="36px" className='d-inline red-glow-light' b css={{paddingRight: ".5rem", paddingLeft:".5rem", textGradient: `45deg, ${red600} 0%, ${creamy} 500%`}}>
            Help
          </Text>
        </Text>
      </div>
    )

    /** 1 on 1 analysis service box */
    const OneOnOneBox = () => (
      <ServiceCol>
        <HoverActionBox
          {...serviceBoxProps}
          color={serviceBoxColors['1on1']}
          icon={serviceBoxIcons['1on1']}
          buttonText="Schedule Now"
          onClick={() => handleActionBoxClick("1on1")}
        >
          <HoverActionBox.Title text="1 on 1 Sessions" color="white" />
          <HoverActionBox.Body>
            <WLText indent align="left" firestoreId="1on1-intro" />
          </HoverActionBox.Body>
        </HoverActionBox>
      </ServiceCol>
    )

    /** group analysis service box */
    const GroupsBox = () => (
      <ServiceCol>
        <HoverActionBox
          {...serviceBoxProps}
          color={serviceBoxColors['groups']}
          icon={serviceBoxIcons['groups']}
          buttonText="Schedule Now"
          onClick={() => handleActionBoxClick("groups")}
        >
          <HoverActionBox.Title text="Group Sessions" color="white" />
          <HoverActionBox.Body>
            <WLText indent align="left" firestoreId="group-session-intro" />
          </HoverActionBox.Body>
        </HoverActionBox>
      </ServiceCol>
    )

    /** dream retreats service box */
    const RetreatsBox = () => (
      <ServiceCol>
        <HoverActionBox
          {...serviceBoxProps}
          color={serviceBoxColors['retreats']}
          icon={serviceBoxIcons['retreats']}
          buttonText="Schedule Now"
          onClick={() => handleActionBoxClick("retreats")}
        >
          <HoverActionBox.Title text="Dream Retreats" color="white" />
          <HoverActionBox.Body>
            <WLText indent align="left" firestoreId="retreats-intro"/>
          </HoverActionBox.Body>
        </HoverActionBox>
      </ServiceCol>
    )

    /** worshops service box */
    const WorkshopsBox = () => (
      <ServiceCol>
        <HoverActionBox
          {...serviceBoxProps}
          color={serviceBoxColors['workshops']}
          icon={serviceBoxIcons['workshops']}
          buttonText="Schedule Now"
          onClick={() => handleActionBoxClick("workshops")}
        >
          <HoverActionBox.Title text="Mini Workshops" color="white" />
          <HoverActionBox.Body>
            <WLText indent align="left" firestoreId="workshops-intro" />
          </HoverActionBox.Body>
        </HoverActionBox>
      </ServiceCol>
    )

    return (
      <section className="d-flex flex-column align-items-center justify-content-center container-fluid w-100 py-5 px-2 px-md-5" id="services">
        <div className="row w-100" style={{position: 'relative', zIndex: 1}}>
          <ServicesHeader />
          <div className="col-12">
            <Spacer y={1} />
          </div>
          <OneOnOneBox />
          <GroupsBox />
          <RetreatsBox />
          <WorkshopsBox />
        </div>
      </section>
    )
  }

  /** Testimonials, etc */
  const InsightsSection = () => {
    
    /** Something to introduce the insights section */
    const InsightsHeader = () => (
      <Text h1 className='d-inline' size="36px">
        How People
        <Text h1 size="36px" className='d-inline red-glow-light' b css={{paddingRight: ".5rem", paddingLeft:".5rem", textGradient: `45deg, ${red600} 0%, ${creamy} 500%`}}>
          Feel
        </Text>
      </Text>
    )

    /** A carousel of testimonials */
    const InsightsCarousel = () => (
      <WLSlick
        buttonStyle="MUI"
        buttonColor={creamy}
      >
        {testimonials.map((t, i) => {
          return <TestimonialCard
            outlineWeight="2px"
            key={i} 
            testimonial={t}
            glyphColor={red600}
            accentColor={gray900}
            editButton={<ModelEditButton model={WLTestimonial} data={t} userCanEdit={userCanEditTestimonials} setCurrentModel={setCurrentModel} setEditModalOpen={setModelEditModalOpen}/>}
          />})
        }
      </WLSlick>
    )

    return (
      <section id="insights" style={{position: 'relative', zIndex: 1}}>
        <Spacer y={2} />
        <InsightsHeader />
        <InsightsCarousel />
      </section>
    )
  }

  /** Contact section (footer) */
  const Contact = () => {
  
    const [contactHeaderLoaded, setContactHeaderLoaded] = useState(false);
    const [contactSubtitleLoaded, setContactSubtitleLoaded] = useState(false);
  
    const [recaptchaModalOpen, setRecaptchaModalOpen] = useState(false);
  
    function sendForm() {
      function getEmailBody() {
        const body = `Name: ${document.getElementById("name").value}\n` + 
        `Phone: ${document.getElementById("phone").value}\n` +
        `Email: ${document.getElementById("email").value}\n` +
        `Contact Method: ${document.getElementById("contact").value}\n` +
        `Location: ${document.getElementById("location").value}\n`
        return body;
      }
  
      TAGMailManager.sendMail(
        `New contact form submission from ${document.getElementById("name").value}`,
        getEmailBody()
      )
  
      const res = new FormResponse();
      res.content["Name"] =  document.getElementById("name").value;
      res.content["Email"] =  document.getElementById("email").value;
      res.content["Phone Number"] =  document.getElementById("phone").value;
      res.content["Preferred Contact Method"] =  document.getElementById("contact").value;
      res.content["City, State"] =  document.getElementById("location").value;
      res.shortStrings.formId = "footer-contact";
      res.shortStrings.formTitle = "Footer Contact Form";
      res.sendFormData();
    }
  
  
    // const {currentSignIn} = useContext(CurrentSignInContext);
    // const {authenticationManager} = useContext(AuthenticationManagerContext);
    
    const [userCanEditText, setUserCanEditText] = useState(false);
  
    // useEffect(() => {
    //   authenticationManager.getPermission(currentSignIn, "siteText").then(p => setUserCanEditText(p));
    // }, [authenticationManager, currentSignIn]);
  
    function handleCaptchaComplete(v) {
      if (v.length < 1) {
        setRecaptchaModalOpen(false);
        return;
      }
      sendForm();
      window.location = "/thank-you";
    }
    
    function handleButtonClick() {
      setFormSent(true)
    }
  
    /** A call-to-action */
    const ContactHook = () => [
      <div key={1} className="d-flex flex-row justify-content-center align-items-center w-100" style={{marginTop: "2rem", gap: "0.5rem"}}>
        <Text h1 className='d-inline' size="36px">
          Talk About Your
          <Text h1 size="36px" className='d-inline red-glow-light' b css={{paddingRight: ".5rem", paddingLeft:".5rem", textGradient: `45deg, ${red600} 0%, ${creamy} 500%`}}>
            Dreams
          </Text>
          With Me
        </Text>
      </div>,
      <div key={2} className="d-flex flex-row justify-content-center align-items-center w-100" style={{gap: "0.5rem"}}>
        <WLText size="large" firestoreId="contact-hook"/>
      </div>
    ]

    const ContactForm = () => (
      <form className="d-flex flex-row justify-content-center w-100">
        <div className="gap-2 d-flex flex-column align-items-start justify-content-center contact-form w-100 mx-2 my-5 mx-md-5"  style={{maxWidth: 1400}}>
          <div className="container-fluid d-flex flex-column">
            <div className="row pt-2">
              <Input id="name" clearable bordered label="Your Name" fullWidth css={{display: "flex", alignItems: "start"}} />
            </div>
            <div className="row">
              <div className="col-lg-6 col-md-12 pt-2">
                <Input id="phone" clearable bordered label="Your phone" fullWidth css={{display: "flex", alignItems: "start"}} />
              </div>      
              <div className="col-lg-6 col-md-12 pt-2">
                <Input id="email" clearable bordered label="Your email" fullWidth css={{display: "flex", alignItems: "start"}} />
              </div>      
            </div>
            <div className="row pt-2">
              <Input id="contact" clearable bordered label="Preferred contact method" fullWidth css={{display: "flex", alignItems: "start"}} />
            </div>
            <div className="row pt-2">
              <Input id="location" clearable bordered label="City, State" fullWidth css={{display: "flex", alignItems: "start"}} />
            </div>
          </div>
          <div className="py-3 w-100">            
            <LineButton text={formSent ? "Thank You!" : "Speak With Me"} closed={formSent} color={red600} onClick={handleButtonClick} />
          </div>
        </div>
      </form>
    )

    return (
      <footer id="contact" className="d-flex flex-column justify-content-center align-items-center w-100 py-5" style={{position: 'relative', zIndex: 1}}>
        <ContactHook />
        <ContactForm />
      </footer>
    )
  }

  return (
    <WLSpinnerPage dependencies={[]}>
      <LandingSection />
      <div className="water">
        <BioSection />
        <AnalysisBanner />
        <ServicesSection />
      </div>
      <FloatingIsland color={creamy} islandCount={1} weight="0.1rem" width={1400} />
      <InsightsSection />
      <FloatingIsland color={creamy} islandCount={1} weight="0.1rem" width={1400} />
      <Contact formSent={formSent} setFormSent={setFormSent}/>
    </WLSpinnerPage>
  )
}
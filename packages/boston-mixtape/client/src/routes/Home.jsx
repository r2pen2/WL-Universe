import React, { useContext, useEffect, useState } from 'react'

import "../assets/style/home.css"
import { RecordTray } from '../components/homepage/Record'

import { WLHeaderV2, WLTextV2} from "../libraries/Web-Legos/components/Text"
import { Accordion, Button, Paper, Text } from '@mantine/core'
import { Contact } from '../components/homepage/Contact'
import { FeaturedVideo, Performer } from '../api/siteModels.ts'
import { Carousel } from '@mantine/carousel'
import { SiteModel } from '../libraries/Web-Legos/api/models.ts';
import { WLYoutubeEmbed } from '../libraries/Web-Legos/components/Media';
import { getYoutubeEmbedCode } from '../libraries/Web-Legos/api/media.ts';

import {TypeAnimation} from "react-type-animation"
import { IconBrain, IconCalendar, IconExchange, IconMicrophone2 } from '@tabler/icons-react'
import { CurrentSignInContext } from '../App.jsx'
import { AuthenticationManager } from '../libraries/Web-Legos/api/auth.ts'


import {AddModelButton, ModelEditButton, ModelEditModal} from "../libraries/Web-Legos/components/Modals.jsx"
import { getHostname } from '../libraries/Web-Legos/api/development.ts'

import logo from "../assets/images/homepage/logoPurple.png";
import { Spacer } from '@nextui-org/react'


export default function Home() {

  
  const [userCanEditText, setUserCanEditText] = useState(false);

  const {currentSignIn} = useContext(CurrentSignInContext);
  const {authenticationManager} = useContext(AuthenticationManager.Context)

  const [currentModel, setCurrentModel] = useState(new SiteModel());
  const [editModalOpen, setEditModalOpen] = useState(false);

  const [featuredVideo, setFeaturedVideo] = useState([]);

  useEffect(() => {
    authenticationManager.getPermission(currentSignIn, "siteText").then(p => setUserCanEditText(p));
    Performer.getAndSet(setPerformers);
    FeaturedVideo.getAndSet(setFeaturedVideo);
  }, [currentSignIn, authenticationManager]);

  const [performers, setPerformers] = useState([])

  const Ensemble = () => {

    const PerformerSlide = ({performer}) => {
      return (
        <Carousel.Slide className="px-2" style={{maxWidth: "90vw"}}>
          <Paper style={{background: "#fcb393"}} className="p-0 px-md-2 m-0 pt-2 d-flex flex-md-row flex-column align-items-center align-items-md-start text-center text-md-start justify-content-center h-100">
            <div className="px-2 d-flex flex-column align-items-center justify-content-center" style={{minWidth: 200}}>
              <img src={getHostname() + "/" + performer.imageSource} alt={performer.name} style={{height: 200, width: 200, objectFit: "cover", aspectRatio: "1/1", borderRadius: "1rem"}}></img>
              <Text className="gibbons-regular performer-text py-2" size="1.5rem" c="var(--splash-text-color)">{performer.name}</Text>
            </div>
            <div className="px-2 w-100 d-flex flex-column align-items-start text-left justify-content-center">
              <div className="performer-line"></div>
              <Text className="performer-text pb-2" c="var(--splash-text-color)">{performer.bio}</Text>
              <ModelEditButton
                userCanEdit={userCanEditText} 
                data={performer} 
                model={Performer} 
                setEditModalOpen={setEditModalOpen} 
                setCurrentModel={setCurrentModel}
                buttonComponent={
                  <Button color="var(--splash-text-color)" style={{marginBottom: "1rem", alignSelf: "end"}}>
                    <Text c="#FCB393" className="gibbons-regular">
                      Edit
                    </Text>
                  </Button> }
              />
            </div>
          </Paper>
        </Carousel.Slide>
      )
    }

    return (
      <section id="ensemble" className="purple-content px-2 px-sm-3 py-5 d-flex flex-column align-items-center justify-content-center">
        <WLHeaderV2 firestoreId="ensemble-header" editable={userCanEditText} h2 className="gibbons-regular" />
        <WLTextV2 className="wider lighter mb-2" firestoreId="ensemble-body-1" editable={userCanEditText} />
        <Carousel 
          className="performer-container px-md-5 px-1"
          slideSize={{ base: '90%', md: '50%' }}
          // align="start"
          loop
        >
          {performers.map((performer, index) => <PerformerSlide key={index} performer={performer} />)}
        </Carousel>
        <AddModelButton
          userCanEdit={userCanEditText} 
          model={Performer} 
          setCurrentModel={setCurrentModel} 
          setEditModalOpen={setEditModalOpen}
          buttonComponent={
          <Button color="#FCB393" style={{marginTop: "1rem"}}>
            <Text c="#702137" className="gibbons-regular">
              Add Performer
            </Text>
          </Button> }
        />
        <WLTextV2 className="wider mt-2 lighter" firestoreId="ensemble-body-2" editable={userCanEditText}/>
      </section>
    )
  }

  const Services = () => {

    const Service = (props) => {
      return (
        <div className="service col-md-6 py-3 col-12 text-start">
        <div className="service-content" id='services'>
          <div className="gap-2 d-flex flex-row align-items-start justify-content-start">
            {props.icon}
            <WLTextV2 firestoreId={props.firestoreId + "-title"} editable={userCanEditText} className="gibbons-regular w-100 text-start" />
          </div>
          <WLTextV2 firestoreId={props.firestoreId + "-description"} editable={userCanEditText} className="service-description w-100" />
        </div>
      </div>
      )
    }

    return (
      <div className="col-12 col-lg-6 py-lg-0 py-5">
        <WLHeaderV2 h2 className="gibbons-regular" firestoreId="services-header" editable={userCanEditText} />
        <div className="container-fluid">
          <div className="row">
            <Service firestoreId="service-1"  icon={<IconCalendar size={32} />}     />
            <Service firestoreId="service-2"  icon={<IconMicrophone2 size={32} />}  />
            <Service firestoreId="service-3"  icon={<IconExchange size={32} />}     />
            <Service firestoreId="service-4"  icon={<IconBrain size={32} />}        />
          </div>
        </div>
      </div>
    )
  }

  const MetaHeader = () => (
    <hgroup className="d-none">
      <h1>BOSTON Mixtape</h1>
      <h2>Your happiness... set to music.</h2>
    </hgroup>
  )

  const Repertoire = () => (
    <div className="col-12 col-lg-6 mb-4" id="repertoire">
      <h2 className='gibbons-regular m-0'>WE PLAY</h2>
      <TypeAnimation
        sequence={[
          "Jazz & Swing", 1000,
          "Contemporary Hits", 1000,
          "Traditional Klezmer", 1000,
          "Funk", 1000,
          "Show Tunes", 1000,
          "Popular Hits", 1000,
          "Contemporary Jewish", 1000,
          "Motown and R&B", 1000,
          "American Rock", 1000,
          "Upbeat Simcha", 1000,
          "Country", 1000,
          "Classical", 1000,
          "Israeli Pop", 1000,
          // "Hits from the 40’s to Top 40", 1000,
          // "Your Favorites (or) Your Music", 1000,
          "What You Love", 1000
        ]}
        wrapper="span"
        speed={70}
        className="richard-regular m-0"
        style={{ fontSize: '1.5rem', display: 'inline-block' }}
        repeat={Infinity}
      />
      <WLTextV2 firestoreId="repretoire-body" editable={userCanEditText} />
    </div>
  )

  return (
    <div className="homepage-container">
      <ModelEditModal open={editModalOpen} setOpen={setEditModalOpen} model={currentModel} />
      <section className="home-splash-container" id="home">
        <MetaHeader />
        <hgroup className='logo-container'>
          <img src={logo} alt="boston-mixtape-logo" className="homepage-logo"/>
        </hgroup>
        <RecordTray userCanEditText={userCanEditText} />
        <div className="d-flex flex-column align-items-center justify-content-center w-100 px-2 px-sm-3 hero-container" style={{position: "absolute", top: "80vh"}}>
          <WLTextV2 headerLevel={2} firestoreId="hero-text-1" editable={userCanEditText} className="richard-regular hero h2-container" />
          <WLTextV2 headerLevel={2} firestoreId="hero-text-2" editable={userCanEditText} className="richard-regular hero h2-container" />
        </div>
      </section>
      <section className="purple-content px-2 px-sm-3 py-5">
        <WLHeaderV2 h2 className="gibbons-regular" firestoreId="call-to-action-header" editable={userCanEditText} />
        <WLTextV2 firestoreId="call-to-action-body" editable={userCanEditText} />
        <div className="d-flex flex-row align-items-center justify-content-center pt-4 gap-2 contact-button-container">
          <div className="contact-line"></div>
          <Button color={"#FCB393"} onClick={() => window.location = "/#contact"}>
            <Text className="contact-button gibbons-regular">Contact Us</Text>
          </Button>
          <div className="contact-line"></div>
        </div>
      </section>
      <section className='purple-content d-flex align-items-center justify-content-center flex-column pb-5'>
        <WLHeaderV2 firestoreId="featured-video-header" color="#faebee" className="gibbons-regular" editable={userCanEditText} h2 />
        <WLYoutubeEmbed maxWidth={600} embedCode={featuredVideo[0] ? getYoutubeEmbedCode(featuredVideo[0].embedCode) : ""} />
        <ModelEditButton
          userCanEdit={userCanEditText}
          model={FeaturedVideo}
          data={featuredVideo[0]}
          setEditModalOpen={setEditModalOpen}
          setCurrentModel={setCurrentModel}
          buttonComponent={
            <Button color={"#FCB393"} style={{marginTop: "1rem", alignSelf: "center"}}>
              <Text c="#702137" className="gibbons-regular">
                Change Video
              </Text>
            </Button>  
          }
        />
      </section>
      <Ensemble />
      <section style={{position: "relative"}} className="red-content peaks-responsive">
        <Peaks />
        <div className="container-fluid px-2 px-sm-3" style={{zIndex: 2}}>
          <div className="row">
            <Repertoire />
            <Services />
          </div>
        </div>
        <PeaksFlipped />
      </section>
      <section className="w-100 d-flex flex-column mountains align-items-center justify-content-center gap-2 px-2 px-md-4" style={{backgroundColor: "#9C2C45", paddingTop: "6rem"}}>
        <hgroup id="differentiation">
          <WLHeaderV2 firestoreId="differentiation-header" color="#faebee" className="gibbons-regular" editable={userCanEditText} h2 />
          <WLTextV2 firestoreId="differentiation-subheader" color="#faebee" className="richard-regular" editable={userCanEditText} />
        </hgroup>
        <Accordion variant="contained" style={{maxWidth: 1000, width: "100%"}} className="diff-acc px-2">
          {
            accordionItems.map((item) => (
              <Accordion.Item key={item} value={item}>
                <Accordion.Control>
                  <WLTextV2 firestoreId={item + "-header"} className="richard-regular" color="#faebee" editable={userCanEditText} />
                </Accordion.Control>
                <Accordion.Panel>
                  <WLTextV2 firestoreId={item + "-body"} color="#faebee" size="1.125rem" editable={userCanEditText} />
                </Accordion.Panel>
              </Accordion.Item>
            ))
          }
        </Accordion>
        <Spacer y={2} />
        <Contact />
      </section>
    </div>
  )
}

const Peaks = ({flip}) => (
  <svg style={{position: "absolute", top: "0%"}} xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" id="visual" version="1.1" viewBox={`0 0 900 242`}>
    <path d="M0 231L129 242L257 167L386 199L514 231L643 190L771 240L900 182L900 0L771 0L643 0L514 0L386 0L257 0L129 0L0 0Z" fill="#c9394f"/>
    <path d="M0 199L129 158L257 196L386 128L514 186L643 177L771 199L900 126L900 0L771 0L643 0L514 0L386 0L257 0L129 0L0 0Z" fill="#b2324a"/>
    <path d="M0 103L129 149L257 106L386 113L514 91L643 133L771 158L900 158L900 0L771 0L643 0L514 0L386 0L257 0L129 0L0 0Z" fill="#9c2c45"/>
    <path d="M0 63L129 75L257 91L386 82L514 112L643 80L771 102L900 65L900 0L771 0L643 0L514 0L386 0L257 0L129 0L0 0Z" fill="#86263e"/>
    <path d="M0 56L129 35L257 30L386 64L514 71L643 38L771 41L900 58L900 0L771 0L643 0L514 0L386 0L257 0L129 0L0 0Z" fill="#702137"/>
  </svg>
)

const PeaksFlipped = () => (
  <svg style={{position: "absolute", bottom: "0%", transform: "rotate(-180deg)"}} xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" id="visual" version="1.1" viewBox="0 50 900 242">
    <path d="M0 231L129 242L257 167L386 199L514 231L643 190L771 240L900 182L900 0L771 0L643 0L514 0L386 0L257 0L129 0L0 0Z" fill="#c9394f"/>
    <path d="M0 199L129 158L257 196L386 128L514 186L643 177L771 199L900 126L900 0L771 0L643 0L514 0L386 0L257 0L129 0L0 0Z" fill="#b2324a"/>
    <path d="M0 103L129 149L257 106L386 113L514 91L643 133L771 158L900 158L900 0L771 0L643 0L514 0L386 0L257 0L129 0L0 0Z" fill="#9c2c45"/>
  </svg>
)

const accordionItems = ["diff-air-time", "diff-special-requests", "diff-ego", "diff-volume", "diff-dj", "diff-dance", "diff-culture", "diff-composition", "diff-media", "diff-games", "diff-logo", "diff-concert", "diff-charity"];
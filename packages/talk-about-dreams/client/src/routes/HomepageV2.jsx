import React from 'react'
import {GlyphSectionTwoItemsNoActions} from "../libraries/Web-Legos/Layouts/Sections/GlyphSection"
import { WLHeaderV2, WLTextV2 } from "../libraries/Web-Legos/components/Text"
import { WLImageV2 } from "../libraries/Web-Legos/components/Images"

import bridge from "../assets/images/bridge.svg";
import flower from "../assets/images/leaf.png";
import { swanBlueGray, swanWhite } from '../libraries/Web-Legos/api/colors';
import { ButtonRounded } from '../libraries/Web-Legos/Layouts/Buttons/Buttons';

import julia from "../assets/images/julia.jpg";

import "../assets/style/homepageV2.css"
import { Paper } from '@mantine/core';

import moonLogo from "../assets/images/moonLogo.png";

export default function HomepageV2({userCanEditText, userCanEditImages}) {

  const Splash = () => (
    <section className="splash d-flex flex-column align-items-center justify-content-center px-2">
      <hgroup style={{maxWidth: 800}} id="home">
        <WLHeaderV2 editable={userCanEditText} firestoreId="header" align="center" color="white" />
        <WLTextV2 editable={userCanEditText} firestoreId="subheader-text" align="center" size={24} color="white" />
      </hgroup>
      <div className="dreams-line" />
      <div className="wl-spacer-2" />
      <Paper shadow="xl" style={{backgroundColor: "#F4FBFC", maxWidth: 1000}} className="d-flex flex-md-row flex-column align-items-start justify-content-center gap-2 p-lg-4 p-2">
        <img src={moonLogo} alt="moonLogo" className="moon-logo" />
        <div className="d-flex flex-column align-items-center justify-content-start h-100 gap-2">
          <WLHeaderV2 editable={userCanEditText} firestoreId="brand-label" align="left" size={32} color="#1e1e1e"/>
          <WLTextV2 editable={userCanEditText} firestoreId="brand-info" size={18} color="#525252" />
          <div className="wl-spacer-1" />
          <ButtonRounded color="#5738B3" size="lg" onClick={() => window.open("mailto:talkaboutdreams@yahoo.com")}>
            Speak With Me
          </ButtonRounded>
        </div>
      </Paper>
      <img src={bridge} alt="bridge" className="wl-section-bottom"/>
    </section>
  )

  const About = () => {
    
    const JuliaImageLarge = () => <img src={julia} alt="Julia Dobbelaar" className='col-12 col-lg-5 px-5 px-lg-2 d-none d-lg-block' />

    const JuliaImageSmall = () => <img src={julia} alt="Julia Dobbelaar" className='col-12 col-lg-5 px-2 d-block d-lg-none' />

    return (
    <section id="about" className="d-flex flex-column align-items-center pt-5" style={{backgroundColor: "#F4FBFC", position: "relative"}}>
      <div className="container-fluid" style={{maxWidth: 900}}>
        <div className="row align-items-center d-flex">
          <JuliaImageLarge />
          <div className="d-flex flex-column align-items-start col-12 col-lg-7 text-center text-lg-start ">
            <WLHeaderV2 h1 editable={userCanEditText} firestoreId="about-header" />
            <div className="dreams-line full px-2" />
            <div className="container-fluid pb-5">
              <div className="row">
                <div className="col-12 px-2 pb-2 text-start">
                  <WLTextV2 editable={userCanEditText} firestoreId="about-blurb-1" />
                </div>
              </div>
            </div>
          </div>
          <JuliaImageSmall />
        </div>
      </div>
    </section>
  )}

  const Services = () => (
    <section id="services" className="d-flex flex-column align-items-center col-lg-4 col-12">
      Tes
    </section>
  )

  return (
    <div className="d-flex flex-column align-items-center justify-content-center">
      <Splash />
      <About />
    </div>
  )
}

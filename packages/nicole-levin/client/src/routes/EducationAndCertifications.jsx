import { Text, Button, Spacer } from '@nextui-org/react'
import React, { memo, useEffect, useState } from 'react'

import {WLHeader, WLHeaderV2, WLTextV2} from "../libraries/Web-Legos/components/Text"
import {WLImage} from "../libraries/Web-Legos/components/Images"

import "../assets/style/about.css";
import nicole from "../assets/images/nicole.jpg"


export default function EducationAndCertifications({userCanEditText, userCanEditImages}) {

  // Fetch text only once
  const AboutBodyText = ({align}) => <WLTextV2 align={align} color="white" firestoreId="about-body-text" editable={userCanEditText} />
  const AboutHeader = ({align}) => <WLHeaderV2 align={align} color="white" firestoreId="about-header" editable={userCanEditText} />

  return (
    <section id="about" className="about-container">
      <div className="container py-2">
        <div className="row d-flex flex-row align-items-center justify-content-center">
          <div className="col-xl-4 col-lg-12 col-12 d-flex flex-column justify-content-center align-items-center py-2">
            <WLImage editable={userCanEditImages} firestoreId="about" alt="education-glyph" imgCss={{maxHeight: 200, width: 200, aspectRatio: "1/1", objectFit:"cover", borderRadius: "50%"}} />
          </div>
          <div className="col-xl-8 col-12 d-xl-flex d-none flex-column align-items-start justify-content-center">
            <AboutHeader align="left" />
            <AboutBodyText align="left"/>
          </div>
          <div className="col-xl-8 col-12 d-none d-md-flex d-xl-none flex-column align-items-start justify-content-center">
            <AboutHeader />
            <AboutBodyText align="left"/>
          </div>
          <div className="col-xl-8 col-12 d-flex d-md-none flex-column align-items-start justify-content-center">
            <AboutHeader />
            <AboutBodyText />
          </div>
        </div>
      </div>
    </section>
  )
}

import React from 'react'

import "../assets/style/bar.css";

import "../libraries/Web-Legos/assets/style/text.css";
import { WLBlockHeader, getWLText } from '../libraries/Web-Legos/components/Text';
import { blockHeaderColor } from '../assets/style/colors';
import { useState } from 'react';
import { useEffect } from 'react';

export function OrangeBar(props) {
  return (
    <section className={"orange-bar"}>
      {props.children}
    </section>
  )
}

export function AboutBlockHeader() {
  
  const [developingHeader, setDevelopingHeader] = useState("");
  const [directorHeader, setDirectorHeader] = useState("");
  const [methodsHeader, setMethodsHeader] = useState("");
  const [learningHeader, setLearningHeader] = useState("");

  useEffect(() => {
    getWLText("developing-all-learners-header").then(t => setDevelopingHeader(t))
    getWLText("our-staff-header").then(t => setDirectorHeader(t))
    getWLText("our-methods-header").then(t => setMethodsHeader(t))
    getWLText("our-learning-center-header").then(t => setLearningHeader(t))
  }, [])

  return (
    <WLBlockHeader 
      text="About Beyond the Bell"
      color={blockHeaderColor}
    >
      <WLBlockHeader.Section sectionId="developing-all-learners" title={developingHeader} />
      <WLBlockHeader.Section sectionId="our-methods" title={methodsHeader} />
      <WLBlockHeader.Section sectionId="our-learning-center" title={learningHeader} />
      <WLBlockHeader.Section sectionId="meet-the-director" title={directorHeader} />
    </WLBlockHeader>
  )
}


export function ContactBlockHeader() {
  return <WLBlockHeader short color={blockHeaderColor} text="Contact / Register" />;
}

export function GalleryBlockHeader() {
  return <WLBlockHeader short color={blockHeaderColor} text="Gallery" />;
}

export function ServicesBlockHeader() {
  
  
  
  const [afterSchoolHeader, setAfterSchoolHeader] = useState("");
  const [tutoringHeader, setTutoringHeader] = useState("");
  const [wilsonHeader, setWilsonHeader] = useState("");

  useEffect(() => {
    getWLText("social-skills-header").then(t => setAfterSchoolHeader(t))
    getWLText("1-on-1-tutoring-header").then(t => setTutoringHeader(t))
    getWLText("wilson-tutoring-header").then(t => setWilsonHeader(t))
  }, [])

  return (
    <WLBlockHeader
      color={blockHeaderColor} 
      text="Our Services"
    >
      <WLBlockHeader.Section sectionId="after-school" title={afterSchoolHeader} />
      <WLBlockHeader.Section sectionId="1-on-1-tutoring" title={tutoringHeader} />
      <WLBlockHeader.Section sectionId="wilson-tutoring" title={wilsonHeader} />
    </WLBlockHeader>
  )

}

export function ThankYouBlockHeader() {
  return <WLBlockHeader short color={blockHeaderColor} text="Thank You" />;
}
import { Text } from '@nextui-org/react'
import React, { useEffect, useState } from 'react'

import { WLHeaderV2, WLTextV2 } from "../libraries/Web-Legos/components/Text"
import { Swoosh } from "../libraries/Web-Legos/components/Waves"

import "../assets/style/psychotherapy.css";
import chair from "../assets/images/chair.png"

import { TreatmentItem } from '../api/siteModels.ts';

import {AddModelButton, ModelEditButton} from "../libraries/Web-Legos/components/Modals"


export default function Psychotherapy({userCanEditText, modelEditModalOpen, setModelEditModalOpen, currentModel, setCurrentModel}) {

  const [treatments, setTreatments] = useState([])

  useEffect(() => {
    TreatmentItem.getAndSet(setTreatments);
  }, [])
  
  const PsychotherapyBodyText = ({indent}) => (
    <WLTextV2 color="#8C8C8C" indent={indent} align="left" firestoreId="psychotherapy-body-text" editable={userCanEditText}/>
  )

  const PsychotherapyHeader = ({className, align}) => (
    <WLHeaderV2 className={className} b align={align} firestoreId="psychotherapy-header" editable={userCanEditText}/>
  )

  const TextInline = () => (
    <div className="container d-lg-block d-none" style={{padding: 0}}>
      <div className="row d-flex flex-row align-items-center justify-content-center">
        <div className="col-12">
          <PsychotherapyBodyText />
        </div>
      </div>
    </div>
  )

  const TextVertical = () => (
    <div className="d-flex d-lg-none flex-column align-items-center justify-content-center"s>
      <PsychotherapyBodyText />
    </div>
  )

  const Treatment = ({t}) => (
    <div className="py-2 col-12 col-md-6 col-lg-4 treatment d-flex flex-column align-items-center justify-content-center">
      <Text>{t.title}</Text>
      <ModelEditButton setCurrentModel={setCurrentModel} setEditModalOpen={setModelEditModalOpen} data={t} userCanEdit={userCanEditText} model={TreatmentItem}/>
    </div>
  )

  const WhiteSection = () => (
    <section id="psychotherapy" className="row w-100 card-top p-2">
      <div className="col-12 col-lg-8 d-flex flex-column align-items-start justify-content-start py-2">
        <hgroup className="w-100 d-flex flex-column align-items-center align-items-md-start">
          <PsychotherapyHeader className="psychotherapy-header d-none d-lg-block" align="left" />
          <PsychotherapyHeader className="psychotherapy-header d-lg-none" />
        </hgroup>
        <TextInline />
        <TextVertical />
      </div>
      <div className="col-12 col-lg-4 d-flex flex-column align-items-center justify-content-center">
        <img src={chair} alt="chair" className="chair" />
      </div>
      <WLHeaderV2 h2 className="treatments-header" firestoreId="treatment-specializations-header" editable={userCanEditText}/>
      <div className="container d-flex flex-column align-items-center">
        <ul className="row">
          {treatments.map((t, i) => <Treatment key={i} t={t}/>)}
        </ul>
        <AddModelButton model={TreatmentItem} userCanEdit={userCanEditText} setCurrentModel={setCurrentModel} setEditModalOpen={setModelEditModalOpen}  />
      </div>
    </section>
  )

  const GraySection = () => (
    <div className="row w-100 card-bottom px-2" >
      <div className="col-12 col-lg-6 py-3 d-flex flex-column align-items-center justify-content-center" style={{padding: 0}}>
        <div className="line-right px-4 d-flex flex-column align-items-center h-100 gap-2">
          <WLTextV2 color="#E6E6E6" firestoreId="social-worker-body" editable={userCanEditText} />
        </div>
      </div>
      <div className="col-12 col-lg-6 py-3 d-flex flex-column align-items-center justify-content-center" style={{padding: 0}}>
        <div className="px-4 d-flex flex-column align-items-center h-100 gap-2">
          <WLTextV2 color="#E6E6E6" firestoreId="gestalt-body" editable={userCanEditText}/>
        </div>
      </div>
    </div>
  )

  const WhiteWave = () => (
    <div className='w-100 shadow-top' style={{position: "absolute", bottom: -1, left: 0, width: "100vw"}}>
      <svg width="100vw" display="block" viewBox="0 0 1456 95" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g filter="url(#filter0_d_2_260)">
        <path d="M-2 65L32.7764 60.3C67.6542 55.7 137.207 46.3 206.658 48.5C276.11 50.7 345.46 64.3 414.911 64C484.362 63.7 553.915 49.3 623.569 39.2C693.224 29 762.776 23 832.431 31.2C902.085 39.3 971.638 61.7 1041.09 64.3C1110.54 67 1179.89 50 1249.34 37.3C1318.79 24.7 1388.35 16.3 1423.22 12.2L1458 8V95H1423.22C1388.35 95 1318.79 95 1249.34 95C1179.89 95 1110.54 95 1041.09 95C971.638 95 902.085 95 832.431 95C762.776 95 693.224 95 623.569 95C553.915 95 484.362 95 414.911 95C345.46 95 276.11 95 206.658 95C137.207 95 67.6542 95 32.7764 95H-2V65Z" fill="white"/>
        </g>
        <defs>
        <filter id="filter0_d_2_260" x="-6" y="0" width="1468" height="95" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
        <feFlood flood-opacity="0" result="BackgroundImageFix"/>
        <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
        <feOffset dy="-4"/>
        <feGaussianBlur stdDeviation="2"/>
        <feComposite in2="hardAlpha" operator="out"/>
        <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
        <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_2_260"/>
        <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_2_260" result="shape"/>
        </filter>
        </defs>
      </svg>
    </div>
  )

  return (
    <section className="psychotherapy-container px-2 px-sm-5">
      <Swoosh flipX flipY className="shadow-bottom" style={{position: "absolute", top: -1, left: 0}} color="#1E1E1E" />
      <div className="container-fluid d-flex flex-column align-items-center justify-content-center psychotherapy-card-container">
        <WhiteSection />
        <GraySection />
      </div>
      <WhiteWave />
    </section>
  )
}

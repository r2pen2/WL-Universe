import React from 'react'

import "../assets/style/yoga.css"
import { WLHeaderV2, WLTextV2 } from '../libraries/Web-Legos/components/Text'
import glyph from "../assets/images/flower.png"

export default function YogaBanner({userCanEditText}) {
  
  const Left = () => (
    <div className="d-flex flex-column align-items-center justify-content-center py-2" style={{maxWidth: 650}}>
      <WLHeaderV2 h2 firestoreId="yoga-header" editable={userCanEditText} />
      <WLTextV2 firestoreId="yoga-body" editable={userCanEditText}>
        
      </WLTextV2>
    </div>
  )
  
  const Right = () => (
    <div className="d-flex flex-column align-items-center justify-content-center py-2" style={{maxWidth: 650}}>
      <WLHeaderV2 h2 firestoreId="gestalt-workshops-header" editable={userCanEditText}/>
      <WLTextV2 firestoreId="gestalt-workshops-body" editable={userCanEditText}/>
    </div>
  )

  return (
    <section className="w-100 yoga-container d-flex flex-column align-items-center justify-content-center py-2" id="yoga-and-workshops" style={{zIndex: 2}}>
      <div className={`w-100`}>
        <section className="wl-glyph-section-two-items-no-actions d-none d-lg-flex wl-gap-3">
          <Left />
          <div className="wl-glyph-section-two-items-no-actions-glyph-container">
            <img src={glyph} alt="glyph" className="wl-glyph-section-glyph" data-testid="wl-glyph-section-glyph" />
          </div>
          <Right />
        </section>
        <div className="wl-glyph-section-two-items-no-actions d-flex d-lg-none">
          <div className="wl-glyph-section-two-items-no-actions-md-container container-fluid">
            <div className="row">
              <section className="col-12 col-md-6 d-flex flex-column align-items-center justify-content-center" id="yoga-and-pilates"><Left /></section>
              <section className="col-12 col-md-6 d-flex flex-column align-items-center justify-content-center" id="workshops"><Right /></section>
            </div>
          </div>
          <div className="wl-glyph-section-two-items-no-actions-glyph-container">
            <img src={glyph} alt="glyph" className="wl-glyph-section-glyph" data-testid="wl-glyph-section-glyph" />
          </div>
        </div>
      </div>
    </section>
  )
}

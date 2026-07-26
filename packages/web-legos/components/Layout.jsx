import React, { Component, useEffect, useState } from "react";
import "../assets/style/layout.css";
import { WLImage } from "./Images";
import { WLHeader, WLTextBlock } from "./Text";
import { Loading, Text, Tooltip } from "@nextui-org/react";

import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

/**
 * Web-Legos section that renders from firestoreId
 * @param {string} justifyTop - top section justification
 * @param {string} justifyLeft - left section justification
 * @param {string} justifyRight - right section justification
 * @param {string} columnWidthLeft - column width for left section
 * @param {string} columnWidthRight - column width for right section
 * @param {string} sectionClasses - classes to apply on rendered <section /> element
 * @param {string} sectionId - id of the section to render
 * @param {React.ReactNode} topContent - content to place in top section
 * @param {React.ReactNode} leftContent - content to place in left section
 * @param {React.ReactNode} rightContent - content to place in right section
 * @param {React.ReactNode} bottomContent - content to place in bottom section
 * @default
 * justifyTop = "center"
 * justifyLeft = "center"
 * justifyRight = "center"
 * columnWidthLeft = "6"
 * columnWidthRight = "6"
 */
export function WLResponsiveSection(props) {

  /** Justification string for top section */
  const topJustification = props.justifyTop ? props.justifyTop : "center";
  /** Justification string for left section */
  const leftJustification = props.justifyLeft ? props.justifyLeft : "center";
  /** Justification string for right section */
  const rightJustification = props.justifyRight ? props.justifyRight : "center";
  /** Column width for left section */
  const leftCol = props.columnWidthLeft ? props.columnWidthLeft : "6";
  /** Column width for right section */
  const rightCol = props.columnWidthRight ? props.columnWidthRight : "6";

  return (
    <section className={"container-fluid py-lg-5 py-3 " + props.sectionClasses} id={props.sectionId}>
      <div className={`d-flex flex-column align-items-center justify-content-${topJustification}`}>
        {props.topContent}
      </div>
      <div className="row">
        <div className={`col-lg-${leftCol} py-xl-4 py-3 col-md-12 web-legos-responsive-section d-flex flex-column align-items-center justify-content-${leftJustification}`}>
          {props.leftContent}
        </div>
        <div className={`col-lg-${rightCol} py-xl-4 py-3 col-md-12 web-legos-responsive-section d-flex flex-column align-items-center justify-content-${rightJustification}`} >
          {props.rightContent}
        </div>
      </div>
      {props.bottomContent}
    </section>
  )
}

/**
 * Web-Legos section that renders from firestoreId
 * @param {string} justifyTop - top section justification
 * @param {string} justifyLeft - left section justification
 * @param {string} justifyRight - right section justification
 * @param {string} columnWidthLeft - column width for left section
 * @param {string} columnWidthRight - column width for right section
 * @param {string} sectionClasses - classes to apply on rendered <section /> element
 * @param {string} textColor - color of text in this section
 * @param {boolean} editable - whether current user has permission to edit this section
 * @param {string} firestoreId - id of the section to render from firestore
 * @param {React.ReactNode} topContent - content to place in top section
 * @param {React.ReactNode} bottomContent - content to place in bottom section
 * @param {React.ReactNode} header - replacement header component
 * @param {React.ReactNode} text - replacement text component
 * @param {React.ReactNode} image - replacement image component
 * @param {boolean} textRight - whether to display text on the right side of the section
 * @param {boolean} stackHeader - whether to stack header on top of text
 * @param {Function} setLoaded - function to tell parent components that all parts of section have been loaded
 * @param {boolean} headerBlack - whether to color header black
 * @param {boolean} headerWhite - whether to color header white
 * @param {string} headerAlign - header flex alignment
 * @default
 * justifyTop = "center"
 * justifyLeft = "center"
 * justifyRight = "center"
 * columnWidthLeft = "6"
 * columnWidthRight = "6"
 */
export function WLResponsiveSectionEditable(params) {

  // Create states
  const [textLoaded, setTextLoaded] = useState(false);      // Whether text has loaded
  const [headerLoaded, setHeaderLoaded] = useState(false);  // Whether header has loaded

  /** Rendered header component */
  const headerRender = params.header ? params.header : <WLHeader align={params.headerAlign} setLoaded={setHeaderLoaded} editable={params.editable} firestoreId={`${params.firestoreId}-header`} color={params.textColor ? params.textColor : (params.headerWhite ? "white" : (params.headerBlack ? "black" : "primary"))} headerLevel={1} />;
  /** Rendered text component */
  const textRender = <WLTextBlock setLoaded={setTextLoaded} editable={params.editable} className="px-4 px-md-5" firestoreId={params.firestoreId} color={params.textColor} />;
  /** Rendered imagea component */
  const imageRender = <WLImage firestoreId={params.firestoreId} editable={params.editable} shadow halfWidth/>;

  // Set parent's loaded state if text and header have loaded
  useEffect(() => {
    if (params.setLoaded) {
      params.setLoaded(textLoaded && headerLoaded);
    }
  }, [textLoaded, headerLoaded, params])

  return (
    <WLResponsiveSection
      justifyLeft={params.justifyLeft}
      justifyRight={params.justifyRight}
      justifyTop={params.justifyTop}
      sectionId={params.firestoreId}
      sectionClasses={params.sectionClasses}
      columnWidthLeft={params.columnWidthLeft}
      columnWidthRight={params.columnWidthRight}
      leftContent={
        params.textRight
        ?
          params.image ? params.image : imageRender
        :
          <WLCenteredColumn>
            { params.stackHeader && headerRender }
            { params.text ? params.text : textRender }
          </WLCenteredColumn>
      }
      rightContent={
        params.textRight
        ?
          <WLCenteredColumn>
            { params.stackHeader && headerRender }
            { params.text ? params.text : textRender }
          </WLCenteredColumn>
        :
          params.image ? params.image : imageRender
      }
      topContent={!params.stackHeader ? headerRender : params.topContent}
      bottomContent={params.bottomContent}
      stackHeader={params.stackHeader}
    />
  )
}

/**
 * A full-width centered column component
 * @param {React.ReactNode} children - content to render inside column
 */
export function WLCenteredColumn(props) {
  return (
    <div className="w-100 d-flex flex-column align-items-center justify-content-center">
      {props.children}
    </div>
  )
}

/**
 * A loading indicator
 */
export function WLLoading() {
  return (
    <div className="d-flex flex-column align-items-center justify-content-center gap-2 vh-100">
      <Loading size="lg" color="primary" />
      <Text size="$lg">
        Loading...
      </Text>
    </div>
  )
}

/**
 * A page that renders a spinner until all dependencies are resolved
 * @param {boolean[]} dependencies - displays spinner until all dependencies are true
 * @param {boolean} itemsCentered - whether to center items
 * @param {React.ReactNode} children - content to render inside of screen
 * @param {string} containerClasses - classes to apply to rendered div
 */
export function WLSpinnerPage(props) {

  /** How long to spin loaded until just hiding it anyway */
  const loadingTimeoutTimeMs = 1000;

  /** We need a loading timeout for some older devices because the dependencies don't get updated */
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [pageReady, setPageReady] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setLoadingTimeout(true);
    }, loadingTimeoutTimeMs);
  });

  useEffect(() => {

    /** Check if all dependencies are resolved */
    function getDependenciesLoaded() {
      for (const dep of props.dependencies) {
        if (!dep) {
          return dep;
        }
      }
      return true;
    }

    setPageReady(getDependenciesLoaded())
  }, [props.dependencies])

  return (
    <div className={"d-flex flex-column w-100 align-items-center"} data-testid={props["data-testid"]}>
      { !pageReady && !loadingTimeout && <WLLoading /> }
      <div className={`d-${pageReady ? "flex" : "none"} flex-column ` + props.itemsCentered ? "w-100 align-items-center" : ""}>
        { props.children }
      </div>
    </div>
  )
}

/**
 *
 * @param {number} height - height of divider
 * @param {number} padding - space around divider
 * @param {string} color - color of divider
 * @param {string} showIn - breakpoint to show divider
 * @default
 * padding = "0.5rem"
 * @returns
 */
export function VerticalDivider(props) {
  return (
    <div
      style={{
        height: props.height,
        marginLeft: props.padding ? props.padding : "0.5rem",
        marginRight: props.padding ? props.padding : "0.5rem"
      }}
      className={props.showIn ? `d-none d-${props.showIn}-inline` : null}
    >
      <div style={{height: props.height, width: props.width ? props.width : 1, backgroundColor: props.color}}/>
    </div>
  )
}

/**
 * A toggleable section that disappears when not logged in— unfinished
 * @deprecated lol I don't ever use this or really intend on it
 */
export function WLToggleableSection(props) {

  // Needs to fetch from site-sections
  const [toggledOff, setToggledOff] = useState(false);
  // Needs to fetch from site-auth
  // eslint-disable-next-line no-unused-vars
  const [editable, setEditable] = useState(true);

  function handleClick() {
    if (toggledOff) {
      setToggledOff(false);
    }
  }

  return (
    <div className={`wl-toggleable-section-container ${toggledOff ? "wl-toggleable-section-off" : "wl-toggleable-section-on"}  ${editable ? "wl-toggleable-section-editable" : "wl-toggleable-section-ineditable"}`}>
      <Tooltip onClick={() => setToggledOff(!toggledOff)} placement="right" className="d-flex flex-row align-items-center justify-content-center" style={{position: "absolute", top: "1rem", left: "1rem"}} content={`Toggle visibility ${toggledOff ? "ON" : "OFF"}`}>
        { !toggledOff && <VisibilityOffIcon fontSize="large" />}
      </Tooltip>
      <div className="wl-toggleable-section-content" onClick={handleClick}>
        {props.children}
      </div>
    </div>
  )
}

/**
 *
 * @param {string} backgroundColor1 - first background color
 * @param {string} backgroundColor2 - second background color
 * @param {number} zIndex - new zIndex if shadow does not appear
 * @returns
 */
export function ColoredShadowBox(props) {

  const backgroundColor1 = props.backgroundColor1 ? props.backgroundColor1 : "rgb(44, 44, 45)";
  const backgroundColor2 = props.backgroundColor2 ? props.backgroundColor2 : "rgb(26, 26, 30)";

  const shadowColor1 = props.shadowColor1 ? props.shadowColor1 : "#EF2427";
  const shadowColor2 = props.shadowColor2 ? props.shadowColor2 : "#070709";

  const zIndex = props.zIndex ? props.zIndex : 2;

  const alignment = props.stickLeft ? "left" : (props.stickRight ? "right" : null)

  return (
    <div style={{zIndex: zIndex}}>
      <div
        className={(`colored-shadow-box colored-shadow-box-aligned-${alignment} `) + props.className}
        style={{
          ...props.style,
          backgroundImage: props.background ? props.background : `linear-gradient(239.59deg, ${backgroundColor1} -44.65%, ${backgroundColor2} 75.57%)`,
        }}
      >
        {props.children}
        <div
          className="colored-shadow-box-shadow"
          style={{
            background: `linear-gradient(79.42deg, ${shadowColor1} -51.76%, ${shadowColor2} 75.15%)`
          }}
        />
      </div>
    </div>
  )
}

/**
 * @param {boolean} flipped - whether showing component 2
 * @deprecated i didn't get this working last time I tried
 */
export class TogglePane extends Component {

  static Item1(itemProps) {
    return <div className="toggle-pane-item toggle-pane-item-1">
      {itemProps.children}
    </div>
  }

  static Item2(itemProps) {
    return <div className="toggle-pane-item toggle-pane-item-2">
      {itemProps.children}
    </div>
  }

  render() {
    return (
      <div
        className="toggle-pane"
        style={{
          "--height1": this.props.flipped ? "0px" : "100%",
          "--height2": this.props.flipped ? "100%" : "0px",
          "--visibility1": this.props.flipped ? 0 : 1,
          "--visibility2": this.props.flipped ? 1 : 0,
          "--zIndex1": this.props.flipped ? -1 : 1,
          "--zIndex2": this.props.flipped ? 1 : -1,
          "--transitionTime": this.props.transitionTime ? this.props.transitionTime : "1s",
        }}
      >
        {this.props.children}
      </div>
    )
  }
}

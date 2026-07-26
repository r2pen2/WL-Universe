import React, { Component, useEffect, useRef, useState } from "react";
import Flickity from 'react-flickity-component'
import AliceCarousel from 'react-alice-carousel';
import "react-alice-carousel/lib/alice-carousel.css";

import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

import Slider from "react-slick"

import "../assets/style/content.css";
import { getLargestNumber } from "../api/math";
import { Button, IconButton, Pagination } from "@mui/material";
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { Divider, Text, Button as NextUIButton, Card, Progress } from "@nextui-org/react";
import { WLTestimonial } from "../api/models.ts";
import { QuoteBlock } from "./Text";
import { Carousel } from "react-responsive-carousel"
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';



/**
 * @param {boolean} autoPlay - autoplay timer setting
 * @param {string} inlineWidth - width to display carousel as inline
 * @param {boolean} buttonBlock - whether to display block buttons
 * @param {number} buttonSpacing - distance between inline buttons
 * @param {string} buttonSize - size of inline buttons
 * @param {string} backgroundColor - background color of carousel (not pagination)
 * @param {string} controlsStrategy - set a strategy for gallery controls (default, alternate, or responsive)
 * @param {boolean} forceButtons - show buttons even when pagination is enabled
 * @param {boolean} scaleActive - whether to scale down un-targeted elements
 * @default
 * autoPlay = false;
 * infinute = true;
 * buttonBlock = false;
 * buttonSpacing = 20;
 * @deprecated since 9/2/23— this is getting too gross. I'm re-writing it as {@link WLResponsiveCarousel}
 */
export function WLAliceCarousel(props) {

  const [activeIndex, setActiveIndex] = useState(0);

  const slidePrev = () => setActiveIndex(activeIndex !== 0 ? activeIndex - 1 : (props.breakpoints ? activeIndex : props.items.length - 1));
  const slideNext = () => setActiveIndex(activeIndex !== props.items.length - 1 ? activeIndex + 1 : (props.breakpoints ? activeIndex : 0));
  const syncActiveIndex = ({ item }) => setActiveIndex(item);

  const [items, setItems] = useState([]);

  useEffect(() => {

    const createItems = ([handleClick]) => {
      let deltaX = 0;
      let difference = 0;
      const swipeDelta = 20;

      return props.items.map((item, i) => (
          <div
              key={i}
              data-value={i + 1}
              className="item"
              style={{
                borderColor: props.underlineColor ? props.underlineColor : "transparent",
              }}
              onMouseDown={(e) => (deltaX = e.pageX)}
              onMouseUp={(e) => (difference = Math.abs(e.pageX - deltaX))}
              onClick={() => (difference < swipeDelta) && handleClick(i)}
          >
            <div className={"item-inner " + (props.underlineColor ? "underline-color " : "") + (props.scaleActive ? "scale-active " : "")} >
              {item}
            </div>
          </div>
      ));
    };

    setItems(createItems([setActiveIndex]));
  }, [props.items, props.underlineColor, props.scaleActive]);

  function getLeftButton() {
    if (props.leftButton) {
      return props.leftButton;
    }
    if (props.buttonBlock) {
      return <Button variant="outlined" style={{minWidth: 100}} color={props.buttonColor ? props.buttonColor : "inherit"} onClick={slidePrev}>Previous</Button>;
    }
    return <div className="carousel-button" style={{color: "white", filter: "drop-shadow(1px 1px 3px rgba(0,0,0,0.5))", marginInline: props.buttonSpacing ? props.buttonSpacing / 2 : 10}}><ChevronLeftIcon fontSize="large" /></div>;
  }

  function getRightButton() {
    if (props.leftButton) {
      return props.leftButton;
    }
    if (props.buttonBlock) {
      return <Button variant="outlined" style={{minWidth: 100}} color={props.buttonColor ? props.buttonColor : "inherit"} onClick={slideNext}>Next</Button>;
    }
    return <div className="carousel-button" style={{color: "white", filter: "drop-shadow(1px 1px 3px rgba(0,0,0,0.5))", marginInline: props.buttonSpacing ? props.buttonSpacing / 2 : 10}}><ChevronRightIcon fontSize="large" /></div>;
  }

  if (props.inlineWidth) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center" >
        { props.pagination && props.paginationTop && <Pagination hideNextButton={props.autoPlay} hidePrevButton={props.autoPlay} count={props.items.length} page={activeIndex + 1} onChange={(e, v) => { setActiveIndex(v - 1)}} /> }
        <div className="d-flex flex-row align-items-center justify-content-between" style={{zIndex: 2, position: "absolute", width: "100%", maxWidth: props.buttonSpacingInline ? props.buttonSpacingInline : props.inlineWidth}}>
          { (!props.pagination || props.forceButtons) && <div className="d-flex" onClick={slidePrev}>{ getLeftButton() }</div> }
          { (!props.pagination || props.forceButtons) && <div className="d-flex" onClick={slideNext}>{ getRightButton() }</div> }
        </div>
        <div className="d-flex" style={{width: props.inlineWidth, maxWidth: props.inlineWidth}}>
          <AliceCarousel
            style={{backgroundColor: props.backgroundColor}}
            mouseTracking
            disableDotsControls
            autoHeight={props.autoHeight}
            controlsStrategy={props.controlsStrategy ? props.controlsStrategy : "alternate"}
            disableButtonsControls
            infinite={props.autoPlay}
            autoPlay={props.autoPlay}
            autoPlayInterval={props.autoPlay}
            items={items}
            responsive={props.breakpoints}
            activeIndex={!props.autoPlay ? activeIndex : null}
            onSlideChanged={syncActiveIndex}
          />
        </div>
        { props.pagination && !props.paginationTop && <Pagination hideNextButton={props.autoPlay} hidePrevButton={props.autoPlay} count={props.items.length} page={activeIndex + 1} onChange={(e, v) => { setActiveIndex(v - 1)}} /> }
      </div>
    )
  }

  return [
    <div>
      { props.pagination && props.paginationTop && <Pagination hideNextButton={props.autoPlay} hidePrevButton={props.autoPlay} count={props.items.length} page={activeIndex + 1} onChange={(e, v) => { setActiveIndex(v - 1)}} /> }
    </div>,
    <AliceCarousel
      style={{backgroundColor: props.backgroundColor}}
      mouseTracking
      autoHeight={props.autoHeight}
      disableDotsControls
      controlsStrategy={props.controlsStrategy ? props.controlsStrategy : "alternate"}
      disableButtonsControls
      infinite={props.autoPlay}
      autoPlay={props.autoPlay}
      autoPlayInterval={props.autoPlay}
      items={items}
      responsive={props.breakpoints}
      activeIndex={!props.autoPlay ? activeIndex : null}
      onSlideChanged={syncActiveIndex}
    />,
    <div className="b-refs-buttons d-flex flex-row gap-10 my-2">
        { (!props.pagination || props.forceButtons) && <div className="d-inline" onClick={slidePrev}>{ getLeftButton() }</div> }
        { (!props.pagination || props.forceButtons) && <div className="d-inline" onClick={slideNext}>{ getRightButton() }</div> }
    </div>,
    <div>
      { props.pagination && !props.paginationTop && <Pagination hideNextButton={props.autoPlay} hidePrevButton={props.autoPlay} count={props.items.length} page={activeIndex + 1} onChange={(e, v) => { setActiveIndex(v - 1)}} /> }
    </div>
  ]
}

export function WLAliceCarouselItem(props) {

  function handleDragStart(e) {
    e.preventDefault();
  }

  return (
    <div onDragStart={handleDragStart}>
      {props.children}
    </div>
  )
}

export function createCarouselBreakpoints(itemsBase, itemsSm, itemsMd, itemsLg, itemsXl, itemsXxl) {

  const returnBase = itemsBase ? itemsBase : 1;
  const returnSmall = itemsSm ? itemsSm : getLargestNumber([itemsSm]);
  const returnMd = itemsMd ? itemsMd : getLargestNumber([itemsSm, itemsMd]);
  const returnLg = itemsLg ? itemsLg : getLargestNumber([itemsSm, itemsMd, itemsLg]);
  const returnXl = itemsXl ? itemsXl : getLargestNumber([itemsSm, itemsMd, itemsLg, itemsXl]);
  const returnXxl = itemsXxl ? itemsXxl : getLargestNumber([itemsSm, itemsMd, itemsLg, itemsXl, itemsXxl]);

  return {
    0: { items: returnBase, itemsFit:"contain" },
    576: { items: returnSmall, itemsFit:"contain" },  // sm
    768: { items: returnMd, itemsFit:"contain" },  // md
    992: { items: returnLg, itemsFit:"contain" },  // lg
    1200: { items: returnXl, itemsFit:"contain" }, // xl
    1400: { items: returnXxl, itemsFit:"contain" }, // xxl
  };
}

/**
 *
 * @param {string} buttonText - button text
 * @param {string} color - action box color
 * @param {string} borderColor - action box border color
 * @param {Image} icon - action box icon
 * @param {Function} onClick - onClick function
 */
export class HoverActionBox extends Component {

  static colors = {
    blue: "#56CCF2",
    purple: "#9B51E0",
    green: "#63C34E",
    yellow: "#EBB512",
  }

  state = {
    hover: false,
  }

  iconSize = this.props.iconSize ? this.props.iconSize : 48;

  /**
   * Title for HoverActionBox
   * @param {string} text - title text
   * @param {string} color - divider and text color
   * @returns
   */
  static Title({text, color}) {

    const titleColor = color ? color : "white";

    return [
      <Text b size="$lg" key={1}>
        {text}
      </Text>,
      <Divider style={{backgroundColor: titleColor}} key={2} />
    ]
  }

  static Body(bodyProps) {
    return <div className="py-2">{bodyProps.children}</div>
  }

  styledIcon = React.cloneElement(this.props.icon, {
    className: "hover-action-box-icon",
    style: {fontSize: this.iconSize}
  })

  render() {
    return (
      <Card
        isPressable={this.props.onClick}
        onClick={this.props.onClick}
        className={`d-flex flex-column p-2 align-items-center align-items-${this.props.leftIn}-start gap-2 justify-content-start hover-action-box ${this.props.hidden ? "hidden" : ""}`}
        css={{
          height: "100%"
        }}
        style={{
          borderRadius: "1rem",
          "--background": this.props.background,
          "--accentColor": this.props.accentColor,
          "--mainColor": this.props.color,
          "--mainColorAlpha": this.props.color + "66",
          "--stackIndex": this.props.stackIndex,
          cursor: this.props.onClick ? "pointer" : null,
        }}
      >
        <div
          className="d-flex flex-row align-items-center justify-content-center hover-action-box-icon-container"
          style={{
            boxSizing: "border-box",
            borderRadius: "1rem",
            backgroundColor: this.props.color,
          }}
        >
          {this.styledIcon}
        </div>
        <div className="hover-action-box-items">
          {this.props.children}
        </div>
        {this.props.buttonText &&
          <NextUIButton className="hover-action-box-button" onClick={this.props.onClick} bordered style={{minHeight: 40, borderColor: this.props.accentColor, color: this.props.accentColor, width: "100%"}}>
            {this.props.buttonText}
            <ChevronRightIcon />
          </NextUIButton>
        }
      </Card>
    )
  }
}

/**
 * A pre-made WLTestimonial card
 * @param {string} color - testimonial color
 * @param {ModalEditButton} editButton - modal edit button
 * @param {WLTestimonial} wlTestimonial - WLTestimonial object
 * @param {string} outlineWeight - weight of glyph outline
 * @returns
 */
export function TestimonialCard({testimonial, editButton, glyphColor, accentColor, outlineWeight}) {
  return (
    <div className="gap-2 d-flex flex-column align-items-center justify-content-center" style={{minHeight: 300, height: '100%', userSelect: "none"}}>
      {editButton}
      <QuoteBlock color={glyphColor} outlineColor={accentColor} outlineWeight={outlineWeight}>
        <QuoteBlock.Text>{testimonial.message}</QuoteBlock.Text>
        <QuoteBlock.Author name={testimonial.author} />
      </QuoteBlock>
    </div>
  )
}

/**
 * @deprecated This doesn't work at all
 */
export function WLResponsiveCarousel(props) {
  return (
    <Carousel>
      {props.children}
    </Carousel>
  )
}

/**
 * A ReactSlick slider with custom arrows
 * @param {React.Element} nextArrow - custom next arrow
 * @param {React.Element} prevArrow - custom previous arrow
 * @param {boolean} autoPlay - whether to autoplay carousel
 * @param {number} autoPlaySpeed - speed (in ms) of autoplay
 * @returns
 */
export function WLSlick(props) {

  const buttonStyles = {
    "--buttonColor": props.buttonColor ? props.buttonColor : "white",
    "--buttonSize": props.buttonSize ? props.buttonSize : "2rem",
  }

  function NextArrow(arrowProps) {
    const { className, style, onClick } = arrowProps;
    return (
      <div
      className={className + " custom-slick-button"}
        style={{ ...style,
          ...buttonStyles
        }}
        onClick={onClick}
      >
        <ArrowForwardIosIcon style={{color: props.buttonColor ? props.buttonColor : "white"}}/>
      </div>
    );
  }

  function PrevArrow(arrowProps) {
    const { className, style, onClick } = arrowProps;

    return (
      <div
        className={className + " custom-slick-button"}
        style={{
          ...style,
          ...buttonStyles
        }}
        onClick={onClick}
      >
        <ArrowBackIosIcon style={{color: props.buttonColor ? props.buttonColor : "white"}}/>
      </div>
    );
  }

  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    nextArrow: <NextArrow />,
    prevArrow: <PrevArrow />,
    autoplay: props.autoPlay,
    autoplaySpeed: props.autoPlaySpeed ? props.autoPlaySpeed : 5000,
  };

  return (
    <div className="container" data-testid="react-slick-container">
      <Slider {...settings} >
        {props.children}
      </Slider>
    </div>
  )
}

export function WLFlickity(props) {

  const flickityOptions = {
    initialIndex: 2
  }

  return (
    <Flickity
      className={'carousel'} // default ''
      elementType={'div'} // default 'div'
      options={flickityOptions} // takes flickity options {}
      disableImagesLoaded={false} // default false
      reloadOnUpdate // default false
      static // default false
    >
      {props.children}
    </Flickity>
  )
}

import { Component } from "react";
import "../assets/style/backgrounds.css";

/**
 * A background container class
 * @param {number} fadeIn - % stop for fade in
 * @param {number} fadeOut - % stop for fade out
 * @param {string} mask - mask-image for flipping out unwanted parts
 * @param {number} scaleX - X scale
 * @param {number} scaleY - Y scale
 * @param {boolean} flipX - wheter to flip horizontal
 * @param {boolean} flipY - wheter to flip vertical
 * @param {number} opacity - background opacity
 * @default
 * fadeIn = 10;
 * fadeOut = 80;
 * mask = "linear-gradient(to bottom, transparent 0%, black 10%, black 80%, transparent 100%)";
 * scaleX = 1;
 * scaleY = 1;
 * flipX = false;
 * flipY = false;
 * opacity = 0.6;
 */
export class WLBackground extends Component {
  /** Where to place background SVG */
  placementClass = this.props.placement ? this.props.placement : "left"
  /** Background SVG color */
  color = this.props.color
  /** Height of fade-out */
  fadePosition = this.props.fadePosition ? this.props.fadePosition : "100%";

  /** SVG to be set by child classes */
  svg;

  /** % stop for fade in */
  fadeIn = this.props.fadeIn ? this.props.fadeIn : 10;
  /** % stop for fade out */
  fadeOut = this.props.fadeOut ? this.props.fadeOut : 80;
  /** mask-image for clipping out unwanted parts of this background */
  mask = this.props.mask ? this.props.mask : `linear-gradient(to bottom, transparent 0%, black ${this.fadeIn}%, black ${this.fadeOut}%, transparent 100%)`;
  /** Background X Scale */
  scaleX = this.props.scaleX ? this.props.scaleX : 1;
  /** Background Y scale */
  scaleY = this.props.scaleY ? this.props.scaleY : 1;
  /** How do we present this background? */
  transform = `${this.props.flipX ? `scaleX(${-1 * this.scaleX}) ` : ""}${this.props.flipY ? `scaleY(${-1 * this.scaleY}) ` : ""}`
  /** Background opacity */
  opacity = this.props.opacity ? this.props.opacity : .6

  render() {
    return (
      <div
        className="w-100"
        style={{
          position: "absolute",
          height: this.props.sectionHeight,
          "--mask": this.mask,
          "--opacity": this.opacity,
          transform: this.transform,
        }}
      >
        {this.svg}
        {this.props.cap}
      </div>
    )
  }
}

/**
 * @deprecated Don't use this! Just add a background on your own.
 */
export class RockCandyBackground1 extends WLBackground {
  svg = (
    <svg className={`wl-background`} xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <g xmlns="http://www.w3.org/2000/svg" transform="matrix(0 1 -1 0 500 0)">
        <g mask="url(&quot;#SvgjsMask1095&quot;)" fill="none">
          <path d="M61 500L561 0L873 0L373 500z" fill="url(&quot;#SvgjsLinearGradient1096&quot;)"></path>
          <path d="M357.8 500L857.8 0L1312.3 0L812.3 500z" fill="url(&quot;#SvgjsLinearGradient1096&quot;)"></path>
          <path d="M651.6 500L1151.6 0L1427.6 0L927.6 500z" fill="url(&quot;#SvgjsLinearGradient1096&quot;)"></path>
          <path d="M1413 500L913 0L437.5 0L937.5 500z" fill="url(&quot;#SvgjsLinearGradient1097&quot;)"></path>
          <path d="M1060.2 500L560.2 0L344.20000000000005 0L844.2 500z" fill="url(&quot;#SvgjsLinearGradient1097&quot;)"></path>
          <path d="M754.4 500L254.39999999999998 0L188.39999999999998 0L688.4 500z" fill="url(&quot;#SvgjsLinearGradient1097&quot;)"></path>
          <path d="M1042.4194561002657 500L1440 102.41945610026568L1440 500z" fill="url(&quot;#SvgjsLinearGradient1096&quot;)"></path>
          <path d="M0 500L397.5805438997343 500L 0 102.41945610026568z" fill="url(&quot;#SvgjsLinearGradient1097&quot;)"></path>
        </g>
        <defs>
          <mask id="SvgjsMask1095">
            <rect width="1440" height="500" fill="#ffffff"></rect>
          </mask>
          <linearGradient x1="0%" y1="100%" x2="100%" y2="0%" id="SvgjsLinearGradient1096">
            <stop stopColor={this.color} offset="0"></stop>
            <stop stopOpacity="0" stopColor={this.color} offset="0.66"></stop>
          </linearGradient>
          <linearGradient x1="100%" y1="100%" x2="0%" y2="0%" id="SvgjsLinearGradient1097">
            <stop stopColor={this.color} offset="0"></stop>
            <stop stopOpacity="0" stopColor={this.color} offset="0.66"></stop>
          </linearGradient>
        </defs>
      </g>
    </svg>
  )
}

/**
 * A breathing circle background
 * @param {string} color - circle color
 * @param {number} size - max size for circle
 * @param {string} trasnparency - circle transparency (as hex)
 * @default
 * color = "rgba(121, 40, 202, 0.2)";
 * transparency = "05";
 * @returns
 */
export function GrowingCircles({color, size, transparency}) {

  const circleTransparency = transparency ? transparency : "05";
  const circleColor = color ? color + "22" : "rgba(121, 40, 202, 0.2)"
  const circleGradient = `linear-gradient(-180deg, ${color + circleTransparency} 40%, transparent 100%)`

  return (
    <div className="growing-circle-container" style={{height: size, width: size}}>
      <div className="growing-circle growing-circle-static" style={{height: size, width: size, borderColor: circleColor, backgroundImage: circleGradient}} />
      <div className="growing-circle growing-circle-1" style={{height: size, width: size, borderColor: circleColor, backgroundImage: circleGradient}}/>
      <div className="growing-circle growing-circle-2" style={{height: size, width: size, borderColor: circleColor, backgroundImage: circleGradient}}/>
      <div className="growing-circle growing-circle-3" style={{height: size, width: size, borderColor: circleColor, backgroundImage: circleGradient}}/>
    </div>
  )
}

/**
 * @deprecated this isn't working as intended
 */
export class TornadoBackground1 extends WLBackground {
  svg = (
    <svg className={`wl-background`} xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <rect fill={this.color} width='2000' height='1500'/>
      <defs>
        <radialGradient id='a' gradientUnits='objectBoundingBox'>
          <stop  offset='0' stopColor='transparent'/>
          <stop  offset='1' stopColor={this.color}/>
        </radialGradient>
        <linearGradient id='b' gradientUnits='userSpaceOnUse' x1='0' y1='750' x2='1550' y2='750'>
          <stop  offset='0' stopColor='#111316'/><stop  offset='1' stopColor={this.color}/>
        </linearGradient>
        <path id='s' fill='url(#b)' d='M1549.2 51.6c-5.4 99.1-20.2 197.6-44.2 293.6c-24.1 96-57.4 189.4-99.3 278.6c-41.9 89.2-92.4 174.1-150.3 253.3c-58 79.2-123.4 152.6-195.1 219c-71.7 66.4-149.6 125.8-232.2 177.2c-82.7 51.4-170.1 94.7-260.7 129.1c-90.6 34.4-184.4 60-279.5 76.3C192.6 1495 96.1 1502 0 1500c96.1-2.1 191.8-13.3 285.4-33.6c93.6-20.2 185-49.5 272.5-87.2c87.6-37.7 171.3-83.8 249.6-137.3c78.4-53.5 151.5-114.5 217.9-181.7c66.5-67.2 126.4-140.7 178.6-218.9c52.3-78.3 96.9-161.4 133-247.9c36.1-86.5 63.8-176.2 82.6-267.6c18.8-91.4 28.6-184.4 29.6-277.4c0.3-27.6 23.2-48.7 50.8-48.4s49.5 21.8 49.2 49.5c0 0.7 0 1.3-0.1 2L1549.2 51.6z'/>
        <g id='g'>
          <use href='#s' transform='scale(0.12) rotate(60)'/>
          <use href='#s' transform='scale(0.2) rotate(10)'/>
          <use href='#s' transform='scale(0.25) rotate(40)'/>
          <use href='#s' transform='scale(0.3) rotate(-20)'/>
          <use href='#s' transform='scale(0.4) rotate(-30)'/>
          <use href='#s' transform='scale(0.5) rotate(20)'/>
          <use href='#s' transform='scale(0.6) rotate(60)'/>
          <use href='#s' transform='scale(0.7) rotate(10)'/>
          <use href='#s' transform='scale(0.835) rotate(-40)'/>
          <use href='#s' transform='scale(0.9) rotate(40)'/>
          <use href='#s' transform='scale(1.05) rotate(25)'/>
          <use href='#s' transform='scale(1.2) rotate(8)'/>
          <use href='#s' transform='scale(1.333) rotate(-60)'/>
          <use href='#s' transform='scale(1.45) rotate(-30)'/>
          <use href='#s' transform='scale(1.6) rotate(10)'/>
        </g>
      </defs>
      <g transform=''>
        <g transform='translate(0 840)'>
          <circle fill='url(#a)' r='3000'/>
          <g opacity='0.5'>
            <circle fill='url(#a)' r='2000'/>
            <circle fill='url(#a)' r='1800'/>
            <circle fill='url(#a)' r='1700'/>
            <circle fill='url(#a)' r='1651'/>
            <circle fill='url(#a)' r='1450'/>
            <circle fill='url(#a)' r='1250'/>
            <circle fill='url(#a)' r='1175'/>
            <circle fill='url(#a)' r='900'/>
            <circle fill='url(#a)' r='750'/>
            <circle fill='url(#a)' r='500'/>
            <circle fill='url(#a)' r='380'/>
            <circle fill='url(#a)' r='250'/>
          </g>
          <g transform='rotate(-154.8 0 0)'>
            <use href='#g' transform='rotate(10)'/>
            <use href='#g' transform='rotate(120)'/>
            <use href='#g' transform='rotate(240)'/>
          </g>
          <circle fillOpacity='0.36' fill='url(#a)' r='3000'/>
        </g>
      </g>
    </svg>
  )
}

import recordCenter from "../../assets/images/homepage/records/recordCenter.png"
import recordGlare from "../../assets/images/homepage/records/glare.png"

import recordGold from "../../assets/images/homepage/records/recordGold.png"
import recordGreen from "../../assets/images/homepage/records/recordGreen.png"
import recordHotPink from "../../assets/images/homepage/records/recordHotPink.png"
import recordIceBlue from "../../assets/images/homepage/records/recordIceBlue.png"
import recordPurple from "../../assets/images/homepage/records/recordPurple.png"
import recordRed from "../../assets/images/homepage/records/recordRed.png"
import recordSteel from "../../assets/images/homepage/records/recordSteel.png"
import recordIceGreen from "../../assets/images/homepage/records/recordIceGreen.png"
import recordLava from "../../assets/images/homepage/records/recordLava.png"
import recordGray from "../../assets/images/homepage/records/recordGray.png"
import { useEffect, useRef, useState } from "react"

import '@mantine/carousel/styles.css';
import { Carousel } from '@mantine/carousel';

import { IconPlayerPause, IconPlayerPauseFilled, IconPlayerPlay, IconPlayerPlayFilled, IconPlayerTrackNext, IconPlayerTrackNextFilled, IconPlayerTrackPrevFilled } from "@tabler/icons-react"

import brownEyedGirl from "../../assets/audio/brownEyedGirl.mp3"
import driftAway from "../../assets/audio/driftAway.mp3"
import sweetCaroline from "../../assets/audio/sweetCaroline.mp3"
import september from "../../assets/audio/september.mp3"
import layDownSally from "../../assets/audio/layDownSally.mp3"
import myGirl from "../../assets/audio/myGirl.mp3"
import summerOf69 from "../../assets/audio/summerOf69.mp3"
import haveIToldYouLately from "../../assets/audio/haveIToldYouLately.mp3"
import MustangSally from "../../assets/audio/mustangSally.mp3"
import AllRightNow from "../../assets/audio/allRightNow.mp3"
import { Text } from "@mantine/core"
import { WLTextV2 } from "../../libraries/Web-Legos/components/Text"
import { useZoomDetector } from '../../hooks/useZoomDetector';

export const RecordColor = {
  Gold: "gold",
  Green: "green",
  HotPink: "hot-pink",
  IceBlue: "ice-blue",
  Purple: "purple",
  Red: "red",
  Steel: "steel",
  IceGreen: "ice-green",
  Lava: "lava",
  Gray: "gray",
};

const tracks = [
  { 
    color: RecordColor.Gold,
    number: 0,
    audioHref: brownEyedGirl,
    title: "Brown Eyed Girl",
  },
  {
    color: RecordColor.Green,
    number: 1,
    audioHref: driftAway,
    title: "Drift Away",
  },
  {
    color: RecordColor.HotPink,
    number: 2,
    audioHref: sweetCaroline,
    title: "Sweet Caroline",
  },
  {
    color: RecordColor.IceBlue,
    number: 3,
    audioHref: september,
    title: "September",
  },
  {
    color: RecordColor.Purple,
    number: 4,
    audioHref: layDownSally,
    title: "Lay Down Sally",
  },
  {
    color: RecordColor.Red,
    number: 5,
    audioHref: myGirl,
    title: "My Girl",
  },
  {
    color: RecordColor.Steel,
    number: 6,
    audioHref: summerOf69,
    title: "Summer of '69",
  },
  {
    color: RecordColor.IceGreen,
    number: 7,
    audioHref: haveIToldYouLately,
    title: "Have I Told You Lately",
  },
  {
    color: RecordColor.Lava,
    number: 8,
    audioHref: MustangSally,
    title: "Mustang Sally",
  },
  {
    color: RecordColor.Gray,
    number: 9,
    audioHref: AllRightNow,
    title: "All Right Now",
  }
]

export const RecordTray = ({userCanEditText}) => {

  const [audios, setAudios] = useState({});

  const [mousePosition, setMousePosition] = useState({x: 0, y: 0});

  const [activeRecord, setActiveRecord] = useState(0);

  const carouselRef = useRef();

  const [embla, setEmbla] = useState(null);

  const [clicked, setClicked] = useState(null);

  const zoom = useZoomDetector();

  const [zoomLevel, setZoomLevel] = useState(1);

  useEffect(() => {
    setZoomLevel(zoom);
  }, [zoom]);

  useEffect(() => {
    if (!audios[activeRecord]) {
      const audio = new Audio(tracks[activeRecord].audioHref);
      audio.loop = true;
      audio.volume = 0.3;
      const newAudios = {...audios, [activeRecord]: audio};
      setAudios(newAudios);
    }
  }, [activeRecord, audios, setAudios]);

  const handleMouseMove = (e) => {
    const x = e.clientX - window.innerWidth / 2;
    const y = e.clientY - window.innerHeight / 2;
    setMousePosition({x, y});
  }

  const [playing, setPlaying] = useState({});

  useEffect(() => {
    for (let trackNum = 0; trackNum < tracks.length; trackNum++) {
      const audio = audios[trackNum];
      if (!audio) { continue; }
      if (trackNum === activeRecord && playing[activeRecord]) {
        audio.play();
      } else {
        audio.pause();
      }
    }

  }, [playing, activeRecord, audios])

  const adjustedSlideSize = `${20 / zoomLevel}%`;

  return (
    <div className="record-tray w-100" onMouseMove={handleMouseMove}>
      
      <Carousel
        key={zoomLevel}
        className="record-carousel w-100"
        getEmblaApi={setEmbla}
        ref={carouselRef}
        slideSize={adjustedSlideSize}
        loop
        onSlideChange={num => setActiveRecord(num)}
      >
        {tracks.map((track, index) => (
          <Carousel.Slide key={index} className="record-slide" onMouseMove={handleMouseMove}>
            <Record
              track={track}
              setMousePosition={setMousePosition} 
              embla={embla} 
              number={0} 
              activeRecord={activeRecord} 
              mousePosition={mousePosition} 
              setActiveRecord={setActiveRecord}
              playing={playing}
              setPlaying={setPlaying}
              numRecords={tracks.length}
              pulse={!clicked}
              stopPulse={() => setClicked(true)}
            />
          </Carousel.Slide>
        ))}
      </Carousel>
    </div>
  )

}

export const Record = ({track, embla, activeRecord, mousePosition, setMousePosition, setActiveRecord, playing, setPlaying, numRecords, pulse, stopPulse}) => {

  function getSrc() {
    switch(track.color) {
      case RecordColor.Gold:
        return recordGold;
      case RecordColor.Green:
        return recordGreen;
      case RecordColor.HotPink:
        return recordHotPink;
      case RecordColor.IceBlue:
        return recordIceBlue;
      case RecordColor.Purple:
        return recordPurple;
      case RecordColor.Red:
        return recordRed;
      case RecordColor.Steel:
        return recordSteel;
      case RecordColor.IceGreen:
        return recordIceGreen;
      case RecordColor.Lava:
        return recordLava;
      case RecordColor.Gray:
        return recordGray;
      default:
        return recordGold;
    }
  }

  const glareRotation = Math.atan2(mousePosition.y, mousePosition.x) * 180 / Math.PI + 90;

  const handleMouseMove = (e) => {
    const x = e.clientX - window.innerWidth / 2;
    const y = e.clientY - window.innerHeight / 2;
    setMousePosition({x, y});
  }

  const handleNext = () => {
    embla?.scrollNext();
    const isLast = track.number === numRecords - 1;
    setActiveRecord(isLast ? 0 : track.number + 1);
  }
  
  const handleLast = () => {
    embla?.scrollPrev();
    const isFirst = track.number === 0;
    setActiveRecord(isFirst ? numRecords - 1 : track.number - 1);
  }

  const recordRef = useRef()
  const recordCenterRef = useRef()

  const handlePlay = () => {
    const newPlaying = {...playing};
    newPlaying[track.number] = true;
    setPlaying(newPlaying);
    recordRef.current.style.animationPlayState = "running";
    recordCenterRef.current.style.animationPlayState = "running";
    if (pulse) { stopPulse() }
  }
  
  const handlePause = () => {
    const newPlaying = {...playing};
    newPlaying[track.number] = false;
    setPlaying(newPlaying);
    recordRef.current.style.animationPlayState = "paused";
    recordCenterRef.current.style.animationPlayState = "paused";
  }

  return (
    <div
      className={"record " + (activeRecord === track.number ? "active " : "") + (playing[track.number] ? "playing " : "")} 
      // onClick={handleClick}
      onMouseMove={handleMouseMove}
    >
      <img ref={recordRef} src={getSrc()} alt={"record-" + track.color} className="spin record-image" />
      <img ref={recordCenterRef} src={recordCenter} alt={"record-center-" + track.color} className="spin record-center" />
      <img src={recordGlare} alt={"record-glare-" + track.color} className="record-glare" style={{ transform: `rotate(${glareRotation}deg)` }} />
      <div className="record-controls gap-2">      
        <IconPlayerTrackPrevFilled onClick={handleLast} className="record-control-button" />
        {!playing[track.number] && <IconPlayerPlayFilled onClick={handlePlay} className={"record-control-button" + (pulse ? " pulse" : "")} />}
        {playing[track.number] && <IconPlayerPauseFilled onClick={handlePause} className="record-control-button" />}
        <IconPlayerTrackNextFilled onClick={handleNext} className="record-control-button" />
      </div>
      <Text className="record-title richard-regular">{track.title}</Text>
    </div>
  )
}
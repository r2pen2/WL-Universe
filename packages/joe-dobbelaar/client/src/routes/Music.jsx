import React, { useEffect, useRef, useState } from 'react'
import {Button, Divider, Modal, Text} from "@nextui-org/react"

import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import FavoriteIcon from '@mui/icons-material/Favorite';
import HourglassEmptyOutlinedIcon from '@mui/icons-material/HourglassEmptyOutlined';
import QuestionMarkIcon from '@mui/icons-material/QuestionMark';

import albumArt from "../assets/images/jd.svg"

import "../assets/style/music.css"
import { IconButton, Tooltip } from '@mui/material';

import {albums, songs, demoSongs, oldSongs} from "../api/data/songs"

const mins = 10;
const secs = 30;

const songOrderWidth = 20;

export default function Music() {

  const [currentAlbum, setCurrentAlbum] = useState(null)
  
  const [videoPlayerOpen, setViewPlayerOpen] = useState(false)

  const [tab, setTab] = useState("album")

  const [sidebarWidth, setSidebarWidth] = useState(300);

  const [mouseDown, setMouseDown] = useState(false);

  const handleRightResizeMouseDown = (event) => {
    setMouseDown(true);
    event.preventDefault();
  };

  const handleMouseUp = (_event) => {
    setMouseDown(false);
  };

  const handleMouseMove = (event) => {
    if (mouseDown) {
      let newWidth = 0;
      if (event.pageX < 70) {
        newWidth = 70;
      } else {
        newWidth = event.pageX < 400 ? event.pageX : 400;
      }
      setSidebarWidth(newWidth);
    }
  };

  function SongItem({song}) {

    function getSongIcon() {
      if (!song.link) {return; }
      const iconStyle = {color: "#1ED760", marginRight: "0.5rem"};
      if (song.demo) {
        return <Tooltip title="This hasn't been published yet."><QuestionMarkIcon style={iconStyle} /></Tooltip>;
      }
      if (song.old) {
        return <Tooltip title="I plan on re-recording this."><HourglassEmptyOutlinedIcon style={iconStyle} /></Tooltip>;
      }
      return <FavoriteIcon fontSize='small' style={iconStyle} />;
    }

    return (
      <div className={`song-item d-flex flex-row align-items-center justify-content-between px-5 py-1 ${(!currentAlbum || (currentAlbum && song.link)) ? "playable" : "unplayable"}`} style={{width: "90%", maxWidth:"90%"}} onClick={() => {if (!song.link) {return;} window.open(song.link, "_blank")}}>
        <div className="d-flex flex-row" style={{gap: "1rem"}}>
          <div className="song-order-container">
            <Text color="#a7a7a7" className={"m-0 song-order"} style={{width: songOrderWidth}}>{song.order}</Text>
            <PlayArrowIcon style={{color: "#ffffff"}} className="play-icon" />
          </div>
          <div className="song-text-container">
            <Text color="white" className="m-0">{song.title}</Text>
            <a href={currentAlbum ? currentAlbum.artistHref : song.artistHref} target="_blank" rel="noreferrer">
              <Text color="#a7a7a7" className="m-0">{currentAlbum ? currentAlbum.artist : song.artist}</Text>
            </a>
          </div>
        </div>
        <div className="d-flex flex-row align-items-center text-right" style={{gap: "2rem"}}>
          <Text color="#a7a7a7" style={{margin: 0}}>{song.releaseDate}</Text>
          {getSongIcon()}
          <div className="song-duration-container">        
            <Text color="#a7a7a7">{song.duration}</Text>
          </div>
        </div>
      </div>
    )
  }
  
  const [tipModalOpen, setTipModalOpen] = useState(true);

  function AlbumSelection({album}) {
    return (
      <div className="d-flex flex-row align-items-center album-selection" onClick={() => {setCurrentAlbum(album)}}>
        <img src={album.albumCover} alt="album-cover" />
        <div className="text-left">
          <Text className={`album-selection-title ${currentAlbum ? (currentAlbum.title === album.title ? "selected" : "") : ""}`}>{album.title}</Text>
          <Text color="#a7a7a7">Album • {album.artist}</Text>
        </div>
      </div>
    )
  }

  function getTimeDisplay() {
    if (currentAlbum) {
      if (currentAlbum.hours) {
        return `${currentAlbum.songs.length} songs, ${currentAlbum.hours} hr ${currentAlbum.mins} min`
      }
      return `${currentAlbum.songs.length} songs, ${currentAlbum ? currentAlbum.mins : mins} min ${currentAlbum ? currentAlbum.secs : secs} sec`
    }
    return `${currentAlbum ? currentAlbum.songs.length : songs.length + oldSongs.length} songs, ${currentAlbum ? currentAlbum.mins : mins} min ${currentAlbum ? currentAlbum.secs : secs} sec`
  }
  
  function OldCoversDivider() {
    if (currentAlbum) { return; }
    return (
      <div className="d-flex flex-row align-items-center justify-content-start px-5 py-3" style={{width:"90%"}}>
        <HourglassEmptyOutlinedIcon style={{color: "#a7a7a7", marginRight: "0.5rem"}} />
        <Text color="#a7a7a7" b className="m-0">Awaiting Re-Make</Text>
      </div>
    )
  }
  
  function DemoCoversDivider() {
    if (currentAlbum) { return; }
    return (
      <div className="d-flex flex-row align-items-center justify-content-start px-5 py-3" style={{width:"90%"}}>
        <QuestionMarkIcon style={{color: "#a7a7a7", marginRight: "0.5rem"}} />
        <Text color="#a7a7a7" b className="m-0">Demos</Text>
      </div>
    )
  }

  return (
    <div className="spotify-container" onMouseUp={handleMouseUp} onMouseMove={handleMouseMove} style={{
      "--album-theme-color": currentAlbum ? currentAlbum.themeColor : "#ee4747"
    }}>
      <Modal open={tipModalOpen} onClose={() => setTipModalOpen(false)} closeButton>
        <Modal.Header>
          <Text h1>Hey, there!</Text>
        </Modal.Header>
        <Modal.Body>
          <Text>
            I've been covering metal songs for a couple years now, and this page serves as a trampoline to my Youtube videos. Soon I intend to embed the player into this page. Hope you enjoy :)
          </Text>
        </Modal.Body>
        <Modal.Footer className="d-flex flex-row justify-content-center">
          <Button flat color="success" onClick={() => setTipModalOpen(false)}>Okay, cool. Now yell at me!</Button>
        </Modal.Footer>
      </Modal>
      <div className="d-flex flex-column align-items-center justify-content-center spotify-sidebar" style={{ width: sidebarWidth }}>
        <div className="right-resizer" onMouseDown={handleRightResizeMouseDown} />
        <div className="tab-selector spotify-bg-light w-100 p-relative">
          <div className="tab-item" onClick={() => setCurrentAlbum(null)}>
            <HomeOutlinedIcon />
            <Text>Home</Text>
          </div>
          <div className="tab-item">
            <SearchOutlinedIcon />
            <Text>Search</Text>
          </div>
        </div>
        <div className="recents-selector spotify-bg-light w-100">
          <div className="d-flex flex-row align-items-center album-selection" onClick={() => {setCurrentAlbum(null)}}>
            <img src={albumArt} alt="album-cover" style={{backgroundColor: "black"}} />
            <div className="text-left">
              <Text className={`album-selection-title ${!currentAlbum ? "selected" : ""}`}>Joe Dobbelaar</Text>
              <Text color="#a7a7a7">Artist • Joe Dobbelaar</Text>
            </div>
          </div>
          {albums.map((a, i) => <AlbumSelection key={i} album={a} />)}
        </div>
      </div>
      <div className="album-container">
        <IconButton className="p-2" style={{zIndex: 2, position: 'absolute', top: "1.25rem", left: "1.25rem", backgroundColor: "#000000aa"}} onClick={() => window.location = "/"}>
          <ArrowBackIosNewIcon className="d-flex flex-column align-items-center justify-content-center" style={{color: "white"}} />
        </IconButton>
        <div className="album">
          <div className="album-header">
            <img src={currentAlbum ? currentAlbum.albumCover : albumArt} alt="album-art" />
            <div className="album-text">
              <Text color="white">{currentAlbum ? "Album" : "Artist"}</Text>
              <Text h1 color="white">{currentAlbum ? currentAlbum.title : "Joe Dobbelaar"}</Text>
              <span>
                <img src={currentAlbum ? currentAlbum.albumCover : albumArt} alt="Joe Dobbelaar" />
                <a href={currentAlbum ? currentAlbum.artistHref : "http://www.youtube.com/r2pen2/"} target="_blank" rel="noreferrer">
                  <Text b color="white">{currentAlbum ? currentAlbum.artist : "Joe Dobbelaar"}</Text>
                </a>
                <Text className="dot" color="white">{currentAlbum ? currentAlbum.year : 2001}</Text>
                <Text className="dot" color="white">{getTimeDisplay()}</Text>
              </span>
            </div>
          </div>
          <div className="album-content">
            <div className="album-controls">
              <IconButton className="p-2 play-button" style={{backgroundColor: "#1ed760"}}>
                <PlayArrowIcon style={{color: "black"}} fontSize='large' />
              </IconButton>
            </div>
            <div className="content-header px-5">
              <div className="song-order-container">                
                <div style={{width: songOrderWidth}}><Text color="#a7a7a7" size="$lg">#</Text></div>
              </div>
              <div className="text-left w-100"><Text color="#a7a7a7">Title</Text></div>
              <div className="d-flex flex-row align-items-center justify-content-end w-100" style={{gap:"2rem"}}>              
                <Text color="#a7a7a7">Release Date</Text>
                <FavoriteIcon fontSize='small' style={{color: "transparent"}} />
                <AccessTimeOutlinedIcon style={{color: "#a7a7a7"}} />
              </div>
            </div>
            <Divider style={{backgroundColor: "#a7a7a733", width: "90%"}} height={1} />
            { !currentAlbum && songs.map((s, i) => <SongItem key={i} song={s}/>) }
            { currentAlbum && currentAlbum.songs.map((s, i) => <SongItem key={i} song={s}/>) }
            <DemoCoversDivider />
            { !currentAlbum && demoSongs.map((s, i) => <SongItem key={i} song={s}/>) }
            <OldCoversDivider />
            { !currentAlbum && oldSongs.map((s, i) => <SongItem key={i} song={s}/>) }
          </div>
        </div>
      </div>
    </div>
  )
}

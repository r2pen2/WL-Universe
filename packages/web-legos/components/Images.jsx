// Library Imports
import AddAPhotoIcon from '@mui/icons-material/AddAPhoto';
import { Card, Loading, Text } from "@nextui-org/react";
import { getFileNameByCurrentTime, openFileBrowser } from '../api/files';
import { useEffect, useState } from 'react';
import { ImageCompressor } from '../api/images';

// Style imports
import "../assets/style/images.css";
import { getHostname } from '../api/development.ts';

const developmentHostname = getHostname();

/**
 * A card component that prompts a user to upload an image
 * @param {Function} params.onClick - function to call when the user clicks the card
 * @param {number} params.size - size of the card
 * @default
 * const size = 300;
 */
export function UploadImageCard({onClick, size, fullSize}) {

  /** Adjusted card size to match parameters */
  const cardSize = size ? size : 300;
  /** Adjusted icon size to match parameters */
  const iconSize = size ? size / 4.5 : 64;

  return (
    <Card variant='bordered' isPressable isHoverable onClick={onClick} css={{height: cardSize, width: fullSize ? "100%" : cardSize,}}>
      <Card.Body className="d-flex flex-column align-items-center justify-content-center gap-2">
        <Text b>
          Click to upload an image
        </Text>
        <AddAPhotoIcon sx={{fontSize: iconSize}}/>
      </Card.Body>
    </Card>
  )
}

/**
 *
 * @param {string} firestoreId
 * @param {boolean} editable
 * @param {Object} imgCss - css to apply on image
 * @param {string} imgClasses - classes to apply on image
 * @returns
 */
export function WLImage(props) {

  const [compressing, setCompressing] = useState(false);

  function uploadImage() {
    openFileBrowser().then(async (img) => {
      if (img) {
        const fileName = getFileNameByCurrentTime(img);
        setCompressing(true);
        const WLImageCompressor = new ImageCompressor(1, 1920)
        const compressedImage = await WLImageCompressor.compressImage(img);
        setCompressing(false);
        const formData = new FormData();
        formData.append("file", compressedImage);
        formData.append("firestoreId", props.firestoreId);
        formData.append("fileName", fileName);
        formData.append("oldFileName", imageFileName);


        fetch(`${developmentHostname}/site-images`, {
          method: "POST",
          body: formData,
        }).then((response) => {
          if (response.status === 200) {
            window.location.reload();
          }
        });
      }
    });
  }

  const [imageSource, setImageSource] = useState(null);
  const [imageFileName, setImageFileName] = useState(null);

  useEffect(() => {
    fetch(`${developmentHostname}/site-images?id=${props.firestoreId}`).then((res) => {
      res.json().then(json => {
        setImageSource(json.source);
        setImageFileName(json.fileName);
      })
    })
  })

  function getCss() {
    if (props.halfWidth) {
      return {width: "100%", maxWidth: "95vw", maxHeight: "50vh", objectFit: "cover"};
    }
    return props.imgCss;
  }

  if (compressing) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center">
        <Text>Compressing...</Text>
        <Loading color="primary" />
      </div>
    )
  }

  return (
    imageSource ?
    <img
      src={imageSource}
      alt={props.firestoreId}
      className={`${props.imgClasses} img-shadow ${props.editable ? "web-legos-image-edit" : ""} ${props.shadow ? "web-legos-image-shadow" : ""} ${props.round ? "web-legos-image-round" : ""}`}
      onClick={() => {
        if (props.editable) {
          uploadImage()
        }
      }}
      style={getCss()}
    />
    :
    <Loading color="primary" />
  )
}

/**
 *
 * @param {string} firestoreId
 * @param {boolean} editable
 * @param {Object} imgCss - css to apply on image
 * @param {string} className - classes to apply on image
 * @returns
 */
export function WLImageV2(props) {

  const [compressing, setCompressing] = useState(false);

  function uploadImage() {
    openFileBrowser().then(async (img) => {
      if (img) {
        const fileName = getFileNameByCurrentTime(img);
        setCompressing(true);
        const WLImageCompressor = new ImageCompressor(1, 1920)
        const compressedImage = await WLImageCompressor.compressImage(img);
        setCompressing(false);
        const formData = new FormData();
        formData.append("file", compressedImage);
        formData.append("firestoreId", props.firestoreId);
        formData.append("fileName", fileName);
        formData.append("oldFileName", imageFileName);


        fetch(`${developmentHostname}/site-images`, {
          method: "POST",
          body: formData,
        }).then((response) => {
          if (response.status === 200) {
            window.location.reload();
          }
        });
      }
    });
  }

  const [imageSource, setImageSource] = useState(null);
  const [imageFileName, setImageFileName] = useState(null);

  useEffect(() => {
    fetch(`${developmentHostname}/site-images?id=${props.firestoreId}`).then((res) => {
      res.json().then(json => {
        setImageSource(json.source);
        setImageFileName(json.fileName);
      })
    })
  })

  function getCss() {
    if (props.halfWidth) {
      return {width: "100%", maxWidth: "95vw", maxHeight: "50vh", objectFit: "cover"};
    }
    return props.imgCss;
  }

  if (compressing) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center">
        <Text>Compressing...</Text>
        <Loading color="primary" />
      </div>
    )
  }

  return (
    imageSource ?
    <img
      src={imageSource}
      alt={props.firestoreId}
      className={`${props.className} ${props.editable ? "web-legos-image-edit" : ""} ${props.shadow ? "web-legos-image-shadow" : ""} ${props.round ? "web-legos-image-round" : ""}`}
      onClick={() => {
        if (props.editable) {
          uploadImage()
        }
      }}
      style={getCss()}
    />
    :
    <Loading color="primary" />
  )
}

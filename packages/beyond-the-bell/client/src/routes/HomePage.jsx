import React, { useContext, useEffect, useState } from 'react'

import { Button, Text, Card, Modal, Textarea, Divider } from "@nextui-org/react";

import { ImageCompressor } from "../libraries/Web-Legos/api/images";

import {Swoosh, WaveBottom, WaveTop} from "../libraries/Web-Legos/components/Waves.jsx"

import "../assets/style/homepage.css"
import { FormModal, ScheduleBar } from '../components/Forms';

import { firestore, removeImage, uploadImgToStorageAndReturnDownloadLink } from '../api/firebase';
import { addDoc, collection, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { IconButton, TextField } from '@mui/material';
import { PencilIcon } from '../components/Icons';
import { AuthenticationManagerContext, CurrentSignInContext, serverURL } from '../App';
import { BTBLoader } from '../components/Feedback';
import { UploadImageCard } from '../libraries/Web-Legos/components/Images';
import { getFileNameByCurrentTime, openFileBrowser } from '../libraries/Web-Legos/api/files';
import { WLHeader } from '../libraries/Web-Legos/components/Text';
import { WLSpinnerPage } from '../libraries/Web-Legos/components/Layout';
import { WLAliceCarousel, createCarouselBreakpoints } from "../libraries/Web-Legos/components/Content";
import { sortByOrder } from '../libraries/Web-Legos/api/models.ts';

import logoFull from "../assets/images/LogoFull.png"


export default function HomePage() {
  
  // Create states for HomePage
  const [currentTestimonial, setCurrentTestimonial] = useState({  // Default focused testimonial data
    preview: "",            // No testimonial selected, so no preview yet 
    authorDescription: "",  // No testimonial selected, so no author description yet
    image: null,            // No testimonial selected, so no image yet
    message: "",            // No testimonial selected, so no message yet
    id: "",                 // No testimonial selected, so no id yet
  });
  const [currentOffering, setCurrentOffering] = useState({        // Default focused class offering data
    description: "",        // No class offering selected, so no description yet
    image: null,            // No class offering selected, so no image yet
    schedule: "",           // No class offering selected, so no schedule yet
    title: "",              // No class offering selected, so no title yet
    order: 0,               // No class offering selected, so no order yet
  });
  const [formModalOpen, setFormModalOpen] = useState(false);                      // Whether form modal is open
  const [testimonialModalOpen, setTestimonialModalOpen] = useState(false);        // Whether focused testimonial modal is open
  const [offeringModalOpen, setOfferingModalOpen] = useState(false);              // Whether focused class offering modal is open
  const [testimonialEdit, setTestimonialEdit] = useState(false);                  // Whether current user is currently editing a testimonial
  const [offeringEdit, setOfferingEdit] = useState(false);                        // Whether current user is currently editing a class offering
  const [testimonialData, setTestimonialData] = useState([]);                   // Data for all testimonials from DB
  const [offeringData, setOfferingData] = useState([]);                           // Data for all class offerings from DB

  // User Permissions
  const {currentSignIn} = useContext(CurrentSignInContext);
  const {authenticationManager} = useContext(AuthenticationManagerContext);
  
  const [userCanEditText, setUserCanEditText] = useState(false);
  const [userCanEditOfferings, setUserCanEditOfferings] = useState(false);
  const [userCanEditTestimonials, setUserCanEditTestimonials] = useState(false);

  useEffect(() => {
    authenticationManager.getPermission(currentSignIn, "siteText").then(p => setUserCanEditText(p));
    authenticationManager.getPermission(currentSignIn, "offerings").then(p => setUserCanEditOfferings(p));
    authenticationManager.getPermission(currentSignIn, "testimonials").then(p => setUserCanEditTestimonials(p));
  }, [authenticationManager, currentSignIn]);

  /**
   * Close all modals and reload the page. This is intended for use after some edit is confirmed.
   */
  function closeModalsAndReload() {
    setTestimonialEdit(false);
    setOfferingEdit(false);
    setTestimonialModalOpen(false);
    setOfferingModalOpen(false);
    window.location.reload();
  }

  // Fetch current class offerings and testimonials after component mount
  useEffect(() => {
    // Ask server for current offerings
    fetch(`${serverURL}offerings`).then(res => {
      res.json().then(data => {
        // Get json from HTTP response and set data state
        setOfferingData(sortByOrder(data));
      })
    })
    fetch(`${serverURL}testimonials`).then(res => {
      // Ask server for current testimonials
      res.json().then(data => {
        // Get json from HTTP response and set data state
        setTestimonialData(sortByOrder(data));
      })
    })
  }, [])

  /**
   * Close the focused testimonial modal 
   */
  function closeTestimonialModal() {
    setTestimonialModalOpen(false);
    setTestimonialEdit(false);
  }
  
  /**
   * Close the focused class offering modal 
   */
  function closeOfferingModal() {
    setOfferingModalOpen(false);
    setOfferingEdit(false);
  }

  const [testimonialHeaderLoaded, setTestimonialHeaderloaded] = useState(false);
  const [offeringsHeaderLoaded, setOfferingsHeaderloaded] = useState(false);

  function SpinningLogo() {
    
    const [spinning, setSpinning] = useState(false);

    function spin() {
      setSpinning(true);
      setTimeout(() => {
        setSpinning(false);
      }, 500)
    }

    return (
      <img onClick={spin} className={spinning ? "spinning" : ""} src={logoFull} alt="logo-full" style={{maxWidth: 500, maxHeight: 500, height:"100%", width: "100%", filter: "drop-shadow(0px 0px 5px rgba(0,0,0,0.5)"}}/>
    )
  }

  return (
    <WLSpinnerPage dependencies={[testimonialHeaderLoaded, offeringsHeaderLoaded, testimonialData, offeringData]}>
      <Modal 
        closeButton
        width="80vw"
        open={testimonialModalOpen}
        blur
        onClose={closeTestimonialModal}
      >
        <TestimonialModal />
        <Modal.Footer>
          <div className="d-flex flex-row align-items-center justify-content-center w-100">
            <Button auto flat color="error" onPress={closeTestimonialModal} >
                Close
            </Button>
          </div>
        </Modal.Footer>
      </Modal>
      <Modal 
        closeButton
        width="80vw"
        open={offeringModalOpen}
        blur
        onClose={closeOfferingModal}
      >
        <OfferingModal />
        <Modal.Footer>
          <div className="d-flex flex-row align-items-center justify-content-center w-100">
            <Button auto flat color="error" onPress={closeOfferingModal} >
                Close
            </Button>
          </div>
        </Modal.Footer>
      </Modal>
      <FormModal open={formModalOpen} setOpen={setFormModalOpen} />
      <section className="home-image w-100 py-5 px-2">
        <div className="container">
        <div className="row px-2 d-flex flex-row align-items-center justify-content-center">
          <div className="col-xxl-5 col-lg-6 col-12 d-flex flex-column align-items-center justify-content-center">
            <SpinningLogo />
          </div>
          <div className="col-xxl-5 col-lg-6 col-12 py-3 flex-column align-items-center justify-content-center">
            <div className="d-flex flex-column align-items-center justify-content-center">
            <Text 
              h1
              css={{
                fontWeight: 600,
                letterSpacing: "-2px", 
                fontSize: "3rem",
                filter: "drop-shadow(2px 2px 5px black)",
                textGradient: "45deg, $yellow600 -20%, $btbOrange600 100%",
              }}
              className="d-none d-lg-inline"
            >
              Beyond The Bell Educational Services
            </Text>
            <Text 
              h2
              color="white"
              css={{
                fontSize: "24px", 
                textShadow: "0px 0px 5px black",
                maxWidth: 580,
              }}
            >
              Educational enrichment, social skills and executive functioning groups, academic tutoring, and advocacy and consulting for families and schools.
            </Text>
          <div className="d-flex flex-row align-items-center gap-5 mt-5">
            <Button
              bordered
              rounded
              color="gradient"
              size="xl"
              className="d-none d-md-inline"
              onClick={() => setFormModalOpen(true)}
            >
              Schedule
            </Button>
            <Button
              bordered
              rounded
              size="lg"
              color="gradient"
              className="d-md-none d-inline"
              onClick={() => setFormModalOpen(true)}
            >
              Schedule
            </Button>
          </div>
            </div>        
          </div>
        </div>

        </div>
      </section>
      <div className="rainbow-line" style={{filter: "drop-shadow(0px -10px 0.75rem #000000aa)"}}/>
      <section className="container-fluid d-flex flex-column align-items-center py-5" >  
        <WLHeader color="primary" editable={userCanEditText} firestoreId="class-offerings-header" setLoaded={setOfferingsHeaderloaded}/>
        <div className="d-none d-lg-flex flex-column align-items-center justify-content-center px-xxl-5 px-xl-4 px-md-3 px-2" style={{width: "100%", overflow: "visible"}}>
          <WLAliceCarousel 
            controlsStrategy="responsive"
            pagination
            paginationTop
            breakpoints={createCarouselBreakpoints(2,2,2,2,3,4)}
            items={offeringData.map((o,i)=><ClassOffering offering={o} key={i} />)}
          />
        </div>
        <div className="d-lg-none d-flex flex-column d-lg-none align-items-center w-100">
          { renderOfferingsList() }
        </div>
        { userCanEditOfferings && <AddOfferingButton /> }
      </section>
      <section className="bg-blue py-5 p-relative">
        <Swoosh color="white" flipY shadowBottom style={{marginTop: "-3.125rem"}} />
          <WLHeader editable={userCanEditText} firestoreId="testimonials-header" color="white"  setLoaded={setTestimonialHeaderloaded}/>
          <div className="container-fluid my-5" >
            <div className="d-flex flex-column align-items-center justify-content-center px-xxl-5 px-xl-4 px-md-3 px-2" style={{width: "100%", overflow: "visible"}}>
              <WLAliceCarousel 
                controlsStrategy="responsive"
                pagination
                breakpoints={createCarouselBreakpoints(1,null,null,2,null,3)}
                items={testimonialData.map((t,i)=><Testimonial testimonial={t} key={i} />)}
              />
            </div>
          </div>
        { userCanEditTestimonials && <AddTestimonialButton /> }
        {/* <Swoosh color="white" shadowTop flipX style={{marginBottom: "-3.125rem"}} /> */}
      </section>
      <ScheduleBar open={formModalOpen} setOpen={setFormModalOpen} />
    </WLSpinnerPage>
  )

  function TestimonialModal() {
    
    const [tempMessage, setTempMessage] = useState(currentTestimonial.message);
    const [tempPreview, setTempPreview] = useState(currentTestimonial.preview);
    const [tempAuthorDesc, setTempAuthorDesc] = useState(currentTestimonial.authorDescription);
    const [tempImageURL, setTempImageURL] = useState(currentTestimonial.image ? serverURL + currentTestimonial.image : null);
    const [tempOrder, setTempOrder] = useState(currentTestimonial.order);
    const [uploadImageFile, setUploadImageFile] = useState(null);

    const [errorMessage, setErrorMessage] = useState(null);

    function handleTestimonialMessageChange(e) {
      setTempMessage(e.target.value);
    }

    function handleTestimonialAuthorDescChange(e) {
      setTempAuthorDesc(e.target.value);
    }

    function handleTestimonialPreviewChange(e) {
      setTempPreview(e.target.value);
    }

    function handleTestimonialOrderChange(e) {
      setTempOrder(parseInt(e.target.value));
    }

    async function saveChanges() {
      let newErrorMessage = "Error: Missing Fields ( "; 
      let errorFound = false;
      if (!tempMessage) {
        newErrorMessage += "message "
        errorFound = true;
      }
      if (!tempPreview) {
        newErrorMessage += "preview "
        errorFound = true;
      }
      if (!tempAuthorDesc) {
        newErrorMessage += "authorDescription "
        errorFound = true;
      }
      if (!tempImageURL) {
        newErrorMessage += "image "
        errorFound = true;
      }
      newErrorMessage += ")";
      if (errorFound) {
        setErrorMessage(newErrorMessage);
        return;
      }
      const newData = {...currentTestimonial};
      const newFileName = getFileNameByCurrentTime(uploadImageFile);
      const compressedImage = await ImageCompressor.compressImage(uploadImageFile);
      const imgLink = await uploadImgToStorageAndReturnDownloadLink("testimonials", compressedImage, newFileName);
      if (imgLink !== newData.image && imgLink) {
        removeImage("testimonials/" + currentTestimonial.imgFileName);
      }
      newData.imgFileName = imgLink ? newFileName : currentTestimonial.imgFileName;
      newData.order = tempOrder ? tempOrder : testimonialData.length + 1;
      if (imgLink) {
        newData.image = imgLink;
      }
      newData.authorDescription = tempAuthorDesc;
      newData.message = tempMessage;
      newData.preview = tempPreview;
      if (currentTestimonial.id) {        
        const docRef = doc(firestore, "testimonials", currentTestimonial.id);
        setDoc(docRef, newData).then(() => {
          closeModalsAndReload();
        });
      } else {
        const collectionRef = collection(firestore, "testimonials");
        addDoc(collectionRef, newData).then(() => {
          closeModalsAndReload();
        });
      }
    }

    const [deleteWarningVisible, setDeleteWarningVisible] = useState(false);

    function deleteTestimonial() {
      const docRef = doc(firestore, "testimonials", currentTestimonial.id);
      const deleteRef = doc(firestore, "deletedTestimonials", currentTestimonial.id);
      removeImage("testimonials/" + currentTestimonial.imgFileName);
      deleteDoc(docRef);
      setDoc(deleteRef, currentTestimonial).then(() => {
        closeModalsAndReload();
      });
    }
    
    function uploadImage() {
      openFileBrowser().then((img) => {
        if (img) {
          const fileReader = new FileReader();
          fileReader.onload = (e) => {
            const { result } = e.target;
            if (result) {
              setTempImageURL(result);
              setUploadImageFile(img);
            }
          }
          fileReader.readAsDataURL(img);
        }
      });
    }

    return (
      <Modal.Body>
      <div className="container-fluid">
        <div className="row d-flex flex-row align-items-center justify-content-center">
          <div className="col-lg-4 col-sm-12 gap-3 d-flex flex-column align-items-center">
          { tempImageURL ? 
            <img 
              src={tempImageURL} 
              alt={currentTestimonial.authorDescription ? currentTestimonial.authorDescription : "add-testimonial"} 
              className={`img-shadow img-square ${testimonialEdit ? "edit" : ""}`}
              style={{maxHeight: "50vw"}} 
              onClick={() => {
                if (testimonialEdit) {
                  uploadImage()
                }
            }}/>
            :
            <UploadImageCard onClick={uploadImage} />
          }
            { testimonialEdit && !deleteWarningVisible && currentTestimonial.id &&
              <Button flat auto color="error" onClick={() => setDeleteWarningVisible(true)}>
                Delete Testimonial
              </Button>
            }
            { testimonialEdit && deleteWarningVisible && currentTestimonial.id &&
              <Text>
                Are you sure you want to delete this testimonial?
              </Text>
            }
            { testimonialEdit && deleteWarningVisible && currentTestimonial.id &&
              <div className="w-100 d-flex flex-row justify-content-around align-items-center">
                <Button flat auto color="success" onClick={() => setDeleteWarningVisible(false)}>
                  Cancel
                </Button>
                <Button flat auto color="error" onClick={deleteTestimonial}>
                  Delete it!
                </Button>
              </div>
            }
          </div>
          <div className="col-lg-8 p-3 gap-3 col-sm-12 d-flex flex-column justify-content-center text-center">
            { !testimonialEdit && 
              <Text className="d-inline d-lg-none">
              "{tempMessage}"
              </Text>
            }
            { !testimonialEdit && 
              <Text className="d-none d-lg-inline" size="$lg">
                "{tempMessage}"
              </Text>
            }
            { testimonialEdit &&
              <Textarea label="Testimonial Message" placeholder="Enter the full testimonial message" bordered value={tempMessage ? tempMessage : ""} onChange={handleTestimonialMessageChange}/>
            }
            { testimonialEdit &&
              <Textarea label="Testimonial Preview" placeholder="This is the shortened preview that shows up on the homepage" bordered value={tempPreview ? tempPreview : ""} onChange={handleTestimonialPreviewChange}/>
            }
            { !testimonialEdit && 
              <Text className="d-inline d-lg-none">
                {currentTestimonial.authorDescription}
              </Text>
            }
            { !testimonialEdit && 
              <Text className="d-none d-lg-inline" size="$lg">
                {currentTestimonial.authorDescription}
              </Text>
            }
            { testimonialEdit &&
              <div className="container-fluid">
                <div className="row">
                  <TextField className="p-1 col-xl-6 col-sm-12" label="Author Description" placeholder="Enter a description of the testimonial's author" bordered value={tempAuthorDesc ? tempAuthorDesc : ""} onChange={handleTestimonialAuthorDescChange}/>
                  <TextField className="p-1 col-xl-6 col-sm-12" label="Order" placeholder="Enter this testimonial's order value" bordered value={tempOrder ? tempOrder : ""} onChange={handleTestimonialOrderChange}/>
                </div>
              </div>
            }
            { testimonialEdit &&
              <Button flat auto color="success" onClick={saveChanges}>
                Save Changes
              </Button>
            }
            { errorMessage && 
              <Text color="error">
                {errorMessage}
              </Text>
            }
          </div>
        </div>
      </div>
    </Modal.Body>
    )
  }

  
  function OfferingModal() {
    
    const [tempDescription, setTempDescription] = useState(currentOffering.description);
    const [tempTitle, setTempTitle] = useState(currentOffering.title);
    const [tempOrder, setTempOrder] = useState(currentOffering.order);
    const [tempSchedule, setTempSchedule] = useState(currentOffering.schedule);
    const [tempImageURL, setTempImageURL] = useState(currentOffering.image ? serverURL + currentOffering.image : null);
    const [uploadImageFile, setUploadImageFile] = useState(null);

    function handleOfferingDescriptionChange(e) {
      setTempDescription(e.target.value);
    }

    function handleOfferingScheduleChange(e) {
      setTempSchedule(e.target.value);
    }

    function handleOfferingTitleChange(e) {
      setTempTitle(e.target.value);
    }

    function handleOfferingOrderChange(e) {
      setTempOrder(parseInt(e.target.value));
    }

    async function saveChanges() {
      let newErrorMessage = "Error: Missing Fields ( "; 
      let errorFound = false;
      if (!tempDescription) {
        newErrorMessage += "desctiption "
        errorFound = true;
      }
      if (!tempTitle) {
        newErrorMessage += "title "
        errorFound = true;
      }
      if (!tempSchedule) {
        newErrorMessage += "schedule "
        errorFound = true;
      }
      if (!tempSchedule) {
        newErrorMessage += "schedule "
        errorFound = true;
      }
      newErrorMessage += ")";
      if (errorFound) {
        setErrorMessage(newErrorMessage);
        return;
      }
      const newData = {...currentOffering};
      const newFileName = getFileNameByCurrentTime(uploadImageFile)
      const compressedImage = await ImageCompressor.compressImage(uploadImageFile);
      const imgLink = await uploadImgToStorageAndReturnDownloadLink("offerings", compressedImage, newFileName);
      if (imgLink !== newData.image && imgLink) {
        removeImage("offerings/" + currentOffering.imgFileName);
      }
      newData.imgFileName = imgLink ? newFileName : currentOffering.imgFileName;
      newData.order = tempOrder ? tempOrder : offeringData.length + 1;
      if (imgLink) {
        newData.image = imgLink;
      }
      newData.description = tempDescription;
      newData.schedule = tempSchedule;
      newData.title = tempTitle;
      if (currentOffering.id) {        
        const docRef = doc(firestore, "offerings", currentOffering.id);
        setDoc(docRef, newData).then(() => {
          closeModalsAndReload();
        });
      } else {
        const collectionRef = collection(firestore, "offerings");
        addDoc(collectionRef, newData).then(() => {
          closeModalsAndReload();
        });
      }
    }

    const [deleteWarningVisible, setDeleteWarningVisible] = useState(false);

    function deleteOffering() {
      const docRef = doc(firestore, "offerings", currentOffering.id);
      const deleteRef = doc(firestore, "deletedOfferings", currentOffering.id);
      deleteDoc(docRef);
      removeImage("offerings/" + currentOffering.imgFileName);
      setDoc(deleteRef, currentOffering).then(() => {
        closeModalsAndReload();
      });
    }

    
    function uploadImage() {
      openFileBrowser().then((img) => {
        if (img) {
          const fileReader = new FileReader();
          fileReader.onload = (e) => {
            const { result } = e.target;
            if (result) {
              setTempImageURL(result);
              setUploadImageFile(img);
            }
          }
          fileReader.readAsDataURL(img);
        }
      });
    }

    const [errorMessage, setErrorMessage] = useState(null);

    return (
      <Modal.Body>
      <div className="container-fluid">
        <div className="row d-flex flex-row align-items-center justify-content-center">
          <div className="col-lg-4 col-sm-12 gap-3 d-flex flex-column align-items-center">
          { tempImageURL ? 
            <img 
              src={tempImageURL} 
              alt={currentOffering.title ? currentOffering.title : "add-offering"} 
              className={`img-shadow img-square ${offeringEdit ? "edit" : ""}`}
              style={{maxHeight: "50vw"}} 
              onClick={() => {
                if (offeringEdit) {
                  uploadImage()
                }
              }}/>
            :
            <UploadImageCard onClick={uploadImage}/>
          }
            { offeringEdit && !deleteWarningVisible && currentOffering.id &&
              <Button flat auto color="error" onClick={() => setDeleteWarningVisible(true)}>
                Delete Class Offering
              </Button>
            }
            { offeringEdit && deleteWarningVisible && currentOffering.id &&
              <Text>
                Are you sure you want to delete this class offering?
              </Text>
            }
            { offeringEdit && deleteWarningVisible && currentOffering.id &&
              <div className="w-100 d-flex flex-row justify-content-around align-items-center">
                <Button flat auto color="success" onClick={() => setDeleteWarningVisible(false)}>
                  Cancel
                </Button>
                <Button flat auto color="error" onClick={deleteOffering}>
                  Delete it!
                </Button>
              </div>
            }
          </div>
          <div className="col-lg-8 p-3 gap-3 col-sm-12 d-flex flex-column justify-content-center text-center">
            { !offeringEdit && 
              <Text b size="$lg">
                {tempTitle}
              </Text>
            }
            { !offeringEdit && 
              <Text>
                {tempDescription}
              </Text>
            }
            { offeringEdit &&
              <div className="d-flex flex-row justify-content-center gap-2">
                <TextField label="Offering Title" placeholder="Please enter a title for this class offering" bordered value={tempTitle ? tempTitle : ""} onChange={handleOfferingTitleChange}/>
                <TextField label="Order" placeholder="Enter offering order value" value={tempOrder} onChange={handleOfferingOrderChange}/>
              </div>
            }
            { offeringEdit &&
              <Textarea label="Offering Description" placeholder="Enter the class offering's description" bordered value={tempDescription ? tempDescription : ""} onChange={handleOfferingDescriptionChange}/>
            }
            { !offeringEdit && 
              <Text>
                <strong>Schedule:</strong> {currentOffering.schedule}
              </Text>
            }
            { offeringEdit &&
              <Textarea label="Offering Schedule" placeholder="Enter this class offering's schedule" bordered value={tempSchedule ? tempSchedule : ""} onChange={handleOfferingScheduleChange}/>
            }
            { offeringEdit &&
              <Button flat auto color="success" onClick={saveChanges}>
                Save Changes
              </Button>
            }
            { errorMessage && 
              <Text color="error">
                {errorMessage}
              </Text>
            }
          </div>
        </div>
      </div>
    </Modal.Body>
    )
  }

  function renderOfferingsList() {
    
    // Guard clauses
    if (!offeringData) { return <BTBLoader />; }  // Offering data has not been fetched yet

    return offeringData.map((o, index) => {

      function handleOfferingPress() {
        setOfferingModalOpen(true);
        setCurrentOffering(o);
      }
    
      function editOffering() {
        handleOfferingPress();
        setOfferingEdit(true);
      }
    
      function EditButton() {
        return (
          <IconButton onClick={editOffering} className="m-5">
            <PencilIcon />
          </IconButton>
        )
      }

      return (
        <Card
          isPressable
          isHoverable
          key={"ol-" + index}
          css={{
            height: "200px",
            width: "100%",
          }}
          className="m-2"
          onPress={userCanEditOfferings ? editOffering : handleOfferingPress}
        >
          <Card.Body className="w-100 p-2 d-flex flex-row align-items-center justify-content-between" style={{overflowY: "hidden"}}>
            <img src={serverURL + o.image} alt={o.title} style={{width: "40%", minHeight: "100%", objectFit:"cover"}} className="img-shadow"/>
            <div className="d-none d-sm-flex w-100 h-100 flex-column px-2 py-2 text-center justify-content-around">
              <div className="d-flex flex-column align-items-center justify-content-center">
                <Text b>
                  {o.title}
                </Text>
                <Text>
                  {o.schedule}
                </Text>
              </div>
              <div className="d-flex flex-row w-100 justify-content-center align-items-center">
                <Button bordered style={{minHeight:"2rem", maxWidth: "50%"}} onClick={handleOfferingPress}>
                  Read More
                </Button>
              </div>
            </div>
            <div className="d-flex d-sm-none w-100 h-100 flex-column px-2 py-2 text-center justify-content-around">
              <div className="d-flex flex-column align-items-center justify-content-center">
                <Text b size="$sm">
                  {o.title}
                </Text>
                <Text size="$sm">
                  {o.schedule}
                </Text>
              </div>
              <div className="d-flex flex-row w-100 justify-content-center align-items-center">
                <Button size="sm" bordered style={{minHeight:"2rem", maxWidth: "50%"}} onClick={handleOfferingPress}>
                  Read More
                </Button>
              </div>
            </div>
          { userCanEditOfferings && <EditButton /> }
          </Card.Body>
        </Card>
      )
    })
  }

  function Testimonial(props) {

    function handleTestimonialPress(event) {
      setTestimonialModalOpen(true);
      setCurrentTestimonial(props.testimonial);
    }
  
    function editTestimonial() {
      handleTestimonialPress();
      setTestimonialEdit(true);
    }

    function EditButton() {
      return (
        <Card.Footer className="d-flex flex-row justify-content-center w-100">
          <Button color="secondary" onClick={editTestimonial}>
            Edit
          </Button>
        </Card.Footer>
      )
    }

    return (
      <div 
        className={`p-3`}
        style={{flex: 1}}
      >
        <Card 
          isPressable 
          isHoverable 
          css={{
            minHeight: 450,
            height: "100%",
          }}
            onPress={handleTestimonialPress}
        >
          <Card.Body>
              <div className="text-center d-flex flex-column align-items-center justify-content-center h-100 w-100 gap-2">
                <img src={serverURL + props.testimonial.image} alt="testimonial-img" className="testimonial-img" style={{width: "10rem", height: "10rem", objectFit: "cover"}}/>
                <Text className="d-inline d-sm-none">
                  "{props.testimonial.preview}"
                </Text>
                <Text className="d-none d-sm-inline" size="$lg">
                  "{props.testimonial.preview}"
                </Text>
                <Text className="d-inline d-lg-none">
                  {props.testimonial.authorDescription}
                </Text>
                <Text className="d-none d-lg-inline" size="$lg">
                  {props.testimonial.authorDescription}
                </Text>
              </div>
          </Card.Body>
          { userCanEditTestimonials && <EditButton /> }
        </Card>
      </div>
    )
  }
  

  function AddOfferingButton() {
  
    function handleButtonClick() {
      setCurrentOffering({
        description: null,
        title: null,
        image: null,
        schedule: null,
        order: null,
        imgFileName: null,
      });
      setOfferingModalOpen(true);
    }

    function editOfferings() {
      handleButtonClick();
      setOfferingEdit(true);
    }


    return (
      <div className="d-flex flex-row w-100 p-2 justify-content-center">
        <Button css={{width: "100%"}} size="lg" color="secondary" onClick={editOfferings}>
          Add a Class Offering
        </Button>
      </div>
    )
  }

  
  function AddTestimonialButton() {
  
    function handleButtonClick() {
      setCurrentTestimonial({
        authorDescription: null,
        message: null,
        preview: null,
        order: null,
        imgFileName: null,
      });
      setTestimonialModalOpen(true);
    }

    function editTestimonials() {
      handleButtonClick();
      setTestimonialEdit(true);
    }


    return (
      <div className="d-flex flex-row w-100 p-2 justify-content-center">
        <Button css={{width: "100%"}}  size="lg" color="secondary" onClick={editTestimonials}>
          Add a Testimonial
        </Button>
      </div>
    )
  }
  
function ClassOffering({offering}) {

  function handleOfferingPress(event) {
    setOfferingModalOpen(true);
    setCurrentOffering(offering);
  }

  function editOffering() {
    handleOfferingPress();
    setOfferingEdit(true);
  }

  function EditButton() {
    return (
      <Card.Footer className="d-flex flex-row justify-content-center w-100 my-2">
        <Button color="secondary" onClick={editOffering}>
          Edit
        </Button>
      </Card.Footer>
    )
  }

  return (
    <div className={`p-3`} style={{ height: "100%", flex: 1}}>
      <Card isHoverable isPressable className="d-flex flex-column justify-content-between" onClick={handleOfferingPress}>
        <Card.Image
          src={serverURL + offering.image}
          objectFit='cover'
          width="100%"
          height={250}
          alt={offering.title}
        />
        <div className="d-flex flex-column align-items-center gap-2 p-2">
          <Text b>          
            {offering.title}
          </Text>
          <Text size="$sm" color="textSecondary">          
            {offering.schedule}
          </Text>
          <Button bordered size="md" style={{minHeight:"2rem"}} onClick={handleOfferingPress}>
            Read More
          </Button>
        </div>
        { userCanEditOfferings && <EditButton /> }
      </Card>
    </div>
  )
}
}

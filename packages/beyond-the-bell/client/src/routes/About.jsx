// Library Imports
import { addDoc, collection, deleteDoc, doc, setDoc, } from 'firebase/firestore';
import { Button, Card, Modal, Text, Textarea, } from "@nextui-org/react";
import { useContext, useEffect, useState, } from 'react'

// Style Imports
import "../assets/style/about.css";

// Component Imports
import { AuthenticationManagerContext, CurrentSignInContext, serverURL, } from '../App';
import { ScheduleBar, } from "../components/Forms";

// API Imports
import { firestore, removeImage, uploadImgToStorageAndReturnDownloadLink, } from '../api/firebase';
import { UploadImageCard, WLImage } from '../libraries/Web-Legos/components/Images';
import { ImageCompressor } from '../libraries/Web-Legos/api/images';
import { getFileNameByCurrentTime, openFileBrowser } from '../libraries/Web-Legos/api/files';
import { WLHeader, } from '../libraries/Web-Legos/components/Text';
import { WLCenteredColumn, WLResponsiveSectionEditable, WLSpinnerPage } from '../libraries/Web-Legos/components/Layout';
import { TextField } from '@mui/material';
import { AboutBlockHeader } from '../components/Bar';

export default function About() {

  // Fetch current team members after component mount
  useEffect(() => {
    // Ask server for current staff
    fetch(`${serverURL}staff`).then(res => {
      res.json().then(data => {
        // Get json from HTTP response and set data state
        setStaffData(data);
      })
    });
  }, [])

  const [developingAllLearnersLoaded, setdevelopingAllLearnersLoaded] = useState(false);
  const [meetTheTeamLoaded, setMeetTheTeamLoaded] = useState(false);
  const [ourMethodsLoaded, setourMethodsLoaded] = useState(false);
  const [ourLearningCenterLoaded, setourLearningCenterLoaded] = useState(false);
  
  const [staffData, setStaffData] = useState([]);

  const [formModalOpen, setFormModalOpen] = useState(false);

  const [currentTeamMember, setCurrentTeamMember] = useState({
    order: 0,
    name: null,
    position: null,
    image: null,
    bio: null,
  })

  const [teamMemberModalOpen, setTeamMemberModalOpen] = useState(false);

  const { currentSignIn } = useContext(CurrentSignInContext)
  const { authenticationManager } = useContext(AuthenticationManagerContext)
  
  useEffect(() => {
    authenticationManager.getPermission(currentSignIn, "siteText").then(p => setUserCanEditText(p));
    authenticationManager.getPermission(currentSignIn, "siteImages").then(p => setUserCanEditImages(p));
    authenticationManager.getPermission(currentSignIn, "staff").then(p => setUserCanEditStaff(p));
  }, [authenticationManager, currentSignIn]);

  const [userCanEditStaff, setUserCanEditStaff] = useState(false);
  const [userCanEditText, setUserCanEditText] = useState(false);
  const [userCanEditImages, setUserCanEditImages] = useState(false);

  const [staffEdit, setStaffEdit] = useState(false);

  function handleStaffModalClose() {
    setTeamMemberModalOpen(false);
    setStaffEdit(false);
  }

  return (
    <WLSpinnerPage dependencies={[staffData, developingAllLearnersLoaded, meetTheTeamLoaded, ourMethodsLoaded, ourLearningCenterLoaded]}>
      <Modal 
        closeButton
        width="75vw"
        open={teamMemberModalOpen}
        blur
        onClose={handleStaffModalClose}
      >
        <Modal.Body>
          <StaffModal />
        </Modal.Body>
        <Modal.Footer>
          <div className="d-flex flex-row align-items-center justify-content-center w-100">
            <Button auto flat color="error" onPress={handleStaffModalClose} >
                Close
            </Button>
          </div>
        </Modal.Footer>
      </Modal>
      <AboutBlockHeader />
      <WLResponsiveSectionEditable setLoaded={setdevelopingAllLearnersLoaded} firestoreId="developing-all-learners" editable={userCanEditText}/>
      <div className="rainbow-line" />
      <WLResponsiveSectionEditable setLoaded={setourMethodsLoaded} stackHeader justifyLeft="start" sectionClasses="bg-blue" textColor="white" firestoreId="our-methods" editable={userCanEditText} /> 
      <WLResponsiveSectionEditable setLoaded={setourLearningCenterLoaded} textRight={true} firestoreId="our-learning-center" editable={userCanEditText} />
      <div className="rainbow-line" />
      <WLResponsiveSectionEditable setLoaded={setMeetTheTeamLoaded} columnWidthLeft="4" columnWidthRight="8" textRight firestoreId="meet-the-director" editable={userCanEditText} image={<WLImage firestoreId="meet-the-director" editable={userCanEditImages} shadow round />}/>
      <WLCenteredColumn>
        <WLHeader editable={userCanEditText} firestoreId="our-staff-header" color="primary" headerLevel={1} />
        <div className="w-100 row d-flex flex-row justify-content-center align-items-center">
          { renderTeam() }
        </div>
        { userCanEditStaff && <AddStaffButton /> }
      </WLCenteredColumn>
      <ScheduleBar open={formModalOpen} setOpen={setFormModalOpen} />
    </WLSpinnerPage>
  )

    function StaffModal() {

      const [tempName, setTempName] = useState(currentTeamMember.name);
      const [tempPosition, setTempPosition] = useState(currentTeamMember.position);
      const [tempBio, setTempBio] = useState(currentTeamMember.bio);
      const [tempOrder, setTempOrder] = useState(currentTeamMember.order);
      const [tempImageURL, setTempImageURL] = useState(currentTeamMember.image ? serverURL + currentTeamMember.image : null);
      const [uploadImageFile, setUploadImageFile] = useState(null);

      async function saveChanges() {
        let newErrorMessage = "Error: missing fields ( "; 
        let errorFound = false;
        if (!tempName) {
          newErrorMessage += "name "
          errorFound = true;
        }
        if (!tempPosition) {
          newErrorMessage += "position "
          errorFound = true;
        }
        if (!tempPosition) {
          newErrorMessage += "bio "
          errorFound = true;
        }
        if (!tempPosition) {
          newErrorMessage += "order "
          errorFound = true;
        }
        newErrorMessage += ")";
        if (errorFound) {
          setErrorMessage(newErrorMessage);
          return;
        }
        const newData = {...currentTeamMember};
        const newFileName = getFileNameByCurrentTime(uploadImageFile);
        const compressedImage = await ImageCompressor.compressImage(uploadImageFile);
        const imgLink = await uploadImgToStorageAndReturnDownloadLink("staff", compressedImage, newFileName);
        if ((imgLink !== newData.image) && imgLink) {
          removeImage("staff/" + currentTeamMember.imgFileName);
        }
        newData.imgFileName = imgLink ? newFileName : currentTeamMember.imgFileName;
        newData.order = tempOrder ? tempOrder : staffData.length + 1;
        if (imgLink) {
          newData.image = imgLink;
        }
        newData.name = tempName;
        newData.position = tempPosition;
        newData.bio = tempBio;
        if (currentTeamMember.id) {        
          const docRef = doc(firestore, "staff", currentTeamMember.id);
          setDoc(docRef, newData).then(() => {
            setStaffEdit(false);
            setTeamMemberModalOpen(false);
            window.location.reload();
          });
        } else {
          const collectionRef = collection(firestore, "staff");
          addDoc(collectionRef, newData).then(() => {
            setStaffEdit(false);
            setTeamMemberModalOpen(false);
            window.location.reload();
          });
        }
      }

      const [deleteWarningVisible, setDeleteWarningVisible] = useState(false);

      function deleteStaff() {
        const docRef = doc(firestore, "staff", currentTeamMember.id);
        const deleteRef = doc(firestore, "deletedStaff", currentTeamMember.id);
        deleteDoc(docRef);
        removeImage("staff/" + currentTeamMember.imgFileName);
        setDoc(deleteRef, currentTeamMember).then(() => {
          setStaffEdit(false);
          setTeamMemberModalOpen(false);
          window.location.reload();
        });
      }

      function handleStaffNameChange(e) {
        setTempName(e.target.value);
      }

      function handleStaffPositionChange(e) {
        setTempPosition(e.target.value);
      }

      function handleStaffBioChange(e) {
        setTempBio(e.target.value);
      }

      function handleStaffOrderChange(e) {
        setTempOrder(parseInt(e.target.value));
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
        <div className="container-fluid">
          <div className="row d-flex flex-row align-items-center justify-content-center">
            <div className="col-lg-4 col-md-12 d-flex flex-column align-items-center gap-3">
              { tempImageURL ? 
                <img 
                  src={tempImageURL} 
                  alt={currentTeamMember.name ? currentTeamMember.name : "add-team-member"} 
                  className={`img-shadow img-square ${staffEdit ? "edit" : ""}`}
                  style={{maxHeight: "50vw"}} 
                  onClick={() => {
                    if (staffEdit) {
                      uploadImage()
                    }
                }}/>
                :
                <UploadImageCard onClick={uploadImage} />
              }
              { staffEdit && !deleteWarningVisible &&  currentTeamMember.id &&
                <Button flat auto color="error" onClick={() => setDeleteWarningVisible(true)}>
                  Delete Team Member
                </Button>
              }
              { staffEdit && deleteWarningVisible && currentTeamMember.id &&
                <Text>
                  Are you sure you want to delete this team member?
                </Text>
              }
              { staffEdit && deleteWarningVisible && currentTeamMember.id &&
                <div className="w-100 d-flex flex-row justify-content-around align-items-center">
                  <Button flat auto color="success" onClick={() => setDeleteWarningVisible(false)}>
                    Cancel
                  </Button>
                  <Button flat auto color="error" onClick={deleteStaff}>
                    Delete them!
                  </Button>
                </div>
              }
            </div>
            <div className="col-lg-8 p-3 col-md-12 d-flex flex-column justify-content-center gap-2">
              <div className="w-100 d-flex flex-row gap-2 justify-content-center">
                { !staffEdit && 
                  <Text size="$lg" css={{fontWeight: "bold"}} >
                    {tempName}
                  </Text>
                }
                { staffEdit && 
                  <TextField label="Name" placeholder="Enter their name" value={tempName} onChange={handleStaffNameChange}/>
                }
                <Text>
                  —
                </Text>
                { !staffEdit && 
                  <Text>
                    {tempPosition}
                  </Text>
                }
                { staffEdit && 
                  <TextField label="Position" placeholder="Enter their positon" value={tempPosition} onChange={handleStaffPositionChange}/>
                }
                { staffEdit && 
                  <TextField label="Order" placeholder="Enter their order value" value={tempOrder} onChange={handleStaffOrderChange}/>
                }
              </div>
                { !staffEdit && 
                  <Text align="center">
                    {tempBio}
                  </Text>
                }
              { staffEdit && 
                <Textarea label="Team Member Bio" placeholder="Please enter a bio for this team member" bordered value={tempBio} onChange={handleStaffBioChange}/>
              }
              { staffEdit &&
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
      )
    }

  function renderTeam() {

    const sortedTeamMembers = staffData.sort((a, b) => a.order - b.order);
  
    return sortedTeamMembers.map((teamMember, index) => {
  
      function handleCardClick() {
        setCurrentTeamMember(teamMember);
        setTeamMemberModalOpen(true);
      }

      function editStaff() {
        handleCardClick();
        setStaffEdit(true);
      }

      function EditButton() {
        return (
          <Card.Footer className="d-flex flex-row justify-content-center w-100 my-2">
            <Button color="secondary" onClick={editStaff}>
              Edit
            </Button>
          </Card.Footer>
        )
      }

  
      return (
        <div className="col-xxl-3 col-xl-4 col-md-6 col-sm-12 p-3 d-flex flex-column align-items-center justify-content-center" key={index} style={{maxHeight: 550}}>
          <Card 
            isHoverable 
            isPressable 
            className="p-3 m-2 d-flex flex-column align-items-center h-100"
            onPress={handleCardClick}
          >
            <Card.Body className="d-flex flex-column gap-2 align-items-center w-100 justify-content-center">
              <img src={serverURL + teamMember.image} alt={teamMember.name} className="img-shadow img-round" style={{height: "10rem", width: "10rem", objectFit: "cover"}}/>
              <div className="w-100 d-md-none d-lg-flex flex-column justify-content-center text-center align-items-center">
                <Text size="$lg" css={{fontWeight: "bold"}} >
                  {teamMember.name}
                </Text>
                <Text>
                  {teamMember.position}
                </Text>
              </div>
              <Button bordered onClick={handleCardClick}>
                Read More
              </Button>
            </Card.Body>
            { userCanEditStaff && <EditButton />}
          </Card>
        </div>
      )
    })
  }

  function AddStaffButton() {
  
    function handleCardClick() {
      setCurrentTeamMember({
        id: null,
        order: null,
        name: null,
        position: null,
        image: null,
        bio: null,
      });
      setTeamMemberModalOpen(true);
    }

    function editStaff() {
      handleCardClick();
      setStaffEdit(true);
    }



    return (
      <div className="d-flex flex-row w-100 justify-content-center p-3">
        <Button size="lg" color="secondary" css={{width: "100%"}} onClick={editStaff}>
          Add a Team Member
        </Button>
      </div>
    )
  }
}

import React from 'react';
import "../assets/style/projects.css";
import { Button, Link, Spacer } from '@nextui-org/react';

// WL Images
import nicole from "../assets/images/projects/web-legos/nicoleScreenshot.png";
import ycd from "../assets/images/projects/web-legos/ycdScreenshot.png";
import btb from "../assets/images/projects/web-legos/btbScreenshot.png";
import dreams from "../assets/images/projects/web-legos/dreamsScreenshot.png";
import andc from "../assets/images/projects/web-legos/andcScreenshot.png";

// Arboles Images
import arbolesLogin from "../assets/images/projects/arboles/arbolesLoginScreen.jpg";
import arbolesDetail from "../assets/images/projects/arboles/arbolesDetail.png";
import arbolesMap from "../assets/images/projects/arboles/arbolesMap.jpg";
import arbolesTree from "../assets/images/projects/arboles/arbolesTree.jpg";

// Citrus Images
import citrusGroup from "../assets/images/projects/citrus-native/citrus-group.jpg";
import citrusNew from "../assets/images/projects/citrus-native/citrus-new.jpg";
import citrusPeople from "../assets/images/projects/citrus-native/citrus-people.jpg";
import citrusTransaction from "../assets/images/projects/citrus-native/citrus-transaction.jpg";

// DVL Images
import dvlLogin from "../assets/images/projects/dvl/login.png";
import dvlDashboard from "../assets/images/projects/dvl/dashboard.png";
import dvlQ1 from "../assets/images/projects/dvl/q1.png";
import dvlQ2 from "../assets/images/projects/dvl/q2.png";

// PUPSyS Images
import pupCalibration from "../assets/images/projects/pupsys/pupsysCalibration.jpg";
import pupDetails from "../assets/images/projects/pupsys/pupsysDetails.jpg";
import pupLocation from "../assets/images/projects/pupsys/pupsysLocation.jpg";
import pupSensors from "../assets/images/projects/pupsys/pupsysSensors.jpg";

// CRM Images
import crmDashboard from "../assets/images/projects/crm/crmDashboard.png";
import crmGnatt from "../assets/images/projects/crm/crmGnatt.png";
import crmInvoiceManagement from "../assets/images/projects/crm/crmInvoiceManagement.png";
import crmSettings from "../assets/images/projects/crm/crmSettings.png";
import crmUserManagement from "../assets/images/projects/crm/crmUserManagement.png";

// Small Pics
import ssPreview from "../assets/images/projects/ssPreview.png";
import medicalTrackingPreview from "../assets/images/projects/medicalTracking.png"
import citrusV3Preview from "../assets/images/projects/citrusReact.png"

// Web Links
const citrusV3Link = "https://github.com/r2pen2/Citrus-V3"
const medicalTrackingLink = "https://github.com/CS3733-C22-Team-E/MedicalTracking";
const studentSuccessLink = "https://github.com/wpivis/StudentSuccess";
const cirtusNativeLink = "https://github.com/r2pen2/CitrusNative"
const arbolesLink = "https://github.com/r2pen2/Arboles-Maui-Mirror";
const webLegosLink = "https://github.com/r2pen2/web-legos";
const dvlLink = "https://dvl-demo.joed.dev/";
const pupsysLink = "https://github.com/pupsys/PUPSyS-Native"
const crmLink = "https://crm.joed.dev/";

const crmProject = {
  title: "Executive Functioning Coaching Suite",
  link: crmLink,
  img: crmDashboard,
  githubLink: "https://github.com/r2pen2/ANewDayCoachingCrm",
  previewText: `My most comprehensive project to date, A New Day Coaching, is a web app that integrates all the tools necessary for executive functioning coaching. Coaches can manage student assignments, send invoices, assign forms, and more. Students can track assignments in a list or Gantt chart, pay invoices, access shared documents, and view assigned tools and strategies. Parents can link their accounts to monitor progress and pay invoices. The app is built using React, Express.js, and Firebase. Currently ANDC is exclusively used by the EF coach who commissioned the project. However, I'm exploring options to transition it to a software-as-a-service model.`,
  timespan: "2024",
  id: "crm",
  mirror: false
}

const dvlProject = {
  title: "Data Visualization Literacy App",
  link: dvlLink,
  // img: "",
  previewText: `My senior capstone project at WPI is a web application designed to assess and teach data visualization literacy. The app is built using React Native, and we aim to create a mobile platform that will allow anyone to understand the importance of data visualization and how to effectively communicate data. The app is currently in development.`,
  timespan: "2023 & 2024",
  id: "dvl",
  mirror: true
}

const webLegosProject = {
  title: "Web-Legos",
  link: webLegosLink,
  // img: "",
  previewText: `Lately, my focus has been on crafting websites for individuals and small businesses. To streamline this process, I've developed a comprehensive suite of custom assets, aptly named 'Web Legos,' that ensures security, accessibility, and rapid iteration. A key advantage for my clients is the autonomy it offers: they can sign in using Google and independently modify text, images, and custom objects directly on their website, eliminating the need to contact me for minor updates.`,
  timespan: "2023 & 2024",
  id: "web-legos",
  mirror: false
}

const cirtusProject = {
  title: "Citrus Native",
  link: cirtusNativeLink,
  // img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTaGLPq3kuCV1EnActxgqMWIhNwZ_g3d5-Et1OIJqTShg&s",
  // previewText: "",
  timespan: "2023",
  id: "citrus-native",
  mirror: true
}

const studentSuccessProject = {
  title: "WPI Student Success Handbook",
  link: studentSuccessLink,
  img: ssPreview,
  // previewText: "",
  timespan: "2023",
  id: "student-success",
  mirror: false
}

const arbolesProject = {
  title: "Árboles Magicos",
  link: arbolesLink,
  // img: null,
  previewText: `Árboles Magicos is a nonprofit organization aimed at promoting cultural appreciation for the beauty of nature through the use of flowering trees. During the first few months of 2023, I travelled with a team of students to San Jose, where we re-wrote their "Ojeadores" app.`,
  timespan: "2023",
  id: "arboles-magicos",
  mirror: false
}

const pupsysProject = {
  title: "PUPSyS",
  link: pupsysLink,
  previewText: "During the summer of 2023, I single-handedly built the HIPAA compliant computing infrastructure for UMass Chan's PUPSys: a system for preventing pressure ulcers in hospital patients. The first iteration of the app was completed, and an expanded suite was planned, but the project lost momentum once the school year started.",
  timespan: "2023",
  id: "pupsys",
  mirror: true,
}


const citrusReactProject = {
  title: "Citrus V3",
  link: citrusV3Link,
  // previewText: "",
  timespan: "2022",
  id: "citrus-v3",
  img: citrusV3Preview,
  mirror: true
}

const medicalTrackerProject = {
  title: "Medical Tracker",
  link: medicalTrackingLink,
  previewText: "In this project, a team of software engineering students developed an application to enhance equipment tracking at Brigham and Women's Hospital. My primary focus was crafting the front-end, creating a native desktop application using JavaFX. I contributed as the Assistant Lead Software Engineer and Scrum Master, playing a pivotal role in both development and team coordination.",
  timespan: "2022",
  id: "medical-tracking",
  img: medicalTrackingPreview,
  mirror: false
}

export default function Projects() {
  return (
    <div className="projects-page px-2 px-md-4 d-flex flex-column align-items-center">
      <div className="container-fluid d-flex flex-column align-items-center justify-content-center w-100" style={{maxWidth: 1400}}>

        <Project 
          projectData={crmProject}
          buttonOverride={"Visit Project"}
        />
        <ProjectLine />

        <Project 
          projectData={dvlProject}
          buttonOverride={"View Demo"}
          imgOverride={[
            <div key="dvl-images-1" className={"project-img d-flex d-md-none flex-row align-items-center justify-content-center " + (!dvlProject.mirror ? "right" : "")}>
              <div className="d-flex flex-column">
              <img src={dvlLogin} className="project-shadow arboles-img" onClick={() => window.open(dvlProject.link, "_blank")} style={{maxHeight: 350, width: "auto"}} alt="dvl-login" />
                <Spacer y={0.5} />
              <img src={dvlDashboard} className="project-shadow arboles-img" onClick={() => window.open(dvlProject.link, "_blank")} style={{maxHeight: 350, width: "auto"}} alt="dvl-dashboard" />
              </div>
              <Spacer x={0.5} />
              <div className="d-flex flex-column">
              <img src={dvlQ1} className="project-shadow arboles-img" onClick={() => window.open(dvlProject.link, "_blank")} style={{maxHeight: 350, width: "auto"}} alt="dvl-q1" />
                <Spacer y={0.5} />
              <img src={dvlQ2} className="project-shadow arboles-img" onClick={() => window.open(dvlProject.link, "_blank")} style={{maxHeight: 350, width: "auto"}} alt="dvl-q2" />
              </div>
            </div>,
            <div key="dvl-images-2" className={"project-img d-none d-md-flex flex-row " + (!dvlProject.mirror ? "right" : "")}>
              <img src={dvlLogin} className="project-shadow arboles-img" onClick={() => window.open(dvlProject.link, "_blank")} style={{maxHeight: 350, width: "auto"}} alt="dvl-login" />
              <Spacer x={0.5} />
              <img src={dvlDashboard} className="project-shadow arboles-img" onClick={() => window.open(dvlProject.link, "_blank")} style={{maxHeight: 350, width: "auto"}} alt="dvl-dashboard" />
              <Spacer x={0.5} />
              <img src={dvlQ1} className="project-shadow arboles-img" onClick={() => window.open(dvlProject.link, "_blank")} style={{maxHeight: 350, width: "auto"}} alt="dvl-q1" />
              <Spacer x={0.5} />
              <img src={dvlQ2} className="project-shadow arboles-img" onClick={() => window.open(dvlProject.link, "_blank")} style={{maxHeight: 350, width: "auto"}} alt="dvl-q2" />
            </div>
          ]}
        />
        <ProjectLine />

        <Project 
          projectData={webLegosProject}
          imgOverride={
            <div className={"project-img d-flex flex-row align-items-center justify-content-center " + (!webLegosProject.mirror ? "right" : "")}>
              <div className="d-flex flex-column">
                <img src={andc} className="wl-screenshot project-shadow" onClick={() => window.open("https://www.anewdaycoaching.com/", "_blank")} style={{maxHeight: 150, width: "auto"}} alt="a-new-day-coaching-screenshot" />
                <Spacer y={0.5} />
                <img src={ycd} className="wl-screenshot project-shadow" onClick={() => window.open("https://www.youcandoitgardening.com/", "_blank")} style={{maxHeight: 150, width: "auto"}} alt="you-can-do-it-gardening-screenshot" />
              </div>
              <Spacer x={0.5} />
              <div className="d-flex flex-column">
                <img src={btb} className="wl-screenshot project-shadow" onClick={() => window.open("https://www.beyondthebelleducation.com/", "_blank")} style={{maxHeight: 150, width: "auto"}} alt="beyond-the-bell-education-screenshot" />
                <Spacer y={0.5} />
                <img src={nicole} className="wl-screenshot project-shadow" onClick={() => window.open("https://www.nicolelevin.org/", "_blank")} style={{maxHeight: 150, width: "auto"}} alt="nicole=levin-screenshot" />
              </div>
            </div>
          }
        />
        <ProjectLine />
        <Project 
          projectData={cirtusProject} 
          textOverride={
            <p>
              Citrus Native, my mobile development magnum opus, is the latest version of Citrus Financial. This React Native app aims to revolutionize expense splitting and bookkeeping with its straightforward and trust-based approach. Its journey includes several iterations: starting from a Django version, evolving through <Link href="#citrus-v3">two React web applications</Link>, and culminating in this React Native mobile app.
            </p>
          }
          imgOverride={[
            <div key="citrus-images-1" className={"project-img d-flex d-md-none flex-row align-items-center justify-content-center " + (!cirtusProject.mirror ? "right" : "")}>
              <div className="d-flex flex-column">
              <img src={citrusPeople} className="project-shadow arboles-img" onClick={() => window.open(cirtusProject.link, "_blank")} style={{maxHeight: 350, width: "auto"}} alt="arboles-login" />
                <Spacer y={0.5} />
              <img src={citrusNew} className="project-shadow arboles-img" onClick={() => window.open(cirtusProject.link, "_blank")} style={{maxHeight: 350, width: "auto"}} alt="arboles-map" />
              </div>
              <Spacer x={0.5} />
              <div className="d-flex flex-column">
              <img src={citrusGroup} className="project-shadow arboles-img" onClick={() => window.open(cirtusProject.link, "_blank")} style={{maxHeight: 350, width: "auto"}} alt="arboles-tree" />
                <Spacer y={0.5} />
              <img src={citrusTransaction} className="project-shadow arboles-img" onClick={() => window.open(cirtusProject.link, "_blank")} style={{maxHeight: 350, width: "auto"}} alt="arboles-detail" />
              </div>
            </div>,
            <div key="citrus-images-2" className={"project-img d-none d-md-flex flex-row " + (!cirtusProject.mirror ? "right" : "")}>
              <img src={citrusPeople} className="project-shadow arboles-img" onClick={() => window.open(cirtusProject.link, "_blank")} style={{maxHeight: 350, width: "auto"}} alt="arboles-login" />
              <Spacer x={0.5} />
              <img src={citrusNew} className="project-shadow arboles-img" onClick={() => window.open(cirtusProject.link, "_blank")} style={{maxHeight: 350, width: "auto"}} alt="arboles-map" />
              <Spacer x={0.5} />
              <img src={citrusGroup} className="project-shadow arboles-img" onClick={() => window.open(cirtusProject.link, "_blank")} style={{maxHeight: 350, width: "auto"}} alt="arboles-tree" />
              <Spacer x={0.5} />
              <img src={citrusTransaction} className="project-shadow arboles-img" onClick={() => window.open(cirtusProject.link, "_blank")} style={{maxHeight: 350, width: "auto"}} alt="arboles-detail" />
            </div>
          ]}
        />
        <ProjectLine />
        <Project 
          projectData={studentSuccessProject}
          textOverride={
            <p>
              The <Link href="https://studentsuccesshandbook.wpi.edu/" target="_blank" isExternal>Student Success Handbook</Link> is a mobile-optimized website crafted for WPI's incoming freshmen. It's an essential guide to campus resources, tailored to support students from all walks of life. This platform ensures that every new student, regardless of their background, can easily navigate and utilize the wealth of resources available at WPI.
            </p>
          }  
        />
        <ProjectLine />
        <Project 
          projectData={pupsysProject}
          imgOverride={[
            <div key="arboles-images-1" className={"project-img d-flex d-md-none flex-row align-items-center justify-content-center " + (!pupsysProject.mirror ? "right" : "")}>
              <div className="d-flex flex-column">
              <img src={pupCalibration} className="project-shadow arboles-img" onClick={() => window.open(pupsysProject.link, "_blank")} style={{maxHeight: 350, width: "auto"}} alt="arboles-login" />
                <Spacer y={0.5} />
              <img src={pupDetails} className="project-shadow arboles-img" onClick={() => window.open(pupsysProject.link, "_blank")} style={{maxHeight: 350, width: "auto"}} alt="arboles-map" />
              </div>
              <Spacer x={0.5} />
              <div className="d-flex flex-column">
              <img src={pupSensors} className="project-shadow arboles-img" onClick={() => window.open(pupsysProject.link, "_blank")} style={{maxHeight: 350, width: "auto"}} alt="arboles-tree" />
                <Spacer y={0.5} />
              <img src={pupLocation} className="project-shadow arboles-img" onClick={() => window.open(pupsysProject.link, "_blank")} style={{maxHeight: 350, width: "auto"}} alt="arboles-detail" />
              </div>
            </div>,
            <div key="arboles-images-2" className={"project-img d-none d-md-flex flex-row " + (!pupsysProject.mirror ? "right" : "")}>
              <img src={pupCalibration} className="project-shadow arboles-img" onClick={() => window.open(pupsysProject.link, "_blank")} style={{maxHeight: 350, width: "auto"}} alt="arboles-login" />
              <Spacer x={0.5} />
              <img src={pupDetails} className="project-shadow arboles-img" onClick={() => window.open(pupsysProject.link, "_blank")} style={{maxHeight: 350, width: "auto"}} alt="arboles-map" />
              <Spacer x={0.5} />
              <img src={pupSensors} className="project-shadow arboles-img" onClick={() => window.open(pupsysProject.link, "_blank")} style={{maxHeight: 350, width: "auto"}} alt="arboles-tree" />
              <Spacer x={0.5} />
              <img src={pupLocation} className="project-shadow arboles-img" onClick={() => window.open(pupsysProject.link, "_blank")} style={{maxHeight: 350, width: "auto"}} alt="arboles-detail" />
            </div>
          ]
          }
        />
        <ProjectLine />
        <Project 
          projectData={arbolesProject}
          imgOverride={[
            <div key="arboles-images-1" className={"project-img d-flex d-md-none flex-row align-items-center justify-content-center " + (!arbolesProject.mirror ? "right" : "")}>
              <div className="d-flex flex-column">
              <img src={arbolesLogin} className="project-shadow arboles-img" onClick={() => window.open(arbolesProject.link, "_blank")} style={{maxHeight: 350, width: "auto"}} alt="arboles-login" />
                <Spacer y={0.5} />
              <img src={arbolesMap} className="project-shadow arboles-img" onClick={() => window.open(arbolesProject.link, "_blank")} style={{maxHeight: 350, width: "auto"}} alt="arboles-map" />
              </div>
              <Spacer x={0.5} />
              <div className="d-flex flex-column">
              <img src={arbolesTree} className="project-shadow arboles-img" onClick={() => window.open(arbolesProject.link, "_blank")} style={{maxHeight: 350, width: "auto"}} alt="arboles-tree" />
                <Spacer y={0.5} />
              <img src={arbolesDetail} className="project-shadow arboles-img" onClick={() => window.open(arbolesProject.link, "_blank")} style={{maxHeight: 350, width: "auto"}} alt="arboles-detail" />
              </div>
            </div>,
            <div key="arboles-images-2" className={"project-img d-none d-md-flex flex-row " + (!arbolesProject.mirror ? "right" : "")}>
              <img src={arbolesLogin} className="project-shadow arboles-img" onClick={() => window.open(arbolesProject.link, "_blank")} style={{maxHeight: 350, width: "auto"}} alt="arboles-login" />
              <Spacer x={0.5} />
              <img src={arbolesMap} className="project-shadow arboles-img" onClick={() => window.open(arbolesProject.link, "_blank")} style={{maxHeight: 350, width: "auto"}} alt="arboles-map" />
              <Spacer x={0.5} />
              <img src={arbolesTree} className="project-shadow arboles-img" onClick={() => window.open(arbolesProject.link, "_blank")} style={{maxHeight: 350, width: "auto"}} alt="arboles-tree" />
              <Spacer x={0.5} />
              <img src={arbolesDetail} className="project-shadow arboles-img" onClick={() => window.open(arbolesProject.link, "_blank")} style={{maxHeight: 350, width: "auto"}} alt="arboles-detail" />
            </div>
          ]
          }
          textOverride={
            <p>
              In the first few months of 2023, I traveled to Costa Rica with a team of students to collaborate with <Link href="https://www.arbolesmagicos.org/" target="_blank" isExternal>Árboles Magicos</Link>, a nonprofit promoting cultural appreciation of nature through flowering trees. We focused on redeveloping their <Link href="https://www.arbolesmagicos.org/ojeadores/" target="_blank" isExternal>Ojeadores</Link> app in DOTNet MAUI. The new version showcases a collaborative map feature, allowing users to identify trees and place public pins.
            </p>
          }
        />
        <ProjectLine />
        <Project 
          projectData={citrusReactProject} 
          textOverride={
            <p>
              This third iteration of <Link href="#citrus-native">Citrus Financial</Link> represents a key early project in my portfolio. As a comprehensive React app, it served as a valuable learning experience. The insights gained led me to focus on developing a React Native mobile app for Citrus, marking a significant evolution in my coding journey.
            </p>
          }
        />
        <ProjectLine />
        <Project projectData={medicalTrackerProject} last />

      </div>
    </div>
  )
}

function Project({projectData, textOverride, imgOverride, last, buttonOverride}) {
  return (
    <ProjectArticle projectId={projectData.id}>
      {projectData.mirror && <ProjectArticle.Image override={imgOverride} link={projectData.link} src={projectData.img} />}
      <div className="d-flex flex-column align-items-center justify-content-center col-12 col-xl-6">
        <ProjectArticle.Title timespan={projectData.timespan}>
          {projectData.title}
        </ProjectArticle.Title>
        <ProjectArticle.Image override={imgOverride} link={projectData.link} src={projectData.img} vertical/>
        <ProjectArticle.Text override={textOverride}>
          {textOverride ? textOverride : projectData.previewText}
        </ProjectArticle.Text>
        <Spacer y={0.5} />
        <div className="d-flex gap-3 flex-column flex-md-row  align-items-center justify-content-center">
          <ProjectArticle.VisitButton link={projectData.link} textOverride={buttonOverride} />
          {projectData.githubLink && <ProjectArticle.VisitButton link={projectData.githubLink} />}
        </div>
      </div>
      {!projectData.mirror && <ProjectArticle.Image override={imgOverride} link={projectData.link} src={projectData.img} right={true} />}
    </ProjectArticle>
  )
}

class ProjectArticle extends React.Component {
  static Text = (textProps) => (
    <div className="text-center">
      <p className="project-text-primary" style={{color: "#EAE7DE", maxWidth: 500}}>
        {textProps.override ? textProps.children.props.children : textProps.children}
      </p>
    </div>
  )

  static VisitButton = ({link, textOverride}) => (
    <Button color="gradient" bordered onClick={() => window.open(link, "_blank")}>{textOverride ? textOverride : "View GitHub"}</Button>
  )

  static Title = (titleProps) => (
      <h2 style={{color: "#EAE7DE"}} className="project-title text-center">{titleProps.children} — <span>{titleProps.timespan}</span></h2>
  )

  static Image = ({src, right, link, override, vertical}) => (
    <div className={`col-12 col-xl-6 ${vertical ? "d-inline d-xl-none" : "d-none d-xl-inline"}`}>
      {override ? override : <img src={src} onClick={() => window.open(link, "_blank")} className={"project-img project-shadow " + (right ? "right" : "")} alt="project-spotlight" style={{maxHeight: 350, width: "auto"}} />}
    </div>
  )

  render() {
    return (
      <article id={this.props.projectId} className="row w-100 d-flex flex-row align-items-center justify-content-center py-5">
          {this.props.children}
      </article>
    )
  }
}

const ProjectLine = () => <div className="project-line" />
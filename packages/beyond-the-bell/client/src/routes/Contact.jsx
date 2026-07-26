import { useContext, useState, } from 'react'

import { Button, Input, Modal, Text, Textarea } from "@nextui-org/react";

import ReCAPTCHA from "react-google-recaptcha";

import "../assets/style/services.css"
import { WLHeader, WLText } from '../libraries/Web-Legos/components/Text';
import { AuthenticationManagerContext, BTBMailManager, CurrentSignInContext } from '../App';
import { WLSpinnerPage } from '../libraries/Web-Legos/components/Layout';
import { ContactBlockHeader } from '../components/Bar';
import { FormResponse } from '../libraries/Web-Legos/api/admin.ts';
import { useEffect } from 'react';

export default function Contact() {
  
  const [contactHeaderLoaded, setContactHeaderLoaded] = useState(false);
  const [contactSubtitleLoaded, setContactSubtitleLoaded] = useState(false);

  const [recaptchaModalOpen, setRecaptchaModalOpen] = useState(false);

  function sendForm() {
    function getEmailBody() {
      const body = `Name: ${document.getElementById("name").value}\n` + 
      `Phone: ${document.getElementById("phone").value}\n` +
      `Email: ${document.getElementById("email").value}\n` +
      `Contact Method: ${document.getElementById("contact").value}\n` +
      `Location: ${document.getElementById("location").value}\n` +
      `Message: ${document.getElementById("message").value}`
      return body;
    }

    BTBMailManager.sendMail(
      `New BTB Form Submission from ${document.getElementById("name").value}`,
      getEmailBody()
    )

    const res = new FormResponse();
    res.content["Name"] =  document.getElementById("name").value;
    res.content["Email"] =  document.getElementById("email").value;
    res.content["Phone Number"] =  document.getElementById("phone").value;
    res.content["Preferred Contact Method"] =  document.getElementById("contact").value;
    res.content["City, State"] =  document.getElementById("location").value;
    res.content["Message"] =  document.getElementById("message").value;
    res.shortStrings.formId = "contact-us";
    res.shortStrings.formTitle = "Contact Us";
    res.sendFormData();
  }


  const {currentSignIn} = useContext(CurrentSignInContext);
  const {authenticationManager} = useContext(AuthenticationManagerContext);
  
  const [userCanEditText, setUserCanEditText] = useState(false);

  useEffect(() => {
    authenticationManager.getPermission(currentSignIn, "siteText").then(p => setUserCanEditText(p));
  }, [authenticationManager, currentSignIn]);

  function handleCaptchaComplete(v) {
    if (v.length < 1) {
      setRecaptchaModalOpen(false);
      return;
    }
    sendForm();
    window.location = "/thank-you";
  }

  function getCaptchaMessage() {
    const messages = [
      "Are you as real as our little learners? Prove it by solving this puzzle!",
      "Let’s play a quick game! Show us your human skills below!",
      "Are you a clever human like our little scholars? Prove it below!",
      "Quick! Show us you're not a robot so we can welcome you to our learning family!",
      "Join our kiddos in a mini-challenge — prove you're human below!",
      "Solve this puzzle, and you're in the Smartypants Club with our little ones!",
      "Pssst! Can you solve this like a super-smart grown-up?",
      "Our little bookworms challenge you to prove you’re human! Puzzle time!",
      "Jump into the kiddie pool by showing us your human-ness below!",
      "A quick brain teaser to join our circle of learning heroes! Prove you’re human below!"
    ]

    function getRandomValueFromArray(array) {
      if (array.length === 0) {
          return null; // return null if the array is empty
      }
  
      var randomIndex = Math.floor(Math.random() * array.length);
      return array[randomIndex];
    }

    return getRandomValueFromArray(messages);
  }

  return (
    <WLSpinnerPage itemsCentered dependencies={[contactHeaderLoaded, contactSubtitleLoaded]}>
      <Modal
        blur
        open={recaptchaModalOpen}
        onClose={() => setRecaptchaModalOpen(false)}
        closeButton
      >
        <Modal.Body      
          className="d-flex flex-column w-100 align-items-center text-center py-3"
        >
          <Text>
            {getCaptchaMessage()}
          </Text>
          <ReCAPTCHA
            onChange={handleCaptchaComplete}
            sitekey="6LfuCIwmAAAAAOx25tZVJk5Jrw4hjjYWBPHU4IhU"
          />
        </Modal.Body>
      </Modal>
      <ContactBlockHeader />
      <section className="d-flex flex-row justify-content-center">
        <div className="gap-2 d-flex flex-column align-items-start justify-content-center contact-form w-100 mx-2 my-5 mx-md-5"  style={{maxWidth: 1400}}>
          <div className="container-fluid d-flex flex-column">
            <div className="row">
              <WLHeader setLoaded={setContactHeaderLoaded} align="start" firestoreId="contact-header" editable={userCanEditText} />
              <WLText setLoaded={setContactSubtitleLoaded} align="start" firestoreId="contact-subtitle" editable={userCanEditText} />
            </div>
            <div className="row pt-2">
              <Input id="name" clearable bordered label="Your Name" fullWidth css={{display: "flex", alignItems: "start"}} />
            </div>
            <div className="row">
              <div className="col-lg-6 col-md-12 pt-2">
                <Input id="phone" clearable bordered label="Your phone" fullWidth css={{display: "flex", alignItems: "start"}} />
              </div>      
              <div className="col-lg-6 col-md-12 pt-2">
                <Input id="email" clearable bordered label="Your email" fullWidth css={{display: "flex", alignItems: "start"}} />
              </div>      
            </div>
            <div className="row pt-2">
              <Input id="contact" clearable bordered label="Preferred contact method" fullWidth css={{display: "flex", alignItems: "start"}} />
            </div>
            <div className="row pt-2">
              <Input id="location" clearable bordered label="City, State" fullWidth css={{display: "flex", alignItems: "start"}} />
            </div>
            <div className="row pt-2">
              <Textarea id="message" bordered label="How can we help?" placeholder="Tell us what you're looking for." fullWidth css={{display: "flex", alignItems: "start"}} />
            </div>
          </div>
          <div className="d-flex justify-content-center w-100 mt-3">
            <Button color="primary" shadow onPress={() => setRecaptchaModalOpen(true)}>
              Submit
            </Button>
          </div>
        </div>
      </section>
    </WLSpinnerPage>
  )
}
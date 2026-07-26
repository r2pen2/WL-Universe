import MarkEmailReadOutlinedIcon from '@mui/icons-material/MarkEmailReadOutlined';
import {WLTextV2} from "../../libraries/Web-Legos/components/Text";
import { AuthenticationManager } from '../../libraries/Web-Legos/api/auth.ts';
import { useContext, useEffect, useState } from 'react';
import { BBOMailManager, CurrentSignInContext } from '../../App';
import { Modal, Spacer, Text } from '@nextui-org/react';
import {Button, Input, Textarea} from "@mantine/core"
import { FormResponse } from '../../libraries/Web-Legos/api/admin.ts';

import ReCAPTCHA from "react-google-recaptcha";
import { IconAt } from '@tabler/icons-react';

export const Contact = () => {
   
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [recaptchaModalOpen, setRecaptchaModalOpen] = useState(false);

  const [userCanEditText, setUserCanEditText] = useState(false);

  const {currentSignIn} = useContext(CurrentSignInContext);
  const {authenticationManager} = useContext(AuthenticationManager.Context)

  useEffect(() => {
    authenticationManager.getPermission(currentSignIn, "siteText").then(p => setUserCanEditText(p));
  }, [currentSignIn, authenticationManager]);

  const ThankYou = () => (
    <div className="d-flex flex-column align-items-center justify-content-center">
      <MarkEmailReadOutlinedIcon style={{fontSize: 64}} />
      <WLTextV2>Thank you!</WLTextV2>
    </div>
  )

  const FormContent = () => {
    if (formSubmitted) {
      return <ThankYou />
    }
    return [
      <WLTextV2 editable={userCanEditText} className="richard-regular" firestoreId="contact-header" key="contact-header" />,
      <Input key="name-input" id="name" placeholder="Your Name" size='lg' aria-label='Your Name' className='kiwi w-100' />,
      <Input key="email-input" id="email" placeholder="Your Email" size='lg' aria-label='Your Email' className='kiwi w-100' leftSection={<IconAt size={16} />} />,
      <Textarea key="message-input" id="message" placeholder="Your Message" size='lg' aria-label='Message' className='kiwi w-100' />,
      <div key="button-container" className="d-flex flex-row w-100 align-items-center justify-content-center pt-4 gap-2 contact-button-container">
        <div className="contact-line"></div>
          <Button color={"#FCB393"} onClick={() => {setRecaptchaModalOpen(true)}}>
            <Text className="contact-button gibbons-regular mb-0">Contact Us</Text>
          </Button>
        <div className="contact-line"></div>
      </div>
    ]
  }

  const CaptchaModal = () => {
    
    const name = document.getElementById("name")?.value;
    const email = document.getElementById("email")?.value;
    const message = document.getElementById("message")?.value;
  
    function sendForm() {
      function getEmailBody() {
        const body = `Name: ${name}\n` +
          `Email: ${email}\n` +
          `Message: ${message}`;
        return body;
      }
  
      BBOMailManager.sendMail(
        `New BostonMixtape Contact Form Submission from ${name}`,
        getEmailBody()
      );
  
      const res = new FormResponse();
      res.content["Name"] = name;
      res.content["Email"] = email;
      res.content["Message"] = message;
      res.shortStrings.formId = "contact";
      res.shortStrings.formTitle = "Contact";
      res.sendFormData();
    }
  
  function handleCaptchaComplete(v) {
    if (v.length < 1) {
      setRecaptchaModalOpen(false);
      return;
    }
    sendForm();
    setFormSubmitted(true);
    setRecaptchaModalOpen(false);
  }
  
    return (
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
            Prove that you're human:
          </Text>
          <ReCAPTCHA
            onChange={handleCaptchaComplete}
            sitekey="6LfuCIwmAAAAAOx25tZVJk5Jrw4hjjYWBPHU4IhU"
          />
        </Modal.Body>
      </Modal>
    )
  }

  return (
    <section id="contact" className="d-flex flex-column align-items-center justify-content-center w-100" style={{position: "relative"}}>
      <Spacer y={2} />
      <div style={{maxWidth: 1000}} className='mt-3 gap-2 px-2 px-md-3 w-100 d-flex flex-column align-items-center'>
        <Spacer y={0.5} />
        <form style={{backgroundColor: "white", }} className='shadow w-100 p-2 p-md-3 d-flex flex-column align-items-center gap-2'>
          <FormContent />
        </form>
        <Spacer y={1} />
      </div>
      <CaptchaModal />
    </section>
  )
}
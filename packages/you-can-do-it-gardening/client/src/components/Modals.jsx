import { Button, Card, Modal, Text } from "@nextui-org/react";
import LaunchIcon from '@mui/icons-material/Launch';
import { scheduleInPersonLink, scheduleOnlineLink } from "../api/links";

import ComputerTwoToneIcon from '@mui/icons-material/ComputerTwoTone';
import LocationOnTwoToneIcon from '@mui/icons-material/LocationOnTwoTone';

import "../assets/style/modals.css";

/**
 * Some icon fill presets to be used in modals
 */
export const iconFills = {
  purple: "#8a4fcc",
  orange: "#f05c21",
  red: "#f0214e",
  blue: "#009bdf",
  green: "#7ac22d",
}

export function ContactModal({open, setOpen}) {
  
  function ModalOptionCard({icon, title, subtitle, href}) {

    function handleModalOptionCardPress(href) {
      window.open(href, "_blank");
    }
  
    return (
      <Card 
        isHoverable 
        isPressable
        variant="bordered" 
        onPress={() => handleModalOptionCardPress(href)}
        css={{flex:1}}
      >
        <Card.Body>
          <div className="d-none d-md-flex flex-row align-items-center justify-content-space-between">
            {icon}
            <div className="d-flex flex-column align-items-start justify-content-center w-100">
              <Text b>
                {title}
              </Text>
              <Text size="$sm">
                {subtitle}
              </Text>
            </div>
            <LaunchIcon />
          </div>
          <div className="d-flex d-md-none flex-column align-items-center justify-content-center">
            {icon}
            <Text b align="center">
              {title}
            </Text>
            <Text size="$sm" align="center">
              {subtitle}
            </Text>
            <LaunchIcon />
          </div>
        </Card.Body>
      </Card>
    )
  }
  
  function InPersonScheduleOptionCard() {
    return (
      <ModalOptionCard 
        icon={<LocationOnTwoToneIcon fontSize="large" className="mx-0 mx-md-4" style={{color: iconFills.purple}} />}
        title="In-Person Consultations" 
        subtitle="Arrange an in-person consultation in Greater Boston and beyond" 
        href={scheduleInPersonLink}
      />
    )
  }

  function VirtualScheduleOptionCard() {
    return (
      <ModalOptionCard 
        icon={<ComputerTwoToneIcon fontSize="large" className="mx-0 mx-md-4" style={{color: iconFills.purple}}/>}
        title="Virtual Consultations" 
        subtitle="Book a virtual consultation during the most convenient tme for your schedule" 
        href={scheduleOnlineLink}
      />
    )
  }

  return (
    <Modal
      closeButton
      open={open}
      blur
      width="80vw"
      onClose={() => setOpen(false)}
    >
      <Modal.Header>
        <Text h3 size="$md">
          Select a consultation type to open the form in a new tab.
        </Text>
      </Modal.Header>
      <Modal.Body>
        <div className="d-flex flex-column">
          <div className="mt-2">
            <InPersonScheduleOptionCard />
          </div>
          <div className="mt-2">
            <VirtualScheduleOptionCard />
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <div className="d-flex flex-row align-items-center justify-content-center w-100">
          <Button auto bordered color="error" onPress={() => setOpen(false)} >
              Close
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  )
}
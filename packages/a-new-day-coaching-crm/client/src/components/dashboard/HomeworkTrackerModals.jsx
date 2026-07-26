import { Button, Center, Modal, Select, Text, TextInput, Tooltip } from "@mantine/core";
import { Homework, HomeworkPriority, HomeworkSubject } from "../../api/db/dbHomework.ts";
import { notifSuccess } from "../Notifications.jsx";
import { DateInput } from "@mantine/dates";
import React from "react";
import { PickerMenu, SubjectCard } from "./HomeworkTrackerV2.jsx";
import { IconSend } from "@tabler/icons-react";
import IconButton from "../IconButton.jsx";
import { CurrentUserContext } from "../../App.jsx";
import { User } from "../../api/db/dbUser.ts";

export const AddHomeworkModal = ({userOverride = null, setFullUserData = null, open, close}) => {

  /** Get current user from react context */
  const {currentUser} = React.useContext(CurrentUserContext);
  const contextUser = userOverride ? User.getInstanceById(userOverride.id).fillData(userOverride) : currentUser;
  

  function handleFormSubmit(e) {
    e.preventDefault();
    const subject = document.getElementById('subject').value;
    const description = document.getElementById('description').value;
    const startDate = document.getElementById('start-date').value;
    const dueDate = document.getElementById('due-date').value;
    let priority = document.getElementById('priority').value;
    const estTime = document.getElementById('est-time').value;
    const href = document.getElementById('link').value;
    if (!priority) { priority = HomeworkPriority.LOW; }

    const newHomework = new Homework();
    newHomework.subject = subject;
    newHomework.description = description;
    newHomework.startDate = startDate ? new Date(startDate) : null;
    newHomework.dueDate = dueDate ? new Date(dueDate) : null;
    newHomework.priority = priority;
    newHomework.estTime = estTime;
    newHomework.href = href.length > 0 ? href : null;

    contextUser.addHomework(newHomework).then(() => {
      notifSuccess("Assignment Added", `Added assignment: "${description}"`)
      close();
      if (setFullUserData) {
        setFullUserData(contextUser);
      }
    });
  }

  function handleClose() {
    close();
  }

  return (
    <Modal opened={open} onClose={handleClose} title="Add Assignment">
      <form className="d-flex flex-column gap-2 mt-1 mb-2" onSubmit={handleFormSubmit}>
        <Select label="Subject" id="subject" placeholder="Pick a subject" data={Object.keys(contextUser.subjects).sort((a, b) => a.localeCompare(b))} searchable />
        <TextInput label="Description" id="description" required placeholder="What is this assignment?" />
        <div className="d-flex gap-2">
          <DateInput label="Start Date" id="start-date" w={"100%"} placeholder='When will you start?'/>
          <DateInput label="Due Date" id="due-date" w={"100%"} placeholder='When is it due?'/>
        </div>
        <div className="d-flex gap-2">
          <TextInput label="Estimated Time" id="est-time" placeholder="How long will it take?"  w={"100%"}  />
          <Select label="Priority" id="priority" placeholder="Pick a priority" data={[HomeworkPriority.LOW, HomeworkPriority.MEDIUM, HomeworkPriority.HIGH]} searchable />
        </div>
        <TextInput label="Link" id="link" placeholder="Do you have a link to the assignment?" />

        <div className="d-flex flex-row justify-content-end w-100">
          <Tooltip label="Add Assignment">
            <Button type="submit">
              Done
            </Button>
          </Tooltip>
        </div>
      </form>
    </Modal>
  )
}

export const AddSubjectModal = ({userOverride = null, setFullUserData = null, open, close}) => {
  
  /** Get current user from react context */
  const {currentUser} = React.useContext(CurrentUserContext);
  const contextUser = userOverride ? User.getInstanceById(userOverride.id).fillData(userOverride) : currentUser;

  const subjects = Object.values(contextUser.subjects).sort((a, b) => a.title.localeCompare(b.title));
  const hasSubjects = subjects.length > 0;

  const [newTitle, setNewTitle] = React.useState("");
  const [newColor, setNewColor] = React.useState("#ffffff");

  const SubjectList = () => {
    if (!hasSubjects) { return <Text>No subjects found. Add some to get started!</Text> }
    return subjects.map((subject, index) => <SubjectCard subject={subject} key={index} userOverride={userOverride} />)
  }

  const [error, setError] = React.useState(null);

  const resetFields = () => {
    setNewTitle("");
    setNewColor("#ffffff");
  }

  function handleFormSubmit(e) {
    if (e?.preventDefault) {
      e.preventDefault();
    }
    if (Object.keys(contextUser.subjects).includes(newTitle)) { 
      setError("Subject already exists.");
      return;
    }
    resetFields();
    close();
    const newSubject = new HomeworkSubject(newTitle, newColor);
    contextUser.addSubject(newSubject).then(() => {
      notifSuccess("Subject Added", `Added subject "${newTitle}"`)
      if (setFullUserData) {
        setFullUserData(contextUser);
      }
    });
  }

  function handleClose() {
    if (popoverOpen) { setPopoverOpen(false); return; }
    resetFields();
    close();
  }

  const [popoverOpen, setPopoverOpen] = React.useState(false);
  
  function handleEnter(e) {
    if (e.key === "Enter") {
      handleFormSubmit(e);
    }
  }

  return (
    <Modal opened={open} onClose={handleClose} title="Manage Subjects">
      <form className="d-flex gap-2 mt-1 mb-2" >
        <TextInput className="w-100" required id="title" placeholder="Subject Title" onChange={(e) => { setNewTitle(e.target.value); setError(null) }} onKeyDown={handleEnter} error={error}/>
        <PickerMenu c={newColor} setC={setNewColor} popoverOpenOverride={popoverOpen} setPopoverOpenOverride={setPopoverOpen} />
        <Center> 
          <IconButton label="Add Subject" icon={<IconSend />} onClick={handleFormSubmit} buttonProps={{size: 36}} />
        </Center>
      </form>
      <SubjectList />
    </Modal>
  )
}
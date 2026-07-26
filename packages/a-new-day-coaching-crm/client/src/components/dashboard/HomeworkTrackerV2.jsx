// Library Imports
import React, { useEffect } from "react";
import { Badge, Button, Center, Chip, ColorPicker, Divider, Indicator, Loader, Paper, Popover, Select, Spoiler, Text, TextInput, Tooltip } from "@mantine/core";
import { IconAlignJustified, IconArrowBackUp, IconCheck, IconClock, IconClockDown, IconClockUp, IconExternalLink, IconHourglassEmpty, IconInfoCircle, IconLink, IconLinkPlus, IconPlus, IconSchool, IconSend, IconSpeedboat, IconTimeline, IconTrash } from "@tabler/icons-react";
// API Imports
import { Homework, HomeworkPriority, HomeworkPriorityVerbosity, HomeworkStatus, HomeworkSubject } from "../../api/db/dbHomework.ts";
// Component Imports
import { notifSuccess } from "../Notifications";
import { CurrentUserContext } from "../../App";
import IconButton from "../IconButton.jsx";
import { getSlashDateString, parseQuickEntry } from "../../api/strings.js";
import { acceptButtonColor, deleteButtonColor, shouldUseBlackText, unpaidColor, viewButtonColor } from "../../api/color.ts";
import { DateInput } from "@mantine/dates";
import { getOrthodoxDate } from "../../api/dates.ts";
import TrackerRing, { TrackerBar, trackerOffset } from "./TrackerRing.jsx";
import { SortOrderSelector, StatusSelector, RingContextSelector} from "./HomeworkTrackerControl.jsx";
import { CRMGnatt } from "./Gnatt.jsx";

import "../../assets/style/homeworkTracker.css";
import useWindowDimensions from "../Window.jsx";
import { User } from "../../api/db/dbUser.ts";

/**
 * A card that displays a subject
 * @param {HomeworkSubject} subject - the subject to display
 **/
export const SubjectCard = ({subject, userOverride = null}) => {
  
  /** Get currentUser from react context */
  const {currentUser} = React.useContext(CurrentUserContext);
  const contextUser = userOverride ? User.getInstanceById(userOverride.id).fillData(userOverride) : currentUser;

  /** The color of the subject */
  const [c, setC] = React.useState(subject.color);

  /** When the delete button is pressed, remove the subject on the user's document */
  function handleDelete(skipConfirmation = false) {
    if (skipConfirmation || window.confirm(`Are you sure you want to delete "${subject.title}"?`)) {
      contextUser.removeSubject(subject.title).then(() => {
        notifSuccess("Subject Removed", `Removed subject "${subject.title}"`)
      });
    }
  }
  
  /** When the color is updated, update the subject on the user's document */
  function updateColor(c) {
    if (c === subject.color) { return; }
    contextUser.updateSubject(new HomeworkSubject(subject.title, c)).then(() => {
      notifSuccess("Subject Updated", `Changed the color for "${subject.title}"`)
    })
  }

  return (
    <Paper className="p-2 d-flex justify-content-between align-items-center mb-2" withBorder>
      <Text>{subject.title}</Text>
      <div className="d-flex gap-2">
        <PickerMenu c={c} setC={setC} onDone={updateColor} />
        <IconButton onClick={handleDelete} onShiftClick={() => handleDelete(true)} icon={<IconTrash />} buttonProps={{size: 36, color: "red"}} label="Delete Subject" />
      </div>
    </Paper>
  )
}

/**
 * A popover that contains a color picker
 * @param {string} c - the color
 * @param {function} setC - the setter for the color
 * @param {boolean} popoverOpenOverride - whether the popover is open
 * @param {function} setPopoverOpenOverride - the setter for the popover
 * @param {function} onDone - the function to call when the color is selected
 */
export const PickerMenu = ({c, setC, popoverOpenOverride, setPopoverOpenOverride, onDone}) => {
  /** Whether popover is open */
  const [popoverOpen, setPopoverOpen] = React.useState(false)
  
  /** When done is pressed, use the setter or setter override, then call {@link onDone} if it exists */
  const handleDone = () => { 
    setPopoverOpenOverride ? setPopoverOpenOverride(false) : setPopoverOpen(false);
    if (onDone) { onDone(c); }
  }

  /** When the preview button is pressed, toggle the popover wiht the appropriate setter function */
  function handlePreviewButtonPress() {
    if (setPopoverOpenOverride) {
      setPopoverOpenOverride((popoverOpenOverride) => !popoverOpenOverride)
      return;
    }
    setPopoverOpen((popoverOpen) => !popoverOpen);
  }

  return (
    <Popover withArrow position="bottom" shadow="md" opened={popoverOpenOverride ? popoverOpenOverride : popoverOpen}>
      <Popover.Target>
        <Tooltip label="Select Color">            
          <Button className="picker-button" onClick={handlePreviewButtonPress} style={{width: 36, height: 36, background: c}} />
        </Tooltip>
      </Popover.Target>
      <Popover.Dropdown>
        <ColorPicker value={c} onChange={setC} format="hex" swatches={['#2e2e2e', '#868e96', '#fa5252', '#e64980', '#be4bdb', '#7950f2', '#4c6ef5', '#228be6', '#15aabf', '#12b886', '#40c057', '#82c91e', '#fab005', '#fd7e14']} />
        <div className="d-flex justify-content-end w-100 mt-2">
          <Button onClick={handleDone}>Done</Button>
        </div>
      </Popover.Dropdown>
    </Popover>
  )
}

export const QuickEntryResults = ({quickExtract, userOverride = null}) => {
  
  /** Get currentUser from react context */
  const {currentUser} = React.useContext(CurrentUserContext);
  const contextUser = userOverride ? User.getInstanceById(userOverride.id).fillData(userOverride) : currentUser;

  if (!contextUser.subjects[quickExtract.subject] && !quickExtract.priority && !quickExtract.dueDate && !quickExtract.startDate && !quickExtract.href) { return null; } // There's nothing in the quickExtract to display

  const subjectColor = quickExtract.subject ? contextUser.subjects[quickExtract.subject].color : null;

  return (
    <div className="align-items-center d-flex gap-2 mt-2">
      { contextUser.subjects[quickExtract.subject] && <Badge color={subjectColor} style={{border: shouldUseBlackText(subjectColor) ? "1px solid #00000022" : null}} className={shouldUseBlackText(subjectColor) ? "text-black" : ""}>Subject: {quickExtract.subject}</Badge> }
      { quickExtract.priority && <Badge color={Homework.getPriorityColor(quickExtract.priority)}>!{quickExtract.priority}</Badge> }
      { quickExtract.startDate && <Badge color="gray">Start: {getSlashDateString(quickExtract.startDate)}</Badge> }
      { quickExtract.dueDate && <Badge color="gray">Due: {getSlashDateString(quickExtract.dueDate)}</Badge> }
      { quickExtract.href && <Badge color="gray">Link: {quickExtract.href}</Badge> }
    </div>
  )
}

export function Assignment({homeworkJson, userOverride = null, setFullUserData = null}) {

  /** Get currentUser from react context */
  const {currentUser} = React.useContext(CurrentUserContext);
  const contextUser = userOverride ? User.getInstanceById(userOverride.id).fillData(userOverride) : currentUser;

  const homework = new Homework(homeworkJson);

  const subject = contextUser.subjects[homework.subject]

  class AssignmentField extends React.Component {
    
    targetField = this.props.field;
    
    state = {
      targetField: homework[this.targetField] ? homework[this.targetField] : "",
      editPopoverOpen: false
    }
  
    handleEnter(e) { if (e.key !== "Enter") { return; } this.handleFieldChange(); }

    openPopover() {
      this.setState({editPopoverOpen: true});
      this.setState({targetField: homework[this.targetField]});
    }

    handleFieldChange(f) { console.error("handleFieldChange is not implemented on type " + this.typeof) }
  }

  class AssignmentTextField extends AssignmentField {
  
    sanitizeFieldName() {
      if (this.targetField === "estTime") { return "estimated time"; }
      if (this.targetField === "description") { return "description"; }
      return "unknown field"
    }

    handleFieldChange() {
      setTimeout(() => { this.setState({editPopoverOpen: false}); })
      if (this.state.targetField === homework[this.targetField]) { return; }
      homework[this.targetField] = this.state.targetField;
      contextUser.updateHomework(homework).then(() => {
        notifSuccess("Assignment Updated", `Changed ${this.sanitizeFieldName()} to: "${this.state.targetField}"`)
        if (setFullUserData) { setFullUserData(contextUser.data); }
      });
    }

    getSelectLabel() {
      if (this.targetField === "estTime") { return "Est Time"; }
      if (this.targetField === "description") { return "Description"; }
    }
  
    render() {
      const val = this.state.targetField ? this.state.targetField : ""
      const fieldName = this.sanitizeFieldName();
      if (!homework[this.targetField] || homework[this.targetField].length === 0) {
        return <div className="hover-clickable" onClick={this.openPopover.bind(this)}>
          <Popover opened={this.state.editPopoverOpen} onClose={() => this.setState({editPopoverOpen: false})}>
            <Popover.Target>
              <Tooltip label={`Set ${fieldName.substring(0, 1).toUpperCase()}${fieldName.substring(1)}`}>
                { this.targetField === "estTime" ? <IconHourglassEmpty /> : <IconAlignJustified /> }
              </Tooltip>
            </Popover.Target>
            <Popover.Dropdown className="d-flex flex-row gap-2 align-items-end">
              <TextInput autoFocus label={this.getSelectLabel()} value={val} onChange={(e) => this.setState({targetField: e.target.value})} onKeyDown={this.handleEnter.bind(this)} />
              <IconButton onClick={this.handleFieldChange.bind(this)} icon={<IconSend />} buttonProps={{size: 36}} label="Submit" />
            </Popover.Dropdown>
          </Popover>
        </div>
      }
      return (
        <div className="hover-clickable" onClick={this.openPopover.bind(this)}>
          <Popover opened={this.state.editPopoverOpen} onClose={() => this.setState({editPopoverOpen: false})}>
            <Popover.Target>
              <Tooltip label={`Edit ${fieldName.substring(0, 1).toUpperCase()}${fieldName.substring(1)}`}>              
                <Text>{homework[this.targetField]}</Text>
              </Tooltip>
            </Popover.Target>
            <Popover.Dropdown className="d-flex flex-row gap-2 align-items-end">
              <TextInput autoFocus label={this.getSelectLabel()} value={val} onChange={(e) => this.setState({targetField: e.target.value})} onKeyDown={this.handleEnter.bind(this)} />
              <IconButton onClick={this.handleFieldChange.bind(this)} icon={<IconSend />} buttonProps={{size: 36}} label="Submit" />
            </Popover.Dropdown>
          </Popover>
        </div>
      )
    }
  }

  class AssignmentBadgeField extends AssignmentField {
  
    sanitizeFieldName() {
      if (this.targetField === "priority") { return "priority"; }
      if (this.targetField === "subject") { return "subject"; }
      if (this.targetField === "status") { return "status"; }
      return "unknown field"
    }

    handleFieldChange(f) {
      if (f === homework[this.targetField] || f === null) { 
        setTimeout(() => { this.setState({editPopoverOpen: false}); })
        return;
      }
      homework[this.targetField] = f;
      contextUser.updateHomework(homework).then(() => {
        notifSuccess("Assignment Updated", `Set ${this.sanitizeFieldName()} to: "${f}"`)
      });
    }

    getBadgeColor() {
      switch (this.targetField) {
        case "priority":
          return Homework.getPriorityColor(homework.priority);
        case "status":
          return Homework.getStatusColor(homework);
        case "subject":
          return contextUser.subjects[homework.subject].color;
        default:
          return "#000000";
      }
    }
    
    getBadgeValue() {
      if (this.targetField === "subject") { return contextUser.subjects[homework.subject].title; }
      if (this.targetField === "priority") {
        return Homework.getPriorityStringBySetting(homework.priority, contextUser.settings.priorityVerbosity)
      }
      return homework[this.targetField];
    }

    getSelectValue() {
      if (this.targetField !== "priority") { return this.getBadgeValue(); }
      return homework[this.targetField];
    }
    
    getSelectValues() {
      if (this.targetField === "subject") { return Object.keys(contextUser.subjects); }
      if (this.targetField === "status") { return Object.values(HomeworkStatus); }
      if (this.targetField === "priority") { return Object.values(HomeworkPriority); }
    }

    PopoverTarget = () => {
      
      const DotPriority = () => {
        return (
          <Popover.Target>
            <Tooltip label="Edit Priority" position="bottom">
              <div className="p-2 d-flex flex-row align-items-center justify-content-center">
                <Indicator zIndex={1} processing={Homework.checkPriorityPulseThreshold(homework.priority, contextUser.settings.priorityPulseThreshold)} color={this.getBadgeColor()} />
              </div>
            </Tooltip>
          </Popover.Target>
        )
      }

      const fieldName = this.sanitizeFieldName();
      if (this.targetField === "subject") {
        return <Popover.Target>
          <Tooltip label="Edit Subject">
            <Badge color={subject.color} style={{border: "1px solid #00000022", color: shouldUseBlackText(subject.color) ? "#000000" : "#FFFFFF"}}>{subject.title}</Badge>
          </Tooltip>
        </Popover.Target>
      }
      if (this.targetField === "priority" && contextUser.settings.priorityVerbosity === HomeworkPriorityVerbosity.COLORS) {
        return <DotPriority />
      }
      return <Popover.Target>
        <Tooltip position="bottom" label={`Edit ${fieldName.substring(0, 1).toUpperCase()}${fieldName.substring(1)}`}>
          <Badge color={this.getBadgeColor()}>{this.getBadgeValue()}</Badge>
        </Tooltip>
      </Popover.Target>
    }

    getSelectLabel() {
      if (this.targetField === "subject") { return "Subject"; }
      if (this.targetField === "status") { return "Status"; }
      if (this.targetField === "priority") { return "Priority"; }
    }

    render() {
      return (
        <div className="hover-clickable" onClick={this.openPopover.bind(this)}>
          <Popover position="bottom-start" opened={this.state.editPopoverOpen} onClose={() => this.setState({editPopoverOpen: false})}>
            <this.PopoverTarget />
            <Popover.Dropdown>
              <Select label={this.getSelectLabel()} data={this.getSelectValues()} value={this.getSelectValue()} onChange={this.handleFieldChange.bind(this)} />
            </Popover.Dropdown>
          </Popover>
        </div>
      )
    }
  }
  
  class AssignmentDateField extends AssignmentField {
    
    handleFieldChange(date) {
      this.setState({editPopoverOpen: false});
      if (date === homework[this.targetField]) { return; }
      homework[this.targetField] = date;
      const dateType = this.targetField === "startDate" ? "start" : "due";
      contextUser.updateHomework(homework).then(() => {
        notifSuccess("Assignment Updated", `Changed ${dateType} date to: "${getSlashDateString(date)}"`)
      });
    }

    
    getDateString() {
      const d = homework[this.targetField]
      if (!d) { return ""; }
      return getSlashDateString(getOrthodoxDate(d));
    }

    getDateInputLabel() {
      if (this.targetField === "startDate") { return "Start Date"; }
      if (this.targetField === "dueDate") { return "Due Date"; }
    }

    getDateInputLabelShort() {
      if (!homework[this.targetField]) { return ""; }
      if (this.targetField === "startDate") { return "Start: "; }
      if (this.targetField === "dueDate") { return "Due: "; }
    }

    getEmptyStringPlaceholder() {
      if (this.targetField === "startDate") { return "When will you start?" }
      if (this.targetField === "dueDate") { return "When is it due?" }
    }

    getTooltipLabel() {
      if (!homework[this.targetField]) { 
        if (this.targetField === "startDate") { return "Set Start Date"; }
        if (this.targetField === "dueDate") { return "Set Due Date"; }
      }
      if (this.targetField === "startDate") { return "Edit Start Date"; }
      if (this.targetField === "dueDate") { return "Edit Due Date"; }
    }

    render() {
      if (!homework[this.targetField]) { 
        return (
          <div className="hover-clickable" onClick={this.openPopover.bind(this)}>
            <Popover opened={this.state.editPopoverOpen} onClose={() => this.setState({editPopoverOpen: false})}>
              <Popover.Target>
                <Tooltip position="bottom" label={this.getTooltipLabel()}>
                  { this.targetField === "startDate" ? <IconClockUp /> : <IconClockDown /> }
                </Tooltip>
              </Popover.Target>
              <Popover.Dropdown>
                <DateInput autoFocus onChange={this.handleFieldChange.bind(this)} label={this.getDateInputLabel()} id="start-date" w={"100%"} placeholder={homework[this.targetField] ? this.getDateString() : this.getEmptyStringPlaceholder()}/>
              </Popover.Dropdown>
            </Popover>
          </div>
        )
      }
      return (
        <div className="hover-clickable" onClick={this.openPopover.bind(this)}>
          <Popover opened={this.state.editPopoverOpen} onClose={() => this.setState({editPopoverOpen: false})}>
            <Popover.Target>
              <Tooltip position="bottom" label={this.getTooltipLabel()}>
                <Text c="dimmed">{this.getDateInputLabelShort()}{this.getDateString()}</Text>
              </Tooltip>
            </Popover.Target>
            <Popover.Dropdown>
              <DateInput autoFocus onChange={this.handleFieldChange.bind(this)} label={this.getDateInputLabel()} id="start-date" w={"100%"} placeholder={homework[this.targetField] ? this.getDateString() : this.getEmptyStringPlaceholder()}/>
            </Popover.Dropdown>
          </Popover>
        </div>
      )
    }
  }

  const AssignmentActions = () => {
    return (
      <div className="d-flex gap-2 mt-2 mt-sm-0">
         { homework.status !== HomeworkStatus.IN_PROGRESS && <IconButton onClick={() => homework.handleStart(contextUser, setFullUserData)} icon={<IconClock />} className="start-button" color="gray.5" label="Start Assignment" /> }
         { homework.status === HomeworkStatus.IN_PROGRESS && <IconButton onClick={() => homework.handlePause(contextUser, setFullUserData)} icon={<Loader size="sm" type={contextUser.settings.homeworkLoaderType} color="white" />} color="blue.5" label="Click to Pause Assignment" /> }
        <IconButton onClick={() => homework.handleComplete(contextUser, setFullUserData)} icon={<IconCheck />} className="complete-button" color={acceptButtonColor} label="Complete Assignment" />
        <IconButton onClick={() => homework.handlePause(contextUser, setFullUserData)} icon={<IconArrowBackUp />} className="incomplete-button" color={unpaidColor} label="Mark Incomplete"  />
        <IconButton onClick={() => homework.handleRemove(contextUser, false, setFullUserData)} onShiftClick={() => homework.handleRemove(contextUser, true, setFullUserData)} icon={<IconTrash />} color={deleteButtonColor} label="Delete Assignment" />
      </div>
    )
  }

  const [linkEdit, setLinkEdit] = React.useState(false);

  const ExternalLink = () => {

    const [tempLink, setTempLink] = React.useState(homework.href);

    function updateLink() {
      if (tempLink === homework.href) { setLinkEdit(false); return; } // No change
      if (tempLink === "") { setLinkEdit(false); return; } // Empty string, don't update
      homework.href = tempLink;
      contextUser.updateHomework(homework).then(() => {
        notifSuccess("Assignment Updated", `Changed link to: "${tempLink}"`)
        if (setFullUserData) { setFullUserData(contextUser) }
      });
      setLinkEdit(false);
    }

    function deleteLink() {
      if (!homework.href) { return; }
      homework.href = null;
      contextUser.updateHomework(homework).then(() => {
        notifSuccess("Assignment Updated", `Removed link from assignment: "${homework.description}"`)
        if (setFullUserData) { setFullUserData(contextUser) }
      });
    }

    if (linkEdit) {
      return (
        <div className="d-flex flex-row align-items-center gap-2">        
          <TextInput size="xs" placeholder="Enter assignment link..." c="dimmed" value={tempLink} onKeyDown={(e) => { if (e.key === "Enter") { updateLink() } }} onBlur={updateLink} onChange={(e) => setTempLink(e.target.value)} />
          <Tooltip onClick={() => setLinkEdit(true)} position="right" label={"Done"}>       
            <Center style={{cursor: "pointer"}}>
              <IconCheck size="1rem"/>
            </Center>
          </Tooltip>
          <Tooltip onClick={deleteLink} position="right" label={"Remove Link"}>       
            <Center style={{cursor: "pointer"}}>
              <IconTrash size="1rem"/>
            </Center>
          </Tooltip>
        </div>
      )
    }

    if (!homework.href) {
      return (
        <Tooltip onClick={() => setLinkEdit(true)} position="right" label={"Add Assignment Link"}>       
          <Center style={{cursor: "pointer"}}>
            <IconLinkPlus size="1rem"/>
          </Center>
        </Tooltip>
      )
    }

    return (
      <div className="d-flex flex-row align-items-center gap-2">      
        <Tooltip onClick={() => Homework.openLink(homework)} position="right" label={"Open Assignment"}>       
          <Center style={{cursor: "pointer"}}>
            <IconExternalLink size="1rem"/>
          </Center>
        </Tooltip>
        <Tooltip onClick={() => setLinkEdit(true)} position="right" label={"Edit Assignment Link"}>       
          <Center style={{cursor: "pointer"}}>
            <IconLink size="1rem"/>
          </Center>
        </Tooltip>
      </div>
    )
  }

  return (
    <div className={"container-fluid border-gray-bottom p-2 " + (homework.status === HomeworkStatus.COMPLETED ? "homework-completed pb-1" : "homework-incomplete pb-2")}>
      <div className="row d-flex flex-row align-items-center justify-content-between">
        
        <div className="col-12 col-sm-8 d-flex flex-column align-items-start justify-content-start">
          <div className="d-flex gap-2 align-items-center mb-1 w-100">
            <div className="completed-check">
              <Tooltip label="This is done!" >
                <IconCheck color="green" />
              </Tooltip>
            </div>
            <div className="d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-start gap-sm-2 gap-1 w-100" style={{flexWrap: "wrap"}}>
              <div className="d-flex mt-sm-0 mt-1 justify-content-between justify-content-sm-start gap-2">
                <AssignmentBadgeField field="subject" />
                <div className="d-sm-none d-flex gap-2">
                  <Divider orientation="vertical"/>
                  <AssignmentBadgeField field="priority" />
                  <Divider orientation="vertical" />
                  <ExternalLink />
                </div>
              </div>
              <div className="d-none d-sm-flex">
                <ExternalLink />
              </div>
              <AssignmentTextField field="description" />
            </div>
          </div>
          <div className="d-flex gap-2 align-items-center homework-deadline-info" style={{flexWrap: "wrap"}}>
            <AssignmentDateField field="startDate" />
            <Divider orientation="vertical"/>
            <AssignmentDateField field="dueDate" />
            <Divider orientation="vertical" className="d-none d-sm-block" />
            <div className="d-none d-sm-block">
              <AssignmentBadgeField field="priority" />
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-4 d-flex flex-row gap-2 align-items-center justify-content-sm-end justify-content-between" style={{flexWrap: "wrap"}}>
          <AssignmentTextField field="estTime" />
          <Divider orientation="vertical" className="d-none d-sm-block"/>
          <AssignmentActions />
        </div>
      </div>
    </div>
  )
}

export const Tracker = ({setSubjectAddMenuOpen, setHomeworkAddMenuOpen, userOverride = null, setFullUserData = null}) => {
  
  const [unitType, setUnitType] = React.useState("Forever");

  const [onGnatt, setOnGnatt] = React.useState(false);

  const onQuickEntryChange = (e) => { setQuickEntryString(e.target.value); extractQuickEntry(); } 

  function handleAddAssignmentPress() {
    if (quickEntryString.length > 0 && quickExtract.subject) {
      sendQuickEntry();
    } else {
      setQuickEntryString("")
      setHomeworkAddMenuOpen(true);
    }
  }

  
  /** Get current user from react context */
  const {currentUser} = React.useContext(CurrentUserContext);
  const contextUser = userOverride ? User.getInstanceById(userOverride.id).fillData(userOverride) : currentUser;

  const [showCompleted, setShowCompleted] = React.useState(false)

  const [quickEntryString, setQuickEntryString] = React.useState("");
  const [quickExtract, setQuickExtract] = React.useState({
    subject: null,
    description: null,
    startDate: null,
    dueDate: null,
    priority: null
  });

  const [selectedSubjects, setSelectedSubjects] = React.useState(Object.keys(contextUser.subjects));

  useEffect(() => {
    setSelectedSubjects(Object.keys(contextUser.subjects));
  }, [contextUser.subjects])
  
  React.useEffect(() => {
    extractQuickEntry();
    contextUser.purgeAssignments();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quickEntryString]);  // Dependency array includes quickEntryString

  function extractQuickEntry() {
    const props = parseQuickEntry(quickEntryString);
    for (const key of Object.keys(contextUser.subjects)) {
      if (key && props.subject) {
        if (key.replaceAll(" ", "").toLowerCase() === props.subject.toLowerCase()) {
          props.subject = key;
          break;
        }
      }
    }
    setQuickExtract(props);
    setQuickEntryError(null);
  }

  const [quickEntryError, setQuickEntryError] = React.useState(null)

  function onQuickEntryKeyDown(e) {
    if (e.key !== "Enter") { return; }
    sendQuickEntry();
  }

  function sendQuickEntry() {
    const newHomework = new Homework();
    newHomework.subject = quickExtract.subject;
    newHomework.description = quickExtract.description;
    newHomework.startDate = quickExtract.startDate ? new Date(quickExtract.startDate) : null;
    newHomework.dueDate = quickExtract.dueDate ? new Date(quickExtract.dueDate) : null;
    newHomework.priority = quickExtract.priority ? quickExtract.priority : HomeworkPriority.LOW;
    newHomework.href = quickExtract.href ? quickExtract.href : null;
    
    if (!newHomework.subject) { setQuickEntryError("Please specify a subject."); return; }
    if (!contextUser.subjects[newHomework.subject]) { 
      if (window.confirm(`Subject "${newHomework.subject}" does not exist. Would you like to create it?`)) {
        contextUser.addSubject(new HomeworkSubject(newHomework.subject, "#ffffff")).then(() => {
          notifSuccess("Subject Added", `Added subject "${newHomework.subject}"`)
        });
      } else { return; }
    }

    setQuickEntryString("");
    contextUser.addHomework(newHomework).then(() => {
      notifSuccess("Assignment Added", `Added assignment: "${newHomework.description}"`)
      if (setFullUserData) { setFullUserData(contextUser) }
    });
  }

  const [sortType, setSortType] = React.useState("Priority")
  
  function sortingAlg(a, b) {
    if (sortType === "Priority") {
      return Homework.getPriorityValue(b) - Homework.getPriorityValue(a);
    }
    if (sortType === "Due Date") {
      if (!a.dueDate) { return 1; }
      return a.dueDate - b.dueDate;
    }
    if (sortType === "Start Date") {
      if (!a.startDate) { return 1; }
      return a.startDate - b.startDate;
    }
    if (sortType === "Subject") {
      return a.subject.localeCompare(b.subject);
    }
  }

  const completedHomeworks = contextUser.homework.filter(hw => hw.status === HomeworkStatus.COMPLETED && showCompleted).sort((a, b) => sortingAlg(a, b));
  const validHomeworks = Object.values(contextUser.homework).filter(hw => hw.status !== HomeworkStatus.COMPLETED).filter(hw => selectedSubjects.includes(hw.subject)).sort((a, b) => sortingAlg(a, b)).concat(completedHomeworks);

  const TrackerControls = () => (
    <div className='tracker-controls gap-2'>
      <RingContextSelector unitType={unitType} setUnitType={setUnitType} />
      <StatusSelector showCompleted={showCompleted} setShowCompleted={setShowCompleted} />
      {!onGnatt && <SortOrderSelector sortType={sortType} setSortType={setSortType} />}
    </div>
  )

  const SubjectFilter = () => {
    
    
    return (
      <Paper withBorder className='p-2 gap-2 chip-container' >
        <IconButton label="Manage Subjects" icon={<IconSchool />} buttonProps={{size: 36}} onClick={() => setSubjectAddMenuOpen(true)} />
        <Divider orientation="vertical" />
        {Object.keys(contextUser.subjects).map((subject, index) => <SubjectChip userOverride={userOverride} selectedSubjects={selectedSubjects} setSelectedSubjects={setSelectedSubjects} subject={subject} key={index} />)}
      </Paper>
  )}
  
  const { height, width } = useWindowDimensions();

  const AssignmentTable = () => validHomeworks.map((homework, index) => !onGnatt && <Assignment setFullUserData={setFullUserData} userOverride={userOverride} key={index} homeworkJson={homework} />)
  
  const NoDataNotif = () => (
    <div className="d-flex flex-row align-items-center justify-content-cneter p-5 w-100 text-center">
      <Text className="w-100">You don't have any assignments that match your current filters. Try adding an assignment or changing your filter settings.</Text>
    </div>
  )
  
  return (
    <div className="d-flex flex-column" >
      <Paper withBorder className="tracker-header">
        <h3 className="text-md-center text-start p-2 d-flex justify-content-between justify-content-md-center tracker-header-text">
          {userOverride ? `${userOverride.personalData.displayName}'s` : "My"} Assignments
          <IconButton label={onGnatt ? "Switch to Table" : "Switch to Gantt Chart"} className="d-block d-md-none" icon={<IconTimeline />} buttonProps={{size: 36}} onClick={() => setOnGnatt(!onGnatt)} />
        </h3>
        <TrackerBar unitType={unitType} selectedSubjects={selectedSubjects} userOverride={userOverride}/>
        <div className="d-flex flex-row w-100" >
          <div className="ring-container d-none d-md-flex" >
            <TrackerRing unitType={unitType} selectedSubjects={selectedSubjects} onGnatt={onGnatt} setOnGnatt={setOnGnatt} userOverride={userOverride}/>
          </div>
          <div className="d-flex w-100 flex-column px-2 align-items-start">
            <TrackerControls />
            <div className="tracker-inputs gap-1" >
              <div className='gap-2 mt-1 d-flex flex-row w-100 justify-content-start' >
                <TextInput error={quickEntryError} placeholder='Quick Entry' className='w-100' leftSection={<IconSpeedboat />} value={quickEntryString} onChange={onQuickEntryChange} onKeyDown={onQuickEntryKeyDown} />        
                <Popover>
                  <Popover.Target>
                    <Center><IconButton onClick={() => {}} label="Quick Entry Help" icon={<IconInfoCircle />} buttonProps={{size: 32}} /></Center>
                  </Popover.Target>
                  <Popover.Dropdown>
                    <Text>
                      <Text>How to use Quick Entry</Text>
                      <Text size="sm" c="dimmed">#subject</Text>
                      <Text size="sm" c="dimmed">start:(date)</Text>
                      <Text size="sm" c="dimmed">due:(date)</Text>
                      <Text size="sm" c="dimmed">!high !med !low</Text>
                      <Text size="sm" c="dimmed">{">"}www.link.com</Text>
                    </Text>
                  </Popover.Dropdown>
                </Popover>
                <Center><IconButton label="Add Assignment" icon={<IconPlus />} buttonProps={{size: 32}} onClick={handleAddAssignmentPress} /></Center>
              </div>
              <Spoiler maxHeight={width >= 1000 ? 60 : 130} showLabel="Expand Subjects" hideLabel="Collapse Subjects">
                <SubjectFilter />
              </Spoiler>
            </div>
          <QuickEntryResults key="quick-results" userOverride={userOverride} quickExtract={quickExtract} />
          </div>
        </div>
      </Paper>
      <div className="coaching-line"></div>
      <Spoiler key="expander" maxHeight={120 * 10} showLabel="Expand Assignment Tracker" hideLabel="Collapse Assignment Tracker" className="mt-1">
        <Paper withBorder className="w-100">
          <AssignmentTable />
          {validHomeworks.length <= 0 &&  !onGnatt && <NoDataNotif />}
          {onGnatt && <CRMGnatt assignments={validHomeworks} userSubjects={contextUser.subjects} />}
        </Paper>
      </Spoiler>
    </div>
  )
}

const SubjectChip = ({subject, selectedSubjects, setSelectedSubjects, userOverride = null}) => {

  const {currentUser} = React.useContext(CurrentUserContext);
  const contextUser = userOverride ? User.getInstanceById(userOverride.id).fillData(userOverride) : currentUser;

  const selected = selectedSubjects.includes(subject)

  function handleChipClick() {
    if (selected) {
      setSelectedSubjects(selectedSubjects.filter(s => s !== subject));
    } else {
      setSelectedSubjects([...selectedSubjects, subject]);
    }
  }

  const dark = shouldUseBlackText(contextUser.subjects[subject].color);

  const [color, setColor] = React.useState(contextUser.subjects[subject].color)

  useEffect(() => {
    setColor(contextUser.subjects[subject].color)
  }, [contextUser.subjects, subject])
  
  const ChipDivider = () => {
    const sKeys = Object.keys(contextUser.subjects)
    if (subject === sKeys[sKeys.length - 1]) { return; }
    return <Divider orientation="vertical" />
  }

  return (
    <div className="d-flex gap-2">
      <Chip variant={selected ? "filled" : "outline"} checked={selected} style={{border: dark && selected ? "1px solid #00000022" : ""}} color={color} readOnly onClick={handleChipClick} className={dark ? "subject-chip subject-chip-dark" : "subject-chip"}>
        <Text size="sm" className="chip-text">{subject}</Text>
      </Chip>
      <ChipDivider />
    </div>
  )
}
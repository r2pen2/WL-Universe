// Library Imports
import { Button, Divider, Link, Loading, Text, Textarea } from "@nextui-org/react";

// Style Imports
import "../assets/style/text.css";
import { useEffect, useRef, useState, useLayoutEffect, Component } from "react";
import { HTMLToMarkdown, markdownToHTML } from "../api/strings";
import { getHostname } from "../api/development.ts";

const developmentHostname = getHostname();

/**
 * A simple indented text block
 * @param {string} size - text size
 * @param {string} color - text block color
 * @param {React.ReactNode} children - text to render
 * @returns
 */
export function TextBlock(props) {
  return (
    <Text align="left" size={props.size} color={props.color} className="web-legos-text-indent">
      {props.children}
    </Text>
  )
}

/**
 * Editable text component compatible with {@link https://github.com/r2pen2/Server-Legos}. Fetches text from the server
 * on mount and sends updates onBlur when in edit mode.
 * @deprecated in favor of {@link WLTextV2}
 * @param {Function} setLoaded - function for {@link WLText} to call when the text is fetched from server
 * @param {React.JSX.Element} children - whether to indent text
 * @param {boolean} indent - whether to indent text
 * @param {string} align - text alignment
 * @param {string} color - text color
 * @param {number} size - text size
 * @param {boolean} editable - whether this text is currently editable
 * @param {string} firestoreId - id for this text in its firestoreCollection
 * @param {boolean} showSpinner - whether to show a loading spinner
 * @default
 * shopSpinner = false;
 * @returns
 */
export function WLText(props) {

  // Create states
  const [originalText, setOriginalText] = useState("");   // Text first received from DB
  const [editableText, setEditableText] = useState("");   // Current value of the Textfield if editing
  const [showSaved, setShowSaved] = useState(false);      // Whether to show the "Changes saved" message
  const [editMode, setEditMode] = useState(false);        // Whether the user is editing this WLText
  const [paragraphs, setParagraphs] = useState(null);     // Paragraphs from DB to present
  const [fetched, setFetched] = useState(false);          // Whether we got a server response.

  /**
   * A formatted WLParagraph from the WLText props after pulling from DB
   * @param {string} paragraphText - text to render in this paragraph
   */
  function WLParagraph({paragraphText}) {

    /** React ref for inserting HTML to paragraphs after component mount */
    const ref = useRef(null);

    /**
     * Get the correct css classes by WLText props
     * @returns classes for <Text /> component
     */
    function getWLTextClasses() {
      let classes = "";
      if (props.indent) { classes += "web-legos-text-indent "; }
      if (props.textClasses) { classes += props.textClasses + " "; }
      return classes;
    }

    // When component mounts, set innerHTML to text from DB + add any prefix
    useEffect(() => {
      ref.current.innerHTML = (props.prefix ? props.prefix : "") + paragraphText;
    })

    // If this is a header, render as a header.
    if (props.headerLevel) {
      switch (props.headerLevel) {
        case 1:
          return <Text ref={ref} h1 align={props.align} size={props.size} color={props.color} className={getWLTextClasses() + " web-legos-header-1"}/>;
        case 2:
          return <Text ref={ref} h2 align={props.align} size={props.size} color={props.color} className={getWLTextClasses() + " web-legos-header-2"}/>;
        case 3:
          return <Text ref={ref} h3 align={props.align} size={props.size} color={props.color} className={getWLTextClasses() + " web-legos-header-3"}/>;
        case 4:
          return <Text ref={ref} h4 align={props.align} size={props.size} color={props.color} className={getWLTextClasses() + " web-legos-header-4"}/>;
        case 5:
          return <Text ref={ref} h5 align={props.align} size={props.size} color={props.color} className={getWLTextClasses() + " web-legos-header-5"}/>;
        default:
          return;
      }
    }

    // Return paragraph
    return <Text ref={ref} align={props.align} size={props.size ? props.size : "$md"} color={props.color} className={getWLTextClasses()}>{props.children}</Text>;
  }

  // When the component mounts, request the necessary siteText from server and let all parent components know that data has been loaded.
  useLayoutEffect(() => {
    if (!props.firestoreId) {
      // No need to query DB if there's no firestoreId defined
      setParagraphs([]);
      if (props.setLoaded) {
        props.setLoaded(true);
      }
      return;
    }
    // Ask DB for the right text
    fetch(`${developmentHostname}/site-text?id=${props.firestoreId}`).then((res) => {
      res.text().then((text) => {
        const gotResponse = !text.includes("<!DOCTYPE html>");
        setFetched(gotResponse);
        // Split into paragraphs at line breaks
        if (gotResponse) {
          setParagraphs(text.split("<br/>"));
        }
        // And convert HTML into markdown for editing
        const markdownText = HTMLToMarkdown(text);
        setOriginalText(markdownText);
        setEditableText(markdownText);
        // Tell parent components that we're ready
        if (props.setLoaded) {
          props.setLoaded(true);
        }
      })
    })
  }, [props.firestoreId, props.indent, props.setLoaded, props]);

  /**
   * Set {@link editableText} and {@link showSaved} states when text area's value is updated
   * @param {Event} e - text change event
   */
  function handleTextareaChange(e) {
    const newText = e.target.value;
    setEditableText(newText);
    setShowSaved(false);
  }

  /**
   * Handle save changes button click by sending new text to /site-text and reloading the page after one second.
   */
  function sendTextUpdateToServer() {
    if (editableText === originalText) { setEditMode(false); return; }
    setOriginalText(editableText);
    fetch(`${developmentHostname}/site-text`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        id: props.firestoreId,
        newText: markdownToHTML(editableText),
      }),
    });
    setShowSaved(true);
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  }

  if (editMode) {
    // If we're in edit mode, return a Textarea and buttons to save / cancel
    return (
      <div className="d-flex flex-column align-items-center justify-content-center w-100 gap-2">
        <Textarea fullWidth helperColor={showSaved ? "success" : null} status={showSaved ? "success" : null} helperText={showSaved ? "Your changes have been saved!" : null} label={`Editing Text: ${props.firestoreId}`} value={editableText} onChange={handleTextareaChange}/>
        <div className="d-flex flex-row gap-2">
          { editMode && <Button color="error" onClick={() => setEditMode(false)} flat>Cancel</Button> }
          { editMode && <Button color="success" onClick={sendTextUpdateToServer} flat>Save Changes</Button> }
        </div>
      </div>
    )
  }

  /**
   * Render paragraphs retrieved from server with appropriate parameters
   * @returns paragraphs from server mapped to {@link WLParagraph} components
   */
  function renderParagraphs() {
    return paragraphs.map((p, index) => {
      return <WLParagraph paragraphText={p} key={`${props.firestoreId}-${index}`} />;
    });
  }

  return (
    <div data-testid={props["data-testid"]} className={"d-flex flex-column gap-2 w-100 px-2 px-md-3 " + (props.editable ? "web-legos-text-editable" : "")} onClick={() => setEditMode(props.editable)}>
      { paragraphs ? renderParagraphs() : (props.showSpinner && <Loading color="primary" />) }
      { editMode && <Button color="success" onClick={sendTextUpdateToServer}>Save Changes</Button> }
      { !fetched && props.children && <WLParagraph paragraphText={markdownToHTML(props.children)} /> }
    </div>
  )
}

/**
 * Web-Legos text block. Aligns paragraphs left and indents by default.
 * @param {Function} setLoaded - function for {@link WLText} to call when the text is fetched from server
 * @param {boolean} indent - whether paragraphs are indented
 * @param {string} align - paragraph alignment
 * @param {string} color - text color
 * @param {string} size - text size
 * @param {string} firestoreId - ID of the siteText that this header pulls from
 * @param {boolean} editable - whether the current user has permission to edit this header
 * @param {string} textClasses - classes to apply on text inside the returned {@link WLText} component
 * @param {React.ReactNode} children - component children (static text)
 * @param {boolean} showSpinner - whether to show a loading spinner
 * @default
 * indent = true
 * align = "left"
 * headerLevel = 1
 * @returns
 */
export function WLTextBlock(props) {
  return <WLText showSpinner={props.showSpinner} setLoaded={props.setLoaded} indent={true} align="left" color={props.color} size={props.size} firestoreId={props.firestoreId} editable={props.editable} textClasses="web-legos-scaling-text-block">{props.children}</WLText>;
}

/**
 * Web-Legos editable header
 * @deprecated in favor of {@link WLHeaderV2}
 * @param {Function} setLoaded - function for {@link WLText} to call when the text is fetched from server
 * @param {string} align - header alignment
 * @param {string} color - header color
 * @param {string} size - header size
 * @param {string} firestoreId - ID of the siteText that this header pulls from
 * @param {boolean} editable - whether the current user has permission to edit this header
 * @param {number} headerLevel - level of header to display (ex. 1, 2, 3, etc.)
 * @param {string} textClasses - classes to apply on text inside the returned {@link WLText} component
 * @param {React.ReactNode} children - component children (static text)
 * @param {boolean} showSpinner - whether to show a loading spinner
 * @default
 * align = "center"
 * headerLevel = 1
 * @returns
 */
export function WLHeader(props) {
  return <WLText data-testid={props["data-testid"]} showSpinner={props.showSpinner} setLoaded={props.setLoaded} align={props.align} color={props.color} size={props.size} firestoreId={props.firestoreId} editable={props.editable} headerLevel={props.headerLevel ? props.headerLevel : 1} textClasses="web-legos-scaling-header">{props.children}</WLText>;
}

/**
 * Web-Legos editable header
 * @param {Function} setLoaded - function for {@link WLText} to call when the text is fetched from server
 * @param {string} align - header alignment
 * @param {string} color - header color
 * @param {string} size - header size
 * @param {string} firestoreId - ID of the siteText that this header pulls from
 * @param {boolean} editable - whether the current user has permission to edit this header
 * @param {number} headerLevel - level of header to display (ex. 1, 2, 3, etc.)
 * @param {string} textClasses - classes to apply on text inside the returned {@link WLText} component
 * @param {React.ReactNode} children - component children (static text)
 * @param {boolean} showSpinner - whether to show a loading spinner
 * @param {string} spinnerStyle - loading spinner type
 * @param {Object} spinnerCss - loading spinner css
 * @default
 * align = "center"
 * headerLevel = 1
 * @returns
 */
export function WLHeaderV2(props) {

  const headerLevel = props.headerLevel ? props.headerLevel : getHeaderLevel();

  function getHeaderLevel() {
    if (props.h2) { return 2; }
    if (props.h3) { return 3; }
    if (props.h4) { return 4; }
    if (props.h5) { return 5; }
    if (props.h6) { return 6; }
    return 1;
  }

  return <WLTextV2 b={props.b} spinnerCss={props.spinnerCss} spinnerStyle={props.spinnerStyle} data-testid={props["data-testid"]} showSpinner={props.showSpinner} setLoaded={props.setLoaded} align={props.align} color={props.color} size={props.size} firestoreId={props.firestoreId} editable={props.editable} headerLevel={headerLevel} textClasses={"web-legos-scaling-header " + props.className}>{props.children}</WLTextV2>;
}

/**
 * Web-Legos editable text, size small, with a built in copyright prefix. Always looks for siteText with firestoreId="copyright"
 * @param {boolean} editable - whether the current user has permission to edit the copyright
 */
export function WLCopyright({editable}) {
  return (
    <WLText firestoreId="copyright" size="$sm" editable={editable} prefix="Copyright © " />
  )
}

/**
 * A page header with a textured background
 * @param {string} color - color to overlay on background
 * @param {string} backgroundVariant - background variant key (ex. )
 * @param {string} text - text to place inside WLBlockHeader
 * @todo add other backgrounds lol
 */
export class WLBlockHeader extends Component {
  /**
   * Button for jumping to a section on the page from the WLBlockHeader
   * @param {string} title - text to display in section button
   * @param {string} sectionId - id of the section that you would like to jump to on button click
   * @returns
   */
  static Section({title, sectionId}) {

    function handleClick() {
      window.location.hash = "";
      window.location.hash = `#${sectionId}`;
    }

    return (
      <div className="col-lg-3 col-md-12 d-flex flex-column align-items-center">
        <Link block color="white" size="md" onClick={handleClick}>
          <Text color="white">
            {title}
          </Text>
        </Link>
      </div>
    )
  }

  render() {
    return (
      <section style={{marginBottom: "2rem"}} className={`web-legos-header-block web-legos-header-block-background-` + this.props.backgroundVariant} >
        <div className={`${this.props.short ? "web-legos-header-block-short" : ""} web-legos-header-block-color`} style={{backgroundColor: this.props.color}}>
          <WLHeader color="white">
            {this.props.text}
          </WLHeader>
          { this.props.children && (
            <div className="container">
              <div className="row d-flex flex-row justify-content-center" style={{color: "white"}}>
                { this.props.children }
              </div>
            </div>
          ) }
        </div>
      </section>
    )
  }
}

/**
 * A quote block with colors and author decorations
 */
export class QuoteBlock extends Component {

  outlineColor = this.props.outlineColor ? this.props.outlineColor : "#d4d4d4";
  outlineWeight = this.props.outlineWeight ? this.props.outlineWeight : "1px";

  quoteSvg = (
    <svg id="Layer_1" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" style={{borderRadius: "50%", border: `${this.outlineWeight} solid ${this.outlineColor}`, maxWidth: 50}}>
      <path fill={this.props.color} d="M30,20.07C23.8,22.7,19.19,26.26,19.19,31.52c0,4.6,4.35,5.65,8.81,6.7.8.13,1.72,2,1.72,3.56,0,3.54-2.77,5.91-6.71,5.91-5.79,0-11.57-4.73-11.57-13.41,0-9.34,8.41-15.52,16.83-17.88Zm23.16,0C47,22.7,42.34,26.26,42.34,31.52c0,4.6,4.47,5.65,8.95,6.7.79.13,1.71,2,1.71,3.56,0,3.54-2.89,5.91-6.71,5.91-5.79,0-11.57-4.73-11.57-13.41,0-9.34,8.42-15.52,16.83-17.88Z"></path>
    </svg>
  )

  quoteRightSvg = (
    <svg id="Layer_1" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" style={{transform:"scale(-1,1)", borderRadius: "50%", border: `${this.outlineWeight} solid ${this.outlineColor}`, maxWidth: 50}}>
      <path fill={this.props.color} d="M30,20.07C23.8,22.7,19.19,26.26,19.19,31.52c0,4.6,4.35,5.65,8.81,6.7.8.13,1.72,2,1.72,3.56,0,3.54-2.77,5.91-6.71,5.91-5.79,0-11.57-4.73-11.57-13.41,0-9.34,8.41-15.52,16.83-17.88Zm23.16,0C47,22.7,42.34,26.26,42.34,31.52c0,4.6,4.47,5.65,8.95,6.7.79.13,1.71,2,1.71,3.56,0,3.54-2.89,5.91-6.71,5.91-5.79,0-11.57-4.73-11.57-13.41,0-9.34,8.42-15.52,16.83-17.88Z"></path>
    </svg>
  )

  static Text(props) {
    return (
      <Text align="center" size="$lg">
        {props.children}
      </Text>
    )
  }

  static Author(props) {
    return (
      <div className="flex-row d-flex align-items-center justify-content-start gap-2">
        <Text b>
          {!props.decoration && "— " }
          {props.name}
        </Text>
        {props.decoration && <Divider style={{width: "1rem"}} /> }
        {props.decoration}
      </div>
    )
  }

  render() {
    return (
      <div className="container d-flex flex-row">
        <div className="col-1 gap-2 d-flex flex-column align-items-center justify-content-between py-2">
          {this.quoteSvg}
        </div>
        <div className="col-10 p-2 gap-2 d-flex flex-column align-items-center justify-content-center">
          {this.props.children}
        </div>
        <div className="col-1 gap-2 d-flex flex-column align-items-center justify-content-start py-2">
          {this.quoteRightSvg}
        </div>
      </div>
    )
  }
}

export async function getWLText(firestoreId) {
  return new Promise((resolve, reject) => {
    fetch(`${developmentHostname}/site-text?id=${firestoreId}`).then((res) => {
      res.text().then((text) => {
        const markdownText = HTMLToMarkdown(text);
        resolve(markdownText);
      })
    })
  })
}

/**
 * Editable text component compatible with {@link https://github.com/r2pen2/Server-Legos}. Fetches text from the server
 * on mount and sends updates onBlur when in edit mode.
 * @param {Function} setLoaded - function for {@link WLText} to call when the text is fetched from server
 * @param {React.JSX.Element} children - whether to indent text
 * @param {boolean} indent - whether to indent text
 * @param {string} align - text alignment
 * @param {string} color - text color
 * @param {number} size - text size
 * @param {boolean} editable - whether this text is currently editable
 * @param {string} firestoreId - id for this text in its firestoreCollection
 * @param {boolean} showSpinner - whether to show a loading spinner
 * @param {string} spinnerStyle - loading spinner type
 * @param {Object} spinnerCss - loading spinner css
 * @default
 * shopSpinner = false;
 * @returns
 */
export function WLTextV2(props) {

  // Create states
  const [originalText, setOriginalText] = useState("");   // Text first received from DB
  const [editableText, setEditableText] = useState("");   // Current value of the Textfield if editing
  const [showSaved, setShowSaved] = useState(false);      // Whether to show the "Changes saved" message
  const [editMode, setEditMode] = useState(false);        // Whether the user is editing this WLText
  const [paragraphs, setParagraphs] = useState(null);     // Paragraphs from DB to present
  const [fetched, setFetched] = useState(false);          // Whether we got a server response.

  /**
   * A formatted WLParagraph from the WLText props after pulling from DB
   * @param {string} paragraphText - text to render in this paragraph
   */
  function WLParagraph({paragraphText}) {

    /** React ref for inserting HTML to paragraphs after component mount */
    const ref = useRef(null);

    /**
     * Get the correct css classes by WLText props
     * @returns classes for <Text /> component
     */
    function getWLTextClasses() {
      let classes = "";
      if (props.indent) { classes += "web-legos-text-indent "; }
      if (props.textClasses) { classes += props.textClasses + " "; }
      if (props.className) { classes += props.className + " "; }
      return classes;
    }

    // When component mounts, set innerHTML to text from DB + add any prefix
    useEffect(() => {
      ref.current.innerHTML = (props.prefix ? props.prefix : "") + paragraphText;
    })

    // If this is a header, render as a header.
    if (props.headerLevel) {
      switch (props.headerLevel) {
        case 1:
          return <Text ref={ref} b={props.b} h1 align={props.align} size={props.size} color={props.color} className={getWLTextClasses() + " web-legos-header-1"}/>;
        case 2:
          return <Text ref={ref} b={props.b} h2 align={props.align} size={props.size} color={props.color} className={getWLTextClasses() + " web-legos-header-2"}/>;
        case 3:
          return <Text ref={ref} b={props.b} h3 align={props.align} size={props.size} color={props.color} className={getWLTextClasses() + " web-legos-header-3"}/>;
        case 4:
          return <Text ref={ref} b={props.b} h4 align={props.align} size={props.size} color={props.color} className={getWLTextClasses() + " web-legos-header-4"}/>;
        case 5:
          return <Text ref={ref} b={props.b} h5 align={props.align} size={props.size} color={props.color} className={getWLTextClasses() + " web-legos-header-5"}/>;
        default:
          return;
      }
    }

    // Return paragraph
    return <Text ref={ref} style={{margin: 0}} b={props.b} align={props.align} size={props.size ? props.size : "$md"} color={props.color} className={getWLTextClasses()}>{props.children}</Text>;
  }

  // When the component mounts, request the necessary siteText from server and let all parent components know that data has been loaded.
  useLayoutEffect(() => {
    if (!props.firestoreId) {
      // No need to query DB if there's no firestoreId defined
      setParagraphs([]);
      if (props.setLoaded) {
        props.setLoaded(true);
      }
      return;
    }
    // Ask DB for the right text
    fetch(`${developmentHostname}/site-text?id=${props.firestoreId}`).then((res) => {
      res.text().then((text) => {
        const gotResponse = !text.includes("<!DOCTYPE html>");
        setFetched(gotResponse);
        // Split into paragraphs at line breaks
        if (gotResponse) {
          setParagraphs(text.split("<br/>"));
        }
        // And convert HTML into markdown for editing
        const markdownText = HTMLToMarkdown(text);
        setOriginalText(markdownText);
        setEditableText(markdownText);
        // Tell parent components that we're ready
        if (props.setLoaded) {
          props.setLoaded(true);
        }
      })
    })
  }, [props.firestoreId, props.indent, props.setLoaded, props]);

  /**
   * Set {@link editableText} and {@link showSaved} states when text area's value is updated
   * @param {Event} e - text change event
   */
  function handleTextareaChange(e) {
    const newText = e.target.value;
    setEditableText(newText);
    setShowSaved(false);
  }

  /**
   * Handle save changes button click by sending new text to /site-text and reloading the page after one second.
   */
  function sendTextUpdateToServer() {
    if (editableText === originalText) { setEditMode(false); return; }
    setOriginalText(editableText);
    fetch(`${developmentHostname}/site-text`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        id: props.firestoreId,
        newText: markdownToHTML(editableText),
      }),
    });
    setShowSaved(true);
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  }

  if (editMode) {
    // If we're in edit mode, return a Textarea and buttons to save / cancel
    return (
      <div className="d-flex flex-column align-items-center justify-content-center gap-2">
        <Textarea fullWidth helperColor={showSaved ? "success" : null} status={showSaved ? "success" : null} helperText={showSaved ? "Your changes have been saved!" : null} label={`Editing Text: ${props.firestoreId}`} value={editableText} onChange={handleTextareaChange}/>
        <div className="d-flex flex-row gap-2">
          { editMode && <Button color="error" onClick={() => setEditMode(false)} flat>Cancel</Button> }
          { editMode && <Button color="success" onClick={sendTextUpdateToServer} flat>Save Changes</Button> }
        </div>
      </div>
    )
  }

  /**
   * Render paragraphs retrieved from server with appropriate parameters
   * @returns paragraphs from server mapped to {@link WLParagraph} components
   */
  function renderParagraphs() {
    return paragraphs.map((p, index) => {
      return <WLParagraph paragraphText={p} key={`${props.firestoreId}-${index}`} />;
    });
  }

  return (
    <div data-testid={props["data-testid"]} className={"d-flex flex-column gap-2 w-100" + (props.editable ? " web-legos-text-editable" : "")} onClick={() => setEditMode(props.editable)}>
      { paragraphs ? renderParagraphs() : (props.showSpinner && <Loading style={props.spinnerCss} type={props.spinnerStyle} color="primary" />) }
      { editMode && <Button color="success" onClick={sendTextUpdateToServer}>Save Changes</Button> }
      { !fetched && props.children && <WLParagraph paragraphText={markdownToHTML(props.children)} /> }
    </div>
  )
}

/**
 * Editable text component compatible with {@link https://github.com/r2pen2/Server-Legos}. Fetches text from the server
 * on mount and sends updates onBlur when in edit mode.
 * @param {Function} setLoaded - function for {@link WLText} to call when the text is fetched from server
 * @param {React.JSX.Element} children - whether to indent text
 * @param {boolean} indent - whether to indent text
 * @param {string} align - text alignment
 * @param {string} color - text color
 * @param {number} size - text size
 * @param {boolean} editable - whether this text is currently editable
 * @param {string} firestoreId - id for this text in its firestoreCollection
 * @param {boolean} showSpinner - whether to show a loading spinner
 * @param {string} spinnerStyle - loading spinner type
 * @default
 * shopSpinner = false;
 * @returns
 */
export function WLLayoutText(props) {

  // Create states
  const [originalText, setOriginalText] = useState("");   // Text first received from DB
  const [editableText, setEditableText] = useState("");   // Current value of the Textfield if editing
  const [showSaved, setShowSaved] = useState(false);      // Whether to show the "Changes saved" message
  const [editMode, setEditMode] = useState(false);        // Whether the user is editing this WLText
  const [paragraphs, setParagraphs] = useState(null);     // Paragraphs from DB to present
  const [fetched, setFetched] = useState(false);          // Whether we got a server response.

  function getTextAlign() {
    if (!props.align) return "text-center";
    switch (props.align) {
      case "left":
        return "text-left";
      case "right":
        return "text-right";
      default:
        return "text-center";
    }
  }

  /**
   * A formatted WLParagraph from the WLText props after pulling from DB
   * @param {string} paragraphText - text to render in this paragraph
   */
  function WLParagraph({paragraphText}) {

    /** React ref for inserting HTML to paragraphs after component mount */
    const ref = useRef(null);

    /**
     * Get the correct css classes by WLText props
     * @returns classes for <Text /> component
     */

    function getWLTextClasses() {

      let classes = "";
      if (props.indent) { classes += "web-legos-text-indent "; }
      if (props.textClasses) { classes += props.textClasses + " "; }
      return classes;
    }

    // When component mounts, set innerHTML to text from DB + add any prefix
    useEffect(() => {
      ref.current.innerHTML = (props.prefix ? props.prefix : "") + paragraphText;
    })

    // If this is a header, render as a header.
    if (props.headerLevel) {
      switch (props.headerLevel) {
        case 1:
          // eslint-disable-next-line jsx-a11y/heading-has-content
          return <h1 ref={ref} style={{fontWeight: "inherit"}} className={getWLTextClasses()}/>;
        case 2:
          // eslint-disable-next-line jsx-a11y/heading-has-content
          return <h2 ref={ref} style={{fontWeight: "inherit"}} className={getWLTextClasses()}/>;
          case 3:
          // eslint-disable-next-line jsx-a11y/heading-has-content
          return <h3 ref={ref} style={{fontWeight: "inherit"}} className={getWLTextClasses()}/>;
          case 4:
          // eslint-disable-next-line jsx-a11y/heading-has-content
          return <h4 ref={ref} style={{fontWeight: "inherit"}} className={getWLTextClasses()}/>;
          case 5:
          // eslint-disable-next-line jsx-a11y/heading-has-content
          return <h5 ref={ref} style={{fontWeight: "inherit"}} className={getWLTextClasses()}/>;
        default:
          return;
      }
    }

    // Return paragraph
    return <p ref={ref} style={{margin: 0, fontWeight: "inherit", fontSize:"inherit"}} className={getWLTextClasses()}>{props.children}</p>;
  }

  // When the component mounts, request the necessary siteText from server and let all parent components know that data has been loaded.
  useLayoutEffect(() => {
    if (!props.firestoreId) {
      // No need to query DB if there's no firestoreId defined
      setParagraphs([]);
      if (props.setLoaded) {
        props.setLoaded(true);
      }
      return;
    }
    // Ask DB for the right text
    fetch(`${developmentHostname}/site-text?id=${props.firestoreId}`).then((res) => {
      res.text().then((text) => {
        const gotResponse = !text.includes("<!DOCTYPE html>");
        setFetched(gotResponse);
        // Split into paragraphs at line breaks
        if (gotResponse) {
          setParagraphs(text.split("<br/>"));
        }
        // And convert HTML into markdown for editing
        const markdownText = HTMLToMarkdown(text);
        setOriginalText(markdownText);
        setEditableText(markdownText);
        // Tell parent components that we're ready
        if (props.setLoaded) {
          props.setLoaded(true);
        }
      })
    })
  }, [props.firestoreId, props.indent, props.setLoaded, props]);

  /**
   * Set {@link editableText} and {@link showSaved} states when text area's value is updated
   * @param {Event} e - text change event
   */
  function handleTextareaChange(e) {
    const newText = e.target.value;
    setEditableText(newText);
    setShowSaved(false);
  }

  /**
   * Handle save changes button click by sending new text to /site-text and reloading the page after one second.
   */
  function sendTextUpdateToServer() {
    if (editableText === originalText) { setEditMode(false); return; }
    setOriginalText(editableText);
    fetch(`${developmentHostname}/site-text`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        id: props.firestoreId,
        newText: markdownToHTML(editableText),
      }),
    });
    setShowSaved(true);
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  }

  if (editMode) {
    // If we're in edit mode, return a Textarea and buttons to save / cancel
    return (
      <div className={`d-flex flex-column align-items-center justify-content-center w-100 gap-2`}>
        <Textarea fullWidth helperColor={showSaved ? "success" : null} status={showSaved ? "success" : null} helperText={showSaved ? "Your changes have been saved!" : null} label={`Editing Text: ${props.firestoreId}`} value={editableText} onChange={handleTextareaChange}/>
        <div className="d-flex flex-row gap-2">
          { editMode && <Button color="error" onClick={() => setEditMode(false)} flat>Cancel</Button> }
          { editMode && <Button color="success" onClick={sendTextUpdateToServer} flat>Save Changes</Button> }
          { editMode && <div data-testid={props["data-testid"] + ":editing"} /> }
        </div>
      </div>
    )
  }

  /**
   * Render paragraphs retrieved from server with appropriate parameters
   * @returns paragraphs from server mapped to {@link WLParagraph} components
   */
  function renderParagraphs() {
    return paragraphs.map((p, index) => {
      return <WLParagraph paragraphText={p} key={`${props.firestoreId}-${index}`} />;
    });
  }

  return (
    <div data-testid={props["data-testid"]} className={"d-flex flex-column gap-2 w-100" + (props.editable ? "web-legos-text-editable c-pointer" : " ") + (props.align ? getTextAlign() : "")} onClick={() => setEditMode(props.editable)}>
      { paragraphs ? renderParagraphs() : (props.showSpinner && <Loading color="primary" />) }
      { editMode && <Button color="success" onClick={sendTextUpdateToServer}>Save Changes</Button> }
      { !fetched && props.children && <WLParagraph paragraphText={markdownToHTML(props.children)} /> }
    </div>
  )
}


/**
 * Web-Legos editable header
 * @param {Function} setLoaded - function for {@link WLText} to call when the text is fetched from server
 * @param {string} firestoreId - ID of the siteText that this header pulls from
 * @param {boolean} editable - whether the current user has permission to edit this header
 * @param {number} headerLevel - level of header to display (ex. 1, 2, 3, etc.)
 * @param {string} textClasses - classes to apply on text inside the returned {@link WLText} component
 * @param {React.ReactNode} children - component children (static text)
 * @param {boolean} showSpinner - whether to show a loading spinner
 * @default
 * headerLevel = 1
 * @returns
 */
export function WLLayoutHeader(props) {

  const headerLevel = props.headerLevel ? props.headerLevel : getHeaderLevel();

  function getHeaderLevel() {
    if (props.h2) { return 2; }
    if (props.h3) { return 3; }
    if (props.h4) { return 4; }
    if (props.h5) { return 5; }
    if (props.h6) { return 6; }
    return 1;
  }

  return <WLLayoutText b={props.b} data-testid={props["data-testid"]} align={props.align} showSpinner={props.showSpinner} setLoaded={props.setLoaded} firestoreId={props.firestoreId} editable={props.editable} headerLevel={headerLevel} textClasses={"web-legos-scaling-header " + props.className}>{props.children}</WLLayoutText>;
}

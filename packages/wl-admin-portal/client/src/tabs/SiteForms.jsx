// Library imports
import React from 'react'
import { Text, Divider, Modal, Button } from "@nextui-org/react"
import { DataGrid } from "@mui/x-data-grid"


// Models
import { FormResponse, SiteModule } from '../libraries/Web-Legos/api/admin.ts';

// Component Imports
import { CurrentSiteContext, CurrentUserContext, HOSTNAME } from '../App';
import { WLSpinnerPage } from '../libraries/Web-Legos/components/Layout';
import { WLDateTime, getSlashDateString, getTimeOfDay } from '../libraries/Web-Legos/api/strings';
import NoPerms from '../components/noPerms.jsx';

// Constants
/** Minimum width for DataGrid columns */
const MIN_COL_WIDTH = 200;

/**
 * A page for viewing and interacting with all forms on a site— needs actions to be implmemented
 */
export default function SiteForms() {
  
  // Get context
  const {currentUser} = React.useContext(CurrentUserContext);
  const {currentSite} = React.useContext(CurrentSiteContext);

  // Create states
  const [formResponsesFetched, setFormResponsesFetched] = React.useState(false);  // Whether form responses have been fetched from the site
  const [formResponses, setFormResponses] = React.useState([]);                   // List of form responses from the site
  const [focusedRow, setFocusedRow] = React.useState(null);                       // The focused row (if any)
  const [permissionFetched, setPermissionFetched] = React.useState(false) // Whether we know if this user has permission to view this page
  const [permission, setPermission] = React.useState(false)       // Whether user can view this page

  /**
   * Fetch form responses from current site
   */
  function fetchForms() {
    // Get the current user's Firebase ID token
    currentUser.getIdToken(true).then(idToken => {
      /** HTTP endpoint for the GET request */
      const endpoint = `${HOSTNAME}/external-forms?siteId=${currentSite.siteKey}&accessToken=${idToken}`;
      console.log(endpoint);
      // Fetch forms with Firestore ID token as authentication
      fetch(endpoint).then((response) => {
        response.json().then(json => {
          // Response received
          /** A new form responses state */
          let newResponses = [];
          // Iterate through document ids for form responses from external server
          for (const key of Object.keys(json)) {
            // Get a form response from the json w/ this specific key
            const res = json[key];
            // Attach key as an id so we can make changes to this object if necessary
            res.id = key;
            newResponses.push(res);
          }
          // Update form responses state
          setFormResponses(newResponses);
          // Note that we've fetched responses
          setFormResponsesFetched(true);
        })
      })
    })
  }  

  function getPermission() {
    setPermissionFetched(false);
    // Get the current user's Firebase ID token
    currentUser.getIdToken(true).then(idToken => {
      /** HTTP endpoint for the GET request */
      const endpoint = `${HOSTNAME}/external-users?siteId=${currentSite.siteKey}&accessToken=${idToken}`; 
      fetch(endpoint).then((response) => {
        response.json().then(json => {
          // Response received
          // Iterate through document ids for users from external server
          let permState = false;
          for (const value of Object.values(json)) {
            if (value.email === currentUser.email) {
              permState = value.adminPermissions.forms
            }
          }
          setPermission(permState)
          setPermissionFetched(true)
        })
      })
    })
  }

  // When currentUser or currentSite updates, fetch all of the current site's form responses
  React.useEffect(fetchForms, [currentUser, currentSite])
  // Whenever the currentUser or currentSite change, make sure we have permission to view this page
  React.useEffect(getPermission, [currentSite, currentUser]);

  /**
   * Render form responses as separate DataGrid components for each individual form. Populate those DataGrids with form responses and allow for
   * interaction with rows.
   */
  function renderResponses() {
    // Sort responses into buckets by their formId
    const alphabeticalResponses = formResponses.sort((a, b) => a.formId - b.formId)
    const sortedResponses = {};
    
    // alphabeticalResponses has form responses sorted by their formId, so we can now add objects to sortedResponses and those keys will be 
    // in alphabetical order as well.
    for (const r of alphabeticalResponses) {
      if (!sortedResponses[r.formId]) {
        sortedResponses[r.formId] = [];
      }
      sortedResponses[r.formId].push(r);
    }
    
    // Within each of these "buckets" (responses grouped by formId), sort responses by their creation time
    for (const responseBucket of Object.keys(sortedResponses)) {
      sortedResponses[responseBucket] = sortedResponses[responseBucket].sort((a, b) => b.createdAtSeconds - a.createdAtSeconds);
    }

    // Render responses in DataGrids for each unique formId
    return Object.keys(sortedResponses).map((formId, i) => {
      
      /** Render DataGrid rows for this formId */
      function getRows() {
        let rows = [];
        for (const i in sortedResponses[formId]) {
          // Get row content by iterating through responses with this formId and pulling out content.
          
          const d = new WLDateTime()
          d.loadTime(sortedResponses[formId][i].createdAtSeconds);
          
          const content = {id: i, Timestamp: d, ...sortedResponses[formId][i].content};
          rows.push(content);
        }
        return rows;
      }

      /** Render DataGrid column headers for this formId */
      function getCols() {
        // Start with the Timestamp column first
        let cols = [
          {
            field: "Timestamp",
            headerName: "Timestamp",
            width: FormResponse.getFieldWidth("Timestamp") ? FormResponse.getFieldWidth("Timestamp") : MIN_COL_WIDTH
          }
        ];
        // All responses with the same formId should have the same columns, so we can just take the first item's content keys
        for (const k of Object.keys(sortedResponses[formId][0].content)) {
          // Get field width by content key name— "Message" will be longer than "Name"
          const fieldWidth = FormResponse.getFieldWidth(k);
          // Create a column object and push it to the list
          const col = {
            field: k,
            headerName: k,
            width: fieldWidth ? fieldWidth : MIN_COL_WIDTH,
          };
          cols.push(col);
        }
        return cols;
      }
      
      /** Set focused row on click */
      function handleCellClick(e) {
        setFocusedRow(e.row)
      }

      /** Display the focused row in a modal */
      function renderFocusedRow() {
        // If there's no focused row, display nothing
        if (!focusedRow) { return; }

        // Sort fields alphabetically
        const sortedKeys = Object.keys(focusedRow).sort()
        // Map fields to their name in __bold__ and value 
        return sortedKeys.map((k, i) => {
          return (k !== "id") && <div key={i} className='w-100 py-2 flex-column align-items-start justify-content-start'>
            <Text b>
              {k}
            </Text>
            <Text>
              {focusedRow[k].toString()}
            </Text>
          </div>
        })
      }

      /** A modal displaying the currently focused row */
      function FocusedRowModal() {
        return (
          <Modal
            open={focusedRow}
            onClose={() => setFocusedRow(null)}
            className="p-3 d-flex flex-column align-items-center justify-content-center"
          >
            {renderFocusedRow()}
            <Button flat color="error" onClick={() => setFocusedRow(null)}>
              Close
            </Button>
          </Modal>
        )
      }

      /** A header for the form we're displaying */
      function FormTitleContainer() {
        return (
          <div className="w-100 d-flex flex-row">
            <Text b align="left">
              {sortedResponses[formId][0].formTitle}
            </Text>
          </div>
        )
      }

      // Render the DataGrid and Modal
      return (
        <div key={i} className="px-3 w-100 d-flex flex-column align-items-center justify-content-start">
          <FocusedRowModal />
          <FormTitleContainer />
          <Divider css={{marginBottom: "0.5rem"}}/>
          <DataGrid
            onRowClick={handleCellClick}  // Open modal on row click
            sx={{width: "100%"}}
            rows={getRows()}              // Populate DataGrid rows
            columns={getCols()}           // Populate DataGrid columns
            initialState={{               // Set up pagination: 5 per page
              pagination: {
                paginationModel: {
                  pageSize: 5
                }
              }
            }}
            pageSizeOptions={[5]}       // Set up pagination: increments are by 5
          />
        </div>
      )
    })
  }

  // Once form responses have been fetched, render them in a DataGrid.
  return (
    <WLSpinnerPage dependencies={[formResponsesFetched, permissionFetched]}>
      {permission ? renderResponses() : <NoPerms />}
    </WLSpinnerPage>
  )
}

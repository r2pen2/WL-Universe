// Library Imports
import React from 'react'
import { Loading } from "@nextui-org/react"

// Component Imports
import NoPerms from "../components/noPerms"
import { CurrentSiteContext, CurrentUserContext, HOSTNAME } from '../App';
import { WLSpinnerPage } from '../libraries/Web-Legos/components/Layout';
import { sortFieldsAlphabetically } from '../libraries/Web-Legos/api/sorting';
import { Checkbox, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';

export default function SiteUsers() {
  
  // Get contexts
  const {currentUser} = React.useContext(CurrentUserContext);
  const {currentSite} = React.useContext(CurrentSiteContext);

  // Set up states
  const [usersFetched, setUsersFetched] = React.useState(false);  // Whether we've fetched site users
  const [users, setUsers] = React.useState([]);                   // List of site users
  const [permissionFetched, setPermissionFetched] = React.useState(false) // Whether we know if this user has permission to view this page
  const [permission, setPermission] = React.useState(false)       // Whether user can view this page

  /**
   * Fetch users from current site
   */
  function getUsers () {
    // Get the current user's Firebase ID token
    currentUser.getIdToken(true).then(idToken => {
      /** HTTP endpoint for the GET request */
      const endpoint = `${HOSTNAME}/external-users?siteId=${currentSite.siteKey}&accessToken=${idToken}`; 
      fetch(endpoint).then((response) => {
        response.json().then(json => {
          // Response received
          /** A new users state */
          let newUsers = [];
          // Iterate through document ids for users from external server
          for (const key of Object.keys(json)) {
            // Get a user from the json w/ this specific key
            const res = json[key];
            // Attach key as an id so we can make changes to this object if needed
            res.id = key;
            newUsers.push(res);
          }
          // Update users state
          setUsers(newUsers.sort((a, b) => a.displayName - b.displayName));
          // Note that we've fetched users
          setUsersFetched(true);
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
              permState = value.adminPermissions.users
            }
          }
          setPermission(permState)
          setPermissionFetched(true)
        })
      })
    })
  }
  
  // Whenever the currentUser or currentSite change, pull users from target site
  React.useEffect(getUsers, [currentSite, currentUser]);
  // Whenever the currentUser or currentSite change, make sure we have permission to view this page
  React.useEffect(getPermission, [currentSite, currentUser]);

  /** A component for showing and updaing a specific user permission */
  function PermissionCheckbox({perm, user, isAdmin}) {

    // States
    const [updating, setUpdating] = React.useState(); // Whether we're waiting on a response

    const permissionValue = isAdmin ? user.adminPermissions[perm] : user.permissions[perm]

    /** Update the target site's users when a cell is clicked */
    function handleCellClick() {
      // Get the current user's Firebase ID Token
      currentUser.getIdToken(true).then(idToken => {
        /** Body for the POST request */
        const postBody = {
          siteId: currentSite.siteKey,
          accessToken: idToken,
          email: user.email,
          field: perm,
          isAdmin: isAdmin,
          value: !permissionValue,
        }
        // Note that we're sending a request
        setUpdating(true);
        // Send fetch request to server
        fetch(`${HOSTNAME}/external-users`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(postBody)
        }).then((response) => {
          // All was well! Fetch users again.
          if (response.status === 200) {
            setUsersFetched(false);
            getUsers();
          }
        });
      })
    }


    if (user.isOwner) {
      return <Checkbox checked={true} disabled={true} />
    }

    // Show loading if we're updating, otherwise show a checkbox
    return updating ? <Loading size='sm' /> : <Checkbox checked={permissionValue || user.permissions["op"]} disabled={perm !== "op" && user.permissions["op"]} onClick={handleCellClick}/>
  }

  /** Table header rendered from first user's permissions list */
  function TableHeader() {
    // If there are no users yet, don't try to render a header
    if (!users[0]) { return; }

    return (
      <TableHead>
        <TableRow>
          <TableCell align="center" colSpan={2}>User Details</TableCell>
          <TableCell align="center" colSpan={Object.keys(users[0].permissions).length}>Permissions</TableCell>
          <TableCell align="center" colSpan={Object.keys(users[0].adminPermissions).length}>Admin Permissions</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Display Name</TableCell>
          <TableCell>Email</TableCell>
          <TableCell>op</TableCell>
          {Object.keys(sortFieldsAlphabetically(users[0].permissions)).map((k,i) => (k !== "op" && <TableCell key={i}>{k}</TableCell>))}
          {Object.keys(sortFieldsAlphabetically(users[0].adminPermissions)).map((k,i) => <TableCell key={i}>{k}</TableCell>)}
        </TableRow>
      </TableHead>
    )
  }
  
  return (
    <WLSpinnerPage dependencies={[usersFetched, permissionFetched]}>
      {
      permission ?
        <div className="px-3 w-100 d-flex flex-column align-items-center justify-content-start">
          <TableContainer component={Paper}>
            <Table aria-label="users-table">
              <TableHeader />
              <TableBody>
                {
                  users.map((user, i) => (
                    <TableRow key={i}>
                      <TableCell>{`${user.displayName}${user.isOwner && " (Owner)"}`}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell><PermissionCheckbox perm="op" user={user} /></TableCell>
                      {Object.keys(sortFieldsAlphabetically(user.permissions)).map((permissionKey, pi) => (
                        (permissionKey !== "op") && <TableCell key={pi}><PermissionCheckbox perm={permissionKey} user={user} /></TableCell>
                      ))}
                      {Object.keys(sortFieldsAlphabetically(user.adminPermissions)).map((permissionKey, pi) => (
                        <TableCell key={pi}><PermissionCheckbox isAdmin perm={permissionKey} user={user} /></TableCell>
                      ))}
                    </TableRow>
                  ))
                }
              </TableBody>
            </Table>
          </TableContainer>
        </div>
      :
        <NoPerms />
      }
    </WLSpinnerPage>
  )
}
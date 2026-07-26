import React from 'react'

export default function DashboardSectionHeader(props) {
  return (
    <div className="mt-2 d-flex flex-column flex-sm-row align-items-center" key='dashboard-sectionheader'>
      <div className="coaching-line m-2 d-none d-sm-block" />
      <h3 style={{minWidth: "fit-content"}} className="mb-0 mb-sm-2">{props.children}</h3>
      <div className="coaching-line m-2" />
    </div>
  )
}

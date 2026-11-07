import React, { useEffect, useState } from 'react'

import "../assets/style/services.css"
import { WLBlockHeader, WLHeader, WLText } from '../libraries/Web-Legos/components/Text';

import { blockHeaderFill } from "../assets/style/colors";
import { ExternalResource } from '../api/siteModels.ts';
import { AddModelButton, ModelEditButton, ModelEditModal } from '../libraries/Web-Legos/components/Modals';
import { Card, Divider, Text } from '@nextui-org/react';
import { SiteModel } from '../libraries/Web-Legos/api/models.ts';
import { useContext } from 'react';
import { CurrentSignInContext } from '../App';
import { AuthenticationManager } from '../libraries/Web-Legos/api/auth.ts';
import { AnalyticsManager } from '../libraries/Web-Legos/api/analytics.ts';

/**
 * Group resources by category, keeping their existing order within each group.
 * Categories appear in the order of their first resource; ones that differ only by
 * case or surrounding spaces are the same group. Resources with no category go last,
 * under "Other" (or with no heading at all if nothing is categorized yet).
 */
function groupByCategory(resources) {
  const groups = new Map();
  let uncategorized = [];
  for (const r of resources) {
    const name = (r.category || "").trim();
    if (!name) { uncategorized.push(r); continue; }
    const key = name.toLowerCase();
    if (!groups.has(key)) { groups.set(key, { title: name, items: [] }); }
    groups.get(key).items.push(r);
  }
  const list = [...groups.values()];
  if (uncategorized.length) {
    list.push({ title: list.length ? "Other" : null, items: uncategorized });
  }
  return list;
}

export default function Resources() {

  const {currentSignIn} = useContext(CurrentSignInContext);
  const {authenticationManager} = useContext(AuthenticationManager.Context);
  const {analyticsManager} = useContext(AnalyticsManager.Context);

  analyticsManager.logPageView("resources")

  const [userCanEditText, setUserCanEditText] = useState(false);
  const [userCanEditResources, setUserCanEditResources] = useState(false);
  
  useEffect(() => {
    authenticationManager.getPermission(currentSignIn, "siteText").then(p => setUserCanEditText(p));
    authenticationManager.getPermission(currentSignIn, "external-resources").then(p => setUserCanEditResources(p));
  }, [authenticationManager, currentSignIn]);
  
  const [resources, setResources] = useState([]);

  const [modelEditModalOpen, setModelEditModalOpen] = useState(false);
  const [currentModel, setCurrentModel] = useState(new SiteModel());

  useEffect(() => {
    ExternalResource.getAndSet(setResources);
  }, [])

  function ExternalResourceCard({resource}) {
    return (
      <div className="p-2 col-12">
        <Card
          style={{
            width: "100%",
            alignItems: "start",
            justifyContent: "space-between",
            minHeight: "100%"
          }}
          className="d-flex flex-column"
          isPressable
          isHoverable
          onPress={() => window.open(resource.link, "_blank")}
        >
          <div style={{flex: 1}} className="d-flex p-2 flex-column w-100 align-items-start text-start">
            <div className="w-100 mb-1">
              <Text b>{resource.title}</Text>
              <Divider />
            </div>
            <Text style={{fontSize: "1rem"}}>{resource.description}</Text>
          </div>
        </Card>
        <ModelEditButton small userCanEdit={userCanEditResources} data={resource} model={ExternalResource} setEditModalOpen={setModelEditModalOpen} setCurrentModel={setCurrentModel}/>
      </div>
    )
  }

  return (
  <div className="d-flex flex-column align-items-center justify-content-center">
    <ModelEditModal model={currentModel} open={modelEditModalOpen} setOpen={setModelEditModalOpen} />
    <WLBlockHeader text="Resources" color={blockHeaderFill} short />
    <section className="d-flex flex-column align-items-center justify-content-center m-5 w-80">
      <WLHeader firestoreId="resources-header" editable={userCanEditText}/>
      <WLText firestoreId="resources-description" editable={userCanEditText}/>
      <div className="container">
        {groupByCategory(resources).map((group) => (
          <div className="row d-flex align-items-start justify-content-center mt-4" key={group.title || "uncategorized"}>
            {group.title && (
              <div className="col-12 px-2 text-start">
                <Text h3 className="mb-0">{group.title}</Text>
                <Divider />
              </div>
            )}
            {group.items.map((r) => <ExternalResourceCard resource={r} key={r.id}/>)}
          </div>
        ))}
      </div>
      <AddModelButton userCanEdit={userCanEditResources} model={ExternalResource} setEditModalOpen={setModelEditModalOpen} setCurrentModel={setCurrentModel} />
    </section>
    </div>
  )
}

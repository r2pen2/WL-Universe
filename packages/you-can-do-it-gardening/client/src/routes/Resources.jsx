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
import { IconExternalLink } from '@tabler/icons-react';

/** Outline for resource cards: the block-header purple, softened. */
const resourceOutline = "rgba(127,74,199,0.35)";

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

/** Distinct category names in first-use order, for the edit modal's category pull-down. */
function categoryNames(resources) {
  return groupByCategory(resources).map(g => g.title).filter(t => t && t !== "Other");
}

/** Thin, symmetric baroque scroll drawn between category sections. */
function Flourish() {
  const half = (
    <>
      <path d="M126 12 C150 12, 165 17, 185 13 C200 10, 212 12, 226 12" />
      <path d="M128 11 C134 4, 144 2, 149 6 C153 9.5, 149 13.5, 145.5 11.5 C143 10, 144 7, 146.5 7.5" />
      <path d="M140 13.5 C146 18, 156 20, 160 16.5 C162.5 14, 159.5 11.5, 157.5 13.5" />
      <path d="M190 12.2 C196 8, 203 7.5, 206 9.5 C208 11, 206.5 13, 204.5 12" />
      <circle cx="231" cy="12" r="1.3" fill="#a67fcf" stroke="none" />
    </>
  );
  return (
    <div className="col-12 d-flex justify-content-center my-3" aria-hidden="true">
      <svg viewBox="0 0 240 24" width="260" height="26" fill="none" stroke="#a67fcf" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round">
        {half}
        <g transform="translate(240 0) scale(-1 1)">{half}</g>
        <path d="M120 7.5 L124 12 L120 16.5 L116 12 Z" fill="#a67fcf" stroke="none" />
      </svg>
    </div>
  );
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

  // Open the edit modal with the existing categories offered as a pull-down.
  function openResourceModel(model) {
    model.shortStringOptions = { category: categoryNames(resources) };
    setCurrentModel(model);
  }

  function ExternalResourceCard({resource}) {
    const hasDescription = Boolean(resource.description && String(resource.description).trim());
    return (
      <div className="p-2 col-12">
        <Card
          style={{
            width: "100%",
            alignItems: "start",
            justifyContent: "space-between",
            minHeight: "100%",
            border: `1px solid ${resourceOutline}`,
          }}
          className="d-flex flex-column"
          isPressable
          isHoverable
          onPress={() => window.open(resource.link, "_blank")}
        >
          <div style={{flex: 1}} className="d-flex p-2 flex-column w-100 align-items-start text-start">
            <div className="w-100 d-flex flex-row align-items-center gap-2">
              <IconExternalLink aria-hidden="true" size={18} stroke={1.75} color={blockHeaderFill} style={{flexShrink: 0}} />
              <Text b>{resource.title}</Text>
            </div>
            {/* Only resources with a description get the divider and text, so cards without one stay compact. */}
            {hasDescription && (
              <div className="w-100">
                <Divider className="my-1" />
                <Text style={{fontSize: "1rem", marginBottom: 0}}>{resource.description}</Text>
              </div>
            )}
          </div>
        </Card>
        <ModelEditButton small userCanEdit={userCanEditResources} data={resource} model={ExternalResource} setEditModalOpen={setModelEditModalOpen} setCurrentModel={openResourceModel}/>
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
        {groupByCategory(resources).map((group, index) => (
          <div className={`row d-flex align-items-start justify-content-center ${index > 0 ? "mt-1" : "mt-4"}`} key={group.title || "uncategorized"}>
            {index > 0 && <Flourish />}
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
      <AddModelButton userCanEdit={userCanEditResources} model={ExternalResource} setEditModalOpen={setModelEditModalOpen} setCurrentModel={openResourceModel} />
    </section>
    </div>
  )
}

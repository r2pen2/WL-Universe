import { Anchor, Breadcrumbs } from "@mantine/core";

export function CRMBreadcrumbs({items}) {

  
  return <Breadcrumbs className="mb-2">{items.map((item, index) => {
    const handleClick = (e) => {
      if (!item.href || item.onClick) {
        e.preventDefault();
        if (item.onClick) { item.onClick(); }
      } 
    }
    return (
      <Anchor href={"#" + item.href} onClick={handleClick} key={index}>
        {item.title}
      </Anchor>
    )}
  )}</Breadcrumbs>
}
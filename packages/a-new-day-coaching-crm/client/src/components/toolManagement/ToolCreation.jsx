import { Button, Paper, Text, TextInput } from "@mantine/core"
import ModuleHeader from "../dashboard/ModuleHeader"

export const ToolCreation = ({onSubmit}) => {
  return (
    <div className="col-xl-3 col-12 px-1">
      <Paper withBorder className="p-0 mb-2 container-fluid">
        <ModuleHeader>New Tool</ModuleHeader>
        <form onSubmit={onSubmit} className="row px-2 pb-2">
          <TextInput id="name" label="Tool Name" className="col-12 mb-2" placeholder="Enter the tool name" required />
          <TextInput id="description" label="Tool Description" className="col-12 mb-2" placeholder="Enter the tool description" required />
          <div className="col-12 d-flex justify-content-end">
            <Button type="submit">Create Tool</Button>
          </div>
        </form>
      </Paper>
    </div>
  )
}
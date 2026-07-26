import { hostname } from "./dbManager.ts";

export class Tool {
  static async createOnDatabase(title: string, description: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      fetch(hostname + "/tools/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title: title,
          description: description
        })
      }).then((response) => {
        response.json().then((data) => {
          resolve(data.id);
        })
      }).catch((error) => {
        reject(error);
      })
    })
  }

  static assignToMultiple(title: string, description: string, toolId: string, users: string[]): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      fetch(hostname + "/tools/assign-multiple", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title: title,
          description: description,
          users: users,
          toolId: toolId
        })
      }).then((response) => {
        response.json().then((data) => {
          resolve(data);
        })
      }).catch((error) => {
        reject(error);
      })
    })
  }

  static unassignMultiple(toolId: string, users: string[]): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      fetch(hostname + "/tools/unassign-multiple", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          users: users,
          toolId: toolId
        })
      }).then((response) => {
        response.json().then((data) => {
          resolve(data);
        })
      }).catch((error) => {
        reject(error);
      })
    })
  }

  static async fetchAll(): Promise<any[]> {
    return new Promise<any[]>((resolve, reject) => {
      fetch(hostname + "/tools").then((response) => {
        response.json().then((data) => {
          resolve(data);
        })
      }).catch((error) => {
        reject(error);
      })
    })
  }

  static async delete(id: string): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      fetch(hostname + "/tools/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          toolId: id
        })
      }).then((res) => {
        res.json().then((data) => {
          resolve(data);
        })
      }).catch((error) => {
        reject(error);
      })
    })
  }

  static star(toolId: string, userId: string): Promise<boolean> {

    return new Promise<boolean>((resolve, reject) => {
      fetch(hostname + "/tools/user-star", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          userId: userId,
          toolId: toolId
        })
      }).then((response) => {
        response.json().then((data) => {
          resolve(data.success);
        })
      }).catch((error) => {
        reject(error);
      })
    })
  }

  static sortBy(tools: any[], sortType: string, reversed: boolean): Tool[] {
    function getArray() {
      if (sortType === "title") { return tools.sort((a,b) => a.title.localeCompare(b.title)) }
      if (sortType === "users") { return tools.sort((a, b) => a.assignedTo.length - b.assignedTo.length).reverse() }
      return [];
    }
    return reversed ? getArray().reverse() : getArray();
  }
}
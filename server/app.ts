import express, { Request, Response } from "express";
import cors from "cors";
import bodyParser from "body-parser";
const server = express()
server.use(bodyParser.json())
server.use(cors())
server.post("/movements", async (req: Request, res: Response) => {
  try {
    const request = await fetch("https://3gt6ljkai4gvw.elma365.ru/pub/v1/app/test/movements/list", {
      method: "POST",
      headers: {
        "Authorization": "Bearer 7b074a67-71c7-49a4-ba48-c2a49ffd6f98",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        active: true,
        size: -1
      })
    })
    if (!request.ok) {
      throw new Error(await request.text())
    }
    res.send(await request.json())
  } catch (error: any) {
    console.log(error.message)
  }

})

server.post("/create_nomenclature", async (req: Request, res: Response) => {
  try {
    const request = await fetch("https://3gt6ljkai4gvw.elma365.ru/pub/v1/app/_system_catalogs/nomenclature/create", {
      method: "POST",
      headers: {
        "Authorization": "Bearer 7b074a67-71c7-49a4-ba48-c2a49ffd6f98",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(createElement(req.body.name))
    })
    if (!request.ok) {
      throw new Error(await request.text())
    }
    res.send(await request.json())
  } catch (error) {
    if (error instanceof Error)
      console.log(error.message)
  }

})

server.post("/goods", async (req: Request, res: Response) => {
  try {
    const request = await fetch("https://3gt6ljkai4gvw.elma365.ru/pub/v1/app/_system_catalogs/nomenclature/list", {
      method: "POST",
      headers: {
        "Authorization": "Bearer 7b074a67-71c7-49a4-ba48-c2a49ffd6f98",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        active: true,
        size: -1
      })
    })
    if (!request.ok) {
      throw new Error(await request.text())
    }
    const products = (await request.json()).result.result
    const units_ids: string[] = products?.map((product: any) => product.unit[0]).filter(Boolean)
    const units = await getUnits(units_ids)
    res.send({products, units})
  } catch (error: any) {
    console.log(error.message)
  }

})

server.get("/app", async (req: Request, res: Response) => {
  try {
    const request = await fetch("https://3gt6ljkai4gvw.elma365.ru/pub/v1/scheme/namespaces/test/apps/movements", {
      method: "GET",
      headers: {
        "Authorization": "Bearer 7b074a67-71c7-49a4-ba48-c2a49ffd6f98",
        "Content-Type": "application/json"
      }
      // body: JSON.stringify({
      //   active: true,
      //   size: -1
      // })
    })

    if (!request.ok) {
      throw new Error(await request.text())
    }
    
    res.send(await request.json())
  } catch (error: any) {
    console.log(error.message)
  }

})

server.listen(3001, () => {
  console.log("Запущен")
})

// Создание элемента

function createElement(name: string) {
  const item = {
    "context": {
      "__name": name,
    }
  }
  return item
}

async function getUnits(ids: string[]) {
  const res = await fetch("https://3gt6ljkai4gvw.elma365.ru/pub/v1/app/_system_catalogs/units/list", {
    method: "POST",
    headers: {
      "Authorization": "Bearer 7b074a67-71c7-49a4-ba48-c2a49ffd6f98",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      active: true,
      ids,
      size: ids.length
    })
  })
  if (!res.ok) {
    throw new Error("Ошибка")
  }
  return (await res.json()).result.result
}


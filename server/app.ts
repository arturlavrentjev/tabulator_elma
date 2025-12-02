import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv"
import bodyParser from "body-parser";
const server = express()
dotenv.config({ path: "./.env" })
server.use(bodyParser.json())
server.use(cors())
server.use((req, res, next) => {
  console.log('Запрос:', req.method, req.url);
  next();
});

server.get("/", (req, res) => {
  res.send("Работает")
})
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
      body: JSON.stringify(createOrUpdateElement(req.body.name))
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

server.post("/update_goods", async (req: Request, res: Response) => {
  try {
    const { id, name } = req.body
    const url = `${process.env.BASE_URL}/pub/v1/app/_system_catalogs/nomenclature/${id}/update`
    const data = createOrUpdateElement(name)
    const request = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    })
    if (!request.ok) {
      throw new Error(await request.text())
    }
    res.send(await request.text())
  } catch (error) {
    if (error instanceof Error) {
      console.error(error.message)
    }
  }
})

server.post("/goods", async (req: Request, res: Response) => {
  try {
    const body = req.body;
    const filter: IFilter = { active: true, size: 1000 }
    if (body) {
      filter["filter"] = {like:[{field: "__name"}, {const: body?.name ?? ""}]}
    }
    const request = await fetch("https://3gt6ljkai4gvw.elma365.ru/pub/v1/app/_system_catalogs/nomenclature/list", {
      method: "POST",
      headers: {
        "Authorization": "Bearer 7b074a67-71c7-49a4-ba48-c2a49ffd6f98",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(filter)
    })
    if (!request.ok) {
      throw new Error(await request.text())
    }
    const products = (await request.json()).result.result
    const units_ids: string[] = products?.map((product: any) => product.unit[0]).filter(Boolean)
    const units = await getUnits(units_ids)
    res.send({ products, units })
  } catch (error: any) {
    console.log(error.message)
  }

})
interface IFilter {
  active: boolean
  filter?: {
    like: [
      {field: string},
      {const: string}
    ]
  }
  size: number
}
server.get("/units", async (req: Request, res: Response) => {
  try {
    const request = await fetch(`https://3gt6ljkai4gvw.elma365.ru/pub/v1/app/_system_catalogs/units/list`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({active: true, size: 100})
    })
    if (!request.ok) {
      res.sendStatus(400)
      throw new Error(`Чет пошло не так ${await request.text()} ${request.status}`)
    }
    res.send((await request.json()).result.result)
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
const host = "0.0.0.0"
server.listen(3001, host, () => {
  console.log(`Сервер запущен на хосте: http://${host}:3001`)
}).on('error', (err) => {
    console.error('Ошибка сервера:', err.message);
  });


// Создание элемента

function createOrUpdateElement(name: string) {
  const item = {
    context: {
      __name: name,
      "unit": ["0199d4fb-9f0c-711f-9b75-631c0f5ede8b"]
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

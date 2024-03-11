export const dynamic = 'force-dynamic' // defaults to auto
export async function GET(request: Request) {
  return new Response('Hello world')
}

// Path: src/app/home/api/route.ts

export async function POST() {

  

  const data = { time: new Date().toISOString() }
 
  return Response.json(data)
}
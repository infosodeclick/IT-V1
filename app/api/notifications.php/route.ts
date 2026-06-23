export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const action = url.searchParams.get("action");

  if (action === "unread_count") {
    return Response.json(
      {
        unread_count: 0,
        count: 0
      },
      {
        headers: {
          "Cache-Control": "no-store"
        }
      }
    );
  }

  return Response.json(
    {
      notifications: []
    },
    {
      headers: {
        "Cache-Control": "no-store"
      }
    }
  );
}

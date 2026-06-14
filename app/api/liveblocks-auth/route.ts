import { Liveblocks } from "@liveblocks/node";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/require-auth";
import { requireProjectMember } from "@/lib/projects/auth";
import { currentUser } from "@clerk/nextjs/server";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { room } = await request.json();

    if (!room || typeof room !== "string" || !room.startsWith("project:")) {
      return NextResponse.json({ error: "Invalid room ID" }, { status: 400 });
    }

    const projectId = room.replace("project:", "");
    const member = await requireProjectMember(projectId, user.id);

    const clerkUser = await currentUser();
    const session = liveblocks.prepareSession(user.id, {
      userInfo: {
        name: clerkUser?.fullName || clerkUser?.emailAddresses[0]?.emailAddress || "Anonymous",
        email: user.email,
        avatar: clerkUser?.imageUrl,
        role: member.role,
      },
    });

    session.allow(room, session.FULL_ACCESS);

    const { status, body } = await session.authorize();
    return new Response(body, { status });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

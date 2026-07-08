import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";
import { startOfDay, endOfDay } from "date-fns";

// GET /api/courses — 获取课程列表
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const today = searchParams.get("today");
  const studentId = searchParams.get("studentId");
  const start = searchParams.get("start");
  const end = searchParams.get("end");

  const where: any = {};

  if (today === "true") {
    const now = new Date();
    where.startTime = {
      gte: startOfDay(now),
      lt: endOfDay(now),
    };
  }

  if (studentId) where.studentId = studentId;

  if (start && end) {
    where.startTime = {
      gte: new Date(start),
      lte: new Date(end),
    };
  }

  const courses = await prisma.course.findMany({
    where,
    orderBy: { startTime: "asc" },
    include: {
      student: {
        select: {
          id: true,
          name: true,
          grade: { select: { name: true } },
        },
      },
      attendance: true,
      dailyRecord: { select: { id: true, masteryLevel: true } },
    },
  });

  return NextResponse.json({
    data: courses,
    total: courses.length,
  });
}

// POST /api/courses — 创建课程
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });

  try {
    const body = await req.json();

    // 计算结束时间
    const duration = body.duration || 120;
    const startTime = new Date(body.startTime);
    const endTime = new Date(startTime.getTime() + duration * 60000);

    // === 排课冲突检测 ===
    const conflictingCourse = await prisma.course.findFirst({
      where: {
        status: "scheduled",
        startTime: { lt: endTime },
        endTime: { gt: startTime },
      },
      include: {
        student: { select: { id: true, name: true } },
      },
    });

    if (conflictingCourse) {
      // === 覆盖模式：用户确认覆盖，删除冲突课程 ===
      if (body.overwrite === true && body.conflictCourseId === conflictingCourse.id) {
        await prisma.course.delete({
          where: { id: conflictingCourse.id },
        });
        await logActivity({
          action: "delete", entity: "course", entityId: conflictingCourse.id,
          summary: `排课覆盖：删除冲突课程 ${conflictingCourse.student.name} ${conflictingCourse.subject}`,
          userId: session.user?.id,
        });
      } else {
        return NextResponse.json(
          {
            error: "排课冲突",
            message: `该时间段与 ${conflictingCourse.student.name} 的 ${conflictingCourse.subject} 课程冲突（${new Date(conflictingCourse.startTime).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}-${new Date(conflictingCourse.endTime).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })})`,
            conflict: {
              id: conflictingCourse.id,
              studentId: conflictingCourse.student.id,
              studentName: conflictingCourse.student.name,
              subject: conflictingCourse.subject,
              startTime: conflictingCourse.startTime,
              endTime: conflictingCourse.endTime,
            },
          },
          { status: 409 }
        );
      }
    }

    const course = await prisma.course.create({
      data: {
        studentId: body.studentId,
        registrationId: body.registrationId || null,
        subject: body.subject,
        courseType: body.courseType || "normal",
        startTime: new Date(body.startTime),
        endTime,
        duration,
        location: body.location,
        status: "scheduled",
      },
      include: {
        student: { select: { id: true, name: true } },
      },
    });

    await logActivity({ action: "create", entity: "course", entityId: course.id, summary: `新建课程：${course.student.name} ${body.subject}`, userId: session.user?.id });
    return NextResponse.json({ data: course }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: "创建课程失败", message: err.message },
      { status: 400 }
    );
  }
}

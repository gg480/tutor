import { NextResponse } from "next/server";

/**
 * 统一 API 响应格式
 * 所有 API 路由应使用此工具函数返回一致的结构
 */

export interface ApiSuccess<T = any> {
  data: T;
  meta?: {
    total?: number;
    page?: number;
    pageSize?: number;
  };
}

export interface ApiError {
  error: string;
  message?: string;
  details?: any;
}

export function success<T>(data: T, meta?: ApiSuccess["meta"]) {
  return NextResponse.json({ data, ...(meta ? { meta } : {}) }, { status: 200 });
}

export function created<T>(data: T) {
  return NextResponse.json({ data }, { status: 201 });
}

export function badRequest(error: string, message?: string) {
  return NextResponse.json({ error, message }, { status: 400 });
}

export function unauthorized(error = "未登录") {
  return NextResponse.json({ error }, { status: 401 });
}

export function notFound(error = "资源不存在") {
  return NextResponse.json({ error }, { status: 404 });
}

export function conflict(error: string, message?: string, details?: any) {
  return NextResponse.json({ error, message, ...(details ? { details } : {}) }, { status: 409 });
}

export function serverError(error = "服务器内部错误", message?: string) {
  return NextResponse.json({ error, message }, { status: 500 });
}

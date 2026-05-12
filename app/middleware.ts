import { NextResponse }
from 'next/server'

import type {
  NextRequest
} from 'next/server'

export function middleware(
  request: NextRequest
) {

  /* =====================
     GET USER SESSION
  ===================== */

  const userCookie =
    request.cookies.get(
      'user'
    )?.value

  /* =====================
     CURRENT PATH
  ===================== */

  const pathname =
    request.nextUrl.pathname

  /* =====================
     PUBLIC ROUTES
  ===================== */

  const publicRoutes = [
    '/login',
  ]

  /* =====================
     ALLOW PUBLIC ROUTES
  ===================== */

  if (
    publicRoutes.includes(
      pathname
    )
  ) {

    return NextResponse.next()
  }

  /* =====================
     USER NOT LOGIN
  ===================== */

  if (!userCookie) {

    return NextResponse.redirect(
      new URL(
        '/login',
        request.url
      )
    )
  }

  /* =====================
     PARSE USER
  ===================== */

  let user

  try {

    user = JSON.parse(
      userCookie
    )

  } catch {

    return NextResponse.redirect(
      new URL(
        '/login',
        request.url
      )
    )
  }

  /* =====================
     ROLE PROTECTION
  ===================== */

  if (
    pathname.startsWith(
      '/employee'
    ) &&
    user.role !== 'employee'
  ) {

    return NextResponse.redirect(
      new URL(
        '/login',
        request.url
      )
    )
  }

  if (
    pathname.startsWith(
      '/hr'
    ) &&
    user.role !== 'hr'
  ) {

    return NextResponse.redirect(
      new URL(
        '/login',
        request.url
      )
    )
  }

  if (
    pathname.startsWith(
      '/finance'
    ) &&
    user.role !== 'finance'
  ) {

    return NextResponse.redirect(
      new URL(
        '/login',
        request.url
      )
    )
  }

  /* =====================
     ALLOW ACCESS
  ===================== */

  return NextResponse.next()
}

/* =====================
   MATCHER
===================== */

export const config = {

  matcher: [

    '/employee/:path*',

    '/hr/:path*',

    '/finance/:path*',

    '/login',

  ],
}
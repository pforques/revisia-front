import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    // Pages autorisées sans vérification email
    const allowedPages = [
        '/login',
        '/register',
        '/verify-email',
    ]

    // Vérifier si c'est une page autorisée
    if (allowedPages.includes(request.nextUrl.pathname)) {
        return NextResponse.next()
    }

    // Vérifier si c'est une ressource statique
    if (
        request.nextUrl.pathname.startsWith('/_next/') ||
        request.nextUrl.pathname.startsWith('/favicon') ||
        request.nextUrl.pathname.startsWith('/manifest') ||
        request.nextUrl.pathname.startsWith('/png/') ||
        request.nextUrl.pathname.startsWith('/svg/') ||
        request.nextUrl.pathname.startsWith('/videos/') ||
        request.nextUrl.pathname.startsWith('/api/')
    ) {
        return NextResponse.next()
    }

    // Vérifier si l'utilisateur est connecté
    const accessToken = request.cookies.get('access_token')?.value

    if (!accessToken) {
        // Pas de token, laisser passer (géré par AuthContext)
        return NextResponse.next()
    }

    // Si l'utilisateur est connecté, vérifier l'email
    // Note: On ne peut pas vérifier l'état email_verified côté middleware
    // car on n'a pas accès au contexte React. Le blocage se fait côté composant.

    return NextResponse.next()
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
}

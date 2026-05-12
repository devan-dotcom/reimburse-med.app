export function saveUser(
  user: any
) {

  /* =====================
     SAVE TO LOCAL STORAGE
  ===================== */

  localStorage.setItem(
    'user',
    JSON.stringify(user)
  )

  /* =====================
     SAVE TO COOKIE
  ===================== */

  document.cookie =
    `user=${JSON.stringify(user)}; path=/`
}

export function getUser() {

  if (
    typeof window === 'undefined'
  ) {
    return null
  }

  const user =
    localStorage.getItem('user')

  if (!user) {
    return null
  }

  return JSON.parse(user)
}

export function logout() {

  /* =====================
     REMOVE LOCAL STORAGE
  ===================== */

  localStorage.removeItem(
    'user'
  )

  /* =====================
     REMOVE COOKIE
  ===================== */

  document.cookie =
    'user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'

  /* =====================
     REDIRECT LOGIN
  ===================== */

  window.location.href =
    '/login'
}
// The Users page. Every request goes to the gateway, never straight to the
// user service.

// Config
// This file runs in the browser, so it can't read .env - the gateway address
// is a plain constant. Change it here when the gateway is deployed.
const GATEWAY_URL = 'http://localhost:3000'

// /users is the gateway route that forwards to the user service.
const USERS_URL = `${GATEWAY_URL}/users`

// Must match API_KEY in the gateway's .env. Anyone who opens this page can
// read it here - a key used from the browser can't stay secret.
const API_KEY = 'bed2-demo-key'

// Talking to the gateway

// Every request goes through here, so the API key is added in one place and
// errors are handled in one place.
// Two ways a request can fail:
//   - no response at all (CORS, gateway down): fetch itself throws
//     "Failed to fetch"
//   - an error response (401, 500): fetch does NOT throw, so we check
//     response.ok and throw with the { error } the server sent back
async function request (url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { ...options.headers, 'x-api-key': API_KEY }
  })
  const body = await response.json().catch(() => null)

  if (!response.ok) {
    const error = new Error(`${response.status} ${body?.error || response.statusText}`)
    error.status = response.status
    throw error
  }

  return body
}

// One search box, three meanings:
//   empty         -> all users
//   only digits   -> exact id
//   anything else -> part of an email
function searchUrl (search) {
  if (search === '') {
    return USERS_URL
  }

  if (/^\d+$/.test(search)) {
    return `${USERS_URL}/${search}`
  }

  return `${USERS_URL}?email=${encodeURIComponent(search)}`
}

// Always resolves to a list, so the page only has one shape to draw.
async function findUsers (search) {
  try {
    const data = await request(searchUrl(search))

    // /:id returns one user, / returns a list.
    return Array.isArray(data) ? data : [data]
  } catch (error) {
    // An id that doesn't exist is an empty result, not a failure.
    if (error.status === 404) {
      return []
    }

    throw error
  }
}

function createUser ({ username, email }) {
  return request(USERS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email })
  })
}

// The page

const usersTable = document.getElementById('users')
const message = document.getElementById('message')
const searchForm = document.getElementById('search-form')
const addForm = document.getElementById('add-form')

function showMessage (text, type) {
  const alert = document.createElement('div')
  alert.className = `alert alert-${type}`
  alert.textContent = text

  message.replaceChildren(alert)
}

function clearMessage () {
  message.replaceChildren()
}

function renderUsers (users) {
  const rows = users.map((user) => {
    const row = document.createElement('tr')

    for (const value of [user.UserId, user.Username, user.Email, new Date(user.CreateAt).toLocaleString()]) {
      const cell = document.createElement('td')
      cell.textContent = value
      row.appendChild(cell)
    }

    return row
  })

  usersTable.replaceChildren(...rows)
}

async function loadUsers (search = '') {
  clearMessage()

  try {
    const users = await findUsers(search)

    renderUsers(users)

    if (users.length === 0) {
      showMessage('No users found', 'warning')
    }
  } catch (error) {
    renderUsers([])
    showMessage(`Request failed: ${error.message}`, 'danger')
  }
}

searchForm.addEventListener('submit', (event) => {
  event.preventDefault()

  loadUsers(document.getElementById('search').value.trim())
})

addForm.addEventListener('submit', async (event) => {
  event.preventDefault()

  const username = document.getElementById('username').value.trim()
  const email = document.getElementById('email').value.trim()

  try {
    await createUser({ username, email })

    addForm.reset()
    showMessage(`Added ${username}`, 'success')
    loadUsers()
  } catch (error) {
    showMessage(`Request failed: ${error.message}`, 'danger')
  }
})

loadUsers()

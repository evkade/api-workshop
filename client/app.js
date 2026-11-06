const scheduleElement = document.querySelector("#schedule")
const dialog = document.querySelector("#session-dialog")
let openSessionId = null

async function api(method, path, body) {
  const response = await fetch(path, {
    method,
    headers: body === undefined ? {} : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const text = await response.text()
  let data
  try {
    data = text ? JSON.parse(text) : undefined
  } catch {
    data = text
  }
  return { ok: response.ok, status: response.status, data }
}

function showMessage(element, response, successText) {
  element.hidden = false
  element.className = "api-error"
  element.replaceChildren()

  if (response.ok) {
    element.classList.add("success")
    element.textContent = successText
    return
  }

  const { error, message, details } = response.data ?? {}
  if (response.status === 501) element.classList.add("not-implemented")

  const code = document.createElement("code")
  code.textContent = `${response.status} ${error ?? ""}`
  element.append(code, ` ${message ?? JSON.stringify(response.data)}`)

  if (Array.isArray(details)) {
    const list = document.createElement("ul")
    for (const detail of details) {
      const item = document.createElement("li")
      item.textContent = detail.path ? `${detail.path}: ${detail.message}` : detail.message
      list.append(item)
    }
    element.append(list)
  }
}

function hide(...elements) {
  for (const element of elements) element.hidden = true
}

const time = (dateTime) => dateTime.slice(11, 16)

function renderSeats(element, session) {
  element.className = "seats"
  if (typeof session.seatsLeft !== "number") {
    element.classList.add("unknown")
    element.textContent = `${session.capacity} seats · seats left appear after task 6`
    return
  }
  if (session.seatsLeft <= 0) element.classList.add("full")
  else if (session.seatsLeft <= 3) element.classList.add("few")
  element.textContent = session.seatsLeft <= 0 ? "Fully booked" : `${session.seatsLeft} of ${session.capacity} seats left`
}

function renderRoomHeader(rooms) {
  const header = document.createElement("div")
  header.className = "slot room-header"
  const roomsElement = document.createElement("div")
  roomsElement.className = "slot-sessions"
  roomsElement.style.setProperty("--room-count", rooms.length)
  for (const room of rooms) {
    const roomElement = document.createElement("div")
    roomElement.textContent = room
    roomsElement.append(roomElement)
  }
  header.append(document.createElement("div"), roomsElement)
  return header
}

async function loadSchedule() {
  const response = await api("GET", "/api/sessions")
  const errorElement = document.querySelector("#schedule-error")
  if (!response.ok) {
    showMessage(errorElement, response)
    return
  }
  hide(errorElement)

  const sessions = response.data
  const rooms = [...new Set(sessions.map((session) => session.room))].sort()
  const slots = Map.groupBy
    ? Map.groupBy(sessions, (session) => time(session.startsAt))
    : sessions.reduce((map, session) => map.set(time(session.startsAt), [...(map.get(time(session.startsAt)) ?? []), session]), new Map())

  scheduleElement.replaceChildren(renderRoomHeader(rooms))
  for (const [startTime, slotSessions] of [...slots].sort(([a], [b]) => a.localeCompare(b))) {
    const slot = document.createElement("div")
    slot.className = "slot"

    const timeElement = document.createElement("div")
    timeElement.className = "slot-time"
    timeElement.textContent = startTime

    const sessionsElement = document.createElement("div")
    sessionsElement.className = "slot-sessions"
    sessionsElement.style.setProperty("--room-count", rooms.length)

    for (const session of slotSessions) {
      const card = document.createElement("button")
      card.type = "button"
      card.className = "session-card"
      card.style.gridColumn = String(rooms.indexOf(session.room) + 1)

      const title = document.createElement("span")
      title.className = "title"
      title.textContent = session.title
      const details = document.createElement("span")
      details.className = "details"
      details.textContent = `${time(session.startsAt)}–${time(session.endsAt)} · ${session.room} · ${session.speaker}`
      const seats = document.createElement("span")
      renderSeats(seats, session)

      card.append(title, details, seats)
      card.addEventListener("click", () => openSession(session.id))
      sessionsElement.append(card)
    }

    slot.append(timeElement, sessionsElement)
    scheduleElement.append(slot)
  }
}

async function openSession(id) {
  openSessionId = id
  hide(...dialog.querySelectorAll(".api-error"))
  document.querySelector("#registration-form").reset()
  if (!dialog.open) dialog.showModal()
  await Promise.all([loadSessionDetails(), loadRegistrations()])
}

async function loadSessionDetails() {
  const response = await api("GET", `/api/sessions/${openSessionId}`)
  const titleElement = document.querySelector("#session-title")
  const metaElement = document.querySelector("#session-meta")
  const seatsElement = document.querySelector("#session-seats")
  const errorElement = document.querySelector("#session-error")

  if (!response.ok) {
    titleElement.textContent = `Session ${openSessionId}`
    metaElement.textContent = ""
    seatsElement.textContent = ""
    showMessage(errorElement, response)
    return
  }
  hide(errorElement)

  const session = response.data
  titleElement.textContent = session.title
  metaElement.textContent = `${time(session.startsAt)}–${time(session.endsAt)} · ${session.room} · ${session.speaker}`
  renderSeats(seatsElement, session)

  const editForm = document.querySelector("#edit-form")
  editForm.elements.title.value = session.title
  editForm.elements.capacity.value = session.capacity
}

async function loadRegistrations() {
  const response = await api("GET", `/api/sessions/${openSessionId}/registrations`)
  const list = document.querySelector("#registrations")
  const errorElement = document.querySelector("#registrations-error")
  list.replaceChildren()

  if (!response.ok) {
    showMessage(errorElement, response)
    return
  }
  hide(errorElement)

  for (const registration of response.data) {
    const item = document.createElement("li")
    item.textContent = `${registration.name} (${registration.email})`
    list.append(item)
  }
}

async function refreshAfterChange() {
  await Promise.all([loadSchedule(), loadSessionDetails(), loadRegistrations()])
}

document.querySelector("#registration-form").addEventListener("submit", async (event) => {
  event.preventDefault()
  const form = event.currentTarget
  const body = { name: form.elements.name.value, email: form.elements.email.value }
  const response = await api("POST", `/api/sessions/${openSessionId}/registrations`, body)
  showMessage(document.querySelector("#registration-result"), response, `${body.name} is registered!`)
  if (response.ok) {
    form.reset()
    await refreshAfterChange()
  }
})

document.querySelector("#edit-form").addEventListener("submit", async (event) => {
  event.preventDefault()
  const form = event.currentTarget
  const body = { title: form.elements.title.value, capacity: Number(form.elements.capacity.value) }
  const response = await api("PATCH", `/api/sessions/${openSessionId}`, body)
  showMessage(document.querySelector("#edit-result"), response, "Saved!")
  if (response.ok) await refreshAfterChange()
})

document.querySelector("#delete-session").addEventListener("click", async () => {
  if (!confirm("Delete the session and all its registrations?")) return
  const response = await api("DELETE", `/api/sessions/${openSessionId}`)
  if (response.ok) {
    dialog.close()
    await loadSchedule()
    return
  }
  showMessage(document.querySelector("#delete-result"), response)
})

document.querySelector("#close-dialog").addEventListener("click", () => dialog.close())
dialog.addEventListener("close", loadSchedule)

loadSchedule()

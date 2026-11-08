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

const roomHues = [265, 210, 330, 150, 35, 185]
const roomHue = (roomIndex) => roomHues[roomIndex % roomHues.length]

const time = (dateTime) => dateTime.slice(11, 16)
const minutesSinceMidnight = (dateTime) => Number(dateTime.slice(11, 13)) * 60 + Number(dateTime.slice(14, 16))

function renderSeats(element, session) {
  element.className = "seats"
  if (typeof session.seatsLeft !== "number") {
    element.classList.add("unknown")
    element.textContent = `${session.capacity} seats · seats left appear after task 6`
    return
  }
  if (session.seatsLeft <= 0) element.classList.add("full")
  else if (session.seatsLeft <= 3) element.classList.add("few")
  element.textContent =
    session.seatsLeft <= 0 ? "Fully booked" : `${session.seatsLeft} of ${session.capacity} seats left`
}

function renderRoomHeader(rooms) {
  const header = document.createElement("div")
  header.className = "slot room-header"
  const roomsElement = document.createElement("div")
  roomsElement.className = "slot-sessions"
  roomsElement.style.setProperty("--room-count", rooms.length)
  for (const [index, room] of rooms.entries()) {
    const roomElement = document.createElement("div")
    roomElement.textContent = room
    roomElement.style.setProperty("--room-hue", roomHue(index))
    roomsElement.append(roomElement)
  }
  const locationLabel = document.createElement("div")
  locationLabel.className = "location-label"
  locationLabel.textContent = "Location"
  header.append(locationLabel, roomsElement)
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
  scheduleElement.replaceChildren(renderRoomHeader(rooms))
  if (sessions.length > 0) scheduleElement.append(renderTimeline(sessions, rooms))
}

function renderTimeline(sessions, rooms) {
  const firstHour = Math.floor(Math.min(...sessions.map((session) => minutesSinceMidnight(session.startsAt))) / 60)
  const lastHour = Math.ceil(Math.max(...sessions.map((session) => minutesSinceMidnight(session.endsAt))) / 60)
  const rowOf = (dateTime) => minutesSinceMidnight(dateTime) - firstHour * 60 + 1

  const timeline = document.createElement("div")
  timeline.className = "timeline"
  timeline.style.setProperty("--room-count", rooms.length)
  timeline.style.setProperty("--minutes", (lastHour - firstHour) * 60)

  for (let hour = firstHour; hour < lastHour; hour++) {
    const row = String((hour - firstHour) * 60 + 1)

    const line = document.createElement("div")
    line.className = "hour-line"
    line.style.gridRow = row

    const label = document.createElement("div")
    label.className = "slot-time"
    label.textContent = `${String(hour).padStart(2, "0")}:00`
    label.style.gridRow = row

    timeline.append(line, label)
  }

  for (const session of sessions) {
    const card = renderSessionCard(session, rooms.indexOf(session.room))
    card.style.gridRow = `${rowOf(session.startsAt)} / ${rowOf(session.endsAt)}`
    timeline.append(card)
  }
  return timeline
}

function renderSessionCard(session, roomIndex) {
  const card = document.createElement("button")
  card.type = "button"
  card.className = "session-card"
  card.style.gridColumn = String(roomIndex + 2)
  card.style.setProperty("--room-hue", roomHue(roomIndex))

  const title = document.createElement("span")
  title.className = "title"
  title.textContent = session.title
  const details = document.createElement("span")
  details.className = "details"
  details.textContent = `${time(session.startsAt)}–${time(session.endsAt)} · ${session.room} · ${session.speaker}`
  const seats = document.createElement("span")
  renderSeats(seats, session)

  card.append(title, details, seats)
  card.addEventListener("click", () => openSession(session.id, roomIndex))
  return card
}

async function openSession(id, roomIndex) {
  openSessionId = id
  dialog.style.setProperty("--room-hue", roomHue(roomIndex))
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
